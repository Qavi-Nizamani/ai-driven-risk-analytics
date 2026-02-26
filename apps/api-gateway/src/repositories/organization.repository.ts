import { eq } from "drizzle-orm";
import { getDb, organizations, organizationMembers } from "@risk-engine/db";
import type { Organization, OrganizationMember } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

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
}
