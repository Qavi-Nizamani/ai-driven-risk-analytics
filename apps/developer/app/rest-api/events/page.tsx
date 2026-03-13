import type { Metadata } from "next";
import { EndpointCard } from "@/components/endpoint-card";

export const metadata: Metadata = { title: "Events — REST API" };

export default function EventsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          REST API
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Events</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Events are the raw observations captured by your application. They are
          ingested asynchronously through the Ingestion Service and stored for
          querying and analysis.
        </p>
      </div>

      <div className="space-y-6">
        <EndpointCard
          method="GET"
          path="/events"
          description="Query events for the authenticated organization. Supports filtering by project, type, severity, correlation ID, and time range."
          auth="jwt"
          queryParams={[
            {
              name: "project_id",
              type: "string",
              description: "Filter events to a specific project.",
            },
            {
              name: "type",
              type: "string",
              description: "Filter by event type (e.g. manual, server_error, webhook).",
            },
            {
              name: "severity",
              type: "\"info\" | \"warn\" | \"error\" | \"critical\"",
              description: "Filter by severity level.",
            },
            {
              name: "correlation_id",
              type: "string",
              description: "Filter events sharing a correlation ID.",
            },
            {
              name: "from",
              type: "ISO 8601 string",
              description: "Return events after this timestamp.",
            },
            {
              name: "to",
              type: "ISO 8601 string",
              description: "Return events before this timestamp.",
            },
            {
              name: "limit",
              type: "number",
              description: "Maximum number of events to return. Defaults to 50, max 500.",
            },
          ]}
          requestExample={`GET /events?project_id=proj_01HX...&severity=error&limit=20 HTTP/1.1`}
          responseExample={`HTTP/1.1 200 OK

[
  {
    "id": "evt_01HX...",
    "type": "server_error",
    "severity": "error",
    "source": "api-service",
    "message": "Unhandled exception in /api/checkout",
    "payload": {
      "status_code": 500,
      "path": "/api/checkout",
      "method": "POST"
    },
    "correlationId": "order_9988",
    "projectId": "proj_01HX...",
    "organizationId": "org_01HX...",
    "capturedAt": "2026-03-12T18:45:32.000Z"
  }
]`}
        />
      </div>
    </div>
  );
}
