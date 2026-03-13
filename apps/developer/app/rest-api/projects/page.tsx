import type { Metadata } from "next";
import { EndpointCard } from "@/components/endpoint-card";

export const metadata: Metadata = { title: "Projects & API Keys — REST API" };

export default function ProjectsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          REST API
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Projects &amp; API Keys</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Projects scope your event data. Each project has one or more API keys
          used to authenticate ingest calls. Raw API key values are shown{" "}
          <strong>only once</strong> — at creation time.
        </p>
      </div>

      <div className="space-y-6">
        <EndpointCard
          method="GET"
          path="/projects"
          description="List all projects belonging to the authenticated organization."
          auth="jwt"
          responseExample={`HTTP/1.1 200 OK

[
  {
    "id": "proj_01HX...",
    "name": "Production",
    "environment": "production",
    "organizationId": "org_01HX...",
    "createdAt": "2026-01-20T09:00:00.000Z"
  }
]`}
        />

        <EndpointCard
          method="POST"
          path="/projects"
          description="Create a new project. Automatically generates one API key. The raw key is returned once in the response — store it securely."
          auth="jwt"
          bodyParams={[
            { name: "name", type: "string", required: true, description: "Display name for the project." },
            {
              name: "environment",
              type: "\"production\" | \"staging\" | \"development\"",
              description: "Target environment. Defaults to production.",
            },
          ]}
          requestExample={`POST /projects HTTP/1.1
Content-Type: application/json

{
  "name": "Production",
  "environment": "production"
}`}
          responseExample={`HTTP/1.1 201 Created

{
  "id": "proj_01HX...",
  "name": "Production",
  "environment": "production",
  "organizationId": "org_01HX...",
  "createdAt": "2026-01-20T09:00:00.000Z",
  "apiKey": "vig_live_abc123def456..."
}`}
          notes={[
            "The apiKey field is the raw (unhashed) key. It is never stored and cannot be retrieved again.",
          ]}
        />

        <EndpointCard
          method="GET"
          path="/projects/:id"
          description="Retrieve a single project by its ID."
          auth="jwt"
          pathParams={[
            { name: "id", type: "string", required: true, description: "Project ID." },
          ]}
          responseExample={`HTTP/1.1 200 OK

{
  "id": "proj_01HX...",
  "name": "Production",
  "environment": "production",
  "organizationId": "org_01HX...",
  "createdAt": "2026-01-20T09:00:00.000Z"
}`}
        />

        <EndpointCard
          method="PATCH"
          path="/projects/:id"
          description="Update a project's name or environment."
          auth="jwt"
          pathParams={[
            { name: "id", type: "string", required: true, description: "Project ID." },
          ]}
          bodyParams={[
            { name: "name", type: "string", description: "New display name." },
            { name: "environment", type: "\"production\" | \"staging\" | \"development\"", description: "New environment." },
          ]}
          requestExample={`PATCH /projects/proj_01HX... HTTP/1.1
Content-Type: application/json

{
  "name": "Production v2"
}`}
          responseExample={`HTTP/1.1 200 OK

{
  "id": "proj_01HX...",
  "name": "Production v2",
  "environment": "production",
  "organizationId": "org_01HX...",
  "createdAt": "2026-01-20T09:00:00.000Z"
}`}
        />

        <EndpointCard
          method="DELETE"
          path="/projects/:id"
          description="Permanently delete a project and all its associated events, incidents, and API keys."
          auth="jwt"
          pathParams={[
            { name: "id", type: "string", required: true, description: "Project ID." },
          ]}
          responseExample={`HTTP/1.1 204 No Content`}
        />

        <EndpointCard
          method="GET"
          path="/projects/:projectId/api-keys"
          description="List all API keys for a project. Raw key values are never returned — only metadata."
          auth="jwt"
          pathParams={[
            { name: "projectId", type: "string", required: true, description: "Project ID." },
          ]}
          responseExample={`HTTP/1.1 200 OK

[
  {
    "id": "key_01HX...",
    "name": "Default",
    "prefix": "vig_live_abc1",
    "projectId": "proj_01HX...",
    "createdAt": "2026-01-20T09:00:00.000Z",
    "lastUsedAt": "2026-03-12T18:45:00.000Z"
  }
]`}
        />

        <EndpointCard
          method="POST"
          path="/projects/:projectId/api-keys"
          description="Create an additional API key for a project. The raw key is returned once."
          auth="jwt"
          pathParams={[
            { name: "projectId", type: "string", required: true, description: "Project ID." },
          ]}
          bodyParams={[
            { name: "name", type: "string", description: "Friendly label for this key (e.g. \"CI/CD\")." },
          ]}
          responseExample={`HTTP/1.1 201 Created

{
  "id": "key_02HX...",
  "name": "CI/CD",
  "prefix": "vig_live_xyz9",
  "projectId": "proj_01HX...",
  "createdAt": "2026-03-13T10:00:00.000Z",
  "rawKey": "vig_live_xyz9..."
}`}
        />

        <EndpointCard
          method="DELETE"
          path="/api-keys/:id"
          description="Revoke an API key. Any requests using this key will immediately return 401."
          auth="jwt"
          pathParams={[
            { name: "id", type: "string", required: true, description: "API key ID." },
          ]}
          responseExample={`HTTP/1.1 204 No Content`}
          notes={[
            `Note: This endpoint is at /api-keys/:id (not under /projects). Use GET /projects/:projectId/api-keys to find the key ID.`,
          ]}
        />
      </div>
    </div>
  );
}
