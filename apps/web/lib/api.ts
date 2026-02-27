import type {
  SessionInfo,
  SignupResult,
  EventRow,
  IncidentRow,
  ApiKeyRow,
} from "@/types/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => ({ message: res.statusText }))) as { message?: string };
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    me: () => request<SessionInfo>("/auth/me"),
    login: (email: string, password: string) =>
      request<void>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    signup: (data: {
      email: string;
      name: string;
      orgName: string;
      password: string;
    }) =>
      request<SignupResult>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
  },

  events: {
    list: (params?: {
      limit?: number;
      type?: string;
      severity?: string;
      project_id?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.type) query.set("type", params.type);
      if (params?.severity) query.set("severity", params.severity);
      if (params?.project_id) query.set("project_id", params.project_id);
      const qs = query.toString();
      return request<EventRow[]>(`/events${qs ? `?${qs}` : ""}`);
    },
  },

  incidents: {
    list: (params?: { project_id?: string }) => {
      const query = new URLSearchParams();
      if (params?.project_id) query.set("project_id", params.project_id);
      const qs = query.toString();
      return request<IncidentRow[]>(`/incidents${qs ? `?${qs}` : ""}`);
    },
  },

  apiKeys: {
    list: (projectId: string) =>
      request<ApiKeyRow[]>(`/projects/${projectId}/api-keys`),
    create: (projectId: string, name: string) =>
      request<{
        id: string;
        name: string;
        projectId: string;
        key: string;
        createdAt: string;
      }>(`/projects/${projectId}/api-keys`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    revoke: (id: string) =>
      request<void>(`/api-keys/${id}`, { method: "DELETE" }),
  },
} as const;
