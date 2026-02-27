"use client";

import { useEffect } from "react";
import { FolderGit2, AlertTriangle, Activity, Key } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useEvents } from "@/hooks/useEvents";
import { useIncidents } from "@/hooks/useIncidents";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { IncidentsTable } from "@/components/dashboard/IncidentsTable";

export function OrgOverview() {
  const { projects, fetchProjects } = useProjects();
  const { events, fetchEvents } = useEvents();
  const { incidents, fetchIncidents } = useIncidents();

  useEffect(() => {
    void fetchProjects();
    void fetchEvents();
    void fetchIncidents();
  }, [fetchProjects, fetchEvents, fetchIncidents]);

  const openIncidents = incidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING");
  const now = Date.now();
  const events24h = events.filter(
    (e) => now - new Date(e.occurredAt).getTime() < 24 * 60 * 60 * 1000,
  );

  const totalApiKeys = projects.length; // approximate: 1 default key per project

  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          title="Projects"
          value={projects.length}
          icon={FolderGit2}
          description="Active projects"
        />
        <StatsCard
          title="Open Incidents"
          value={openIncidents.length}
          icon={AlertTriangle}
          description="Open or investigating"
        />
        <StatsCard
          title="Events (24h)"
          value={events24h.length}
          icon={Activity}
          description="In the last 24 hours"
        />
        <StatsCard
          title="API Keys"
          value={totalApiKeys}
          icon={Key}
          description="Across all projects"
        />
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3">
          Recent Incidents
        </h2>
        <IncidentsTable incidents={recentIncidents} />
      </div>
    </div>
  );
}
