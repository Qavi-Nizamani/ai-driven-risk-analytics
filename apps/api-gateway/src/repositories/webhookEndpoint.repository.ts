import { and, eq } from "drizzle-orm";
import { getDb, webhookEndpoints, projects } from "@risk-engine/db";
import type { WebhookEndpoint } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export class WebhookEndpointRepository {
  constructor(private readonly db: Db) {}

  async create(data: {
    projectId: string;
    name: string;
    token: string;
    secret: string;
  }): Promise<WebhookEndpoint> {
    const [endpoint] = await this.db.insert(webhookEndpoints).values(data).returning();
    return endpoint;
  }

  async findAllByProject(
    projectId: string,
  ): Promise<Pick<WebhookEndpoint, "id" | "name" | "token" | "projectId" | "createdAt">[]> {
    return this.db
      .select({
        id: webhookEndpoints.id,
        name: webhookEndpoints.name,
        token: webhookEndpoints.token,
        projectId: webhookEndpoints.projectId,
        createdAt: webhookEndpoints.createdAt,
      })
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.projectId, projectId));
  }

  async deleteByIdAndOrg(id: string, organizationId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: webhookEndpoints.id })
      .from(webhookEndpoints)
      .innerJoin(projects, eq(webhookEndpoints.projectId, projects.id))
      .where(and(eq(webhookEndpoints.id, id), eq(projects.organizationId, organizationId)))
      .limit(1);

    if (!rows.length) return false;

    await this.db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));
    return true;
  }
}
