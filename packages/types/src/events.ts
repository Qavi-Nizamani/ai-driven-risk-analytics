import { EventSeverity, IncidentStatus } from "./risk";

export interface EventPayload<TData extends Record<string, unknown> = Record<string, unknown>> {
  eventId: string;
  type: string;
  projectId: string;
  timestamp: number;
  data: TData;
}

export interface EventIngestedData {
  projectId: string;
  eventId: string;
  severity: EventSeverity;
  timestamp: number;
}

export interface AnomalyDetectedData {
  projectId: string;
  errorCount: number;
  windowSeconds: number;
}

export interface IncidentCreatedData {
  incidentId: string;
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  summary?: string;
}

export interface IncidentUpdatedData {
  incidentId: string;
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  summary?: string;
}

