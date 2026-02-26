import { Router } from "express";
import { EventSeverity, EventType } from "@risk-engine/types";
import { createLogger } from "@risk-engine/logger";
import { authenticate } from "../middleware/authenticate";
import { ingestEvent } from "../lib/ingestEvent";

export const manualRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("ingestion-service:manual");

interface ManualBody {
  type?: string;
  source?: string;
  severity?: string;
  payload?: Record<string, unknown>;
  correlation_id?: string;
  occurred_at?: string;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
manualRouter.post("/ingest/events", authenticate, async (req, res, next) => {
  try {
    const {
      type,
      source,
      severity,
      payload,
      correlation_id,
      occurred_at,
    }: ManualBody = req.body ?? {};

    if (!type || !source) {
      return res.status(400).json({ message: "type and source are required" });
    }

    if (!severity || !Object.values(EventSeverity).includes(severity as EventSeverity)) {
      return res.status(400).json({
        message: `severity must be one of: ${Object.values(EventSeverity).join(", ")}`,
      });
    }

    if (!Object.values(EventType).includes(type as EventType)) {
      return res.status(400).json({
        message: `type must be one of: ${Object.values(EventType).join(", ")}`,
      });
    }

    const result = await ingestEvent({
      organizationId: req.auth.organization.id,
      projectId: req.auth.project.id,
      source,
      type,
      severity: severity as EventSeverity,
      payload,
      correlationId: correlation_id,
      occurredAt: occurred_at ? new Date(occurred_at) : undefined,
    });

    logger.info(
      { organizationId: req.auth.organization.id, eventId: result.id, type },
      "Manual event ingested"
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
