import type { EventSeverity } from "@risk-engine/types";

export interface AnomalyJobPayload {
  organizationId: string;
  projectId: string;
  eventId: string;
  severity: EventSeverity;
  correlationId: string;
  timestamp: number;
}

export interface IngestionJobPayload {
  organizationId: string;
  projectId: string;
  source: string;
  type: string;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  correlationId: string;
  correlation: Record<string, unknown>;
  occurredAt: string;
}
