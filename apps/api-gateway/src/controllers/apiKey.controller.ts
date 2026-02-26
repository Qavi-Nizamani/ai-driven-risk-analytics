import type { Request, Response } from "express";
import { createLogger } from "@risk-engine/logger";
import type { ApiKeyService } from "../services/apiKey.service";

const logger = createLogger("api-gateway:api-keys");

export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { name } = req.body as { name: string };

    const { apiKey, rawKey } = await this.apiKeyService.create(projectId, { name });

    logger.info({ projectId, apiKeyId: apiKey.id }, "API key created");

    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      projectId: apiKey.projectId,
      key: rawKey,
      createdAt: apiKey.createdAt.toISOString(),
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const keys = await this.apiKeyService.listByProject(projectId, req.auth.organization.id);
    res.json(keys);
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.apiKeyService.revoke(id, req.auth.organization.id);
    logger.info({ apiKeyId: id }, "API key revoked");
    res.status(204).send();
  };
}
