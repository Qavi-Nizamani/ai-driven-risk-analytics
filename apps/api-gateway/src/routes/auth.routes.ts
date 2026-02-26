import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validate } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { AuthController } from "../controllers/auth.controller";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  orgName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createAuthRouter(
  ctrl: AuthController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/auth/signup", validate(signupSchema), asyncHandler(ctrl.signup));
  router.post("/auth/login", validate(loginSchema), asyncHandler(ctrl.login));
  router.post("/auth/logout", ctrl.logout);
  router.get("/auth/me", authenticate, ctrl.me);

  return router;
}
