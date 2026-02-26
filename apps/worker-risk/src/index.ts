import http from "node:http";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { Worker } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions, getRedisClient } from "@risk-engine/redis";
import { EventSeverity, IncidentSeverity, IncidentStatus } from "@risk-engine/types";
import { getDb, events, incidents, incidentEvents } from "@risk-engine/db";
import { getAnomalyQueueName, getDatabaseUrl, getWorkerPort } from "./config/env";
import {
  emitAnomalyDetected,
  emitIncidentCreated,
  type RedisStreamClient
} from "@risk-engine/events";

interface AnomalyJobPayload {
  organizationId: string;
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
  const redisClient = getRedisClient();
  const streamClient: RedisStreamClient = redisClient as unknown as RedisStreamClient;
  const db = getDb(getDatabaseUrl());

  const worker = new Worker<AnomalyJobPayload>(
    queueName,
    async (job) => {
      const { organizationId, projectId, timestamp } = job.data;

      const windowMs = 60 * 1000;
      const windowStart = new Date(timestamp - windowMs);

      const recentErrors = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.organizationId, organizationId),
            eq(events.projectId, projectId),
            eq(events.severity, EventSeverity.ERROR),
            gte(events.occurredAt, windowStart),
            lte(events.occurredAt, new Date(timestamp)),
          )
        )
        .orderBy(desc(events.occurredAt));

      const errorCount = recentErrors.length;

      if (errorCount <= 10) {
        logger.info({ organizationId, errorCount }, "Error rate below anomaly threshold");
        return;
      }

      await emitAnomalyDetected(streamClient, {
        organizationId,
        projectId,
        errorCount,
        windowSeconds: 60
      });

      const relatedEvents = recentErrors.slice(0, 10);

      const [incident] = await db
        .insert(incidents)
        .values({
          organizationId,
          projectId,
          status: IncidentStatus.OPEN,
          severity: IncidentSeverity.CRITICAL,
          summary: `High error rate detected: ${errorCount} ERROR events in last 60 seconds.`
        })
        .returning();

      // Link related events via join table
      if (relatedEvents.length > 0) {
        await db.insert(incidentEvents).values(
          relatedEvents.map((e) => ({ incidentId: incident.id, eventId: e.id }))
        );
      }

      await emitIncidentCreated(streamClient, {
        incidentId: incident.id,
        organizationId,
        projectId,
        status: incident.status as IncidentStatus,
        severity: incident.severity as EventSeverity,
        summary: incident.summary
      });

      logger.info(
        { organizationId, incidentId: incident.id, errorCount },
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
  startHealthServer();
  await runWorker();
}

bootstrap().catch((error) => {
  console.log(error);
  logger.error({ error }, "Worker failed to start");
  process.exit(1);
});
