import { randomUUID } from "crypto";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type { IntelligenceSignal, Severity } from "@/types/intelligence";

/** Allowed background-watch intervals (ms). */
export const WATCH_INTERVAL_OPTIONS_MS = [
  30 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
] as const;

export type WatchIntervalMs = (typeof WATCH_INTERVAL_OPTIONS_MS)[number];

export function isAllowedWatchInterval(value: unknown): value is WatchIntervalMs {
  return typeof value === "number" && (WATCH_INTERVAL_OPTIONS_MS as readonly number[]).includes(value);
}

export type DbMonitor = {
  id: string;
  requirement: string;
  category: string;
  minimum_severity: Severity;
  keywords: string[];
  target_url: string | null;
  active: boolean;
  last_checked_at: string | null;
  search_query?: string | null;
  plain_summary?: string | null;
  last_matched_count?: number;
  last_signal_count?: number;
  last_summary?: string | null;
  last_search_query?: string | null;
  last_match_title?: string | null;
  last_provider?: string | null;
  /** Opt-in background email watch (additive; undefined = off). */
  watch_enabled?: boolean;
  watch_interval_ms?: number;
  watch_started_at?: string | null;
  watch_email_enabled?: boolean;
  last_notified_at?: string | null;
};

export async function listMonitors(userId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection<DbMonitor & { user_id: string }>("monitors")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();
  return rows.map(({ user_id: _, ...monitor }) => monitor);
}

export async function createMonitor(
  userId: string,
  monitor: Omit<DbMonitor, "id" | "last_checked_at"> & {
    id?: string;
    search_query?: string | null;
    plain_summary?: string | null;
  },
) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const row = {
    id: monitor.id ?? randomUUID(),
    user_id: userId,
    requirement: monitor.requirement,
    category: monitor.category,
    minimum_severity: monitor.minimum_severity,
    keywords: monitor.keywords,
    target_url: monitor.target_url,
    active: monitor.active,
    search_query: monitor.search_query ?? null,
    plain_summary: monitor.plain_summary ?? null,
    last_checked_at: null,
    created_at: now,
    updated_at: now,
  };
  await db.collection("monitors").insertOne(row);
  const { user_id: _, created_at: __, updated_at: ___, ...result } = row;
  return result as DbMonitor;
}

export async function updateMonitorActive(userId: string, monitorId: string, active: boolean) {
  await ensureMongoReady();
  const db = await getDb();
  await db
    .collection("monitors")
    .updateOne({ id: monitorId, user_id: userId }, { $set: { active, updated_at: new Date().toISOString() } });
}

export type MonitorUpdateFields = {
  requirement?: string;
  category?: string;
  minimum_severity?: Severity;
  keywords?: string[];
  target_url?: string | null;
  active?: boolean;
  search_query?: string | null;
  plain_summary?: string | null;
};

export async function updateMonitor(userId: string, monitorId: string, fields: MonitorUpdateFields) {
  await ensureMongoReady();
  const db = await getDb();
  const $set: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof fields.requirement === "string") $set.requirement = fields.requirement;
  if (typeof fields.category === "string") $set.category = fields.category;
  if (fields.minimum_severity) $set.minimum_severity = fields.minimum_severity;
  if (fields.keywords) $set.keywords = fields.keywords;
  if (fields.target_url !== undefined) $set.target_url = fields.target_url;
  if (typeof fields.active === "boolean") $set.active = fields.active;
  if (fields.search_query !== undefined) $set.search_query = fields.search_query;
  if (fields.plain_summary !== undefined) $set.plain_summary = fields.plain_summary;

  const result = await db.collection("monitors").updateOne(
    { id: monitorId, user_id: userId },
    { $set },
  );
  return result.matchedCount > 0;
}

export async function deleteMonitor(userId: string, monitorId: string) {
  await ensureMongoReady();
  const db = await getDb();
  await db.collection("monitors").deleteOne({ id: monitorId, user_id: userId });
}

export async function getMonitor(userId: string, monitorId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const row = await db.collection<DbMonitor & { user_id: string }>("monitors").findOne({
    id: monitorId,
    user_id: userId,
  });
  if (!row) return null;
  const { user_id: _, ...monitor } = row;
  return monitor;
}

export async function recordMonitorEvents(userId: string, monitorId: string, signals: IntelligenceSignal[]) {
  if (!signals.length) return [];
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const ops = signals.map((signal) => ({
    updateOne: {
      filter: { monitor_id: monitorId, signal_id: signal.id },
      update: {
        $setOnInsert: {
          id: randomUUID(),
          monitor_id: monitorId,
          signal_id: signal.id,
          user_id: userId,
          seen_at: now,
        },
      },
      upsert: true,
    },
  }));
  await db.collection("monitor_events").bulkWrite(ops);
  return signals.map((signal) => ({ signal_id: signal.id, seen_at: now }));
}

export async function updateMonitorChecked(userId: string, monitorId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  await db
    .collection("monitors")
    .updateOne({ id: monitorId, user_id: userId }, { $set: { last_checked_at: now, updated_at: now } });
}

export type MonitorWatchState = {
  watch_enabled: boolean;
  watch_interval_ms: number | null;
  watch_started_at: string | null;
  watch_email_enabled: boolean;
  last_notified_at: string | null;
};

export function pickWatchState(monitor: DbMonitor | null | undefined): MonitorWatchState {
  return {
    watch_enabled: Boolean(monitor?.watch_enabled),
    watch_interval_ms: typeof monitor?.watch_interval_ms === "number" ? monitor.watch_interval_ms : null,
    watch_started_at: monitor?.watch_started_at ?? null,
    watch_email_enabled: Boolean(monitor?.watch_email_enabled),
    last_notified_at: monitor?.last_notified_at ?? null,
  };
}

export async function startMonitorWatch(userId: string, monitorId: string, intervalMs: WatchIntervalMs) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.collection("monitors").updateOne(
    { id: monitorId, user_id: userId },
    {
      $set: {
        watch_enabled: true,
        watch_interval_ms: intervalMs,
        watch_started_at: now,
        watch_email_enabled: true,
        updated_at: now,
      },
    },
  );
  return result.matchedCount > 0;
}

export async function stopMonitorWatch(userId: string, monitorId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.collection("monitors").updateOne(
    { id: monitorId, user_id: userId },
    {
      $set: {
        watch_enabled: false,
        watch_email_enabled: false,
        updated_at: now,
      },
    },
  );
  return result.matchedCount > 0;
}

export async function updateMonitorLastNotified(userId: string, monitorId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  await db
    .collection("monitors")
    .updateOne({ id: monitorId, user_id: userId }, { $set: { last_notified_at: now, updated_at: now } });
}

/** Legacy cron cadence for active monitors that are not email-watching. */
const CRON_MIN_INTERVAL_MS = 30 * 60 * 1000;

export type DbMonitorWithUser = DbMonitor & { user_id: string };

export async function listActiveMonitorsDueForCronWithUsers(limit = 8) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection<DbMonitorWithUser & { created_at?: string }>("monitors")
    .find({ active: true })
    .sort({ last_checked_at: 1 })
    .limit(50)
    .toArray();

  const now = Date.now();
  const due = rows.filter((row) => {
    const last = row.last_checked_at;
    const intervalMs =
      row.watch_enabled && typeof row.watch_interval_ms === "number" && row.watch_interval_ms > 0
        ? row.watch_interval_ms
        : CRON_MIN_INTERVAL_MS;
    if (!last) return true;
    return now - new Date(last).getTime() >= intervalMs;
  });

  // Watched monitors go first so a large backlog of idle monitors cannot starve them.
  due.sort((a, b) => Number(Boolean(b.watch_enabled)) - Number(Boolean(a.watch_enabled)));

  return due.slice(0, limit);
}
