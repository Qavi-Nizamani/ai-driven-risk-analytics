import { randomBytes, createHash } from "node:crypto";
import type { Project } from "@risk-engine/db";
import { NotFoundError } from "@risk-engine/http";
import type { ProjectRepository } from "../repositories/project.repository";
import type { ApiKeyRepository } from "../repositories/apiKey.repository";

export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async create(
    organizationId: string,
    input: { name: string; environment?: "PRODUCTION" | "STAGING" | "DEV" },
  ): Promise<{ project: Project; rawKey: string }> {
    const project = await this.projectRepo.create({ organizationId, ...input });

    const rawKey = randomBytes(32).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    await this.apiKeyRepo.create({ projectId: project.id, keyHash, name: "Default Key" });

    return { project, rawKey };
  }

  async listByOrg(organizationId: string): Promise<Project[]> {
    return this.projectRepo.findAllByOrg(organizationId);
  }

  async getById(organizationId: string, id: string): Promise<Project> {
    const project = await this.projectRepo.findByIdAndOrg(id, organizationId);
    if (!project) throw new NotFoundError("Project not found");
    return project;
  }

  async update(
    organizationId: string,
    id: string,
    data: { name?: string; environment?: "PRODUCTION" | "STAGING" | "DEV" },
  ): Promise<Project> {
    const updated = await this.projectRepo.updateByIdAndOrg(id, organizationId, data);
    if (!updated) throw new NotFoundError("Project not found");
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const deleted = await this.projectRepo.deleteByIdAndOrg(id, organizationId);
    if (!deleted) throw new NotFoundError("Project not found");
  }
}
