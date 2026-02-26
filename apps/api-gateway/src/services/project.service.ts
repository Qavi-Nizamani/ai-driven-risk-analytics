import type { Project } from "@risk-engine/db";
import type { ProjectRepository } from "../repositories/project.repository";

export class ProjectService {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async create(
    organizationId: string,
    input: { name: string; environment?: "PRODUCTION" | "STAGING" | "DEV" },
  ): Promise<Project> {
    return this.projectRepo.create({ organizationId, ...input });
  }

  async listByOrg(organizationId: string): Promise<Project[]> {
    return this.projectRepo.findAllByOrg(organizationId);
  }
}
