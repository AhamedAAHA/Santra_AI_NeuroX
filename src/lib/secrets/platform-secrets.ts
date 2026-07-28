/** Read env (MongoDB migration — secrets live in .env.local). */
export function getPlatformEnv(key: string): string | undefined {
  const fromEnv = process.env[key]?.trim();
  return fromEnv || undefined;
}

export async function ensurePlatformSecrets() {
  // no-op — env vars are read at request time
}

export function schedulePlatformSecretsRefresh() {
  // no-op
}
