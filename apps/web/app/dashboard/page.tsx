'use client';

import { useEffect, useRef, useState } from "react";
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

const ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

function severityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL": return "#dc2626";
    case "ERROR": return "#ea580c";
    case "WARN": return "#ca8a04";
    default: return "#16a34a";
  }
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Fetch initial data from API
  useEffect(() => {
    if (!API_KEY) return;

    fetch(`${API_URL}/events?limit=50`, {
      headers: { "X-Api-Key": API_KEY },
    })
      .then((r) => r.json())
      .then((data: EventRow[]) => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
      })
      .catch(() => {/* ignore initial fetch errors */});

    fetch(`${API_URL}/incidents`, {
      headers: { "X-Api-Key": API_KEY },
    })
      .then((r) => r.json())
      .then((data: IncidentRow[]) => {
        if (Array.isArray(data)) {
          setIncidents(data);
        }
      })
      .catch(() => {/* ignore initial fetch errors */});
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = io(WS_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (ORGANIZATION_ID) {
        socket.emit("subscribe_to_organization", { organizationId: ORGANIZATION_ID });
      }
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

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main style={{ fontFamily: "monospace", padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: 0 }}>Risk Analytics Dashboard</h1>
        <span style={{ fontSize: "12px", color: connected ? "#16a34a" : "#dc2626" }}>
          {connected ? "● Live" : "○ Disconnected"}
        </span>
      </div>

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
                    No events yet. Ingest events via the API.
                  </td>
                </tr>
              ) : (
                events.map((event, i) => (
                  <tr key={event.id ?? i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>{event.type}</td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>{event.source}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: severityColor(event.severity), fontWeight: "bold" }}>
                        {event.severity}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "11px" }}>
                      {event.correlationId ?? "—"}
                    </td>
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

      <section>
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
                        <span style={{ color: severityColor(incident.severity), fontWeight: "bold" }}>
                          {incident.severity}
                        </span>
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
    </main>
  );
}
