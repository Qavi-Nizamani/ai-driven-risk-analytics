import { eq } from "drizzle-orm";
import { getDb, users, emailVerificationTokens } from "@risk-engine/db";
import type { User, EmailVerificationToken } from "@risk-engine/db";

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

  async markEmailVerified(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    // Remove any existing token for this user before inserting a fresh one
    await this.db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));

    await this.db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt });
  }

  async findVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null> {
    const [row] = await this.db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  }

  async deleteVerificationToken(id: string): Promise<void> {
    await this.db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
  }
}
