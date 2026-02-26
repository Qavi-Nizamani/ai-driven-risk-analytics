import type { Event } from "@risk-engine/db";
import { NotFoundError } from "@risk-engine/http";
import type { EventRepository, EventQueryFilters } from "../repositories/event.repository";

export class EventService {
  constructor(private readonly eventRepo: EventRepository) {}

  async query(
    organizationId: string,
    input: {
      type?: string;
      severity?: string;
      projectId?: string;
      correlationId?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Event[]> {
    const filters: EventQueryFilters = {
      organizationId,
      type: input.type,
      severity: input.severity as EventQueryFilters["severity"],
      projectId: input.projectId,
      correlationId: input.correlationId,
      from: input.from ? new Date(input.from) : undefined,
      to: input.to ? new Date(input.to) : undefined,
      limit: input.limit,
      offset: input.offset,
    };
    return this.eventRepo.query(filters);
  }

  async getById(organizationId: string, id: string): Promise<Event> {
    const event = await this.eventRepo.findByIdAndOrg(id, organizationId);
    if (!event) throw new NotFoundError("Event not found");
    return event;
  }
}
