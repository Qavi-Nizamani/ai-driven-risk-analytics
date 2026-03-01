import type { Request, Response } from "express";
import { createLogger } from "@risk-engine/logger";
import type { WebhookEndpointService } from "../services/webhookEndpoint.service";

const logger = createLogger("api-gateway:webhook-endpoints");

export class WebhookEndpointController {
  constructor(private readonly webhookService: WebhookEndpointService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { name } = req.body as { name: string };

    const { endpoint, secret, webhookUrl } = await this.webhookService.create(
      projectId,
      req.auth.organization.id,
      { name },
    );

    logger.info(
      { organizationId: req.auth.organization.id, endpointId: endpoint.id, projectId },
      "Webhook endpoint created",
    );

    res.status(201).json({
      id: endpoint.id,
      projectId: endpoint.projectId,
      name: endpoint.name,
      token: endpoint.token,
      webhookUrl,
      secret,
      createdAt: endpoint.createdAt.toISOString(),
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;

    const endpoints = await this.webhookService.listByProject(
      projectId,
      req.auth.organization.id,
    );

    res.json(endpoints);
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    await this.webhookService.revoke(id, req.auth.organization.id);

    logger.info(
      { organizationId: req.auth.organization.id, endpointId: id },
      "Webhook endpoint revoked",
    );

    res.status(204).send();
  };
}
