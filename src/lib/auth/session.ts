import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  LOCAL_SESSION_COOKIE,
  parseLocalSessionCookie,
  serializeLocalSessionCookie,
  type LocalSessionPayload,
} from "@/lib/local-auth/session-cookie";
import { findUserById } from "@/lib/auth/users";
import { allowDemoAuthFallback } from "@/lib/demo/runtime";
import { isMongoConfigured } from "@/lib/mongo/config";
import { ensureMongoReady } from "@/lib/mongo/client";

export const LOCAL_DEV_USER_EMAIL = "dev@santra.local";
export const LOCAL_DEV_USER_ID = "00000000-0000-4000-8000-000000000001";

export type ApiAuthContext = {
  user: { id: string; email?: string };
};

async function getLocalSessionFromCookies() {
  const cookieStore = await cookies();
  return parseLocalSessionCookie(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
}

export function buildSessionCookie(session: LocalSessionPayload) {
  const maxAge = 60 * 60 * 24 * 30;
  return {
    name: LOCAL_SESSION_COOKIE,
    value: serializeLocalSessionCookie(session),
    options: {
      path: "/",
      maxAge,
      sameSite: "lax" as const,
      httpOnly: false,
    },
  };
}

export async function requireApiUser(): Promise<{ error: NextResponse } | ApiAuthContext> {
  const localSession = await getLocalSessionFromCookies();

  if (!isMongoConfigured()) {
    return {
      user: localSession
        ? { id: localSession.userId, email: localSession.email }
        : { id: LOCAL_DEV_USER_ID, email: LOCAL_DEV_USER_EMAIL },
    };
  }

  let mongoReady = true;
  try {
    await ensureMongoReady();
  } catch (error) {
    mongoReady = false;
    if (!allowDemoAuthFallback()) {
      console.error("MongoDB unavailable", error);
      return {
        error: NextResponse.json(
          { error: "Database unavailable.", hint: "Check MONGODB_URI and Atlas network access." },
          { status: 503 },
        ),
      };
    }
  }

  if (!mongoReady) {
    if (!localSession) {
      return {
        error: NextResponse.json(
          {
            error: "Sign in required.",
            hint: "Use demo sign-in on this host — MongoDB is not reachable from Cloudflare Workers.",
          },
          { status: 401 },
        ),
      };
    }
    return { user: { id: localSession.userId, email: localSession.email } };
  }

  if (!localSession) {
    return {
      error: NextResponse.json(
        {
          error: "Sign in required.",
          hint: "Sign in from the account menu to access your MongoDB-backed workspace.",
        },
        { status: 401 },
      ),
    };
  }

  const user = await findUserById(localSession.userId);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Session expired.", hint: "Sign in again." },
        { status: 401 },
      ),
    };
  }

  return { user: { id: user.id, email: user.email } };
}
