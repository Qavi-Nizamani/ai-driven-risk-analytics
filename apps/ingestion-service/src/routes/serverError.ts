import { Router } from "express";
import { EventSeverity, EventType } from "@risk-engine/types";
import { createLogger } from "@risk-engine/logger";
import { authenticate } from "../middleware/authenticate";
import { ingestEvent } from "../lib/ingestEvent";

export const serverErrorRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("ingestion-service:server-error");

interface ServerErrorBody {
  status_code?: number;
  path?: string;
  method?: string;
  error_message?: string;
  stack?: string;
  correlation_id?: string;
}

function severityFromStatusCode(statusCode: number): EventSeverity {
  if (statusCode >= 504) return EventSeverity.CRITICAL;
  return EventSeverity.ERROR;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
serverErrorRouter.post("/ingest/server-error", authenticate, async (req, res, next) => {
  try {
    const {
      status_code,
      path,
      method,
      error_message,
      stack,
      correlation_id,
    }: ServerErrorBody = req.body ?? {};

    if (!status_code || !path || !method || !error_message) {
      return res.status(400).json({
        message: "status_code, path, method, and error_message are required",
      });
    }

    if (status_code < 500) {
      return res.status(400).json({ message: "status_code must be 500 or higher" });
    }

    const severity = severityFromStatusCode(status_code);
    const payload: Record<string, unknown> = { status_code, path, method, error_message };
    if (stack) payload.stack = stack;

    const result = await ingestEvent({
      organizationId: req.auth.organization.id,
      projectId: req.auth.project.id,
      source: "server-monitoring",
      type: EventType.SERVER_ERROR,
      severity,
      payload,
      correlationId: correlation_id,
    });

    logger.info(
      { organizationId: req.auth.organization.id, eventId: result.id, status_code, severity },
      "Server error event ingested"
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
