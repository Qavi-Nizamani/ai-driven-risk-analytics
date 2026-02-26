import { and, eq } from "drizzle-orm";
import { getDb, apiKeys, projects, organizations } from "@risk-engine/db";
import type { ApiKey, Organization, Project } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export interface ApiKeyWithContext {
  apiKey: ApiKey;
  project: Project;
  organization: Organization;
}

export class ApiKeyRepository {
  constructor(private readonly db: Db) {}

  async create(data: { projectId: string; keyHash: string; name: string }): Promise<ApiKey> {
    const [key] = await this.db.insert(apiKeys).values(data).returning();
    return key;
  }

  async findByHash(keyHash: string): Promise<ApiKeyWithContext | null> {
    const rows = await this.db
      .select({ apiKey: apiKeys, project: projects, organization: organizations })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .innerJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async findAllByProject(
    projectId: string,
  ): Promise<Pick<ApiKey, "id" | "name" | "projectId" | "lastUsedAt" | "createdAt">[]> {
    return this.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        projectId: apiKeys.projectId,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId));
  }

  async deleteByIdAndOrg(id: string, organizationId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .where(and(eq(apiKeys.id, id), eq(projects.organizationId, organizationId)))
      .limit(1);

    if (!rows.length) return false;

    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
    return true;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }
}
