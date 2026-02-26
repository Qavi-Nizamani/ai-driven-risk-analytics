import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb, events } from "@risk-engine/db";
import type { Event } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export interface EventQueryFilters {
  organizationId: string;
  type?: string;
  severity?: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  projectId?: string;
  correlationId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export class EventRepository {
  constructor(private readonly db: Db) {}

  async query(filters: EventQueryFilters): Promise<Event[]> {
    const {
      organizationId,
      type,
      severity,
      projectId,
      correlationId,
      from,
      to,
      limit = 50,
      offset = 0,
    } = filters;

    const conditions = [eq(events.organizationId, organizationId)];
    if (type) conditions.push(eq(events.type, type));
    if (severity) conditions.push(eq(events.severity, severity));
    if (projectId) conditions.push(eq(events.projectId, projectId));
    if (correlationId) conditions.push(eq(events.correlationId, correlationId));
    if (from) conditions.push(gte(events.occurredAt, from));
    if (to) conditions.push(lte(events.occurredAt, to));

    return this.db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.occurredAt))
      .limit(Math.min(limit, 200))
      .offset(offset);
  }

  async findByIdAndOrg(id: string, organizationId: string): Promise<Event | null> {
    const [event] = await this.db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)))
      .limit(1);
    return event ?? null;
  }
}
