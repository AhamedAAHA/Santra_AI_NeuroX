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
  monitor_intent: { action: "monitor_intent", limit: 60, windowMs: 60 * 60 * 1000 },
  transcribe: { action: "transcribe", limit: 100, windowMs: 60 * 60 * 1000 },
  voice: { action: "voice", limit: 40, windowMs: 60 * 60 * 1000 },
};

const PROVIDER_BY_ACTION: Partial<Record<keyof typeof LIMITS, ProviderId>> = {
  intelligence: "aiml",
  monitor_check: "bright_data",
  monitor_intent: "aiml",
  transcribe: "speechmatics",
  voice: "speechmatics",
};

function getWindowStart(windowMs: number) {
  const now = Date.now();
  const start = new Date(Math.floor(now / windowMs) * windowMs);
  return start.toISOString();
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; message: string };

/** Fails closed: if usage cannot be counted, the request is denied rather than let through. */
export async function checkRateLimit(
  userId: string,
  key: keyof typeof LIMITS,
): Promise<RateLimitResult> {
  const config = LIMITS[key];
  if (!config) return { allowed: true };

  if (!isMongoConfigured()) {
    await recordProviderUsageFor(key);
    return { allowed: true };
  }

  try {
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
        allowed: false,
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
  } catch (error) {
    console.warn(`Rate limit check failed for ${config.action}`, error);
    // Live call / STT should still work when Atlas is briefly unreachable.
    if (key === "voice" || key === "transcribe") {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: "Usage limits are temporarily unavailable. Try again in a moment.",
    };
  }

  await recordProviderUsageFor(key);
  return { allowed: true };
}

async function recordProviderUsageFor(key: keyof typeof LIMITS) {
  const provider = PROVIDER_BY_ACTION[key];
  if (!provider) return;
  try {
    await recordProviderUsage(provider);
  } catch (error) {
    console.warn(`Provider usage not recorded for ${provider}`, error);
  }
}
