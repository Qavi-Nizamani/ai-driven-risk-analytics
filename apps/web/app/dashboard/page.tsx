'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

interface EventRow {
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

interface IncidentRow {
  incidentId?: string;
  id?: string;
  organizationId: string;
  projectId: string;
  severity: string;
  status: string;
  summary: string;
  createdAt: string;
}

interface ApiKeyRow {
  id: string;
  name: string;
  projectId: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface SessionInfo {
  organization: { id: string; name: string; plan: string };
  project: { id: string; name: string; environment: string };
  user: { id: string; email: string; name: string } | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";

function severityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL": return "#dc2626";
    case "ERROR": return "#ea580c";
    case "WARN": return "#ca8a04";
    default: return "#16a34a";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [apiKeyRows, setApiKeyRows] = useState<ApiKeyRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // API key generation
  const [keyName, setKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function init() {
      const meRes = await fetch(`${API_URL}/auth/me`, { credentials: "include" });

      if (!meRes.ok) {
        router.replace("/login");
        return;
      }

      const me = await meRes.json() as SessionInfo;
      setSession(me);
      setAuthChecked(true);

      const orgId = me.organization.id;
      const projectId = me.project.id;

      const [eventsRes, incidentsRes, keysRes] = await Promise.all([
        fetch(`${API_URL}/events?limit=50`, { credentials: "include" }),
        fetch(`${API_URL}/incidents`, { credentials: "include" }),
        fetch(`${API_URL}/projects/${projectId}/api-keys`, { credentials: "include" }),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json() as EventRow[];
        if (Array.isArray(data)) setEvents(data);
      }

      if (incidentsRes.ok) {
        const data = await incidentsRes.json() as IncidentRow[];
        if (Array.isArray(data)) setIncidents(data);
      }

      if (keysRes.ok) {
        const data = await keysRes.json() as ApiKeyRow[];
        if (Array.isArray(data)) setApiKeyRows(data);
      }

      const socket = io(WS_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("subscribe_to_organization", { organizationId: orgId });
      });

      socket.on("event_created", (payload: EventRow) => {
        setEvents((prev) => {
          if (prev.find((e) => e.id === payload.id)) return prev;
          return [payload, ...prev];
        });
      });

      socket.on("incident_created", (payload: IncidentRow) => {
        setIncidents((prev) => {
          const id = payload.incidentId || payload.id;
          if (prev.find((i) => (i.incidentId || i.id) === id)) return prev;
          return [payload, ...prev];
        });
      });

      socket.on("incident_updated", (payload: IncidentRow) => {
        setIncidents((prev) =>
          prev.map((i) =>
            (i.incidentId || i.id) === (payload.incidentId || payload.id) ? payload : i
          )
        );
      });

      socket.on("disconnect", () => setConnected(false));
    }

    void init();

    return () => { socketRef.current?.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/login");
  }

  async function handleGenerateKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session || !keyName.trim()) return;

    setGeneratingKey(true);
    setNewKeyValue(null);

    try {
      const res = await fetch(`${API_URL}/projects/${session.project.id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() }),
      });

      if (!res.ok) return;

      const data = await res.json() as { id: string; name: string; projectId: string; key: string; createdAt: string };
      setNewKeyValue(data.key);
      setKeyName("");
      setApiKeyRows((prev) => [
        { id: data.id, name: data.name, projectId: data.projectId, lastUsedAt: null, createdAt: data.createdAt },
        ...prev,
      ]);
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey(id: string) {
    const res = await fetch(`${API_URL}/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setApiKeyRows((prev) => prev.filter((k) => k.id !== id));
    }
  }

  function handleCopyKey() {
    if (!newKeyValue) return;
    void navigator.clipboard.writeText(newKeyValue).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  }

  if (!authChecked) {
    return (
      <div style={{ fontFamily: "monospace", padding: "24px", color: "#6b7280" }}>
        Checking session…
      </div>
    );
  }

  return (
    <main style={{ fontFamily: "monospace", padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px" }}>Risk Analytics Dashboard</h1>
          {session && (
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {session.organization.name} · {session.project.name}
              {session.user && ` · ${session.user.email}`}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "12px", color: connected ? "#16a34a" : "#dc2626" }}>
            {connected ? "● Live" : "○ Disconnected"}
          </span>
          <button
            onClick={() => void handleLogout()}
            style={{ padding: "4px 12px", background: "transparent", border: "1px solid #374151", borderRadius: "4px", color: "#9ca3af", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Events */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "12px" }}>Events <span style={{ fontSize: "14px", fontWeight: "normal", color: "#6b7280" }}>({events.length})</span></h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>Type</th>
                <th style={{ padding: "8px 12px" }}>Source</th>
                <th style={{ padding: "8px 12px" }}>Severity</th>
                <th style={{ padding: "8px 12px" }}>Correlation ID</th>
                <th style={{ padding: "8px 12px" }}>Payload</th>
                <th style={{ padding: "8px 12px" }}>Occurred At</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "16px 12px", color: "#9ca3af", textAlign: "center" }}>
                    No events yet — ingest events via the API using your API key below.
                  </td>
                </tr>
              ) : (
                events.map((event, i) => (
                  <tr key={event.id ?? i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>{event.type}</td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>{event.source}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: severityColor(event.severity), fontWeight: "bold" }}>{event.severity}</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "11px" }}>{event.correlationId ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#374151", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {JSON.stringify(event.payload)}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(event.occurredAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Incidents */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "12px" }}>Incidents <span style={{ fontSize: "14px", fontWeight: "normal", color: "#6b7280" }}>({incidents.length})</span></h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>ID</th>
                <th style={{ padding: "8px 12px" }}>Severity</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Summary</th>
                <th style={{ padding: "8px 12px" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "16px 12px", color: "#9ca3af", textAlign: "center" }}>
                    No incidents yet.
                  </td>
                </tr>
              ) : (
                incidents.map((incident, i) => {
                  const id = incident.incidentId ?? incident.id ?? String(i);
                  return (
                    <tr key={id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", fontSize: "11px", color: "#6b7280" }}>{id.slice(0, 8)}…</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ color: severityColor(incident.severity), fontWeight: "bold" }}>{incident.severity}</span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>{incident.status}</td>
                      <td style={{ padding: "8px 12px" }}>{incident.summary}</td>
                      <td style={{ padding: "8px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                        {new Date(incident.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* API Keys */}
      <section>
        <h2 style={{ marginBottom: "4px" }}>API Keys</h2>
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#6b7280" }}>
          Use these with <code>X-Api-Key</code> header on the ingestion service (port 4100).
          {session && <> Project ID: <code style={{ color: "#94a3b8" }}>{session.project.id}</code></>}
        </p>

        {/* Newly generated key — shown once */}
        {newKeyValue && (
          <div style={{ marginBottom: "16px", padding: "12px 14px", background: "#0f2318", border: "1px solid #166534", borderRadius: "6px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              New key — copy now, won&apos;t be shown again
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                readOnly
                value={newKeyValue}
                style={{ flex: 1, padding: "6px 8px", background: "#1a2e20", border: "1px solid #166534", borderRadius: "4px", color: "#86efac", fontSize: "12px", fontFamily: "monospace", minWidth: 0 }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button onClick={handleCopyKey} style={{ padding: "6px 12px", background: "#166534", border: "none", borderRadius: "4px", color: "#bbf7d0", fontSize: "12px", fontFamily: "monospace", cursor: "pointer", whiteSpace: "nowrap" }}>
                {copiedKey ? "Copied!" : "Copy"}
              </button>
              <button onClick={() => setNewKeyValue(null)} style={{ padding: "6px 10px", background: "transparent", border: "1px solid #166534", borderRadius: "4px", color: "#4ade80", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Existing keys */}
        {apiKeyRows.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "16px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>Name</th>
                <th style={{ padding: "8px 12px" }}>Last used</th>
                <th style={{ padding: "8px 12px" }}>Created</th>
                <th style={{ padding: "8px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {apiKeyRows.map((k) => (
                <tr key={k.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 12px" }}>{k.name}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "12px" }}>
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {new Date(k.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <button
                      onClick={() => void handleRevokeKey(k.id)}
                      style={{ padding: "2px 8px", background: "transparent", border: "1px solid #7f1d1d", borderRadius: "3px", color: "#f87171", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Generate new key form */}
        <form onSubmit={(e) => void handleGenerateKey(e)} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name (e.g. staging-ingestor)"
            required
            style={{ flex: 1, maxWidth: "320px", padding: "6px 10px", background: "#1a1d27", border: "1px solid #374151", borderRadius: "4px", color: "#e2e8f0", fontSize: "13px", fontFamily: "monospace", outline: "none" }}
          />
          <button
            type="submit"
            disabled={generatingKey || !keyName.trim()}
            style={{ padding: "6px 14px", background: "#4f46e5", border: "none", borderRadius: "4px", color: "#fff", fontSize: "13px", fontFamily: "monospace", cursor: "pointer" }}
          >
            {generatingKey ? "Generating…" : "Generate new key"}
          </button>
        </form>
      </section>
    </main>
  );
}
