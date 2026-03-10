import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import { Worker } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions, getRedisClient } from "@risk-engine/redis";
import { EventSeverity, IncidentSeverity, IncidentStatus } from "@risk-engine/types";
import { getDb, events, incidents, incidentEvents, organizationMembers, users, organizations } from "@risk-engine/db";
import {
  emitAnomalyDetected,
  emitIncidentCreated,
  emitIncidentUpdated,
  type RedisStreamClient,
} from "@risk-engine/events";
import { sendEmail, buildIncidentCreatedEmail } from "@risk-engine/email";
import { getDatabaseUrl, getAnomalyQueueName } from "../config/env";
import {
  ACTIVE_INCIDENT_TTL_SECONDS,
  INVESTIGATING_INCIDENT_TTL_SECONDS,
  LOCK_TTL_MS,
  ERRORS_COUNT_LIMIT,
} from "../constants";
import {
  buildActiveIncidentKey,
  buildInvestigatingKey,
  buildLockKey,
  decodeIncidentValue,
  encodeIncidentValue,
} from "../redis/incident-keys";
import type { AnomalyJobPayload } from "../types";

const logger = createLogger("worker-anomaly");

async function getIncidentStats(
  db: ReturnType<typeof getDb>,
  incidentId: string,
): Promise<{ totalCount: number; durationSeconds: number }> {
  const [stats] = await db
    .select({
      totalCount: sql<number>`count(*)`,
      minOccurredAt: sql<string>`min(${events.occurredAt})`,
      maxOccurredAt: sql<string>`max(${events.occurredAt})`,
    })
    .from(incidentEvents)
    .innerJoin(events, eq(incidentEvents.eventId, events.id))
    .where(eq(incidentEvents.incidentId, incidentId));

  const totalCount = Number(stats.totalCount);
  const durationSeconds =
    stats.minOccurredAt && stats.maxOccurredAt
      ? Math.round(
          (new Date(stats.maxOccurredAt).getTime() -
            new Date(stats.minOccurredAt).getTime()) /
            1000,
        )
      : 0;

  return { totalCount, durationSeconds };
}

async function notifyOrgOwner(
  db: ReturnType<typeof getDb>,
  opts: {
    organizationId: string;
    projectId: string;
    incidentId: string;
    severity: string;
    summary: string;
    createdAt: string;
  },
): Promise<void> {
  const owner = await db
    .select({ email: users.email, name: users.name, orgName: organizations.name })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(
      and(
        eq(organizationMembers.organizationId, opts.organizationId),
        eq(organizationMembers.role, "OWNER"),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!owner) return;

  const dashboardUrl = `${process.env.DASHBOARD_URL ?? "http://localhost:3000"}/dashboard/projects/${opts.projectId}`;
  const { subject, html } = buildIncidentCreatedEmail({
    recipientName: owner.name,
    incidentId: opts.incidentId,
    severity: opts.severity,
    summary: opts.summary,
    organizationName: owner.orgName,
    projectId: opts.projectId,
    createdAt: opts.createdAt,
    dashboardUrl,
  });

  await sendEmail({ to: owner.email, subject, html });
}

export async function startAnomalyWorker(): Promise<void> {
  const queueName = getAnomalyQueueName();
  const connection = getBullMqConnectionOptions();
  const redisClient = getRedisClient();
  const streamClient: RedisStreamClient =
    redisClient as unknown as RedisStreamClient;
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
            // Exclude events already claimed by a resolved incident so a
            // quiet period followed by a single new error doesn't immediately
            // re-open an incident using the previous incident's error window.
            sql`NOT EXISTS (
              SELECT 1 FROM incident_events ie
              INNER JOIN incidents i ON i.id = ie.incident_id
              WHERE ie.event_id = ${events.id}
              AND i.status = ${IncidentStatus.RESOLVED}
            )`,
          ),
        )
        .orderBy(desc(events.occurredAt));

      const errorCount = recentErrors.length;

      if (errorCount <= ERRORS_COUNT_LIMIT) {
        logger.info(
          { organizationId, errorCount },
          "Error rate below anomaly threshold",
        );
        return;
      }

      await emitAnomalyDetected(streamClient, {
        organizationId,
        projectId,
        errorCount,
        windowSeconds: 60,
      });

      const activeKey = buildActiveIncidentKey(organizationId, projectId);
      const activeRaw: string | null = await redisClient.get(activeKey);

      // ── PATH A: Active incident — attach events, refresh TTL, update summary ──
      if (activeRaw !== null) {
        const { incidentId: activeIncidentId } = decodeIncidentValue(activeRaw);
        const relatedEvents = recentErrors.slice(0, 10);
        if (relatedEvents.length > 0) {
          await db
            .insert(incidentEvents)
            .values(
              relatedEvents.map((e) => ({
                incidentId: activeIncidentId,
                eventId: e.id,
              })),
            )
            .onConflictDoNothing();
        }

        const { totalCount, durationSeconds } = await getIncidentStats(
          db,
          activeIncidentId,
        );
        await db
          .update(incidents)
          .set({
            summary: `High error rate detected: ${totalCount} ERROR events over ${durationSeconds} seconds.`,
            updatedAt: sql`now()`,
          })
          .where(eq(incidents.id, activeIncidentId));

        await redisClient.expire(activeKey, ACTIVE_INCIDENT_TTL_SECONDS);
        // Also refresh the investigating key so it always outlasts the active key.
        // Without this, a long burst resets activeKey TTL repeatedly while
        // investigatingKey expires at its original time — the sweep then finds
        // no investigating key and the incident stays OPEN forever.
        const investigatingKeyForRefresh = buildInvestigatingKey(
          organizationId,
          projectId,
        );
        await redisClient.expire(
          investigatingKeyForRefresh,
          INVESTIGATING_INCIDENT_TTL_SECONDS,
        );

        logger.info(
          {
            organizationId,
            incidentId: activeIncidentId,
            attachedCount: relatedEvents.length,
            totalCount,
            durationSeconds,
          },
          "Attached events to existing incident, refreshed active TTL, updated summary",
        );
        return;
      }

      const investigatingKey = buildInvestigatingKey(organizationId, projectId);
      const investigatingRaw = await redisClient.get(investigatingKey);

      // ── PATH B: Re-spike during INVESTIGATING — reinstate active key, reset quiet window ──
      if (investigatingRaw !== null) {
        const {
          incidentId: investigatingIncidentId,
          createdAt: investigatingCreatedAt,
        } = decodeIncidentValue(investigatingRaw);
        const relatedEvents = recentErrors.slice(0, 10);
        if (relatedEvents.length > 0) {
          await db
            .insert(incidentEvents)
            .values(
              relatedEvents.map((e) => ({
                incidentId: investigatingIncidentId,
                eventId: e.id,
              })),
            )
            .onConflictDoNothing();
        }

        await redisClient.set(
          activeKey,
          encodeIncidentValue(
            investigatingIncidentId,
            IncidentStatus.OPEN,
            investigatingCreatedAt,
          ),
          "EX",
          ACTIVE_INCIDENT_TTL_SECONDS,
        );
        // Reset investigating TTL to full value so the quiet window restarts from now
        await redisClient.set(
          investigatingKey,
          encodeIncidentValue(
            investigatingIncidentId,
            IncidentStatus.OPEN,
            investigatingCreatedAt,
          ),
          "EX",
          INVESTIGATING_INCIDENT_TTL_SECONDS,
        );

        const { totalCount, durationSeconds } = await getIncidentStats(
          db,
          investigatingIncidentId,
        );
        await db
          .update(incidents)
          .set({
            status: IncidentStatus.OPEN,
            summary: `High error rate detected: ${totalCount} ERROR events over ${durationSeconds} seconds.`,
            updatedAt: sql`now()`,
          })
          .where(eq(incidents.id, investigatingIncidentId));

        await emitIncidentUpdated(streamClient, {
          id: investigatingIncidentId,
          organizationId,
          projectId,
          status: IncidentStatus.OPEN,
          severity: IncidentSeverity.CRITICAL as unknown as EventSeverity,
          createdAt: investigatingCreatedAt,
        });

        logger.info(
          { organizationId, incidentId: investigatingIncidentId },
          "Re-spike during INVESTIGATING → active key reinstated, quiet window reset",
        );
        return;
      }

      // ── PATH C: No active, no investigating — create new incident ────────────
      const lockKey = buildLockKey(organizationId, projectId);
      const lockAcquired = await redisClient.set(
        lockKey,
        "1",
        "PX",
        LOCK_TTL_MS,
        "NX",
      );

      if (lockAcquired === null) {
        logger.info(
          { organizationId, projectId },
          "Lock held by concurrent job, skipping incident creation",
        );
        return;
      }

      const relatedEvents = recentErrors.slice(0, 10);

      const [incident] = await db
        .insert(incidents)
        .values({
          organizationId,
          projectId,
          status: IncidentStatus.OPEN,
          severity: IncidentSeverity.CRITICAL,
          summary: `High error rate detected: ${errorCount} ERROR events in last 60 seconds.`,
        })
        .returning();

      if (relatedEvents.length > 0) {
        await db.insert(incidentEvents).values(
          relatedEvents.map((e) => ({
            incidentId: incident.id,
            eventId: e.id,
          })),
        );
      }

      const incidentCreatedAt = incident.createdAt.toISOString();

      await redisClient.set(
        activeKey,
        encodeIncidentValue(incident.id, IncidentStatus.OPEN, incidentCreatedAt),
        "EX",
        ACTIVE_INCIDENT_TTL_SECONDS,
      );
      await redisClient.set(
        investigatingKey,
        encodeIncidentValue(incident.id, IncidentStatus.OPEN, incidentCreatedAt),
        "EX",
        INVESTIGATING_INCIDENT_TTL_SECONDS,
      );

      await emitIncidentCreated(streamClient, {
        id: incident.id,
        organizationId,
        projectId,
        status: incident.status as IncidentStatus,
        severity: incident.severity as EventSeverity,
        summary: incident.summary,
        createdAt: incidentCreatedAt,
      });

      // Notify the org owner — fire-and-forget (sendEmail never throws)
      void notifyOrgOwner(db, {
        organizationId,
        projectId,
        incidentId: incident.id,
        severity: incident.severity,
        summary: incident.summary,
        createdAt: incidentCreatedAt,
      });

      logger.info(
        { organizationId, incidentId: incident.id, errorCount },
        "Created new incident from anomaly",
      );
    },
    { connection },
  );

  worker.on("failed", (job, error) =>
    logger.error({ jobId: job?.id, error }, "Anomaly worker job failed"),
  );
  worker.on("completed", (job) =>
    logger.info({ jobId: job.id }, "Anomaly worker job completed"),
  );
}
