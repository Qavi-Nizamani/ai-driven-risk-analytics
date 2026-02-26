import { EventSeverity, EventType, IncidentStatus } from "./risk";

export interface Organization {
  id: string;
  name: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  environment: "PRODUCTION" | "STAGING" | "DEV";
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  organizationId: string;
  projectId: string;
  source: string;
  type: EventType | string;
  severity: EventSeverity;
  correlationId?: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  organizationId: string;
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  summary: string;
  createdAt: string;
  updatedAt: string;
}
