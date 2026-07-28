export type OAuthProvider = "github" | "google";

export function getAppOrigin() {
  return (
    process.env.SENTRA_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

export function getOAuthCallbackUrl(provider: OAuthProvider) {
  return `${getAppOrigin()}/api/auth/oauth/${provider}/callback`;
}

export function getGithubOAuthConfig() {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim() ?? "";
  return {
    enabled: Boolean(clientId && clientSecret),
    clientId,
    clientSecret,
  };
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ?? "";
  return {
    enabled: Boolean(clientId && clientSecret),
    clientId,
    clientSecret,
  };
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "github" || value === "google";
}

export function getOAuthProvidersStatus() {
  const github = getGithubOAuthConfig();
  const google = getGoogleOAuthConfig();
  return {
    github: github.enabled,
    google: google.enabled,
  };
}
