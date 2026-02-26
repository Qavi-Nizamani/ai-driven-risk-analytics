import { randomBytes, createHash } from "node:crypto";
import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { getDb, users, organizations, organizationMembers, projects, apiKeys } from "@risk-engine/db";
import { getDatabaseUrl, getJwtSecret } from "../config/env";
import { authenticate, type JwtPayload } from "../middleware/authenticate";

export const authRouter: IRouter = Router();

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function signSession(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

function setSessionCookie(res: import("express").Response, token: string): void {
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

// ── POST /auth/signup ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post("/signup", async (req, res, next) => {
  try {
    const { email, name, password, orgName } = req.body as {
      email?: string;
      name?: string;
      password?: string;
      orgName?: string;
    };

    if (!email || !name || !password || !orgName) {
      return res.status(400).json({ message: "email, name, password, and orgName are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const db = getDb(getDatabaseUrl());

    // Check email uniqueness
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db
      .insert(users)
      .values({ email: email.toLowerCase(), name, passwordHash })
      .returning();

    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({ name: orgName, plan: "FREE" })
      .returning();

    // Create org membership (OWNER)
    await db
      .insert(organizationMembers)
      .values({ organizationId: org.id, userId: user.id, role: "OWNER" });

    // Create default project
    const [project] = await db
      .insert(projects)
      .values({ organizationId: org.id, name: "Default", environment: "PRODUCTION" })
      .returning();

    // Generate and store API key
    const rawKey = randomBytes(32).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    await db
      .insert(apiKeys)
      .values({ projectId: project.id, keyHash, name: "Default Key" });

    const token = signSession({ userId: user.id, organizationId: org.id, projectId: project.id });
    setSessionCookie(res, token);

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      organization: { id: org.id, name: org.name, plan: org.plan },
      project: { id: project.id, name: project.name, environment: project.environment },
      apiKey: rawKey, // shown ONCE — use this with X-Api-Key header on the ingestion service
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const db = getDb(getDatabaseUrl());

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!userRows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userRows[0];
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Find user's primary org membership
    const memberRows = await db
      .select({ org: organizations })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, user.id))
      .limit(1);

    if (!memberRows.length) {
      return res.status(403).json({ message: "User has no organization" });
    }

    const org = memberRows[0].org;

    // Find org's first project
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, org.id))
      .limit(1);

    if (!projectRows.length) {
      return res.status(403).json({ message: "Organization has no projects" });
    }

    const project = projectRows[0];

    const token = signSession({ userId: user.id, organizationId: org.id, projectId: project.id });
    setSessionCookie(res, token);

    return res.json({
      user: { id: user.id, email: user.email, name: user.name },
      organization: { id: org.id, name: org.name, plan: org.plan },
      project: { id: project.id, name: project.name, environment: project.environment },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session");
  res.json({ message: "Logged out" });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.get("/me", authenticate, (req, res) => {
  res.json({
    user: req.auth.user
      ? { id: req.auth.user.id, email: req.auth.user.email, name: req.auth.user.name }
      : null,
    organization: {
      id: req.auth.organization.id,
      name: req.auth.organization.name,
      plan: req.auth.organization.plan,
    },
    project: {
      id: req.auth.project.id,
      name: req.auth.project.name,
      environment: req.auth.project.environment,
    },
  });
});
