# @vigilry/node

Official Node.js SDK for the [Vigilry](https://vigilry.com) risk ingestion API.

## Installation

```bash
npm install @vigilry/node
# or
pnpm add @vigilry/node
# or
yarn add @vigilry/node
```

**Requires Node.js >= 18**

## Quick Start

```ts
import { Vigilry } from "@vigilry/node";

const vigilry = new Vigilry({ apiKey: "your-api-key" });

// Capture a custom event
await vigilry.capture({
  type: "payment_failed",
  severity: "error",
  message: "Stripe charge declined for order #1234",
});

// Capture a server error
try {
  await riskyOperation();
} catch (err) {
  await vigilry.captureError(err as Error, {
    status_code: 500,
    path: "/api/checkout",
    method: "POST",
  });
}
```

## API Reference

### `new Vigilry(options)`

| Option    | Type     | Required | Description                                              |
| --------- | -------- | -------- | -------------------------------------------------------- |
| `apiKey`  | `string` | Yes      | Your project API key (from the Vigilry dashboard)        |
| `baseUrl` | `string` | No       | Override the ingestion endpoint (default: `https://ingest.vigilry.com`) |

---

### `vigilry.capture(options)`

Sends a custom event to the ingestion pipeline.

```ts
await vigilry.capture({
  type: "checkout_started",       // event type / source label
  severity: "info",               // "info" | "warn" | "error" | "critical"
  message: "User began checkout", // human-readable description
  correlation: {                  // optional — attach business identifiers
    user_id: "usr_abc",
    order_id: "ord_xyz",
    customer_id: "cus_123",
  },
});
```

**Returns** `Promise<IngestResult | null>` — `null` on network failure (never throws).

---

### `vigilry.captureError(error, context?)`

Sends a server error with stack trace and request context.

```ts
await vigilry.captureError(err, {
  status_code: 500,    // HTTP status code
  path: "/api/orders", // request path
  method: "POST",      // HTTP method
  correlation: {
    user_id: "usr_abc",
  },
});
```

**Returns** `Promise<IngestResult | null>` — `null` on network failure (never throws).

---

### `IngestResult`

```ts
interface IngestResult {
  jobId: string;
  status: "queued";
}
```

---

## Correlation Fields

Correlation metadata links events to business entities for richer incident analysis.

| Field              | Description                          |
| ------------------ | ------------------------------------ |
| `user_id`          | Internal user identifier             |
| `customer_id`      | Customer / tenant identifier         |
| `order_id`         | Order or transaction identifier      |
| `payment_provider` | Payment provider (e.g. `"stripe"`)   |
| `plan`             | Subscription plan (e.g. `"pro"`)     |
| `deployment_id`    | Deployment or release identifier     |

---

## Express Middleware Example

```ts
import express from "express";
import { Vigilry } from "@vigilry/node";

const vigilry = new Vigilry({ apiKey: process.env.VIGILRY_API_KEY! });
const app = express();

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  vigilry.captureError(err, {
    status_code: 500,
    path: req.path,
    method: req.method,
    correlation: {
      user_id: (req as any).user?.id,
    },
  });
  res.status(500).json({ error: "Internal Server Error" });
});
```

---

## Error Handling

The SDK never throws. All methods return `null` on failure and log a warning to `console.error`. This ensures ingestion failures never crash your application.

---

## License

MIT
