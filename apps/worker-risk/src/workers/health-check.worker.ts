import { and, eq, sql } from "drizzle-orm";
import { Worker } from "bullmq";
import { createLogger } from "@risk-engine/logger";
import { getBullMqConnectionOptions, getRedisClient } from "@risk-engine/redis";
import { IncidentSeverity, IncidentStatus } from "@risk-engine/types";
import type { EventSeverity } from "@risk-engine/types";
import { getDb, incidents } from "@risk-engine/db";
import { emitIncidentUpdated, type RedisStreamClient } from "@risk-engine/events";
import { getDatabaseUrl } from "../config/env";
import {
  CHECK_AND_DELETE_LUA,
  RESOLVE_THRESHOLD_MS,
  SWEEP_LOCK_TTL_MS,
} from "../constants";
import {
  buildActiveIncidentKey,
  buildSweepLockKey,
  decodeIncidentValue,
  encodeIncidentValue,
  scanKeys,
} from "../redis/incident-keys";

const logger = createLogger("worker-anomaly");

/**
 * State machine driven by two Redis keys:
 *
 *  incident:active:{org}:{project}       → refreshed on every anomaly hit; expiry = OPEN→quiet
 *  incident:investigating:{org}:{project} → fixed TTL from creation; resets on re-spike
 *
 * Transitions per sweep tick (30 s):
 *
 *  status=OPEN   + active present  → still OPEN, skip
 *  status=OPEN   + active absent   → DB: INVESTIGATING, update Redis value (KEEPTTL)
 *  status=INVESTIGATING + active present  → re-spike; DB: OPEN, refresh both keys
 *  status=INVESTIGATING + active absent   → wait until PTTL ≤ threshold, then DB: RESOLVED
 *
 * Hardening:
 *  • SCAN instead of KEYS — non-blocking
 *  • Per-incident sweep lock — prevents concurrent workers from double-processing
 *  • Lua PTTL+DEL — atomic; avoids race between check and delete
 *  • try/catch per incident — one failure never aborts the whole sweep
 */
async function runSweep(
  redisClient: ReturnType<typeof getRedisClient>,
  streamClient: RedisStreamClient,
  db: ReturnType<typeof getDb>,
): Promise<void> {
  const investigatingKeys = await scanKeys(
    redisClient,
    "incident:investigating:*",
  );
  if (investigatingKeys.length === 0) return;

  for (const investigatingKey of investigatingKeys) {
    const raw = await redisClient.get(investigatingKey);
    if (raw === null) continue; // expired between SCAN and GET

    const { incidentId, status, createdAt } = decodeIncidentValue(raw);
    const parts = investigatingKey.split(":");
    const organizationId = parts[2];
    const projectId = parts[3];

    // Per-incident sweep lock — skip if another worker is already processing this incident
    const sweepLockKey = buildSweepLockKey(incidentId);
    const sweepLockAcquired = await redisClient.set(
      sweepLockKey,
      "1",
      "PX",
      SWEEP_LOCK_TTL_MS,
      "NX",
    );
    if (sweepLockAcquired === null) continue;

    try {
      const activeKey = buildActiveIncidentKey(organizationId, projectId);
      const activeRaw = await redisClient.get(activeKey);

      if (activeRaw !== null) {
        // Spike is still ongoing — if Redis cached an INVESTIGATING status, correct it back to OPEN
        if (status === IncidentStatus.INVESTIGATING) {
          await db
            .update(incidents)
            .set({ status: IncidentStatus.OPEN, updatedAt: sql`now()` })
            .where(
              and(
                eq(incidents.id, incidentId),
                eq(incidents.status, IncidentStatus.INVESTIGATING),
              ),
            );

          await redisClient.set(
            activeKey,
            encodeIncidentValue(incidentId, IncidentStatus.OPEN, createdAt),
            "KEEPTTL",
          );
          await redisClient.set(
            investigatingKey,
            encodeIncidentValue(incidentId, IncidentStatus.OPEN, createdAt),
            "KEEPTTL",
          );

          await emitIncidentUpdated(streamClient, {
            id: incidentId,
            organizationId,
            projectId,
            status: IncidentStatus.OPEN,
            severity: IncidentSeverity.CRITICAL as unknown as EventSeverity,
            createdAt,
          });

          logger.info(
            { organizationId, incidentId },
            "Re-spike detected in sweep → back to OPEN",
          );
        }
        continue;
      }

      // No active key — errors have calmed down
      if (status === IncidentStatus.OPEN) {
        // First quiet sweep: transition to INVESTIGATING
        await db
          .update(incidents)
          .set({ status: IncidentStatus.INVESTIGATING, updatedAt: sql`now()` })
          .where(
            and(
              eq(incidents.id, incidentId),
              eq(incidents.status, IncidentStatus.OPEN),
            ),
          );

        await redisClient.set(
          investigatingKey,
          encodeIncidentValue(
            incidentId,
            IncidentStatus.INVESTIGATING,
            createdAt,
          ),
          "KEEPTTL",
        );

        await emitIncidentUpdated(streamClient, {
          id: incidentId,
          organizationId,
          projectId,
          status: IncidentStatus.INVESTIGATING,
          severity: IncidentSeverity.CRITICAL as unknown as EventSeverity,
          createdAt,
        });

        logger.info(
          { organizationId, incidentId },
          "Errors calmed → INVESTIGATING",
        );
      } else if (status === IncidentStatus.INVESTIGATING) {
        // Lua atomically checks PTTL and deletes the key if within resolve threshold.
        // This eliminates the race between pttl() and del() across concurrent workers.
        const result = (await redisClient.eval(
          CHECK_AND_DELETE_LUA,
          1,
          investigatingKey,
          String(RESOLVE_THRESHOLD_MS),
        )) as number;

        if (result === -2) continue; // key already gone — nothing to do
        if (result > 0) continue; // TTL still high — check again on next sweep

        // result === 0: key deleted by Lua, safe to resolve
        await db
          .update(incidents)
          .set({ status: IncidentStatus.RESOLVED, updatedAt: sql`now()` })
          .where(
            and(
              eq(incidents.id, incidentId),
              eq(incidents.status, IncidentStatus.INVESTIGATING),
            ),
          );

        await emitIncidentUpdated(streamClient, {
          id: incidentId,
          organizationId,
          projectId,
          status: IncidentStatus.RESOLVED,
          severity: IncidentSeverity.CRITICAL as unknown as EventSeverity,
          createdAt,
        });

        logger.info(
          { organizationId, incidentId },
          "INVESTIGATING window closed → RESOLVED",
        );
      }
    } catch (err) {
      // Log with full context so the incident can be manually recovered if needed.
      // The sweep lock expires in SWEEP_LOCK_TTL_MS, after which the next sweep retries.
      logger.error(
        { organizationId, incidentId, status, err },
        "Sweep transition failed — will retry on next tick",
      );
    } finally {
      await redisClient.del(sweepLockKey);
    }
  }
}

export async function startHealthCheckWorker(): Promise<void> {
  const redisClient = getRedisClient();
  const connection = getBullMqConnectionOptions();
  const streamClient: RedisStreamClient =
    redisClient as unknown as RedisStreamClient;
  const db = getDb(getDatabaseUrl());

  new Worker(
    "incident_health_check",
    async () => {
      await runSweep(redisClient, streamClient, db);
    },
    { connection },
  );
}
