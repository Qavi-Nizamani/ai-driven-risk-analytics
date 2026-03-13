import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { ArrowRight, Package, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Node.js SDK Overview" };

export default function SdkPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          Node.js SDK
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          <span className="text-[--color-primary]">@vigilry/node</span>
        </h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          The official Node.js SDK for the Vigilry Risk Engine. Send events and
          capture errors from any Node.js application with a single function call.
        </p>
      </div>

      {/* Package info */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "npm", value: "@vigilry/node" },
          { label: "version", value: "0.1.5" },
          { label: "Node.js", value: ">= 18.0.0" },
          { label: "license", value: "MIT" },
        ].map((badge) => (
          <span
            key={badge.label}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[--color-muted] border border-[--color-border] text-xs"
          >
            <span className="text-[--color-muted-foreground]">{badge.label}</span>
            <span className="font-mono font-medium">{badge.value}</span>
          </span>
        ))}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold mb-4">Features</h2>
        <ul className="space-y-2">
          {[
            "Zero dependencies — uses native fetch() (Node.js ≥ 18)",
            "Never throws — all errors are caught and logged to console",
            "TypeScript-first with full type definitions included",
            "captureError() automatically extracts Error name, message, and stack",
            "Correlation context for grouping related events (user_id, order_id, etc.)",
            "Configurable base URL — point to self-hosted or cloud deployments",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-[--color-foreground]/80">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[--color-get] shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick install */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Install</h2>
        <CodeBlock
          code={`npm install @vigilry/node`}
          lang="bash"
        />
      </div>

      {/* Quick example */}
      <div>
        <h2 className="text-xl font-bold mb-4">Basic Usage</h2>
        <CodeBlock
          code={`import { Vigilry } from "@vigilry/node";

const vigilry = new Vigilry({ apiKey: process.env.VIGILRY_API_KEY! });

// Capture a custom event
await vigilry.capture({
  type: "checkout_started",
  severity: "info",
  message: "User initiated checkout",
  correlation: { user_id: "usr_99", order_id: "ord_4421" },
});

// Capture an unhandled error
try {
  await processPayment(order);
} catch (err) {
  await vigilry.captureError(err, {
    path: "/api/checkout",
    method: "POST",
    status_code: 500,
    correlation: { order_id: order.id },
  });
  throw err;
}`}
          lang="typescript"
          filename="app.ts"
        />
      </div>

      {/* Navigation */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-4">
          SDK Guides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/sdk/installation", title: "Installation", desc: "npm, pnpm, yarn — ESM and CommonJS." },
            { href: "/sdk/quick-start", title: "Quick Start", desc: "Initialize the client and send your first event." },
            { href: "/sdk/reference", title: "API Reference", desc: "Full method signatures and options." },
            { href: "/sdk/express", title: "Express Middleware", desc: "Auto-capture Express errors with one line." },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 p-4 rounded-xl border border-[--color-border] bg-[--color-card] hover:border-[--color-primary]/40 transition-all"
            >
              <Package className="w-4 h-4 mt-0.5 text-[--color-primary]" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-medium text-sm group-hover:text-[--color-primary] transition-colors">
                  {item.title}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-[--color-muted-foreground] mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
