import { eq } from "drizzle-orm";
import { getDb, organizations, organizationMembers, users } from "@risk-engine/db";
import type { Organization, OrganizationMember, User } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export interface MemberWithUser {
  id: string;
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: Date;
  user: Pick<User, "id" | "email" | "name">;
}

export class OrganizationRepository {
  constructor(private readonly db: Db) {}

  async create(data: { name: string; plan?: "FREE" | "PRO" | "ENTERPRISE" }): Promise<Organization> {
    const [org] = await this.db
      .insert(organizations)
      .values({ name: data.name, plan: data.plan ?? "FREE" })
      .returning();
    return org;
  }

  async findById(id: string): Promise<Organization | null> {
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return org ?? null;
  }

  async findFirstMembership(
    userId: string,
  ): Promise<{ org: Organization; membership: OrganizationMember } | null> {
    const rows = await this.db
      .select({ org: organizations, membership: organizationMembers })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async addMember(data: {
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
  }): Promise<OrganizationMember> {
    const [member] = await this.db
      .insert(organizationMembers)
      .values(data)
      .returning();
    return member;
  }

  async findMembersByOrg(organizationId: string): Promise<MemberWithUser[]> {
    const rows = await this.db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, organizationId));

    return rows;
  }

  async updateOrg(
    id: string,
    data: { name?: string; plan?: "FREE" | "PRO" | "ENTERPRISE" },
  ): Promise<Organization | null> {
    const [updated] = await this.db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated ?? null;
  }
}
