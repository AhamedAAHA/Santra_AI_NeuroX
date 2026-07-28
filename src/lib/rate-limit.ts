import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import { isMongoConfigured } from "@/lib/mongo/config";
import { recordProviderUsage, type ProviderId } from "@/lib/provider-usage";

type RateLimitConfig = {
  action: string;
  limit: number;
  windowMs: number;
};

const LIMITS: Record<string, RateLimitConfig> = {
  chat: { action: "chat", limit: 30, windowMs: 60 * 60 * 1000 },
  intelligence: { action: "intelligence", limit: 15, windowMs: 24 * 60 * 60 * 1000 },
  monitor_check: { action: "monitor_check", limit: 20, windowMs: 24 * 60 * 60 * 1000 },
  transcribe: { action: "transcribe", limit: 100, windowMs: 60 * 60 * 1000 },
  voice: { action: "voice", limit: 40, windowMs: 60 * 60 * 1000 },
};

const PROVIDER_BY_ACTION: Partial<Record<keyof typeof LIMITS, ProviderId>> = {
  intelligence: "aiml",
  monitor_check: "bright_data",
  transcribe: "speechmatics",
  voice: "speechmatics",
};

function getWindowStart(windowMs: number) {
  const now = Date.now();
  const start = new Date(Math.floor(now / windowMs) * windowMs);
  return start.toISOString();
}

export async function checkRateLimit(userId: string, key: keyof typeof LIMITS) {
  const config = LIMITS[key];
  if (!config) return { allowed: true as const };

  if (!isMongoConfigured()) {
    const provider = PROVIDER_BY_ACTION[key];
    if (provider) void recordProviderUsage(provider);
    return { allowed: true as const };
  }

  await ensureMongoReady();
  const db = await getDb();
  const windowStart = getWindowStart(config.windowMs);

  const existing = await db.collection("api_usage").findOne({
    user_id: userId,
    action: config.action,
    window_start: windowStart,
  });

  if (existing && Number(existing.count) >= config.limit) {
    return {
      allowed: false as const,
      message: `Rate limit reached for ${config.action}. Try again later.`,
    };
  }

  if (existing) {
    await db.collection("api_usage").updateOne({ id: existing.id }, { $inc: { count: 1 } });
  } else {
    await db.collection("api_usage").insertOne({
      id: crypto.randomUUID(),
      user_id: userId,
      action: config.action,
      window_start: windowStart,
      count: 1,
    });
  }

  const provider = PROVIDER_BY_ACTION[key];
  if (provider) void recordProviderUsage(provider);

  return { allowed: true as const };
}
