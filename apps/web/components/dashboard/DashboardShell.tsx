"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useIncidents } from "@/hooks/useIncidents";
import { useSocket } from "@/hooks/useSocket";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { IncidentsTable } from "@/components/dashboard/IncidentsTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import type { EventRow, IncidentRow } from "@/types/session";

export function DashboardShell() {
  const { session, authChecked, logout } = useAuth();
  const { events, fetchEvents, addEvent } = useEvents();
  const { incidents, fetchIncidents, addIncident, updateIncident } = useIncidents();

  const onEventCreated = useCallback(
    (payload: unknown) => addEvent(payload as EventRow),
    [addEvent],
  );
  const onIncidentCreated = useCallback(
    (payload: unknown) => addIncident(payload as IncidentRow),
    [addIncident],
  );
  const onIncidentUpdated = useCallback(
    (payload: unknown) => updateIncident(payload as IncidentRow),
    [updateIncident],
  );

  const { connected } = useSocket({
    organizationId: session?.organization.id ?? null,
    onEventCreated,
    onIncidentCreated,
    onIncidentUpdated,
  });

  useEffect(() => {
    if (!session) return;
    void fetchEvents();
    void fetchIncidents();
  }, [session, fetchEvents, fetchIncidents]);

  if (!authChecked) {
    return (
      <div className="p-6">
        <LoadingSpinner rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        session={session}
        connected={connected}
        onLogout={logout}
      />

      <EventsTable events={events} />

      <Separator className="bg-border" />

      <IncidentsTable incidents={incidents} />
    </div>
  );
}
