import { createHash } from "node:crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { getDb, apiKeys, projects, organizations } from "@risk-engine/db";
import type { ApiKey, Organization, Project } from "@risk-engine/db";

export interface AuthContext {
  organization: Organization;
  project: Project;
  apiKey: ApiKey;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth: AuthContext;
    }
  }
}

type Db = ReturnType<typeof getDb>;

export function createAuthMiddleware(db: Db): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = req.headers["x-api-key"];

    if (!rawKey || typeof rawKey !== "string") {
      res.status(401).json({ message: "X-Api-Key header is required" });
      return;
    }

    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const result = await db
      .select({ apiKey: apiKeys, project: projects, organization: organizations })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .innerJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!result.length) {
      res.status(401).json({ message: "Invalid API key" });
      return;
    }

    const { apiKey, project, organization } = result[0];

    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    req.auth = { organization, project, apiKey };
    next();
  };
}
