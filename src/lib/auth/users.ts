import { randomBytes, randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { OAuthProvider } from "@/lib/auth/oauth-config";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  display_name?: string | null;
  company_name?: string | null;
  auth_provider?: OAuthProvider | "email" | null;
  oauth_id?: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  await ensureMongoReady();
  const db = await getDb();
  const row = await db.collection<DbUser>("users").findOne({ email: email.trim().toLowerCase() });
  return row;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  await ensureMongoReady();
  const db = await getDb();
  const row = await db.collection<DbUser>("users").findOne({ id });
  return row;
}

export async function findUserByOAuth(
  provider: OAuthProvider,
  providerId: string,
): Promise<DbUser | null> {
  await ensureMongoReady();
  const db = await getDb();
  const row = await db.collection<DbUser>("users").findOne({
    auth_provider: provider,
    oauth_id: providerId,
  });
  return row;
}

export async function findOrCreateOAuthUser(input: {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  displayName?: string;
}): Promise<DbUser> {
  await ensureMongoReady();
  const db = await getDb();
  const email = input.email.trim().toLowerCase();

  const byProvider = await findUserByOAuth(input.provider, input.providerId);
  if (byProvider) return byProvider;

  const byEmail = await findUserByEmail(email);
  if (byEmail) {
    await db.collection<DbUser>("users").updateOne(
      { id: byEmail.id },
      {
        $set: {
          auth_provider: input.provider,
          oauth_id: input.providerId,
          display_name: byEmail.display_name || input.displayName || email.split("@")[0],
          updated_at: new Date().toISOString(),
        },
      },
    );
    return {
      ...byEmail,
      auth_provider: input.provider,
      oauth_id: input.providerId,
      display_name: byEmail.display_name || input.displayName || email.split("@")[0],
    };
  }

  const now = new Date().toISOString();
  const user: DbUser = {
    id: randomUUID(),
    email,
    password_hash: await hashPassword(randomBytes(32).toString("hex")),
    display_name: input.displayName?.trim() || email.split("@")[0],
    company_name: null,
    auth_provider: input.provider,
    oauth_id: input.providerId,
    onboarding_completed: false,
    created_at: now,
    updated_at: now,
  };

  await db.collection<DbUser>("users").insertOne(user);
  return user;
}

export async function createUser(input: {
  email: string;
  password: string;
  companyName?: string;
}): Promise<DbUser> {
  await ensureMongoReady();
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("An account already exists for this email.");

  const now = new Date().toISOString();
  const user: DbUser = {
    id: randomUUID(),
    email,
    password_hash: await hashPassword(input.password),
    display_name: email.split("@")[0],
    company_name: input.companyName?.trim() || null,
    auth_provider: "email",
    oauth_id: null,
    onboarding_completed: false,
    created_at: now,
    updated_at: now,
  };

  await db.collection<DbUser>("users").insertOne(user);
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<DbUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  return valid ? user : null;
}
