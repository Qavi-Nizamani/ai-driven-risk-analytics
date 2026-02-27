import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { OrganizationController } from "../controllers/organization.controller";

const createOrgSchema = z.object({
  name: z.string().min(1),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
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
  router.patch("/organizations/me", authenticate, validate(updateOrgSchema), asyncHandler(ctrl.updateMe));
  router.get("/organizations/members", authenticate, asyncHandler(ctrl.listMembers));
  router.post(
    "/organizations/:orgId/members",
    authenticate,
    validate(addMemberSchema),
    asyncHandler(ctrl.addMember),
  );

  return router;
}
