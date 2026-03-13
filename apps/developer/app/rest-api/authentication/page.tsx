import type { Metadata } from "next";
import { EndpointCard } from "@/components/endpoint-card";

export const metadata: Metadata = { title: "Authentication — REST API" };

export default function AuthenticationPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          REST API
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Authentication</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Vigilry uses JWT-based session cookies for the dashboard and management
          API. The session cookie is set automatically on login and cleared on logout.
        </p>
      </div>

      <div className="space-y-6">
        <EndpointCard
          method="POST"
          path="/auth/signup"
          description="Create a new account. Automatically creates a user, an organization (named after the user), and an OWNER membership. Sets a JWT session cookie valid for 7 days."
          auth="none"
          bodyParams={[
            { name: "name", type: "string", required: true, description: "Full name of the user." },
            { name: "email", type: "string", required: true, description: "Email address — must be unique." },
            { name: "password", type: "string", required: true, description: "Minimum 8 characters." },
          ]}
          requestExample={`POST /auth/signup HTTP/1.1
Content-Type: application/json

{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "supersecret123"
}`}
          responseExample={`HTTP/1.1 201 Created
Set-Cookie: session=<jwt>; HttpOnly; SameSite=Lax

{
  "user": {
    "id": "usr_01HX...",
    "name": "Alice Smith",
    "email": "alice@example.com"
  },
  "organization": {
    "id": "org_01HX...",
    "name": "Alice Smith",
    "plan": "free"
  }
}`}
          notes={[
            "No project or API key is created automatically. Use POST /projects after signup.",
          ]}
        />

        <EndpointCard
          method="POST"
          path="/auth/login"
          description="Authenticate with email and password. Sets a JWT session cookie valid for 7 days."
          auth="none"
          bodyParams={[
            { name: "email", type: "string", required: true, description: "Registered email address." },
            { name: "password", type: "string", required: true, description: "Account password." },
          ]}
          requestExample={`POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "supersecret123"
}`}
          responseExample={`HTTP/1.1 200 OK
Set-Cookie: session=<jwt>; HttpOnly; SameSite=Lax

{
  "user": {
    "id": "usr_01HX...",
    "name": "Alice Smith",
    "email": "alice@example.com"
  },
  "organization": {
    "id": "org_01HX...",
    "name": "Alice Smith",
    "plan": "free"
  }
}`}
        />

        <EndpointCard
          method="POST"
          path="/auth/logout"
          description="Invalidate the current session by clearing the session cookie."
          auth="jwt"
          responseExample={`HTTP/1.1 200 OK

{ "message": "Logged out" }`}
        />

        <EndpointCard
          method="GET"
          path="/auth/me"
          description="Return the currently authenticated user and their organization. Useful for initializing client-side session state."
          auth="jwt"
          responseExample={`HTTP/1.1 200 OK

{
  "user": {
    "id": "usr_01HX...",
    "name": "Alice Smith",
    "email": "alice@example.com"
  },
  "organization": {
    "id": "org_01HX...",
    "name": "Alice Smith",
    "plan": "free"
  }
}`}
        />
      </div>
    </div>
  );
}
