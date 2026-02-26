import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb, organizations, organizationMembers, projects } from "@risk-engine/db";
import { createLogger } from "@risk-engine/logger";
import { getDatabaseUrl } from "../config/env";
import { authenticate } from "../middleware/authenticate";

export const organizationsRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("api-gateway:organizations");

// Create organization — no auth required (bootstrapping)
// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationsRouter.post("/organizations", async (req, res, next) => {
  try {
    const { name, plan } = req.body as { name?: string; plan?: string };

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const validPlans = ["FREE", "PRO", "ENTERPRISE"] as const;
    const resolvedPlan = validPlans.includes(plan as typeof validPlans[number])
      ? (plan as typeof validPlans[number])
      : "FREE";

    const db = getDb(getDatabaseUrl());
    const [org] = await db
      .insert(organizations)
      .values({ name, plan: resolvedPlan })
      .returning();

    logger.info({ organizationId: org.id }, "Organization created");

    return res.status(201).json({
      id: org.id,
      name: org.name,
      plan: org.plan,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Get current organization (from API key)
// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationsRouter.get("/organizations/me", authenticate, async (req, res, next) => {
  try {
    const db = getDb(getDatabaseUrl());
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.auth.organization.id))
      .limit(1);

    return res.json({
      id: org.id,
      name: org.name,
      plan: org.plan,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Create project under an org — no auth required (bootstrapping)
// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationsRouter.post("/organizations/:orgId/projects", async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { name, environment } = req.body as { name?: string; environment?: string };

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const db = getDb(getDatabaseUrl());

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const validEnvs = ["PRODUCTION", "STAGING", "DEV"] as const;
    const resolvedEnv = validEnvs.includes(environment as typeof validEnvs[number])
      ? (environment as typeof validEnvs[number])
      : "PRODUCTION";

    const [project] = await db
      .insert(projects)
      .values({ name, organizationId: orgId, environment: resolvedEnv })
      .returning();

    logger.info({ organizationId: orgId, projectId: project.id }, "Project created");

    return res.status(201).json({
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      environment: project.environment,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Add member to organization
// eslint-disable-next-line @typescript-eslint/no-misused-promises
organizationsRouter.post("/organizations/:orgId/members", authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.params;

    if (req.auth.organization.id !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId, role } = req.body as { userId?: string; role?: string };

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    const validRoles = ["OWNER", "ADMIN", "MEMBER"] as const;
    if (!validRoles.includes(role as typeof validRoles[number])) {
      return res.status(400).json({ message: "role must be OWNER, ADMIN, or MEMBER" });
    }

    const db = getDb(getDatabaseUrl());
    const [member] = await db
      .insert(organizationMembers)
      .values({
        organizationId: orgId,
        userId,
        role: role as "OWNER" | "ADMIN" | "MEMBER",
      })
      .returning();

    return res.status(201).json({
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
