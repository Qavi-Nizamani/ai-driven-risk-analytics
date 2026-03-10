import type { IncidentStatus } from "@risk-engine/types";
import { getRedisClient } from "@risk-engine/redis";

// ── Key builders ─────────────────────────────────────────────────────────────

export function buildActiveIncidentKey(
  organizationId: string,
  projectId: string,
): string {
  return `incident:active:${organizationId}:${projectId}`;
}

export function buildInvestigatingKey(
  organizationId: string,
  projectId: string,
): string {
  return `incident:investigating:${organizationId}:${projectId}`;
}

export function buildLockKey(
  organizationId: string,
  projectId: string,
): string {
  return `lock:incident:create:${organizationId}:${projectId}`;
}

export function buildSweepLockKey(incidentId: string): string {
  return `lock:sweep:${incidentId}`;
}

// ── Value encoding ───────────────────────────────────────────────────────────

/**
 * Stored value format: "<incidentId>|<status>|<createdAt ISO>"
 * Pipe separator avoids collision with ISO timestamp colons.
 */
export function encodeIncidentValue(
  incidentId: string,
  status: IncidentStatus,
  createdAt: string,
): string {
  return `${incidentId}|${status}|${createdAt}`;
}

export function decodeIncidentValue(value: string): {
  incidentId: string;
  status: IncidentStatus;
  createdAt: string;
} {
  const [incidentId, status, createdAt] = value.split("|");
  return { incidentId, status: status as IncidentStatus, createdAt };
}

// ── SCAN helper ──────────────────────────────────────────────────────────────

export async function scanKeys(
  redisClient: ReturnType<typeof getRedisClient>,
  pattern: string,
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [next, batch] = await redisClient.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = Number(next);
    keys.push(...batch);
  } while (cursor !== 0);
  return keys;
}
