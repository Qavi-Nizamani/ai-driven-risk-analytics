import { Worker, Queue } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions, getRedisClient } from "@risk-engine/redis";
import { getDb, events } from "@risk-engine/db";
import { emitEventIngested, type RedisStreamClient } from "@risk-engine/events";
import { getDatabaseUrl, getIngestionQueueName, getAnomalyQueueName } from "../config/env";
import type { AnomalyJobPayload, IngestionJobPayload } from "../types";

const logger = createLogger("worker-anomaly");

export async function startIngestionWorker(): Promise<void> {
  const queueName = getIngestionQueueName();
  const anomalyQueueName = getAnomalyQueueName();
  const connection = getBullMqConnectionOptions();
  const redisClient = getRedisClient();
  const streamClient: RedisStreamClient =
    redisClient as unknown as RedisStreamClient;
  const db = getDb(getDatabaseUrl());
  const anomalyQueue = new Queue<AnomalyJobPayload>(anomalyQueueName, {
    connection,
  });

  const worker = new Worker<IngestionJobPayload>(
    queueName,
    async (job) => {
      const {
        organizationId,
        projectId,
        source,
        type,
        severity,
        payload,
        correlationId,
        correlation,
        occurredAt,
      } = job.data;

      const occurredAtDate = new Date(occurredAt);

      const [event] = await db
        .insert(events)
        .values({
          organizationId,
          projectId,
          source,
          type,
          severity: severity as "INFO" | "WARN" | "ERROR" | "CRITICAL",
          payload,
          correlationId,
          correlation,
          occurredAt: occurredAtDate,
        })
        .returning();

      const occurredAtMs = event.occurredAt.getTime();

      await emitEventIngested(streamClient, {
        organizationId,
        projectId,
        eventId: event.id,
        type: event.type,
        source: event.source,
        severity,
        payload: event.payload,
        occurredAt: event.occurredAt.toISOString(),
        timestamp: occurredAtMs,
      });

      await anomalyQueue.add("anomaly-check", {
        organizationId,
        projectId,
        eventId: event.id,
        severity,
        correlationId,
        timestamp: occurredAtMs,
      });

      logger.info(
        { organizationId, projectId, eventId: event.id, type },
        "Event ingested",
      );
    },
    { connection },
  );

  worker.on("failed", (job, error) =>
    logger.error({ jobId: job?.id, error }, "Ingestion worker job failed"),
  );
  worker.on("completed", (job) =>
    logger.info({ jobId: job.id }, "Ingestion worker job completed"),
  );
}
