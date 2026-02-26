import { randomBytes, createHash } from "node:crypto";
import type { ApiKey } from "@risk-engine/db";
import { NotFoundError } from "@risk-engine/http";
import type { ApiKeyRepository } from "../repositories/apiKey.repository";
import type { ProjectRepository } from "../repositories/project.repository";

export class ApiKeyService {
  constructor(
    private readonly apiKeyRepo: ApiKeyRepository,
    private readonly projectRepo: ProjectRepository,
  ) {}

  async create(projectId: string, input: { name: string }): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const rawKey = randomBytes(32).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const apiKey = await this.apiKeyRepo.create({ projectId, keyHash, name: input.name });
    return { apiKey, rawKey };
  }

  async listByProject(
    projectId: string,
    organizationId: string,
  ): Promise<{ id: string; name: string; projectId: string; lastUsedAt: string | null; createdAt: string }[]> {
    const project = await this.projectRepo.findByIdAndOrg(projectId, organizationId);
    if (!project) throw new NotFoundError("Project not found");

    const keys = await this.apiKeyRepo.findAllByProject(projectId);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      projectId: k.projectId,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    const deleted = await this.apiKeyRepo.deleteByIdAndOrg(id, organizationId);
    if (!deleted) throw new NotFoundError("API key not found");
  }
}
