import type { Request, Response } from "express";
import { createLogger } from "@risk-engine/logger";
import type { OrganizationService } from "../services/organization.service";

const logger = createLogger("api-gateway:organizations");

export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, plan } = req.body as {
      name: string;
      plan?: "FREE" | "PRO" | "ENTERPRISE";
    };

    const org = await this.orgService.create({ name, plan });

    logger.info({ organizationId: org.id }, "Organization created");

    res.status(201).json({
      id: org.id,
      name: org.name,
      plan: org.plan,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    });
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    const org = await this.orgService.getById(req.auth.organization.id);
    res.json({
      id: org.id,
      name: org.name,
      plan: org.plan,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    });
  };

  createProject = async (req: Request, res: Response): Promise<void> => {
    const { orgId } = req.params;
    const { name, environment } = req.body as {
      name: string;
      environment?: "PRODUCTION" | "STAGING" | "DEV";
    };

    const project = await this.orgService.createProjectUnderOrg(orgId, { name, environment });

    logger.info({ organizationId: orgId, projectId: project.id }, "Project created");

    res.status(201).json({
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      environment: project.environment,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  };

  addMember = async (req: Request, res: Response): Promise<void> => {
    const { orgId } = req.params;
    const { userId, role } = req.body as {
      userId: string;
      role: "OWNER" | "ADMIN" | "MEMBER";
    };

    const member = await this.orgService.addMember(orgId, { userId, role }, req.auth.organization.id);

    res.status(201).json({
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    });
  };
}
