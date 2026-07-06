import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import { isMongoConfigured } from "@/lib/mongo/config";
import { getPlatformEnv } from "@/lib/secrets/platform-secrets";

export type ProviderId = "bright_data" | "aiml" | "speechmatics" | "featherless";

export type ProviderUsageMeta = {
  id: ProviderId;
  label: string;
  color: string;
  requestsToday: number;
  budgetUnits: number;
  usagePercent: number;
  detail: string;
  live: boolean;
};

const PROVIDER_DEFS: Array<{
  id: ProviderId;
  label: string;
  color: string;
  budgetKey: string;
  defaultBudget: number;
}> = [
  { id: "bright_data", label: "Bright Data", color: "#53f4ff", budgetKey: "PROVIDER_BUDGET_BRIGHT_DATA", defaultBudget: 500 },
  { id: "aiml", label: "AI/ML API", color: "#a855f7", budgetKey: "PROVIDER_BUDGET_AIML", defaultBudget: 1000 },
  { id: "speechmatics", label: "Speechmatics", color: "#4ade80", budgetKey: "PROVIDER_BUDGET_SPEECHMATICS", defaultBudget: 500 },
  { id: "featherless", label: "Featherless", color: "#ff4fd8", budgetKey: "PROVIDER_BUDGET_FEATHERLESS", defaultBudget: 1000 },
];

const memoryCounts: Record<string, Partial<Record<ProviderId, number>>> = {};

let developmentSeeded = false;

const DEV_DEFAULT_COUNTS: Record<ProviderId, number> = {
  bright_data: 8,
  aiml: 32,
  speechmatics: 12,
  featherless: 18,
};

async function seedDevelopmentDefaults() {
  const date = utcDateKey();
  memoryCounts[date] = { ...DEV_DEFAULT_COUNTS };
  if (!isMongoConfigured()) return;
  try {
    await ensureMongoReady();
    const db = await getDb();
    for (const [provider, count] of Object.entries(DEV_DEFAULT_COUNTS) as Array<[ProviderId, number]>) {
      await db.collection("provider_usage_daily").updateOne(
        { usage_date: date, provider },
        { $set: { usage_date: date, provider, request_count: count } },
        { upsert: true },
      );
    }
  } catch {
    // collection may not exist yet
  }
}

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getBudget(provider: (typeof PROVIDER_DEFS)[number]) {
  const raw = Number(getPlatformEnv(provider.budgetKey) ?? process.env[provider.budgetKey]);
  return Number.isFinite(raw) && raw > 0 ? raw : provider.defaultBudget;
}

export async function recordProviderUsage(provider: ProviderId, increment = 1) {
  const date = utcDateKey();
  memoryCounts[date] ??= {};
  memoryCounts[date][provider] = (memoryCounts[date][provider] ?? 0) + increment;

  if (!isMongoConfigured()) return;

  try {
    await ensureMongoReady();
    const db = await getDb();
    await db.collection("provider_usage_daily").updateOne(
      { usage_date: date, provider },
      { $inc: { request_count: increment } },
      { upsert: true },
    );
  } catch {
    // memory fallback still works
  }
}

async function readDailyCounts(): Promise<Partial<Record<ProviderId, number>>> {
  const date = utcDateKey();
  const counts: Partial<Record<ProviderId, number>> = { ...(memoryCounts[date] ?? {}) };

  if (!isMongoConfigured()) return counts;

  try {
    await ensureMongoReady();
    const db = await getDb();
    const rows = await db.collection("provider_usage_daily").find({ usage_date: date }).toArray();
    for (const row of rows) {
      const provider = row.provider as ProviderId;
      counts[provider] = Math.max(counts[provider] ?? 0, Number(row.request_count) ?? 0);
    }
  } catch {
    // ignore
  }

  return counts;
}

export async function fetchBrightDataBalance() {
  const apiKey =
    getPlatformEnv("BRIGHT_DATA_MANAGEMENT_KEY") || getPlatformEnv("BRIGHT_DATA_API_KEY");
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.brightdata.com/customer/balance", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { balance?: number; pending_balance?: number };
    const balance = Number(json.balance ?? 0);
    const pending = Number(json.pending_balance ?? 0);
    const total = balance + pending;
    const usagePercent = total > 0 ? Math.min(100, Math.round((pending / total) * 1000) / 10) : 0;
    return {
      balance,
      pending,
      usagePercent,
      detail: `$${pending.toFixed(2)} pending · $${balance.toFixed(2)} balance`,
    };
  } catch {
    return null;
  }
}

export async function getProviderUsageSnapshot(): Promise<{
  providers: ProviderUsageMeta[];
  updatedAt: string;
}> {
  if (process.env.NODE_ENV !== "production" && !developmentSeeded) {
    developmentSeeded = true;
    const existing = await readDailyCounts();
    const total = Object.values(existing).reduce((sum, value) => sum + (value ?? 0), 0);
    if (total === 0) await seedDevelopmentDefaults();
  }

  const counts = await readDailyCounts();
  const brightBalance = await fetchBrightDataBalance();

  const providers = PROVIDER_DEFS.map((def) => {
    if (def.id === "bright_data" && brightBalance) {
      return {
        id: def.id,
        label: def.label,
        color: def.color,
        requestsToday: counts.bright_data ?? 0,
        budgetUnits: 100,
        usagePercent: brightBalance.usagePercent,
        detail: `${brightBalance.detail} · ${counts.bright_data ?? 0} SANTRA calls today`,
        live: true,
      };
    }

    const requestsToday = counts[def.id] ?? 0;
    const budgetUnits = getBudget(def);
    const usagePercent = Math.min(100, Math.round((requestsToday / budgetUnits) * 1000) / 10);

    return {
      id: def.id,
      label: def.label,
      color: def.color,
      requestsToday,
      budgetUnits,
      usagePercent,
      detail: `${requestsToday} / ${budgetUnits} API calls today`,
      live: def.id === "bright_data" ? Boolean(brightBalance) : requestsToday > 0,
    };
  });

  return { providers, updatedAt: new Date().toISOString() };
}
