/**
 * Pick a Speechmatics realtime WebSocket host that matches the temporary JWT audience.
 * EU-scoped keys (aud: eu / eu-1) often fail against global.rt from some browsers/networks.
 */

const DEFAULT_RT_WS = "wss://eu.rt.speechmatics.com/v2";

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function resolveSpeechmaticsRtWsBase(options?: {
  jwt?: string;
  envUrl?: string;
}): string {
  const envUrl = options?.envUrl?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const payload = options?.jwt ? decodeJwtPayload(options.jwt) : null;
  const aud = payload?.aud;
  const regions = Array.isArray(aud)
    ? aud.map((item) => String(item).toLowerCase())
    : typeof aud === "string"
      ? [aud.toLowerCase()]
      : [];

  if (regions.some((r) => r === "usa" || r === "us" || r.startsWith("us"))) {
    return "wss://us.rt.speechmatics.com/v2";
  }
  if (regions.some((r) => r === "eu" || r.startsWith("eu"))) {
    return "wss://eu.rt.speechmatics.com/v2";
  }

  return DEFAULT_RT_WS;
}

export function buildSpeechmaticsRtWsUrl(jwt: string, envUrl?: string) {
  const base = resolveSpeechmaticsRtWsBase({ jwt, envUrl });
  return `${base}?jwt=${encodeURIComponent(jwt)}`;
}
