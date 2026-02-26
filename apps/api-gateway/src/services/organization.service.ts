import type { Organization, OrganizationMember, Project } from "@risk-engine/db";
import { NotFoundError, ForbiddenError } from "@risk-engine/http";
import type { OrganizationRepository } from "../repositories/organization.repository";
import type { ProjectRepository } from "../repositories/project.repository";

export class OrganizationService {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
  ) {}

  async create(input: { name: string; plan?: "FREE" | "PRO" | "ENTERPRISE" }): Promise<Organization> {
    return this.orgRepo.create(input);
  }

  async getById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundError("Organization not found");
    return org;
  }

  async createProjectUnderOrg(
    orgId: string,
    input: { name: string; environment?: "PRODUCTION" | "STAGING" | "DEV" },
  ): Promise<Project> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new NotFoundError("Organization not found");
    return this.projectRepo.create({ organizationId: orgId, ...input });
  }

  async addMember(
    orgId: string,
    input: { userId: string; role: "OWNER" | "ADMIN" | "MEMBER" },
    callerOrgId: string,
  ): Promise<OrganizationMember> {
    if (callerOrgId !== orgId) throw new ForbiddenError("Access denied");
    return this.orgRepo.addMember({ organizationId: orgId, ...input });
  }
}
