import { eq } from "drizzle-orm";
import { getDb, webhookEndpoints, projects, organizations } from "@risk-engine/db";
import type { WebhookEndpoint, Project, Organization } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export interface WebhookEndpointWithContext {
  endpoint: WebhookEndpoint;
  project: Project;
  organization: Organization;
}

export class WebhookEndpointLookupRepository {
  constructor(private readonly db: Db) {}

  async findByToken(token: string): Promise<WebhookEndpointWithContext | null> {
    const rows = await this.db
      .select({ endpoint: webhookEndpoints, project: projects, organization: organizations })
      .from(webhookEndpoints)
      .innerJoin(projects, eq(webhookEndpoints.projectId, projects.id))
      .innerJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(eq(webhookEndpoints.token, token))
      .limit(1);

    return rows[0] ?? null;
  }
}
