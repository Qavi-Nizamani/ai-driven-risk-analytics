import http from "node:http";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { createLogger } from "@risk-engine/logger";
import { createSocketIoRedisAdapter } from "@risk-engine/redis";
import { getWebsocketPort } from "./config/env";
import { startIncidentStreamListener } from "./riskStreamListener";

const logger = createLogger("websocket-service");

async function bootstrap(): Promise<void> {
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "websocket-service",
      timestamp: new Date().toISOString()
    });
  });

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*"
    }
  });

  const adapter = await createSocketIoRedisAdapter();
  io.adapter(adapter);

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Client connected");

    socket.on("subscribe_to_project", (payload: { projectId?: string }) => {
      const projectId = payload.projectId;

      if (!projectId) {
        return;
      }

      socket.join(projectId);
      logger.info({ socketId: socket.id, projectId }, "Client subscribed to project room");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected");
    });
  });

  await startIncidentStreamListener(io);

  const port = getWebsocketPort();

  server.listen(port, () => {
    logger.info({ port }, "WebSocket service listening");
  });
}

bootstrap().catch((error) => {
  console.log(error); 
  logger.error({ error }, "Failed to start WebSocket service");
  process.exit(1);
});

