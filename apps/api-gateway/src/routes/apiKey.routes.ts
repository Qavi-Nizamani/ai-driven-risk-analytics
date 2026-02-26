import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { ApiKeyController } from "../controllers/apiKey.controller";

const createApiKeySchema = z.object({
  name: z.string().min(1),
});

export function createApiKeysRouter(
  ctrl: ApiKeyController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post(
    "/projects/:projectId/api-keys",
    validate(createApiKeySchema),
    asyncHandler(ctrl.create),
  );
  router.get(
    "/projects/:projectId/api-keys",
    authenticate,
    asyncHandler(ctrl.list),
  );
  router.delete("/api-keys/:id", authenticate, asyncHandler(ctrl.revoke));

  return router;
}
