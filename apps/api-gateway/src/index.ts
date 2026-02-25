import express from "express";
import cors from "cors";
import { createLogger } from "@risk-engine/logger";
import { connectMongo } from "./db/mongoose";
import { getApiGatewayPort } from "./config/env";
import { customersRouter } from "./routes/customers";
import { installmentsRouter } from "./routes/installments";

const logger = createLogger("api-gateway");

async function bootstrap(): Promise<void> {
  await connectMongo();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "api-gateway",
      timestamp: new Date().toISOString()
    });
  });

  app.use(customersRouter);
  app.use(installmentsRouter);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.use(async (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "Unhandled error in API gateway");
    res.status(500).json({ message: "Internal server error" });
  });

  const port = getApiGatewayPort();

  app.listen(port, () => {
    logger.info({ port }, "API gateway listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start API gateway");
  process.exit(1);
});

