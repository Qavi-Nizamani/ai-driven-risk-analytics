import http from "node:http";
import { Worker } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions, getRedisClient } from "@risk-engine/redis";
import { InstallmentStatus, RiskLevel } from "@risk-engine/types";
import { connectMongo } from "./db/mongoose";
import { CustomerModel } from "./models/Customer";
import { InstallmentModel } from "./models/Installment";
import { getRedisStreamName, getRiskQueueName, getWorkerPort } from "./config/env";
import {
  emitRiskUpdated,
  type RedisStreamClient
} from "@risk-engine/events";

interface RiskJobPayload {
  customerId: string;
}

const logger = createLogger("worker-risk");

function startHealthServer(): void {
  const port = getWorkerPort();

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "worker-risk",
        timestamp: new Date().toISOString()
      })
    );
  });

  server.listen(port, () => {
    logger.info({ port }, "Worker health server listening");
  });
}

async function runWorker(): Promise<void> {
  const queueName = getRiskQueueName();
  const connection = getBullMqConnectionOptions();
  const streamName = getRedisStreamName();
  const redisClient = getRedisClient();
  const streamClient: RedisStreamClient = redisClient as unknown as RedisStreamClient;

  const worker = new Worker<RiskJobPayload>(
    queueName,
    async (job) => {
      const { customerId } = job.data;

      const installments = await InstallmentModel.find({ customerId }).exec();
      const total = installments.length;

      if (total === 0) {
        logger.info({ customerId }, "No installments found for customer, skipping risk update");
        return;
      }

      const lateCount = installments.filter(
        (installment) => installment.status === InstallmentStatus.LATE
      ).length;

      const riskScore = (lateCount / total) * 100;

      let riskLevel: RiskLevel;
      if (riskScore <= 20) {
        riskLevel = RiskLevel.LOW;
      } else if (riskScore <= 50) {
        riskLevel = RiskLevel.MEDIUM;
      } else {
        riskLevel = RiskLevel.HIGH;
      }

      const customer = await CustomerModel.findByIdAndUpdate(
        customerId,
        {
          riskScore,
          riskLevel
        },
        { new: true }
      ).exec();

      if (!customer) {
        logger.warn({ customerId }, "Customer not found when updating risk");
        return;
      }

      await emitRiskUpdated(
        streamClient,
        {
          customerId,
          riskScore,
          riskLevel
        },
        streamName
      );

      logger.info(
        { customerId, lateCount, total, riskScore, riskLevel },
        "Updated customer risk"
      );
    },
    { connection }
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Risk worker job failed");
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Risk worker job completed");
  });
}

async function bootstrap(): Promise<void> {
  await connectMongo();
  startHealthServer();
  await runWorker();
}

bootstrap().catch((error) => {
  logger.error({ error }, "Worker failed to start");
  process.exit(1);
});

