import { Router } from "express";
import { asyncHandler } from "@risk-engine/http";
import type { RequestHandler } from "express";
import type { EventController } from "../controllers/event.controller";

export function createEventsRouter(
  ctrl: EventController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get("/events", authenticate, asyncHandler(ctrl.query));
  router.get("/events/:id", authenticate, asyncHandler(ctrl.getById));

  return router;
}
