import {
  getGithubOAuthConfig,
  getGoogleOAuthConfig,
  isOAuthProvider,
} from "@/lib/auth/oauth-config";
import { exchangeOAuthCode } from "@/lib/auth/oauth-providers";
import { readOAuthState } from "@/lib/auth/oauth-state";
import { oauthFailureRedirect, oauthSuccessRedirect } from "@/lib/auth/oauth-routes";
import { buildSessionCookie } from "@/lib/auth/session";
import { findOrCreateOAuthUser } from "@/lib/auth/users";
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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerError = searchParams.get("error");
  const fallbackNext = "/dashboard";

  if (!isOAuthProvider(providerParam)) {
    return oauthFailureRedirect(origin, fallbackNext, "oauth_provider_invalid");
  }

  if (!isMongoConfigured() || !isProviderConfigured(providerParam)) {
    return oauthFailureRedirect(origin, fallbackNext, "oauth_not_configured");
  }

  const statePayload = await readOAuthState(state, providerParam);
  const next = statePayload?.next ?? fallbackNext;

  if (providerError) {
    return oauthFailureRedirect(origin, next, providerError);
  }

  if (!code || !statePayload) {
    return oauthFailureRedirect(origin, next, "oauth_state_invalid");
  }

  try {
    await ensureMongoReady();
    const profile = await exchangeOAuthCode(providerParam, code);
    const user = await findOrCreateOAuthUser({
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
      displayName: profile.displayName,
    });

    const session = {
      userId: user.id,
      email: user.email,
      displayName: user.display_name ?? undefined,
      companyName: user.company_name ?? undefined,
      signedInAt: new Date().toISOString(),
    };

    const cookie = buildSessionCookie(session);
    const response = oauthSuccessRedirect(origin, next);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error(`[oauth/${providerParam}] callback failed`, error);
    return oauthFailureRedirect(origin, next, "oauth_callback_failed");
  }
}
