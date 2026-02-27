"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useIncidents } from "@/hooks/useIncidents";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useSocket } from "@/hooks/useSocket";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { IncidentsTable } from "@/components/dashboard/IncidentsTable";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import type { EventRow, IncidentRow } from "@/types/session";

export function DashboardShell() {
  const { session, authChecked, logout } = useAuth();
  const { events, fetchEvents, addEvent } = useEvents();
  const { incidents, fetchIncidents, addIncident, updateIncident } = useIncidents();
  const { keys, fetchKeys, generateKey, revokeKey } = useApiKeys();

  // Stable socket callbacks — wrapped in useCallback to avoid socket reconnects
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

  // Initial data fetch once session is available
  useEffect(() => {
    if (!session) return;
    void fetchEvents();
    void fetchIncidents();
    void fetchKeys(session.project.id);
  }, [session, fetchEvents, fetchIncidents, fetchKeys]);

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

      <Separator className="bg-border" />

      {session && (
        <ApiKeysManager
          keys={keys}
          projectId={session.project.id}
          onGenerate={generateKey}
          onRevoke={revokeKey}
        />
      )}
    </div>
  );
}
