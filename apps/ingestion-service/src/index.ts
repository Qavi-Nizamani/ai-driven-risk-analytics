import express from "express";
import { createLogger } from "@risk-engine/logger";
import { getIngestionPort } from "./config/env";
import { ingestRouter } from "./routes/ingest";

const logger = createLogger("ingestion-service");

async function bootstrap(): Promise<void> {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "ingestion-service",
      timestamp: new Date().toISOString()
    });
  });

  app.use(ingestRouter);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.use(async (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "Unhandled error in ingestion-service");
    res.status(500).json({ message: "Internal server error" });
  });

  const port = getIngestionPort();

  app.listen(port, () => {
    logger.info({ port }, "Ingestion service listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start ingestion service");
  process.exit(1);
});
