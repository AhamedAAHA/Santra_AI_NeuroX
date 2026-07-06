import { URL } from "url";

export function getMongoUri(): string | undefined {
  const direct = process.env.MONGODB_URI_DIRECT?.trim();
  if (direct) return normalizeMongoUri(direct);

  const raw = process.env.MONGODB_URI?.trim();
  if (!raw) return undefined;
  return normalizeMongoUri(raw);
}

export function getMongoSrvUri(): string | undefined {
  const raw = process.env.MONGODB_URI?.trim();
  if (!raw || !raw.startsWith("mongodb+srv://")) return undefined;
  return normalizeMongoUri(raw);
}

export function getMongoDirectUri(): string | undefined {
  const direct = process.env.MONGODB_URI_DIRECT?.trim();
  return direct ? normalizeMongoUri(direct) : undefined;
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || "santra";
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim() || process.env.MONGODB_URI_DIRECT?.trim());
}

/** Encode credentials and ensure srv URI shape is valid. */
export function normalizeMongoUri(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("mongodb")) return trimmed;

  try {
    const parsed = new URL(trimmed.replace(/^mongodb(\+srv)?:\/\//, "https://"));
    if (parsed.username) parsed.username = encodeURIComponent(decodeURIComponent(parsed.username));
    if (parsed.password) parsed.password = encodeURIComponent(decodeURIComponent(parsed.password));
    const protocol = trimmed.startsWith("mongodb+srv://") ? "mongodb+srv://" : "mongodb://";
    return `${protocol}${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}

export function mongoConnectionHint(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/ENODATA|querySrv|ENOTFOUND/i.test(message)) {
    return (
      "MongoDB SRV DNS is not ready yet (cluster may still be deploying in Atlas). " +
      "Wait until Cluster0 shows Active, or in Atlas → Connect → Drivers turn OFF 'Use SRV connection string' " +
      "and paste the mongodb://... URI into MONGODB_URI_DIRECT in .env.local."
    );
  }
  if (/authentication failed|bad auth/i.test(message)) {
    return "MongoDB auth failed. Check username/password in MONGODB_URI and that the database user exists in Atlas.";
  }
  if (/timed out|ETIMEDOUT|ECONNREFUSED/i.test(message)) {
    return "MongoDB connection timed out. In Atlas → Network Access, allow your current IP (or 0.0.0.0/0 for dev).";
  }
  return message;
}
