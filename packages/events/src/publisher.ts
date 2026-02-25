import { randomUUID } from "node:crypto";
import type {
  AnomalyDetectedData,
  EventIngestedData,
  EventPayload,
  IncidentCreatedData,
  IncidentUpdatedData
} from "@risk-engine/types";
import {
  ANOMALY_DETECTED,
  EVENT_INGESTED,
  INCIDENT_CREATED,
  INCIDENT_UPDATED,
  type RedisStreamClient
} from "./types";

const DEFAULT_STREAM_NAME = "platform-events";

async function appendEvent<TData extends object>(
  client: RedisStreamClient,
  payload: EventPayload<TData>,
  streamName: string = DEFAULT_STREAM_NAME
): Promise<string> {
  return client.xadd(
    streamName,
    "*",
    "eventId",
    payload.eventId,
    "type",
    payload.type,
    "projectId",
    payload.projectId,
    "timestamp",
    payload.timestamp,
    "data",
    JSON.stringify(payload.data)
  );
}

export async function emitEventIngested(
  client: RedisStreamClient,
  data: EventIngestedData,
  streamName?: string
): Promise<string> {
  const payload: EventPayload<EventIngestedData> = {
    eventId: randomUUID(),
    type: EVENT_INGESTED,
    projectId: data.projectId,
    timestamp: data.timestamp,
    data
  };

  return appendEvent(client, payload, streamName);
}

export async function emitAnomalyDetected(
  client: RedisStreamClient,
  data: AnomalyDetectedData,
  streamName?: string
): Promise<string> {
  const payload: EventPayload<AnomalyDetectedData> = {
    eventId: randomUUID(),
    type: ANOMALY_DETECTED,
    projectId: data.projectId,
    timestamp: Date.now(),
    data
  };

  return appendEvent(client, payload, streamName);
}

export async function emitIncidentCreated(
  client: RedisStreamClient,
  data: IncidentCreatedData,
  streamName?: string
): Promise<string> {
  const payload: EventPayload<IncidentCreatedData> = {
    eventId: randomUUID(),
    type: INCIDENT_CREATED,
    projectId: data.projectId,
    timestamp: Date.now(),
    data
  };

  return appendEvent(client, payload, streamName);
}

export async function emitIncidentUpdated(
  client: RedisStreamClient,
  data: IncidentUpdatedData,
  streamName?: string
): Promise<string> {
  const payload: EventPayload<IncidentUpdatedData> = {
    eventId: randomUUID(),
    type: INCIDENT_UPDATED,
    projectId: data.projectId,
    timestamp: Date.now(),
    data
  };

  return appendEvent(client, payload, streamName);
}

