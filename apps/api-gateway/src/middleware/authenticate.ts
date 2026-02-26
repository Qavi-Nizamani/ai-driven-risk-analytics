import { createHash } from "node:crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getDb, apiKeys, projects, organizations, users } from "@risk-engine/db";
import type { ApiKey, Organization, Project, User } from "@risk-engine/db";

export interface AuthContext {
  organization: Organization;
  project: Project;
  apiKey?: ApiKey;
  user?: User;
}

export interface JwtPayload {
  userId: string;
  organizationId: string;
  projectId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth: AuthContext;
      cookies: Record<string, string>;
    }
  }
}

type Db = ReturnType<typeof getDb>;

export function createAuthMiddleware(db: Db, jwtSecret: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = req.headers["x-api-key"];

    // ── API key auth ─────────────────────────────────────────────────────────
    if (rawKey && typeof rawKey === "string") {
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

      void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id));

      req.auth = { organization, project, apiKey };
      next();
      return;
    }

    // ── JWT session auth ──────────────────────────────────────────────────────
    const token = req.cookies?.session;

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      res.status(401).json({ message: "Invalid or expired session" });
      return;
    }

    const [orgRow, projectRow, userRow] = await Promise.all([
      db.select().from(organizations).where(eq(organizations.id, payload.organizationId)).limit(1),
      db.select().from(projects).where(eq(projects.id, payload.projectId)).limit(1),
      db.select().from(users).where(eq(users.id, payload.userId)).limit(1),
    ]);

    if (!orgRow.length || !projectRow.length || !userRow.length) {
      res.status(401).json({ message: "Session references deleted resources" });
      return;
    }

    req.auth = { organization: orgRow[0], project: projectRow[0], user: userRow[0] };
    next();
  };
}
