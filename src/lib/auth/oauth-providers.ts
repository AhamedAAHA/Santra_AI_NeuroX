import {
  getGithubOAuthConfig,
  getGoogleOAuthConfig,
  getOAuthCallbackUrl,
  type OAuthProvider,
} from "@/lib/auth/oauth-config";

export type OAuthProfile = {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  displayName?: string;
};

function buildAuthorizeUrl(provider: OAuthProvider, state: string) {
  const redirectUri = encodeURIComponent(getOAuthCallbackUrl(provider));

  if (provider === "github") {
    const { clientId } = getGithubOAuthConfig();
    const scope = encodeURIComponent("read:user user:email");
    return `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  const { clientId } = getGoogleOAuthConfig();
  const scope = encodeURIComponent("openid email profile");
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}&access_type=online&prompt=select_account`;
}

export function getOAuthAuthorizeUrl(provider: OAuthProvider, state: string) {
  return buildAuthorizeUrl(provider, state);
}

async function exchangeGithubCode(code: string) {
  const { clientId, clientSecret } = getGithubOAuthConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getOAuthCallbackUrl("github"),
    }),
  });

  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || "GitHub token exchange failed.");
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${payload.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "SANTRA-AI",
    },
  });
  const user = (await userResponse.json()) as {
    id?: number;
    login?: string;
    name?: string | null;
    email?: string | null;
  };

  if (!userResponse.ok || !user.id) {
    throw new Error("Could not load GitHub profile.");
  }

  let email = user.email?.trim().toLowerCase() ?? "";
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${payload.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "SANTRA-AI",
      },
    });
    const emails = (await emailsResponse.json()) as Array<{
      email?: string;
      primary?: boolean;
      verified?: boolean;
    }>;
    const primary = emails.find((entry) => entry.primary && entry.verified && entry.email);
    const verified = emails.find((entry) => entry.verified && entry.email);
    email = (primary?.email || verified?.email || emails[0]?.email || "").trim().toLowerCase();
  }

  if (!email) {
    throw new Error("GitHub account has no verified email. Make one primary and try again.");
  }

  return {
    provider: "github" as const,
    providerId: String(user.id),
    email,
    displayName: user.name?.trim() || user.login || email.split("@")[0],
  };
}

async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getOAuthCallbackUrl("google"),
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || "Google token exchange failed.");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${payload.access_token}` },
  });
  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (!profileResponse.ok || !profile.sub || !profile.email) {
    throw new Error("Could not load Google profile.");
  }

  if (profile.email_verified === false) {
    throw new Error("Google email is not verified.");
  }

  return {
    provider: "google" as const,
    providerId: profile.sub,
    email: profile.email.trim().toLowerCase(),
    displayName: profile.name?.trim() || profile.email.split("@")[0],
  };
}

export async function exchangeOAuthCode(provider: OAuthProvider, code: string): Promise<OAuthProfile> {
  if (provider === "github") return exchangeGithubCode(code);
  return exchangeGoogleCode(code);
}
