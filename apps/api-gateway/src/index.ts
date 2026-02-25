import express from "express";
import cors from "cors";
import { eq } from "drizzle-orm";
import { createLogger } from "@risk-engine/logger";
import { getDb, projects, incidents } from "@risk-engine/db";
import { getApiGatewayPort, getDatabaseUrl, getRedisStreamName } from "./config/env";
import { createRedisClient } from "@risk-engine/redis";
import { INCIDENT_CREATED } from "@risk-engine/events";

const logger = createLogger("api-gateway");
const redis = createRedisClient();
const streamName = getRedisStreamName();

async function bootstrap(): Promise<void> {
  const db = getDb(getDatabaseUrl());

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "api-gateway",
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/projects", async (req, res, next) => {
    try {
      const { name } = req.body as { name?: string };

      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }

      const [project] = await db.insert(projects).values({ name }).returning();

      return res.status(201).json({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/projects", async (_req, res, next) => {
    try {
      const rows = await db.select().from(projects);
      return res.json(
        rows.map((project) => ({
          id: project.id,
          name: project.name,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        })),
      );
    } catch (err) {
      next(err);
    }
  });

  app.post("/incidents", async (req, res, next) => {
    try {
      const { projectId, status, severity, relatedEventIds, summary } =
        req.body;

      if (!projectId || !status || !severity || !summary) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const [incident] = await db
        .insert(incidents)
        .values({
          projectId,
          status,
          severity,
          relatedEventIds: relatedEventIds ?? [],
          summary,
        })
        .returning();

      const payload = {
        id: incident.id,
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
        "data",
        JSON.stringify(payload),
      );

      return res.status(201).json({
        id: incident.id,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/incidents/:projectId", async (req, res, next) => {
    try {
      const { projectId } = req.params;

      const rows = await db
        .select()
        .from(incidents)
        .where(eq(incidents.projectId, projectId));

      return res.json(
        rows.map((incident) => ({
          id: incident.id,
          projectId: incident.projectId,
          status: incident.status,
          severity: incident.severity,
          relatedEventIds: incident.relatedEventIds,
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
