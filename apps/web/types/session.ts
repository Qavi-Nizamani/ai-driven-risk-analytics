export interface SessionInfo {
  organization: { id: string; name: string; plan: string };
  project: { id: string; name: string; environment: string };
  user: { id: string; email: string; name: string } | null;
}

export interface SignupResult {
  apiKey: string;
  organization: { id: string; name: string };
  project: { id: string; name: string };
}

export interface EventRow {
  id: string;
  organizationId: string;
  projectId: string;
  source: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  correlationId?: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface IncidentRow {
  id: string;
  organizationId: string;
  projectId: string;
  severity: string;
  status: string;
  summary: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  projectId: string;
  lastUsedAt: string | null;
  createdAt: string;
}
