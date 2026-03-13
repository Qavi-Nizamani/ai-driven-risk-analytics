import type { Metadata } from "next";
import { CodeBlock, InlineCode } from "@/components/code-block";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "API Reference — Node.js SDK" };

interface MethodParam {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface MethodDoc {
  signature: string;
  description: string;
  params: MethodParam[];
  returns: string;
  example: string;
  notes?: string[];
}

function MethodSection({ doc }: { name: string; doc: MethodDoc }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
      <div className="px-5 py-4 bg-[--color-muted]/40 border-b border-[--color-border]">
        <code className="text-sm font-mono font-semibold text-[--color-foreground]">{doc.signature}</code>
      </div>
      <div className="px-5 py-4 space-y-5">
        <p className="text-sm text-[--color-foreground]/80">{doc.description}</p>

        {doc.notes && doc.notes.length > 0 && (
          <div className="rounded-lg bg-[--color-post-bg] border border-[--color-post]/20 px-4 py-3 space-y-1">
            {doc.notes.map((n, i) => (
              <p key={i} className="text-sm text-[--color-foreground]/80">{n}</p>
            ))}
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-3">Parameters</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[--color-border]">
                  <th className="text-left py-2 pr-4 font-medium text-[--color-muted-foreground] w-36">Name</th>
                  <th className="text-left py-2 pr-4 font-medium text-[--color-muted-foreground] w-48">Type</th>
                  <th className="text-left py-2 pr-4 font-medium text-[--color-muted-foreground] w-20">Required</th>
                  <th className="text-left py-2 font-medium text-[--color-muted-foreground]">Description</th>
                </tr>
              </thead>
              <tbody>
                {doc.params.map((p) => (
                  <tr key={p.name} className="border-b border-[--color-border]/60">
                    <td className="py-2 pr-4">
                      <code className="text-xs font-mono bg-[--color-muted] px-1.5 py-0.5 rounded border border-[--color-border]">
                        {p.name}
                      </code>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-[--color-muted-foreground]">{p.type}</td>
                    <td className="py-2 pr-4">
                      {p.required ? (
                        <span className="text-[--color-delete] text-xs font-medium">required</span>
                      ) : (
                        <span className="text-[--color-muted-foreground] text-xs">optional</span>
                      )}
                    </td>
                    <td className="py-2 text-[--color-foreground]/80 text-sm">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">Returns</h4>
          <code className="text-sm font-mono text-[--color-primary]">{doc.returns}</code>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-3">Example</h4>
          <CodeBlock code={doc.example} lang="typescript" />
        </div>
      </div>
    </div>
  );
}

const constructorDoc: MethodDoc = {
  signature: "new Vigilry(options: VigilryOptions)",
  description:
    "Creates a new Vigilry client. Create one instance and reuse it across your application.",
  params: [
    {
      name: "options.apiKey",
      type: "string",
      required: true,
      description: "Your project API key (vig_live_...).",
    },
    {
      name: "options.baseUrl",
      type: "string",
      description:
        `Base URL of the Ingestion Service. Defaults to https://ingest.vigilry.com. Override to ${config.ingestionUrl} for local development.`,
    },
  ],
  returns: "Vigilry",
  example: `import { Vigilry } from "@vigilry/node";

const vigilry = new Vigilry({
  apiKey: process.env.VIGILRY_API_KEY!,
  baseUrl: "${config.ingestionUrl}", // local dev
});`,
};

const captureDoc: MethodDoc = {
  signature: "vigilry.capture(options: CaptureOptions): Promise<IngestResult | null>",
  description:
    "Send a custom event to the ingestion pipeline. Returns the job ID and status on success, or null if the request failed.",
  params: [
    {
      name: "options.type",
      type: "string",
      required: true,
      description: "Event type identifier (e.g. checkout_started, feature_flag_evaluated).",
    },
    {
      name: "options.severity",
      type: '"info" | "warn" | "error" | "critical"',
      required: true,
      description: "Event severity level.",
    },
    {
      name: "options.message",
      type: "string",
      required: true,
      description: "Human-readable description of the event.",
    },
    {
      name: "options.correlation",
      type: "CaptureCorrelation",
      description:
        "Key-value metadata for grouping related events. Keys: user_id, customer_id, order_id, and any custom string keys.",
    },
  ],
  returns: "Promise<IngestResult | null>",
  example: `const result = await vigilry.capture({
  type: "order_placed",
  severity: "info",
  message: "Customer placed a new order",
  correlation: {
    user_id: "usr_42",
    order_id: "ord_9988",
    customer_id: "cust_7",
  },
});
// result: { jobId: "bull-12345", status: "queued" } | null`,
  notes: [
    "The SDK never throws. If the request fails (network error, invalid key, etc.), null is returned and the error is logged to console.error.",
  ],
};

const captureErrorDoc: MethodDoc = {
  signature: "vigilry.captureError(error: Error, context?: CaptureErrorContext): Promise<IngestResult | null>",
  description:
    "Report a server-side error. Automatically extracts the error message and stack trace. Maps to the POST /ingest/server-error endpoint.",
  params: [
    {
      name: "error",
      type: "Error",
      required: true,
      description: "The error instance. Name, message, and stack are extracted automatically.",
    },
    {
      name: "context.status_code",
      type: "number",
      description: "HTTP status code of the failed request (e.g. 500).",
    },
    {
      name: "context.path",
      type: "string",
      description: "Request path where the error occurred (e.g. /api/checkout).",
    },
    {
      name: "context.method",
      type: "string",
      description: "HTTP method (GET, POST, etc.).",
    },
    {
      name: "context.correlation",
      type: "CaptureCorrelation",
      description: "Correlation context for linking this error to a user or transaction.",
    },
  ],
  returns: "Promise<IngestResult | null>",
  example: `try {
  await processPayment(order);
} catch (err) {
  await vigilry.captureError(err as Error, {
    status_code: 500,
    path: "/api/checkout",
    method: "POST",
    correlation: {
      user_id: req.user.id,
      order_id: order.id,
    },
  });
  res.status(500).json({ error: "Payment failed" });
}`,
  notes: [
    "Safe to call without awaiting in fire-and-forget patterns, but awaiting ensures delivery before the process exits.",
    "The stack trace is included when available and helps the risk worker identify error hotspots.",
  ],
};

export default function ReferencePage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          Node.js SDK
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">API Reference</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Full documentation for the <InlineCode>Vigilry</InlineCode> client
          class, its constructor, and all public methods.
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-4">
          Type Definitions
        </h2>
        <CodeBlock
          lang="typescript"
          code={`interface VigilryOptions {
  apiKey: string;
  baseUrl?: string; // default: "https://ingest.vigilry.com"
}

interface CaptureCorrelation {
  user_id?: string;
  customer_id?: string;
  order_id?: string;
  [key: string]: string | undefined; // any custom key
}

interface CaptureOptions {
  type: string;
  severity: "info" | "warn" | "error" | "critical";
  message: string;
  correlation?: CaptureCorrelation;
}

interface CaptureErrorContext {
  status_code?: number;
  path?: string;
  method?: string;
  correlation?: CaptureCorrelation;
}

interface IngestResult {
  jobId: string;
  status: "queued";
}`}
        />
      </div>

      <div className="space-y-6">
        <MethodSection name="constructor" doc={constructorDoc} />
        <MethodSection name="capture" doc={captureDoc} />
        <MethodSection name="captureError" doc={captureErrorDoc} />
      </div>
    </div>
  );
}
