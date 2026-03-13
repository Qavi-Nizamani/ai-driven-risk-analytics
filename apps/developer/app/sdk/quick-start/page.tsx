import type { Metadata } from "next";
import { CodeBlock, InlineCode } from "@/components/code-block";
import Link from "next/link";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Quick Start — Node.js SDK" };

const steps = [
  {
    step: "1",
    title: "Install the SDK",
    content: (
      <CodeBlock code={`npm install @vigilry/node`} lang="bash" />
    ),
  },
  {
    step: "2",
    title: "Get your API key",
    description: (
      <p className="text-sm text-[--color-muted-foreground]">
        Create a project in your{" "}
        <Link href={`${config.dashboardUrl}/dashboard/projects`} className="text-[--color-primary] underline underline-offset-2">
          dashboard
        </Link>{" "}
        and copy the API key shown at creation. Add it to your environment file.
      </p>
    ),
    content: (
      <CodeBlock code={`VIGILRY_API_KEY=vig_live_abc123def456...`} filename=".env" />
    ),
  },
  {
    step: "3",
    title: "Initialize the client",
    description: (
      <p className="text-sm text-[--color-muted-foreground]">
        Create a single <InlineCode>Vigilry</InlineCode> instance and reuse it
        throughout your application.
      </p>
    ),
    content: (
      <CodeBlock
        code={`import { Vigilry } from "@vigilry/node";

export const vigilry = new Vigilry({
  apiKey: process.env.VIGILRY_API_KEY!,
  // baseUrl defaults to ${config.ingestionUrl} for local dev
  // baseUrl: "https://ingest.vigilry.com", // production
});`}
        lang="typescript"
        filename="lib/vigilry.ts"
      />
    ),
  },
  {
    step: "4",
    title: "Capture your first event",
    content: (
      <CodeBlock
        code={`import { vigilry } from "./lib/vigilry";

// Anywhere in your application
await vigilry.capture({
  type: "user_signup",
  severity: "info",
  message: "New user registered",
  correlation: {
    user_id: "usr_123",
    plan: "pro",
  },
});`}
        lang="typescript"
        filename="handlers/auth.ts"
      />
    ),
  },
  {
    step: "5",
    title: "Capture errors",
    content: (
      <CodeBlock
        code={`import { vigilry } from "./lib/vigilry";

try {
  await chargeCard(order);
} catch (err) {
  // captureError never throws — safe to call in catch blocks
  await vigilry.captureError(err as Error, {
    status_code: 500,
    path: "/api/checkout",
    method: "POST",
    correlation: {
      user_id: req.user.id,
      order_id: order.id,
    },
  });
  throw err; // re-throw if needed
}`}
        lang="typescript"
        filename="handlers/checkout.ts"
      />
    ),
  },
];

export default function QuickStartPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          Node.js SDK
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Quick Start</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Get the SDK installed and sending your first event in under 5 minutes.
        </p>
      </div>

      <div className="space-y-8">
        {steps.map(({ step, title, description, content }) => (
          <div key={step} className="flex gap-5">
            <div className="shrink-0">
              <div className="w-8 h-8 rounded-full bg-[--color-primary] text-white flex items-center justify-center text-sm font-bold">
                {step}
              </div>
            </div>
            <div className="flex-1 space-y-3 pt-0.5">
              <h2 className="text-base font-semibold">{title}</h2>
              {description}
              {content}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[--color-get]/30 bg-[--color-get-bg] p-5">
        <p className="text-sm font-semibold text-[--color-get] mb-1">You&apos;re all set</p>
        <p className="text-sm text-[--color-foreground]/70">
          Check your dashboard at{" "}
          <InlineCode>{config.dashboardUrl}/dashboard</InlineCode> to see events
          appearing in real time. Continue to the{" "}
          <Link href="/sdk/reference" className="text-[--color-primary] underline underline-offset-2">
            API Reference
          </Link>{" "}
          for full method documentation.
        </p>
      </div>
    </div>
  );
}
