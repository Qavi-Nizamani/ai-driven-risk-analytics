import { randomBytes, createHash } from "node:crypto";
import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { getDb, apiKeys, projects } from "@risk-engine/db";
import { createLogger } from "@risk-engine/logger";
import { getDatabaseUrl } from "../config/env";
import { authenticate } from "../middleware/authenticate";

export const apiKeysRouter: ReturnType<typeof Router> = Router();

const logger = createLogger("api-gateway:api-keys");

// Create API key for a project
// eslint-disable-next-line @typescript-eslint/no-misused-promises
apiKeysRouter.post("/projects/:projectId/api-keys", authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body as { name?: string };

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const db = getDb(getDatabaseUrl());

    // Verify the project belongs to the authenticated org
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, req.auth.organization.id)
        )
      )
      .limit(1);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const rawKey = randomBytes(32).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const [apiKey] = await db
      .insert(apiKeys)
      .values({ projectId, keyHash, name })
      .returning();

    logger.info({ projectId, apiKeyId: apiKey.id }, "API key created");

    // Return raw key ONCE — never retrievable again
    return res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      projectId: apiKey.projectId,
      key: rawKey,
      createdAt: apiKey.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// List API keys for a project (no keyHash in response)
// eslint-disable-next-line @typescript-eslint/no-misused-promises
apiKeysRouter.get("/projects/:projectId/api-keys", authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const db = getDb(getDatabaseUrl());

    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, req.auth.organization.id)
        )
      )
      .limit(1);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        projectId: apiKeys.projectId,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId));

    return res.json(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        projectId: k.projectId,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Revoke an API key
// eslint-disable-next-line @typescript-eslint/no-misused-promises
apiKeysRouter.delete("/api-keys/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb(getDatabaseUrl());

    // Verify ownership: key's project must belong to authenticated org
    const result = await db
      .select({ apiKey: apiKeys, project: projects })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .where(
        and(
          eq(apiKeys.id, id),
          eq(projects.organizationId, req.auth.organization.id)
        )
      )
      .limit(1);

    if (!result.length) {
      return res.status(404).json({ message: "API key not found" });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    logger.info({ apiKeyId: id }, "API key revoked");

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
