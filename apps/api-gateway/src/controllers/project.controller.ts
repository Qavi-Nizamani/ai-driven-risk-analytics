import type { Request, Response } from "express";
import type { ProjectService } from "../services/project.service";

function serializeProject(p: { id: string; organizationId: string; name: string; environment: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: p.id,
    organizationId: p.organizationId,
    name: p.name,
    environment: p.environment,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, environment } = req.body as {
      name: string;
      environment?: "PRODUCTION" | "STAGING" | "DEV";
    };

    const { project, rawKey } = await this.projectService.create(req.auth.organization.id, {
      name,
      environment,
    });

    res.status(201).json({ ...serializeProject(project), apiKey: rawKey });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const projects = await this.projectService.listByOrg(req.auth.organization.id);
    res.json(projects.map(serializeProject));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.getById(req.auth.organization.id, req.params.id);
    res.json(serializeProject(project));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { name, environment } = req.body as {
      name?: string;
      environment?: "PRODUCTION" | "STAGING" | "DEV";
    };

    const project = await this.projectService.update(req.auth.organization.id, req.params.id, {
      name,
      environment,
    });

    res.json(serializeProject(project));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.projectService.delete(req.auth.organization.id, req.params.id);
    res.status(204).end();
  };
}
