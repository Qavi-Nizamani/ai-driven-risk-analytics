"use client";

import { useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useEvents } from "@/hooks/useEvents";
import { useIncidents } from "@/hooks/useIncidents";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { EventRow, IncidentRow } from "@/types/session";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { session, authChecked, logout } = useAuth();
  const { addEvent } = useEvents();
  const { addIncident, updateIncident } = useIncidents();

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

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner rows={3} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar session={session} onLogout={logout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar connected={connected} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
