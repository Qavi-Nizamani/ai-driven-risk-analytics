"use client";

import { useEffect, useCallback, useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useIncidents } from "@/hooks/useIncidents";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useWebhookEndpoints } from "@/hooks/useWebhookEndpoints";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { type TimeRange } from "@/lib/timeRange";
import { ProjectHeader } from "@/components/dashboard/ProjectHeader";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { IncidentsTable } from "@/components/dashboard/IncidentsTable";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";
import { WebhookEndpointsManager } from "@/components/dashboard/WebhookEndpointsManager";
import { TimeRangeFilter } from "@/components/dashboard/TimeRangeFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { EventRow, IncidentRow, ProjectRow } from "@/types/session";

function EventsQuickstart({ hasKey }: { hasKey: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-4 max-w-xl">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest">Send your first event</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No events yet. Install the SDK and send one to see it appear here in real time.
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">1 — Install</p>
        <pre className="text-xs font-mono bg-background border border-border rounded px-3 py-2 overflow-x-auto">
          <span className="text-muted-foreground">$</span> npm install @vigilry/node
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">2 — Initialise</p>
        <pre className="text-xs font-mono bg-background border border-border rounded px-3 py-2 overflow-x-auto leading-relaxed text-foreground/80">
{`import vigilry from "@vigilry/node";

vigilry.init({
  apiKey: "${hasKey ? "<your publishable key from API Keys tab>" : "pk_live_..."}",
});`}
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">3 — Capture</p>
        <pre className="text-xs font-mono bg-background border border-border rounded px-3 py-2 overflow-x-auto leading-relaxed text-foreground/80">
{`try {
  // your code
} catch (err) {
  vigilry.captureError(err);
}`}
        </pre>
      </div>
      <a
        href="https://developers.vigilry.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Full SDK reference and examples →
      </a>
    </div>
  );
}

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const { session } = useAuth();
  const { events, fetchEvents, addEvent } = useEvents();
  const { incidents, fetchIncidents, addIncident, updateIncident } = useIncidents();
  const { keys, fetchKeys, generateKey, revokeKey } = useApiKeys();
  const { endpoints, fetchEndpoints, createEndpoint, revokeEndpoint } = useWebhookEndpoints();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  useEffect(() => {
    setProjectLoading(true);
    void api.projects.getById(projectId).then((p) => {
      setProject(p);
      setProjectLoading(false);
    }).catch(() => setProjectLoading(false));
  }, [projectId]);

  useEffect(() => {
    void fetchKeys(projectId);
    void fetchEndpoints(projectId);
  }, [projectId, fetchKeys, fetchEndpoints]);

  // Re-fetch events & incidents whenever projectId or timeRange changes
  useEffect(() => {
    void fetchEvents(projectId, timeRange);
    void fetchIncidents(projectId, timeRange);
  }, [projectId, timeRange, fetchEvents, fetchIncidents]);

  const onEventCreated = useCallback(
    (payload: unknown) => {
      const ev = payload as EventRow;
      if (ev.projectId === projectId) addEvent(ev);
    },
    [addEvent, projectId],
  );
  const onIncidentCreated = useCallback(
    (payload: unknown) => {
      const inc = payload as IncidentRow;
      if (inc.projectId === projectId) addIncident(inc);
    },
    [addIncident, projectId],
  );
  const onIncidentUpdated = useCallback(
    (payload: unknown) => {
      const inc = payload as IncidentRow;
      if (inc.projectId === projectId) updateIncident(inc);
    },
    [updateIncident, projectId],
  );

  useSocket({
    organizationId: session?.organization.id ?? null,
    onEventCreated,
    onIncidentCreated,
    onIncidentUpdated,
  });

  if (projectLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner rows={3} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Project not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />

      <Tabs defaultValue="events">
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="events" className="text-xs">
              Events ({events.length})
            </TabsTrigger>
            <TabsTrigger value="incidents" className="text-xs">
              Incidents ({incidents.length})
            </TabsTrigger>
            <TabsTrigger value="apikeys" className="text-xs">
              API Keys ({keys.length})
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs">
              Webhooks ({endpoints.length})
            </TabsTrigger>
          </TabsList>

          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        <TabsContent value="events" className="mt-4">
          {events.length === 0 ? (
            <EventsQuickstart hasKey={keys.some((k) => k.type === "publishable")} />
          ) : (
            <EventsTable events={events} />
          )}
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <IncidentsTable incidents={incidents} />
        </TabsContent>

        <TabsContent value="apikeys" className="mt-4">
          <ApiKeysManager
            keys={keys}
            projectId={projectId}
            onGenerate={generateKey}
            onRevoke={revokeKey}
          />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <WebhookEndpointsManager
            endpoints={endpoints}
            projectId={projectId}
            onCreate={createEndpoint}
            onRevoke={revokeEndpoint}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
