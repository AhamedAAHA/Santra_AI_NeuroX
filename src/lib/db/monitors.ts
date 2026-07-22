import { randomUUID } from "crypto";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type { IntelligenceSignal, Severity } from "@/types/intelligence";

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
    if (!last) return true;
    return now - new Date(last).getTime() >= CRON_MIN_INTERVAL_MS;
  });

  return due.slice(0, limit);
}
