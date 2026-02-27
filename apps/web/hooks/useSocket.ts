"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";

interface UseSocketOptions {
  organizationId: string | null;
  onEventCreated: (payload: unknown) => void;
  onIncidentCreated: (payload: unknown) => void;
  onIncidentUpdated: (payload: unknown) => void;
}

interface UseSocketReturn {
  connected: boolean;
}

export function useSocket({
  organizationId,
  onEventCreated,
  onIncidentCreated,
  onIncidentUpdated,
}: UseSocketOptions): UseSocketReturn {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    const socket = io(WS_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe_to_organization", { organizationId });
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("event_created", onEventCreated);
    socket.on("incident_created", onIncidentCreated);
    socket.on("incident_updated", onIncidentUpdated);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Callbacks are wrapped in useCallback in DashboardShell for stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  return { connected };
}
