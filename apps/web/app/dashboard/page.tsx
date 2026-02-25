'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface EventPayload {
  id: string;
  projectId: string;
  severity: string;
  payload: string;
  createdAt: string;
}

interface IncidentPayload {
  id: string;
  projectId: string;
  severity: string;
  status: string;
  summary: string;
  createdAt: string;
}


function getWebsocketUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";
}

const PROJECT_ID = "699f18261b0953014211250d";

export default function DashboardPage() {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [incidents, setIncidents] = useState<IncidentPayload[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const [subscribed, setSubscribed] = useState<boolean>(false);

  const websocketUrl = useMemo(getWebsocketUrl, []);

  useEffect(() => {
    const socket = io(websocketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe_to_project", {
        projectId: PROJECT_ID
      });
    });

    socket.on("event_created", (payload) => {
      setEvents((prev) => {
        if (prev.find((e) => e.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    });

    socket.on("incident_created", (payload) => {
      setIncidents((prev) => {
        if (prev.find((i) => i.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    });

    socket.on("disconnect", () => {
      setSubscribed(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [websocketUrl]);

  useEffect(() => {
    if (!socketRef.current || subscribed) {
      return;
    }
    setSubscribed(true);
  }, [subscribed]);

  return (
    <main>
      <h1>Customer Risk Dashboard</h1>

      <section>
        <h2>Porject Events</h2>
        <table>
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Event ID</th>
              <th>Severity</th>
              <th>Payload</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.projectId}</td>
                <td>{event.id}</td>
                <td>{event.severity}</td>
                <td>{event.payload}</td>
                <td>{new Date(event.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Incidents (Realtime)</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Summary</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td>{incident.id}</td>
                <td>{incident.severity}</td>
                <td>{incident.status}</td>
                <td>{incident.summary}</td>
                <td>{new Date(incident.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </main>
  );
}

