import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { ProjectController } from "../controllers/project.controller";

const createProjectSchema = z.object({
  name: z.string().min(1),
  environment: z.enum(["PRODUCTION", "STAGING", "DEV"]).optional(),
});

export function createProjectsRouter(
  ctrl: ProjectController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/projects", authenticate, validate(createProjectSchema), asyncHandler(ctrl.create));
  router.get("/projects", authenticate, asyncHandler(ctrl.list));

  return router;
}
