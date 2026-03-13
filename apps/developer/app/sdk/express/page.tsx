import type { Metadata } from "next";
import { CodeBlock, InlineCode } from "@/components/code-block";

export const metadata: Metadata = { title: "Express Middleware — Node.js SDK" };

export default function ExpressPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          Node.js SDK
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Express Middleware</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          Add a single error-handling middleware to your Express app to
          automatically capture all unhandled errors with stack traces, HTTP
          context, and correlation data.
        </p>
      </div>

      <div className="space-y-8">

        <div>
          <h2 className="text-xl font-bold mb-4">Basic Setup</h2>
          <p className="text-sm text-[--color-muted-foreground] mb-4">
            Register the Vigilry error middleware <strong>after</strong> all
            routes. Express identifies error middleware by its 4-argument
            signature <InlineCode>(err, req, res, next)</InlineCode>.
          </p>
          <CodeBlock
            lang="typescript"
            filename="app.ts"
            code={`import express from "express";
import { Vigilry } from "@vigilry/node";

const app = express();
const vigilry = new Vigilry({ apiKey: process.env.VIGILRY_API_KEY! });

// ... your routes ...
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Error middleware — MUST be last, after all routes
app.use(async (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  await vigilry.captureError(err, {
    status_code: 500,
    path: req.path,
    method: req.method,
    correlation: {
      // Attach any request-level context
      user_id: (req as any).user?.id,
    },
  });
  res.status(500).json({ error: "Internal server error" });
});

app.listen(3000);`}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Reusable Middleware Factory</h2>
          <p className="text-sm text-[--color-muted-foreground] mb-4">
            Extract the middleware into a reusable factory so it can be shared
            across multiple Express apps in a monorepo.
          </p>
          <CodeBlock
            lang="typescript"
            filename="middleware/vigilry-errors.ts"
            code={`import { Vigilry } from "@vigilry/node";
import type { ErrorRequestHandler } from "express";

export function vigilryErrorHandler(vigilry: Vigilry): ErrorRequestHandler {
  return async (err, req, res, next) => {
    await vigilry.captureError(err, {
      status_code: (err as any).statusCode ?? 500,
      path: req.path,
      method: req.method,
      correlation: {
        user_id: (req as any).user?.id,
      },
    });
    next(err); // pass to your existing error handler
  };
}`}
          />
          <CodeBlock
            lang="typescript"
            filename="app.ts"
            className="mt-3"
            code={`import express from "express";
import { Vigilry } from "@vigilry/node";
import { vigilryErrorHandler } from "./middleware/vigilry-errors";

const app = express();
const vigilry = new Vigilry({ apiKey: process.env.VIGILRY_API_KEY! });

app.use(express.json());
// ... routes ...

// Vigilry captures errors, then passes to your error handler
app.use(vigilryErrorHandler(vigilry));

// Your existing error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as any).statusCode ?? 500;
  res.status(status).json({ error: err.message });
});`}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Capturing Business Events</h2>
          <p className="text-sm text-[--color-muted-foreground] mb-4">
            Beyond errors, instrument key business flows directly in your route
            handlers.
          </p>
          <CodeBlock
            lang="typescript"
            filename="routes/orders.ts"
            code={`import { Router } from "express";
import { vigilry } from "../lib/vigilry";

const router = Router();

router.post("/orders", async (req, res) => {
  const order = await createOrder(req.body);

  // Track successful order creation
  await vigilry.capture({
    type: "order_created",
    severity: "info",
    message: \`Order \${order.id} created\`,
    correlation: {
      user_id: req.user.id,
      order_id: order.id,
      customer_id: req.user.customerId,
    },
  });

  res.status(201).json(order);
});

router.post("/orders/:id/cancel", async (req, res) => {
  const order = await cancelOrder(req.params.id);

  // Flag cancellations as a warning for risk analysis
  await vigilry.capture({
    type: "order_cancelled",
    severity: "warn",
    message: \`Order \${order.id} cancelled by user\`,
    correlation: {
      user_id: req.user.id,
      order_id: order.id,
    },
  });

  res.json(order);
});

export { router as ordersRouter };`}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Tips</h2>
          <div className="space-y-3">
            {[
              {
                title: "Singleton pattern",
                body: "Create one Vigilry instance (e.g. in lib/vigilry.ts) and import it everywhere. Creating multiple instances is safe but wastes connections.",
              },
              {
                title: "Fire and forget",
                body: "In high-throughput handlers you can skip await on capture() calls. The SDK queues the request internally and never blocks your response.",
              },
              {
                title: "Correlation is key",
                body: "Always include user_id and order_id (or equivalent) in correlation. This enables the risk worker to group related events and detect per-user anomalies.",
              },
              {
                title: "Error middleware order",
                body: "Vigilry error middleware should come before your final error handler so it can capture the error before a 500 is sent to the client.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl border border-[--color-border] bg-[--color-card] p-4"
              >
                <p className="text-sm font-semibold mb-1">{tip.title}</p>
                <p className="text-sm text-[--color-muted-foreground]">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
