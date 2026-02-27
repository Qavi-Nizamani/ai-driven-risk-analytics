import http from "node:http";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { createLogger } from "@risk-engine/logger";
import { createSocketIoRedisAdapter } from "@risk-engine/redis";
import { getWebsocketPort, getAllowedOrigin } from "./config/env";
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
      origin: getAllowedOrigin(),
      credentials: true,
    }
  });

  const adapter = await createSocketIoRedisAdapter();
  io.adapter(adapter);

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Client connected");

    socket.on("subscribe_to_organization", (payload: { organizationId?: string }) => {
      const organizationId = payload.organizationId;

      if (!organizationId) {
        return;
      }

      socket.join(organizationId);
      logger.info({ socketId: socket.id, organizationId }, "Client subscribed to organization room");
    });

    // Backward compat alias
    socket.on("subscribe_to_tenant", (payload: { tenantId?: string }) => {
      const tenantId = payload.tenantId;

      if (!tenantId) {
        return;
      }

      socket.join(tenantId);
      logger.info({ socketId: socket.id, tenantId }, "Client subscribed via legacy tenant alias");
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
