import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { EventSeverity, EventType } from "@risk-engine/types";
import { createLogger } from "@risk-engine/logger";
import { authenticate } from "../middleware/authenticate";
import { ingestEvent } from "../lib/ingestEvent";

export const stripeRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("ingestion-service:stripe");

interface StripeEvent {
  id?: string;
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
}

function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const v1 = parts["v1"];

  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const v1Buf = Buffer.from(v1);

  if (expectedBuf.length !== v1Buf.length) return false;
  return timingSafeEqual(expectedBuf, v1Buf);
}

function mapStripeEventType(stripeType: string): { type: EventType; severity: EventSeverity } {
  if (stripeType.startsWith("payment_intent.payment_failed") || stripeType.startsWith("charge.failed")) {
    return { type: EventType.PAYMENT_FAILURE, severity: EventSeverity.ERROR };
  }
  if (stripeType.startsWith("charge.refunded") || stripeType.startsWith("refund.created")) {
    return { type: EventType.REFUND_SPIKE, severity: EventSeverity.WARN };
  }
  return { type: EventType.WEBHOOK, severity: EventSeverity.INFO };
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
stripeRouter.post("/ingest/stripe", authenticate, async (req, res, next) => {
  try {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers["stripe-signature"];

    if (stripeSecret) {
      if (!signature || typeof signature !== "string") {
        return res.status(401).json({ message: "stripe-signature header is required" });
      }
      const rawBody = JSON.stringify(req.body);
      if (!verifyStripeSignature(rawBody, signature, stripeSecret)) {
        return res.status(401).json({ message: "Invalid Stripe webhook signature" });
      }
    }

    const stripeEvent: StripeEvent = req.body ?? {};
    const stripeType = stripeEvent.type ?? "unknown";
    const { type, severity } = mapStripeEventType(stripeType);

    const stripeObject = stripeEvent.data?.object ?? {};
    const correlationId =
      typeof stripeObject["payment_intent"] === "string"
        ? stripeObject["payment_intent"]
        : typeof stripeObject["id"] === "string"
          ? stripeObject["id"]
          : stripeEvent.id;

    const result = await ingestEvent({
      organizationId: req.auth.organization.id,
      projectId: req.auth.project.id,
      source: "stripe",
      type,
      severity,
      payload: {
        stripe_event_type: stripeType,
        stripe_event_id: stripeEvent.id,
        ...stripeObject,
      },
      correlationId: typeof correlationId === "string" ? correlationId : undefined,
    });

    logger.info(
      { organizationId: req.auth.organization.id, eventId: result.id, stripeType, type },
      "Stripe event ingested"
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
