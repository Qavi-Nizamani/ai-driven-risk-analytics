import { Queue } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions } from "@risk-engine/redis";
import { startHealthServer } from "./health-server";
import { startIngestionWorker } from "./workers/ingestion.worker";
import { startAnomalyWorker } from "./workers/anomaly.worker";
import { startHealthCheckWorker } from "./workers/health-check.worker";

const logger = createLogger("worker-anomaly");

async function bootstrap(): Promise<void> {
  try {
    startHealthServer();
    await startIngestionWorker();
    await startAnomalyWorker();
    await startHealthCheckWorker();

    const connection = getBullMqConnectionOptions();
    const queue = new Queue("incident_health_check", { connection });

    await queue.upsertJobScheduler(
      "incident-health-check",
      { every: 30_000 },
      { name: "cron-health-check", data: {}, opts: {} },
    );
  } catch (err) {
    console.error("WORKER CRASH:", err);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  logger.error({ error }, "Worker failed to start");
  process.exit(1);
});
