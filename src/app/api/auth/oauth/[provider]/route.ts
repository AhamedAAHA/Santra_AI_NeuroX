import { NextResponse } from "next/server";
import {
  getGithubOAuthConfig,
  getGoogleOAuthConfig,
  isOAuthProvider,
} from "@/lib/auth/oauth-config";
import { getOAuthAuthorizeUrl } from "@/lib/auth/oauth-providers";
import { createOAuthState } from "@/lib/auth/oauth-state";
import { oauthFailureRedirect, readOAuthNext } from "@/lib/auth/oauth-routes";
import { isMongoConfigured } from "@/lib/mongo/config";
import { ensureMongoReady } from "@/lib/mongo/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

function isProviderConfigured(provider: "github" | "google") {
  return provider === "github" ? getGithubOAuthConfig().enabled : getGoogleOAuthConfig().enabled;
}

export async function GET(request: Request, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  const { origin } = new URL(request.url);
  const next = readOAuthNext(request);

  if (!isOAuthProvider(providerParam)) {
    return oauthFailureRedirect(origin, next, "oauth_provider_invalid");
  }

  if (!isMongoConfigured()) {
    return oauthFailureRedirect(origin, next, "mongodb_not_configured");
  }

  if (!isProviderConfigured(providerParam)) {
    return oauthFailureRedirect(origin, next, "oauth_not_configured");
  }

  try {
    await ensureMongoReady();
    const state = await createOAuthState(providerParam, next);
    const authorizeUrl = getOAuthAuthorizeUrl(providerParam, state);
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error(`[oauth/${providerParam}] start failed`, error);
    return oauthFailureRedirect(origin, next, "oauth_start_failed");
  }
}
