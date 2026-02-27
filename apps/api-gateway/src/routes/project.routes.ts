import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { ProjectController } from "../controllers/project.controller";

const createProjectSchema = z.object({
  name: z.string().min(1),
  environment: z.enum(["PRODUCTION", "STAGING", "DEV"]).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  environment: z.enum(["PRODUCTION", "STAGING", "DEV"]).optional(),
});

export function createProjectsRouter(
  ctrl: ProjectController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get("/projects", authenticate, asyncHandler(ctrl.list));
  router.post("/projects", authenticate, validate(createProjectSchema), asyncHandler(ctrl.create));
  router.get("/projects/:id", authenticate, asyncHandler(ctrl.getById));
  router.patch("/projects/:id", authenticate, validate(updateProjectSchema), asyncHandler(ctrl.update));
  router.delete("/projects/:id", authenticate, asyncHandler(ctrl.delete));

  return router;
}
