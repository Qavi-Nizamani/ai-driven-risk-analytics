import type { Metadata } from "next";
import Link from "next/link";
import { MethodBadge } from "@/components/method-badge";
import { InlineCode } from "@/components/code-block";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "REST API Overview" };

const sections = [
  {
    href: "/rest-api/authentication",
    title: "Authentication",
    description: "Sign up, log in, log out, and retrieve the current session.",
    endpoints: [
      { method: "POST" as const, path: "/auth/signup" },
      { method: "POST" as const, path: "/auth/login" },
      { method: "POST" as const, path: "/auth/logout" },
      { method: "GET" as const, path: "/auth/me" },
    ],
  },
  {
    href: "/rest-api/organizations",
    title: "Organizations",
    description: "Manage your organization profile and members.",
    endpoints: [
      { method: "GET" as const, path: "/organizations/me" },
      { method: "PATCH" as const, path: "/organizations/me" },
      { method: "GET" as const, path: "/organizations/members" },
      { method: "POST" as const, path: "/organizations/:orgId/members" },
    ],
  },
  {
    href: "/rest-api/projects",
    title: "Projects & API Keys",
    description: "Create and manage projects and their API keys.",
    endpoints: [
      { method: "GET" as const, path: "/projects" },
      { method: "POST" as const, path: "/projects" },
      { method: "GET" as const, path: "/projects/:id" },
      { method: "PATCH" as const, path: "/projects/:id" },
      { method: "DELETE" as const, path: "/projects/:id" },
      { method: "GET" as const, path: "/projects/:projectId/api-keys" },
      { method: "POST" as const, path: "/projects/:projectId/api-keys" },
      { method: "DELETE" as const, path: "/api-keys/:id" },
    ],
  },
  {
    href: "/rest-api/events",
    title: "Events",
    description: "Query captured events for your organization.",
    endpoints: [
      { method: "GET" as const, path: "/events" },
    ],
  },
  {
    href: "/rest-api/incidents",
    title: "Incidents",
    description: "Create and list detected incidents.",
    endpoints: [
      { method: "POST" as const, path: "/incidents" },
      { method: "GET" as const, path: "/incidents" },
    ],
  },
  {
    href: "/rest-api/ingestion",
    title: "Ingestion Service",
    description: "Send raw events, server errors, webhooks, and Stripe events. Runs on port 4100.",
    endpoints: [
      { method: "POST" as const, path: "/ingest/events" },
      { method: "POST" as const, path: "/ingest/server-error" },
      { method: "POST" as const, path: "/ingest/webhook" },
      { method: "POST" as const, path: "/ingest/stripe" },
    ],
  },
];

export default function RestApiPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">REST API Reference</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          The Vigilry REST API is organized around two services: the{" "}
          <InlineCode>API Gateway</InlineCode> for account management, and
          the <InlineCode>Ingestion Service</InlineCode> for sending events.
        </p>
      </div>

      {/* Auth overview */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
        <h2 className="font-semibold text-base">Authentication Overview</h2>
        <p className="text-sm text-[--color-muted-foreground]">
          The API supports two authentication methods, resolved in order:
        </p>
        <ol className="text-sm text-[--color-foreground]/80 space-y-1.5 list-decimal list-inside">
          <li>
            <strong>API Key</strong> — Send <InlineCode>X-Api-Key: &lt;rawKey&gt;</InlineCode> header.
            Sets project context. Used for ingestion endpoints.
          </li>
          <li>
            <strong>JWT Session</strong> — A <InlineCode>session</InlineCode> httpOnly cookie set at login.
            Used for dashboard/management endpoints.
          </li>
        </ol>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group block rounded-xl border border-[--color-border] bg-[--color-card] hover:border-[--color-primary]/40 hover:shadow-sm transition-all overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[--color-border] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold group-hover:text-[--color-primary] transition-colors">
                  {s.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm text-[--color-muted-foreground] mt-0.5">{s.description}</p>
              </div>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {s.endpoints.map((e) => (
                <div key={`${e.method}:${e.path}`} className="flex items-center gap-1.5">
                  <MethodBadge method={e.method} />
                  <code className="text-xs font-mono text-[--color-muted-foreground]">{e.path}</code>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
