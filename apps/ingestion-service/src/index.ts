import express from "express";
import { createLogger } from "@risk-engine/logger";
import { getDb } from "@risk-engine/db";
import { errorHandler } from "@risk-engine/http";
import { getIngestionPort, getDatabaseUrl } from "./config/env";
import { createAuthMiddleware } from "./middleware/authenticate";

// Repository, Service, Controller
import { EventIngestionRepository } from "./repositories/event.repository";
import { EventIngestionService } from "./services/eventIngestion.service";
import { IngestionController } from "./controllers/ingestion.controller";
import { createIngestionRouter } from "./routes/ingestion.routes";

const logger = createLogger("ingestion-service");

async function bootstrap(): Promise<void> {
  const db = getDb(getDatabaseUrl());
  const authenticate = createAuthMiddleware(db);

  // ── Repository / Service / Controller ────────────────────────────────────────
  const eventRepo = new EventIngestionRepository(db);
  const ingestionService = new EventIngestionService(eventRepo);
  const ingestionCtrl = new IngestionController(ingestionService);

  // ── App ───────────────────────────────────────────────────────────────────────
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "ingestion-service", timestamp: new Date().toISOString() });
  });

  app.use(createIngestionRouter(ingestionCtrl, authenticate));

  app.use(errorHandler);

  const port = getIngestionPort();
  app.listen(port, () => {
    logger.info({ port }, "Ingestion service listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start ingestion service");
  process.exit(1);
});
