import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { OrganizationController } from "../controllers/organization.controller";

const createOrgSchema = z.object({
  name: z.string().min(1),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
});

const createOrgProjectSchema = z.object({
  name: z.string().min(1),
  environment: z.enum(["PRODUCTION", "STAGING", "DEV"]).optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export function createOrganizationsRouter(
  ctrl: OrganizationController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/organizations", validate(createOrgSchema), asyncHandler(ctrl.create));
  router.get("/organizations/me", authenticate, asyncHandler(ctrl.getMe));
  router.post(
    "/organizations/:orgId/projects",
    validate(createOrgProjectSchema),
    asyncHandler(ctrl.createProject),
  );
  router.post(
    "/organizations/:orgId/members",
    authenticate,
    validate(addMemberSchema),
    asyncHandler(ctrl.addMember),
  );

  return router;
}
