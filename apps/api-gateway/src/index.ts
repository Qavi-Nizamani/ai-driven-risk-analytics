import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { eq, and } from "drizzle-orm";
import { createLogger } from "@risk-engine/logger";
import { getDb, projects, incidents } from "@risk-engine/db";
import { getApiGatewayPort, getDatabaseUrl, getRedisStreamName, getAllowedOrigin } from "./config/env";
import { createRedisClient } from "@risk-engine/redis";
import { INCIDENT_CREATED } from "@risk-engine/events";
import { authenticate } from "./middleware/authenticate";
import { organizationsRouter } from "./routes/organizations";
import { apiKeysRouter } from "./routes/apiKeys";
import { eventsRouter } from "./routes/events";
import { authRouter } from "./routes/auth";

const logger = createLogger("api-gateway");
const redis = createRedisClient();
const streamName = getRedisStreamName();

async function bootstrap(): Promise<void> {
  const db = getDb(getDatabaseUrl());

  const app = express();

  app.use(cors({ origin: getAllowedOrigin(), credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "api-gateway",
      timestamp: new Date().toISOString(),
    });
  });

  // Auth (signup, login, logout, me)
  app.use("/auth", authRouter);

  // Organizations (replaces tenants)
  app.use(organizationsRouter);

  // API key management
  app.use(apiKeysRouter);

  // Events query
  app.use(eventsRouter);

  // Projects — org-scoped
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post("/projects", authenticate, async (req, res, next) => {
    try {
      const { name, environment } = req.body as { name?: string; environment?: string };

      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }

      const [project] = await db
        .insert(projects)
        .values({
          name,
          organizationId: req.auth.organization.id,
          environment: (environment as "PRODUCTION" | "STAGING" | "DEV") ?? "PRODUCTION",
        })
        .returning();

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

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.get("/projects", authenticate, async (req, res, next) => {
    try {
      const rows = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, req.auth.organization.id));

      return res.json(
        rows.map((project) => ({
          id: project.id,
          organizationId: project.organizationId,
          name: project.name,
          environment: project.environment,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        })),
      );
    } catch (err) {
      next(err);
    }
  });

  // Incidents — org-scoped
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post("/incidents", authenticate, async (req, res, next) => {
    try {
      const { projectId, status, severity, summary } = req.body as {
        projectId?: string;
        status?: string;
        severity?: string;
        summary?: string;
      };

      if (!projectId || !status || !severity || !summary) {
        return res.status(400).json({ message: "projectId, status, severity, and summary are required" });
      }

      // Verify projectId belongs to the authenticated org
      const [ownedProject] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.organizationId, req.auth.organization.id)))
        .limit(1);

      if (!ownedProject) {
        return res.status(403).json({ message: "Project not found in your organization" });
      }

      const [incident] = await db
        .insert(incidents)
        .values({
          organizationId: req.auth.organization.id,
          projectId,
          status: status as "OPEN" | "INVESTIGATING" | "RESOLVED",
          severity,
          summary,
        })
        .returning();

      const payload = {
        incidentId: incident.id,
        organizationId: incident.organizationId,
        projectId: incident.projectId,
        status: incident.status,
        severity: incident.severity,
        summary: incident.summary,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
      };

      await redis.xadd(
        streamName,
        "*",
        "type",
        INCIDENT_CREATED,
        "organizationId",
        incident.organizationId,
        "data",
        JSON.stringify(payload),
      );

      return res.status(201).json({ id: incident.id });
    } catch (err) {
      next(err);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.get("/incidents", authenticate, async (req, res, next) => {
    try {
      const { project_id } = req.query as { project_id?: string };
      const conditions = [eq(incidents.organizationId, req.auth.organization.id)];
      if (project_id) conditions.push(eq(incidents.projectId, project_id));

      const rows = await db
        .select()
        .from(incidents)
        .where(and(...conditions));

      return res.json(
        rows.map((incident) => ({
          id: incident.id,
          organizationId: incident.organizationId,
          projectId: incident.projectId,
          status: incident.status,
          severity: incident.severity,
          summary: incident.summary,
          createdAt: incident.createdAt.toISOString(),
          updatedAt: incident.updatedAt.toISOString(),
        })),
      );
    } catch (err) {
      next(err);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.use(
    async (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      logger.error({ err }, "Unhandled error in API gateway");
      res.status(500).json({ message: "Internal server error" });
    },
  );

  const port = getApiGatewayPort();

  app.listen(port, () => {
    logger.info({ port }, "API gateway listening");
  });
}

bootstrap().catch((error) => {
  console.log(error);
  logger.error({ error }, "Failed to start API gateway");
  process.exit(1);
});
