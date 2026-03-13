import type { Metadata } from "next";
import { EndpointCard } from "@/components/endpoint-card";
import { InlineCode } from "@/components/code-block";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Ingestion Service — REST API" };

export default function IngestionPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          REST API
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Ingestion Service</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          The Ingestion Service runs on{" "}
          <InlineCode>{config.ingestionUrl}</InlineCode> and accepts events from
          your applications. All endpoints require an API key via the{" "}
          <InlineCode>X-Api-Key</InlineCode> header. Events are published to Redis
          Streams and processed asynchronously.
        </p>
      </div>

      {/* Auth note */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
        <p className="text-sm font-semibold mb-2">API Key Authentication</p>
        <p className="text-sm text-[--color-muted-foreground]">
          All ingestion endpoints require an <InlineCode>X-Api-Key</InlineCode>{" "}
          header with a valid project API key. The project context is derived from
          the key — you do not need to pass a project ID separately.
        </p>
        <pre className="mt-3 text-xs bg-[--color-code-bg] text-[--color-code-fg] rounded-lg p-3 font-mono">
          {`X-Api-Key: vig_live_abc123def456...`}
        </pre>
      </div>

      <div className="space-y-6">
        <EndpointCard
          method="POST"
          path="/ingest/events"
          description="Send a custom event. Use this for business-level observations — feature flags, checkout flows, critical paths, etc."
          auth="api-key"
          bodyParams={[
            { name: "type", type: "string", required: true, description: "Event type identifier (e.g. checkout_started, feature_disabled)." },
            { name: "severity", type: "\"INFO\" | \"WARN\" | \"ERROR\" | \"CRITICAL\"", required: true, description: "Severity level (uppercase)." },
            { name: "message", type: "string", required: true, description: "Human-readable event description." },
            { name: "source", type: "string", description: "Service or component name (e.g. payment-service)." },
            { name: "correlation", type: "object", description: "Key-value context for grouping related events (user_id, order_id, etc.)." },
            { name: "payload", type: "object", description: "Arbitrary additional metadata." },
          ]}
          requestExample={`POST /ingest/events HTTP/1.1
X-Api-Key: vig_live_abc123...
Content-Type: application/json

{
  "type": "checkout_failed",
  "severity": "ERROR",
  "message": "Payment gateway returned 402",
  "source": "checkout-service",
  "correlation": {
    "user_id": "usr_99",
    "order_id": "ord_4421"
  },
  "payload": {
    "gateway": "stripe",
    "code": "card_declined"
  }
}`}
          responseExample={`HTTP/1.1 202 Accepted

{
  "jobId": "bull-123456",
  "status": "queued"
}`}
        />

        <EndpointCard
          method="POST"
          path="/ingest/server-error"
          description="Report an unhandled server-side error. Automatically extracts stack trace, HTTP method, path, and status code."
          auth="api-key"
          bodyParams={[
            { name: "status_code", type: "number", required: true, description: "HTTP status code (e.g. 500)." },
            { name: "path", type: "string", required: true, description: "Request path where the error occurred." },
            { name: "method", type: "string", required: true, description: "HTTP method (GET, POST, etc.)." },
            { name: "error_message", type: "string", required: true, description: "Error message string." },
            { name: "stack", type: "string", description: "Stack trace (optional but recommended)." },
            { name: "correlation", type: "object", description: "Correlation context (user_id, order_id, etc.)." },
          ]}
          requestExample={`POST /ingest/server-error HTTP/1.1
X-Api-Key: vig_live_abc123...
Content-Type: application/json

{
  "status_code": 500,
  "path": "/api/orders",
  "method": "POST",
  "error_message": "Cannot read properties of undefined",
  "stack": "TypeError: Cannot read properties of undefined\\n  at processOrder (/app/orders.js:42:15)",
  "correlation": {
    "user_id": "usr_99",
    "order_id": "ord_4421"
  }
}`}
          responseExample={`HTTP/1.1 202 Accepted

{
  "jobId": "bull-123457",
  "status": "queued"
}`}
        />

        <EndpointCard
          method="POST"
          path="/ingest/webhook"
          description="Forward an incoming webhook payload as an event. Useful for tracking third-party system notifications."
          auth="api-key"
          bodyParams={[
            { name: "source", type: "string", required: true, description: "Webhook source name (e.g. github, pagerduty)." },
            { name: "event", type: "string", required: true, description: "Event name from the webhook provider." },
            { name: "payload", type: "object", required: true, description: "The full webhook payload." },
            { name: "severity", type: "\"INFO\" | \"WARN\" | \"ERROR\" | \"CRITICAL\"", description: "Severity override. Defaults to INFO." },
          ]}
          requestExample={`POST /ingest/webhook HTTP/1.1
X-Api-Key: vig_live_abc123...
Content-Type: application/json

{
  "source": "github",
  "event": "push",
  "severity": "INFO",
  "payload": {
    "ref": "refs/heads/main",
    "pusher": { "name": "alice" }
  }
}`}
          responseExample={`HTTP/1.1 202 Accepted

{
  "jobId": "bull-123458",
  "status": "queued"
}`}
        />

        <EndpointCard
          method="POST"
          path="/ingest/stripe"
          description="Ingest a Stripe webhook event. Automatically maps Stripe event types to Vigilry severity levels."
          auth="api-key"
          bodyParams={[
            { name: "type", type: "string", required: true, description: "Stripe event type (e.g. payment_intent.payment_failed)." },
            { name: "data", type: "object", required: true, description: "Stripe event data object." },
            { name: "id", type: "string", description: "Stripe event ID for deduplication." },
          ]}
          requestExample={`POST /ingest/stripe HTTP/1.1
X-Api-Key: vig_live_abc123...
Content-Type: application/json

{
  "id": "evt_1ABC...",
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_1ABC...",
      "amount": 2999,
      "currency": "usd",
      "last_payment_error": {
        "code": "card_declined"
      }
    }
  }
}`}
          responseExample={`HTTP/1.1 202 Accepted

{
  "jobId": "bull-123459",
  "status": "queued"
}`}
          notes={[
            "Stripe payment_failed and charge.failed events are mapped to ERROR severity. Other events default to INFO.",
          ]}
        />
      </div>
    </div>
  );
}
