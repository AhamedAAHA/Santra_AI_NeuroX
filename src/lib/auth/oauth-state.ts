import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { OAuthProvider } from "@/lib/auth/oauth-config";

export const OAUTH_STATE_COOKIE = "sentra-oauth-state";

type OAuthStatePayload = {
  nonce: string;
  provider: OAuthProvider;
  next: string;
  issuedAt: number;
};

function getStateSecret() {
  return (
    process.env.OAUTH_STATE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    "santra-dev-oauth-state"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getStateSecret()).update(payload).digest("hex");
}

function encodeState(data: OAuthStatePayload) {
  const payload = JSON.stringify(data);
  const signature = signPayload(payload);
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64url");
}

function decodeState(value: string): OAuthStatePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      payload?: string;
      signature?: string;
    };
    if (!parsed.payload || !parsed.signature) return null;

    const expected = signPayload(parsed.payload);
    const actual = Buffer.from(parsed.signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
      return null;
    }

    const data = JSON.parse(parsed.payload) as OAuthStatePayload;
    if (!data.nonce || !data.provider || !data.next || !data.issuedAt) return null;
    if (Date.now() - data.issuedAt > 10 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createOAuthState(provider: OAuthProvider, next: string) {
  const state = encodeState({
    nonce: randomBytes(16).toString("hex"),
    provider,
    next,
    issuedAt: Date.now(),
  });

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return state;
}

export async function readOAuthState(stateParam: string | null, provider: OAuthProvider) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!stateParam || !cookieValue || stateParam !== cookieValue) return null;

  const payload = decodeState(stateParam);
  if (!payload || payload.provider !== provider) return null;
  return payload;
}
