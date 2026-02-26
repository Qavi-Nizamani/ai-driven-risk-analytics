import type { Request, Response } from "express";
import type { ProjectService } from "../services/project.service";

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, environment } = req.body as {
      name: string;
      environment?: "PRODUCTION" | "STAGING" | "DEV";
    };

    const project = await this.projectService.create(req.auth.organization.id, {
      name,
      environment,
    });

    res.status(201).json({
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      environment: project.environment,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const projects = await this.projectService.listByOrg(req.auth.organization.id);
    res.json(
      projects.map((p) => ({
        id: p.id,
        organizationId: p.organizationId,
        name: p.name,
        environment: p.environment,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    );
  };
}
