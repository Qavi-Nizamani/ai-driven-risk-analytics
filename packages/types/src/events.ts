import { EventSeverity, IncidentStatus } from "./risk";

export interface EventPayload<TData extends object = Record<string, unknown>> {
  eventId: string;
  type: string;
  organizationId: string;
  projectId: string;
  timestamp: number;
  data: TData;
}

export interface EventIngestedData {
  organizationId: string;
  projectId: string;
  eventId: string;
  type: string;
  source: string;
  severity: EventSeverity;
  payload: object;
  occurredAt: string;
  timestamp: number;
}

export interface AnomalyDetectedData {
  organizationId: string;
  projectId: string;
  errorCount: number;
  windowSeconds: number;
}

export interface IncidentCreatedData {
  id: string;
  organizationId: string;
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  summary?: string;
  createdAt?: string;
}

export interface IncidentUpdatedData {
  id: string;
  organizationId: string;
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  summary?: string;
  createdAt?: string;
}
