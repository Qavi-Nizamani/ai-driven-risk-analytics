import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { EventSeverity } from "@risk-engine/types";
import { createLogger } from "@risk-engine/logger";
import { authenticate } from "../middleware/authenticate";
import { ingestEvent } from "../lib/ingestEvent";

export const webhookRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("ingestion-service:webhook");

interface WebhookBody {
  type?: string;
  source?: string;
  severity?: string;
  payload?: Record<string, unknown>;
  correlation_id?: string;
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(`sha256=${expected}`);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
webhookRouter.post("/ingest/webhook", authenticate, async (req, res, next) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const signature = req.headers["x-webhook-signature"];

    if (webhookSecret && signature && typeof signature === "string") {
      const rawBody = JSON.stringify(req.body);
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }
    }

    const {
      type,
      source,
      severity,
      payload,
      correlation_id,
    }: WebhookBody = req.body ?? {};

    if (!type || !source) {
      return res.status(400).json({ message: "type and source are required" });
    }

    const resolvedSeverity = (
      severity && Object.values(EventSeverity).includes(severity as EventSeverity)
        ? severity
        : EventSeverity.INFO
    ) as EventSeverity;

    const result = await ingestEvent({
      organizationId: req.auth.organization.id,
      projectId: req.auth.project.id,
      source,
      type,
      severity: resolvedSeverity,
      payload,
      correlationId: correlation_id,
    });

    logger.info(
      { organizationId: req.auth.organization.id, eventId: result.id, type },
      "Webhook event ingested"
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
