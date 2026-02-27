"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EventRow } from "@/types/session";

interface UseEventsReturn {
  events: EventRow[];
  loading: boolean;
  fetchEvents: (projectId?: string) => Promise<void>;
  addEvent: (event: EventRow) => void;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async (projectId?: string) => {
    setLoading(true);
    try {
      const data = await api.events.list({ limit: 50, project_id: projectId });
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addEvent = useCallback((event: EventRow) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === event.id)) return prev;
      return [event, ...prev].slice(0, 100);
    });
  }, []);

  return { events, loading, fetchEvents, addEvent };
}
