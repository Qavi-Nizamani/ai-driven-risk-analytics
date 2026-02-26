import { and, eq } from "drizzle-orm";
import { getDb, incidents } from "@risk-engine/db";
import type { Incident } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export class IncidentRepository {
  constructor(private readonly db: Db) {}

  async create(data: {
    organizationId: string;
    projectId: string;
    status: "OPEN" | "INVESTIGATING" | "RESOLVED";
    severity: string;
    summary: string;
  }): Promise<Incident> {
    const [incident] = await this.db.insert(incidents).values(data).returning();
    return incident;
  }

  async findAllByOrg(organizationId: string, projectId?: string): Promise<Incident[]> {
    const conditions = [eq(incidents.organizationId, organizationId)];
    if (projectId) conditions.push(eq(incidents.projectId, projectId));
    return this.db.select().from(incidents).where(and(...conditions));
  }
}
