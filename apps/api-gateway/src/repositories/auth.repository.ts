import { eq } from "drizzle-orm";
import { getDb, users } from "@risk-engine/db";
import type { User } from "@risk-engine/db";

type Db = ReturnType<typeof getDb>;

export class AuthRepository {
  constructor(private readonly db: Db) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return user ?? null;
  }

  async createUser(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
      })
      .returning();
    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }
}
