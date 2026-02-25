import { EventSeverity, IncidentStatus } from "./risk";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  projectId: string;
  source: string;
  type: string;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface Incident {
  id: string;
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  relatedEventIds: string[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

