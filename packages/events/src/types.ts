import type {
  AnomalyDetectedData,
  EventIngestedData,
  EventPayload,
  IncidentCreatedData,
  IncidentUpdatedData
} from "@risk-engine/types";

export const EVENT_INGESTED = "EVENT_INGESTED";
export const ANOMALY_DETECTED = "ANOMALY_DETECTED";
export const INCIDENT_CREATED = "INCIDENT_CREATED";
export const INCIDENT_UPDATED = "INCIDENT_UPDATED";

export type AnyEventPayload = EventPayload<Record<string, unknown>>;

export type EventIngestedEvent = EventPayload<EventIngestedData>;
export type AnomalyDetectedEvent = EventPayload<AnomalyDetectedData>;
export type IncidentCreatedEvent = EventPayload<IncidentCreatedData>;
export type IncidentUpdatedEvent = EventPayload<IncidentUpdatedData>;

export interface RedisStreamClient {
  xadd: (stream: string, id: string, ...args: (string | number)[]) => Promise<string>;
}

