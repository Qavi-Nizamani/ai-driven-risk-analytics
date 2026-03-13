import type { Metadata } from "next";
import { EndpointCard } from "@/components/endpoint-card";

export const metadata: Metadata = { title: "Organizations — REST API" };

export default function OrganizationsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          REST API
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Organizations</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Each user belongs to exactly one organization. Organizations group
          projects, members, and billing. All endpoints require a JWT session.
        </p>
      </div>

      <div className="space-y-6">
        <EndpointCard
          method="GET"
          path="/organizations/me"
          description="Retrieve the organization associated with the authenticated session."
          auth="jwt"
          responseExample={`HTTP/1.1 200 OK

{
  "id": "org_01HX...",
  "name": "Acme Corp",
  "plan": "pro",
  "createdAt": "2026-01-15T10:00:00.000Z"
}`}
        />

        <EndpointCard
          method="PATCH"
          path="/organizations/me"
          description="Update the name or plan of the current organization."
          auth="jwt"
          bodyParams={[
            { name: "name", type: "string", description: "New organization display name." },
            { name: "plan", type: "\"free\" | \"pro\" | \"enterprise\"", description: "Subscription plan." },
          ]}
          requestExample={`PATCH /organizations/me HTTP/1.1
Content-Type: application/json

{
  "name": "Acme Corp",
  "plan": "pro"
}`}
          responseExample={`HTTP/1.1 200 OK

{
  "id": "org_01HX...",
  "name": "Acme Corp",
  "plan": "pro",
  "createdAt": "2026-01-15T10:00:00.000Z"
}`}
        />

        <EndpointCard
          method="GET"
          path="/organizations/members"
          description="List all members of the current organization with their user profiles and roles."
          auth="jwt"
          responseExample={`HTTP/1.1 200 OK

[
  {
    "id": "mem_01HX...",
    "role": "OWNER",
    "joinedAt": "2026-01-15T10:00:00.000Z",
    "user": {
      "id": "usr_01HX...",
      "name": "Alice Smith",
      "email": "alice@example.com"
    }
  },
  {
    "id": "mem_02HX...",
    "role": "MEMBER",
    "joinedAt": "2026-02-01T08:30:00.000Z",
    "user": {
      "id": "usr_02HX...",
      "name": "Bob Jones",
      "email": "bob@example.com"
    }
  }
]`}
        />

        <EndpointCard
          method="POST"
          path="/organizations/:orgId/members"
          description="Add a user to the organization by their user ID. Requires OWNER role."
          auth="jwt"
          pathParams={[
            { name: "orgId", type: "string", required: true, description: "Organization ID." },
          ]}
          bodyParams={[
            { name: "userId", type: "string", required: true, description: "ID of the user to add." },
            { name: "role", type: "\"OWNER\" | \"MEMBER\"", description: "Member role. Defaults to MEMBER." },
          ]}
          requestExample={`POST /organizations/org_01HX.../members HTTP/1.1
Content-Type: application/json

{
  "userId": "usr_02HX...",
  "role": "MEMBER"
}`}
          responseExample={`HTTP/1.1 201 Created

{
  "id": "mem_03HX...",
  "organizationId": "org_01HX...",
  "userId": "usr_02HX...",
  "role": "MEMBER",
  "joinedAt": "2026-03-13T12:00:00.000Z"
}`}
        />
      </div>
    </div>
  );
}
