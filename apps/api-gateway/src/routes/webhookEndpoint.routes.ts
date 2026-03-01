import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { WebhookEndpointController } from "../controllers/webhookEndpoint.controller";

const createWebhookEndpointSchema = z.object({
  name: z.string().min(1).max(128),
});

export function createWebhookEndpointRouter(
  ctrl: WebhookEndpointController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post(
    "/projects/:projectId/webhook-endpoints",
    authenticate,
    validate(createWebhookEndpointSchema),
    asyncHandler(ctrl.create),
  );
  router.get(
    "/projects/:projectId/webhook-endpoints",
    authenticate,
    asyncHandler(ctrl.list),
  );
  router.delete("/webhook-endpoints/:id", authenticate, asyncHandler(ctrl.revoke));

  return router;
}
