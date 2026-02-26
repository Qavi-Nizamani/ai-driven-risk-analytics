import { Router } from "express";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { getDb, events } from "@risk-engine/db";
import { createLogger } from "@risk-engine/logger";
import { getDatabaseUrl } from "../config/env";
import { authenticate } from "../middleware/authenticate";

export const eventsRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("api-gateway:events");

// eslint-disable-next-line @typescript-eslint/no-misused-promises
eventsRouter.get("/events", authenticate, async (req, res, next) => {
  try {
    const db = getDb(getDatabaseUrl());
    const organizationId = req.auth.organization.id;

    const {
      type,
      severity,
      project_id,
      correlation_id,
      from,
      to,
      limit: limitParam = "50",
      offset: offsetParam = "0",
    } = req.query as Record<string, string>;

    const limit = Math.min(parseInt(limitParam, 10) || 50, 200);
    const offset = parseInt(offsetParam, 10) || 0;

    const conditions = [eq(events.organizationId, organizationId)];

    if (type) conditions.push(eq(events.type, type));
    if (severity) conditions.push(eq(events.severity, severity as "INFO" | "WARN" | "ERROR" | "CRITICAL"));
    if (project_id) conditions.push(eq(events.projectId, project_id));
    if (correlation_id) conditions.push(eq(events.correlationId, correlation_id));
    if (from) conditions.push(gte(events.occurredAt, new Date(from)));
    if (to) conditions.push(lte(events.occurredAt, new Date(to)));

    const rows = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.occurredAt))
      .limit(limit)
      .offset(offset);

    logger.info({ organizationId, count: rows.length }, "Events queried");

    return res.json(
      rows.map((e) => ({
        id: e.id,
        organizationId: e.organizationId,
        projectId: e.projectId,
        source: e.source,
        type: e.type,
        severity: e.severity,
        correlationId: e.correlationId,
        payload: e.payload,
        occurredAt: e.occurredAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
eventsRouter.get("/events/:id", authenticate, async (req, res, next) => {
  try {
    const db = getDb(getDatabaseUrl());
    const { id } = req.params;
    const organizationId = req.auth.organization.id;

    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)))
      .limit(1);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json({
      id: event.id,
      organizationId: event.organizationId,
      projectId: event.projectId,
      source: event.source,
      type: event.type,
      severity: event.severity,
      correlationId: event.correlationId,
      payload: event.payload,
      occurredAt: event.occurredAt.toISOString(),
      createdAt: event.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
