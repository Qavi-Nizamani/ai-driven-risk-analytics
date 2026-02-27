"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { IncidentRow } from "@/types/session";

interface UseIncidentsReturn {
  incidents: IncidentRow[];
  loading: boolean;
  fetchIncidents: (projectId?: string) => Promise<void>;
  addIncident: (incident: IncidentRow) => void;
  updateIncident: (incident: IncidentRow) => void;
}

export function useIncidents(): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = useCallback(async (projectId?: string) => {
    setLoading(true);
    try {
      const data = await api.incidents.list({ project_id: projectId });
      setIncidents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addIncident = useCallback((incident: IncidentRow) => {
    setIncidents((prev) => {
      if (prev.some((i) => i.id === incident.id)) return prev;
      return [incident, ...prev];
    });
  }, []);

  const updateIncident = useCallback((incident: IncidentRow) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incident.id ? { ...i, ...incident } : i)),
    );
  }, []);

  return { incidents, loading, fetchIncidents, addIncident, updateIncident };
}
