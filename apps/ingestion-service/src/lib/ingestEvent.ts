import { getDb, events } from "@risk-engine/db";
import type { EventSeverity } from "@risk-engine/types";
import { getRedisClient } from "@risk-engine/redis";
import { emitEventIngested } from "@risk-engine/events";
import type { RedisStreamClient } from "@risk-engine/events";
import { getDatabaseUrl } from "../config/env";
import { enqueueAnomalyJob } from "../queues/anomalyQueue";

export interface IngestEventInput {
  organizationId: string;
  projectId: string;
  source: string;
  type: string;
  severity: EventSeverity;
  payload?: Record<string, unknown>;
  correlationId?: string;
  occurredAt?: Date;
}

export interface IngestEventResult {
  id: string;
  organizationId: string;
  projectId: string;
  source: string;
  type: string;
  severity: string;
  correlationId: string | null;
  occurredAt: string;
}

const redisClient = getRedisClient();
const streamClient = redisClient as unknown as RedisStreamClient;

export async function ingestEvent(input: IngestEventInput): Promise<IngestEventResult> {
  const db = getDb(getDatabaseUrl());
  const now = input.occurredAt ?? new Date();

  const [eventDoc] = await db
    .insert(events)
    .values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      source: input.source,
      type: input.type,
      severity: input.severity as "INFO" | "WARN" | "ERROR" | "CRITICAL",
      payload: (input.payload ?? {}) as Record<string, unknown>,
      correlationId: input.correlationId ?? null,
      occurredAt: now,
    })
    .returning();

  const occurredAtMs = eventDoc.occurredAt.getTime();

  await emitEventIngested(streamClient, {
    organizationId: input.organizationId,
    projectId: input.projectId,
    eventId: eventDoc.id,
    severity: input.severity,
    timestamp: occurredAtMs,
  });

  await enqueueAnomalyJob({
    organizationId: input.organizationId,
    projectId: input.projectId,
    eventId: eventDoc.id,
    severity: input.severity,
    timestamp: occurredAtMs,
  });

  return {
    id: eventDoc.id,
    organizationId: eventDoc.organizationId,
    projectId: eventDoc.projectId,
    source: eventDoc.source,
    type: eventDoc.type,
    severity: eventDoc.severity,
    correlationId: eventDoc.correlationId,
    occurredAt: eventDoc.occurredAt.toISOString(),
  };
}
