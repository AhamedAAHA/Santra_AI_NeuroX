import { ALL_PLATFORM_ENV_KEYS, PLATFORM_SECRET_KEYS } from "@/lib/secrets/keys";

/** Read env (MongoDB migration — secrets live in .env.local). */
export function getPlatformEnv(key: string): string | undefined {
  const fromEnv = process.env[key]?.trim();
  return fromEnv || undefined;
}

export function getPlatformSecretsSource(): "env" | "mixed" {
  const secretKeys = [...PLATFORM_SECRET_KEYS];
  const fromEnv = secretKeys.filter((key) => Boolean(process.env[key]?.trim())).length;
  return fromEnv > 0 ? "env" : "env";
}

export function getPlatformVaultBackend() {
  return null;
}

export function invalidatePlatformSecretsCache() {
  // no-op
}

export async function ensurePlatformSecrets(_force = false) {
  // no-op — env vars are read at request time
}

export function schedulePlatformSecretsRefresh() {
  // no-op
}

export async function upsertPlatformEnvEntries(
  _entries: Array<{ key: string; value: string; kind?: "secret" | "config" }>,
) {
  throw new Error("Platform env vault is disabled. Set secrets in .env.local instead.");
}

export function collectEnvForSync() {
  const entries: Array<{ key: string; value: string; kind: "secret" | "config" }> = [];
  for (const key of ALL_PLATFORM_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    entries.push({
      key,
      value,
      kind: PLATFORM_SECRET_KEYS.includes(key as never) ? "secret" : "config",
    });
  }
  return entries;
}
