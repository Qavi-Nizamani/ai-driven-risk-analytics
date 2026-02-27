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

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const { name, plan } = req.body as {
      name?: string;
      plan?: "FREE" | "PRO" | "ENTERPRISE";
    };

    const org = await this.orgService.updateOrg(
      req.auth.organization.id,
      { name, plan },
      req.auth.organization.id,
    );

    res.json({
      id: org.id,
      name: org.name,
      plan: org.plan,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    });
  };

  listMembers = async (req: Request, res: Response): Promise<void> => {
    const members = await this.orgService.listMembers(
      req.auth.organization.id,
      req.auth.organization.id,
    );

    res.json(
      members.map((m) => ({
        id: m.id,
        organizationId: m.organizationId,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
        user: { id: m.user.id, email: m.user.email, name: m.user.name },
      })),
    );
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
