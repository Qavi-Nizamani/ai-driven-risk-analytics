import { and, eq } from "drizzle-orm";
import { getDb, projects } from "@risk-engine/db";
import type { Project } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export class ProjectRepository {
  constructor(private readonly db: Db) {}

  async create(data: {
    organizationId: string;
    name: string;
    environment?: "PRODUCTION" | "STAGING" | "DEV";
  }): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        environment: data.environment ?? "PRODUCTION",
      })
      .returning();
    return project;
  }

  async findAllByOrg(organizationId: string): Promise<Project[]> {
    return this.db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, organizationId));
  }

  async findFirstByOrg(organizationId: string): Promise<Project | null> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .limit(1);
    return project ?? null;
  }

  async findByIdAndOrg(id: string, organizationId: string): Promise<Project | null> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
      .limit(1);
    return project ?? null;
  }
}
