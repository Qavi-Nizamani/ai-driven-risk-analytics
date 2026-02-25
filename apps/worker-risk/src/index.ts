import http from "node:http";
import { Worker } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions, getRedisClient } from "@risk-engine/redis";
import { EventSeverity, IncidentStatus } from "@risk-engine/types";
import { connectMongo } from "./db/mongoose";
import { getAnomalyQueueName, getWorkerPort } from "./config/env";
import { EventModel } from "./models/Event";
import { IncidentModel } from "./models/Incident";
// import { getRedisStreamName } from "./config/env";
import {
  emitAnomalyDetected,
  emitIncidentCreated,
  type RedisStreamClient
} from "@risk-engine/events";

interface AnomalyJobPayload {
  projectId: string;
  eventId: string;
  severity: EventSeverity;
  timestamp: number;
}

const logger = createLogger("worker-anomaly");

function startHealthServer(): void {
  const port = getWorkerPort();

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "worker-anomaly",
        timestamp: new Date().toISOString()
      })
    );
  });

  server.listen(port, () => {
    logger.info({ port }, "Worker health server listening");
  });
}

async function runWorker(): Promise<void> {
  const queueName = getAnomalyQueueName();
  const connection = getBullMqConnectionOptions();
  // const streamName = getRedisStreamName();
  const redisClient = getRedisClient();
  const streamClient: RedisStreamClient = redisClient as unknown as RedisStreamClient;

  const worker = new Worker<AnomalyJobPayload>(
    queueName,
    async (job) => {
      const { projectId, timestamp } = job.data;

      const windowMs = 60 * 1000;
      const windowStart = new Date(timestamp - windowMs);

      const recentErrors = await EventModel.find({
        projectId,
        severity: EventSeverity.ERROR,
        timestamp: { $gte: windowStart, $lte: new Date(timestamp) }
      })
        .sort({ timestamp: -1 })
        .exec();

      const errorCount = recentErrors.length;

      if (errorCount <= 10) {
        logger.info({ projectId, errorCount }, "Error rate below anomaly threshold");
        return;
      }

      await emitAnomalyDetected(streamClient, {
        projectId,
        errorCount,
        windowSeconds: 60
      });

      const relatedEvents = recentErrors.slice(0, 10);

      const incident = await IncidentModel.create({
        projectId,
        status: IncidentStatus.OPEN,
        severity: EventSeverity.ERROR,
        relatedEventIds: relatedEvents.map((e) => e._id),
        summary: `High error rate detected: ${errorCount} ERROR events in last 60 seconds.`
      });

      await emitIncidentCreated(streamClient, {
        incidentId: incident.id,
        projectId,
        status: incident.status,
        severity: incident.severity,
        summary: incident.summary
      });

      logger.info(
        { projectId, incidentId: incident.id, errorCount },
        "Created incident from anomaly"
      );
    },
    {
      connection
    }
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Anomaly worker job failed");
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Anomaly worker job completed");
  });
}

async function bootstrap(): Promise<void> {
  await connectMongo();
  startHealthServer();
  await runWorker();
}

bootstrap().catch((error) => {
  console.log(error);
  logger.error({ error }, "Worker failed to start");
  process.exit(1);
});

