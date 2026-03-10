import http from "node:http";
import { createLogger } from "@risk-engine/logger";
import { getWorkerPort } from "./config/env";

const logger = createLogger("worker-anomaly");

export function startHealthServer(): void {
  const port = getWorkerPort();
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "worker-anomaly",
        timestamp: new Date().toISOString(),
      }),
    );
  });
  server.listen(port, () =>
    logger.info({ port }, "Worker health server listening"),
  );
}
