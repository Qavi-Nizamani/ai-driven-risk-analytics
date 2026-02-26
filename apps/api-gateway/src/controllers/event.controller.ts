import type { Request, Response } from "express";
import { createLogger } from "@risk-engine/logger";
import type { EventService } from "../services/event.service";

const logger = createLogger("api-gateway:events");

export class EventController {
  constructor(private readonly eventService: EventService) {}

  query = async (req: Request, res: Response): Promise<void> => {
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

    const events = await this.eventService.query(req.auth.organization.id, {
      type,
      severity,
      projectId: project_id,
      correlationId: correlation_id,
      from,
      to,
      limit,
      offset,
    });

    logger.info({ organizationId: req.auth.organization.id, count: events.length }, "Events queried");

    res.json(
      events.map((e) => ({
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
      })),
    );
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const event = await this.eventService.getById(req.auth.organization.id, id);
    res.json({
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
  };
}
