import { randomBytes } from "node:crypto";
import type { WebhookEndpoint } from "@risk-engine/db";
import { NotFoundError } from "@risk-engine/http";
import type { WebhookEndpointRepository } from "../repositories/webhookEndpoint.repository";
import type { ProjectRepository } from "../repositories/project.repository";

export interface WebhookEndpointListItem {
  id: string;
  projectId: string;
  name: string;
  token: string;
  webhookUrl: string;
  createdAt: string;
}

export class WebhookEndpointService {
  constructor(
    private readonly webhookRepo: WebhookEndpointRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly ingestionBaseUrl: string,
  ) {}

  async create(
    projectId: string,
    organizationId: string,
    input: { name: string },
  ): Promise<{ endpoint: WebhookEndpoint; secret: string; webhookUrl: string }> {
    const project = await this.projectRepo.findByIdAndOrg(projectId, organizationId);
    if (!project) throw new NotFoundError("Project not found");

    const token = "whe_" + randomBytes(16).toString("hex");
    const secret = randomBytes(24).toString("base64url");

    const endpoint = await this.webhookRepo.create({
      projectId,
      name: input.name,
      token,
      secret,
    });

    return { endpoint, secret, webhookUrl: this.buildWebhookUrl(token) };
  }

  async listByProject(
    projectId: string,
    organizationId: string,
  ): Promise<WebhookEndpointListItem[]> {
    const project = await this.projectRepo.findByIdAndOrg(projectId, organizationId);
    if (!project) throw new NotFoundError("Project not found");

    const endpoints = await this.webhookRepo.findAllByProject(projectId);
    return endpoints.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      name: e.name,
      token: e.token,
      webhookUrl: this.buildWebhookUrl(e.token),
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    const deleted = await this.webhookRepo.deleteByIdAndOrg(id, organizationId);
    if (!deleted) throw new NotFoundError("Webhook endpoint not found");
  }

  private buildWebhookUrl(token: string): string {
    return `${this.ingestionBaseUrl}/ingest/webhook/${token}`;
  }
}
