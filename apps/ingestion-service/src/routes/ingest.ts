import { Router } from "express";
import { EventSeverity } from "@risk-engine/types";
import { createLogger } from "@risk-engine/logger";
import { getRedisClient } from "@risk-engine/redis";
import type { RedisStreamClient } from "@risk-engine/events";
import { emitEventIngested } from "@risk-engine/events";
import { getDb, events } from "@risk-engine/db";
import { getDatabaseUrl } from "../config/env";
import { enqueueAnomalyJob } from "../queues/anomalyQueue";

export const ingestRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("ingestion-service:ingest");

const redisClient = getRedisClient();
const streamClient: RedisStreamClient = redisClient as unknown as RedisStreamClient;

interface IngestBody {
  source?: string;
  type?: string;
  severity?: string;
  payload?: unknown;
}

ingestRouter.post("/ingest/:projectId", async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { source, type, severity, payload }: IngestBody = req.body ?? {};

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required in path" });
    }

    if (!source || !type) {
      return res.status(400).json({ message: "source and type are required" });
    }

    if (!severity || !Object.values(EventSeverity).includes(severity as EventSeverity)) {
      return res.status(400).json({ message: "severity must be one of INFO, WARN, ERROR" });
    }

    const now = new Date();
    const db = getDb(getDatabaseUrl());

    const [eventDoc] = await db.insert(events).values({
      projectId,
      source,
      type,
      severity: severity as "INFO" | "WARN" | "ERROR",
      payload: (payload ?? {}) as Record<string, unknown>,
      timestamp: now
    }).returning();

    const timestampMs = eventDoc.timestamp.getTime();

    await emitEventIngested(streamClient, {
      projectId,
      eventId: eventDoc.id,
      severity: severity as EventSeverity,
      timestamp: timestampMs
    });

    await enqueueAnomalyJob({
      projectId,
      eventId: eventDoc.id,
      severity: severity as EventSeverity,
      timestamp: timestampMs
    });

    logger.info(
      { projectId, eventId: eventDoc.id, severity, type, source },
      "Ingested event and enqueued anomaly job"
    );

    return res.status(201).json({
      id: eventDoc.id,
      projectId: eventDoc.projectId,
      source: eventDoc.source,
      type: eventDoc.type,
      severity: eventDoc.severity,
      timestamp: eventDoc.timestamp.toISOString()
    });
  } catch (error) {
    next(error);
  }
});
