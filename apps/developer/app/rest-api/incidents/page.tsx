import type { Metadata } from "next";
import { EndpointCard } from "@/components/endpoint-card";

export const metadata: Metadata = { title: "Incidents — REST API" };

export default function IncidentsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          REST API
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Incidents</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Incidents are automatically created by the risk worker when anomaly
          thresholds are exceeded. You can also create them manually. Incidents
          are broadcast over WebSocket when created or updated.
        </p>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-muted]/40 px-5 py-4">
        <p className="text-sm font-medium mb-1">Incident lifecycle</p>
        <div className="flex items-center gap-2 text-sm text-[--color-muted-foreground]">
          <span className="px-2 py-0.5 rounded bg-[--color-delete-bg] text-[--color-delete] text-xs font-medium">open</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-[--color-patch-bg] text-[--color-patch] text-xs font-medium">investigating</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-[--color-get-bg] text-[--color-get] text-xs font-medium">resolved</span>
        </div>
      </div>

      <div className="space-y-6">
        <EndpointCard
          method="GET"
          path="/incidents"
          description="List incidents for the authenticated organization. Optionally filter by status or project."
          auth="jwt"
          queryParams={[
            {
              name: "project_id",
              type: "string",
              description: "Filter incidents to a specific project.",
            },
            {
              name: "status",
              type: "\"open\" | \"investigating\" | \"resolved\"",
              description: "Filter by incident status.",
            },
            {
              name: "limit",
              type: "number",
              description: "Maximum number of incidents to return. Defaults to 50.",
            },
          ]}
          responseExample={`HTTP/1.1 200 OK

[
  {
    "id": "inc_01HX...",
    "title": "Elevated 5xx error rate",
    "status": "open",
    "severity": "critical",
    "projectId": "proj_01HX...",
    "organizationId": "org_01HX...",
    "eventCount": 47,
    "openedAt": "2026-03-12T18:40:00.000Z",
    "resolvedAt": null
  }
]`}
        />

        <EndpointCard
          method="POST"
          path="/incidents"
          description="Manually create an incident. Useful for flagging known outages or maintenance windows."
          auth="jwt"
          bodyParams={[
            { name: "title", type: "string", required: true, description: "Short description of the incident." },
            { name: "severity", type: "\"info\" | \"warn\" | \"error\" | \"critical\"", required: true, description: "Incident severity." },
            { name: "projectId", type: "string", required: true, description: "Project this incident belongs to." },
            { name: "status", type: "\"open\" | \"investigating\"", description: "Initial status. Defaults to open." },
          ]}
          requestExample={`POST /incidents HTTP/1.1
Content-Type: application/json

{
  "title": "Payment service degraded",
  "severity": "error",
  "projectId": "proj_01HX..."
}`}
          responseExample={`HTTP/1.1 201 Created

{
  "id": "inc_02HX...",
  "title": "Payment service degraded",
  "status": "open",
  "severity": "error",
  "projectId": "proj_01HX...",
  "organizationId": "org_01HX...",
  "eventCount": 0,
  "openedAt": "2026-03-13T12:00:00.000Z",
  "resolvedAt": null
}`}
          notes={[
            "Creating an incident via the API triggers a real-time incident_created WebSocket event for all connected dashboard clients in the organization.",
          ]}
        />
      </div>
    </div>
  );
}
