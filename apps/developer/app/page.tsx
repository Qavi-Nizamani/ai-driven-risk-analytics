import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Package, ArrowRight, Zap, Shield, Radio } from "lucide-react";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Introduction",
};

interface QuickLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickLink({ href, icon, title, description }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="group flex gap-4 p-5 rounded-xl border border-[--color-border] bg-[--color-card] hover:border-[--color-primary]/40 hover:shadow-sm transition-all"
    >
      <div className="mt-0.5 text-[--color-primary]">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 font-semibold text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {title}
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="mt-0.5 text-sm text-[--color-muted-foreground]">{description}</p>
      </div>
    </Link>
  );
}

export default function IntroductionPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[--color-post-bg] border border-[--color-post]/20 text-[--color-post] text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[--color-post] animate-pulse" />
          v0.1.5 — Latest
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[--color-foreground]">
          Vigilry Developer Docs
        </h1>
        <p className="text-lg text-[--color-muted-foreground] max-w-2xl leading-relaxed">
          Vigilry is a real-time incident risk engine. Capture events from your
          applications, detect anomalies automatically, and get alerted about
          incidents before they escalate.
        </p>
      </div>

      {/* Quick navigation */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-4">
          Quick Navigation
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink
            href="/rest-api"
            icon={<Code2 className="w-5 h-5" />}
            title="REST API Reference"
            description="Full HTTP API for auth, projects, events, and incidents."
          />
          <QuickLink
            href="/sdk"
            icon={<Package className="w-5 h-5" />}
            title="Node.js SDK"
            description="Official @vigilry/node SDK — capture events with one line."
          />
          <QuickLink
            href="/rest-api/ingestion"
            icon={<Radio className="w-5 h-5" />}
            title="Ingestion Service"
            description="Ingest events, server errors, webhooks, and Stripe events."
          />
          <QuickLink
            href="/sdk/express"
            icon={<Zap className="w-5 h-5" />}
            title="Express Middleware"
            description="Drop-in middleware that auto-captures Express errors."
          />
        </div>
      </div>

      {/* Architecture overview */}
      <div>
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Ingest",
              icon: <Radio className="w-5 h-5" />,
              description:
                "Send events from your app using the SDK or the Ingestion Service HTTP API. Events are queued in Redis Streams.",
            },
            {
              step: "2",
              title: "Analyze",
              icon: <Zap className="w-5 h-5" />,
              description:
                "The risk worker processes events via BullMQ, scores anomalies, and creates incidents when thresholds are exceeded.",
            },
            {
              step: "3",
              title: "Alert",
              icon: <Shield className="w-5 h-5" />,
              description:
                "Incidents are broadcast over WebSocket to your dashboard in real time, so your team can respond immediately.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-xl border border-[--color-border] bg-[--color-card] p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-[--color-primary] text-white flex items-center justify-center text-xs font-bold">
                  {item.step}
                </div>
                <div className="text-[--color-primary]">{item.icon}</div>
                <span className="font-semibold">{item.title}</span>
              </div>
              <p className="text-sm text-[--color-muted-foreground] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Base URLs */}
      <div>
        <h2 className="text-xl font-bold mb-4">Base URLs</h2>
        <div className="rounded-xl border border-[--color-border] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[--color-muted] border-b border-[--color-border]">
                <th className="text-left px-5 py-3 font-semibold text-[--color-muted-foreground]">Service</th>
                <th className="text-left px-5 py-3 font-semibold text-[--color-muted-foreground]">Local URL</th>
                <th className="text-left px-5 py-3 font-semibold text-[--color-muted-foreground]">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {[
                { service: "API Gateway", url: config.apiGatewayUrl, purpose: "Auth, projects, events, incidents" },
                { service: "Ingestion Service", url: config.ingestionUrl, purpose: "Event ingestion endpoints" },
                { service: "WebSocket", url: config.websocketUrl, purpose: "Real-time incident/event stream" },
                { service: "Dashboard", url: config.dashboardUrl, purpose: "Web UI" },
              ].map((row) => (
                <tr key={row.service}>
                  <td className="px-5 py-3 font-medium">{row.service}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[--color-primary]">{row.url}</td>
                  <td className="px-5 py-3 text-[--color-muted-foreground]">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
