import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type {
  DetectedChange,
  ExecutiveIntelligenceReport,
  MonitorTimelineEvent,
  PageSnapshot,
} from "@/types/intelligence";

export type MonitorCheckState = {
  search_query?: string | null;
  plain_summary?: string | null;
  last_matched_count?: number;
  last_signal_count?: number;
  last_summary?: string | null;
  last_search_query?: string | null;
  last_match_title?: string | null;
  last_provider?: string | null;
  last_checked_at?: string;
};

export async function updateMonitorCheckState(userId: string, monitorId: string, state: MonitorCheckState) {
  await ensureMongoReady();
  const db = await getDb();
  await db
    .collection("monitors")
    .updateOne({ id: monitorId, user_id: userId }, { $set: { ...state, updated_at: new Date().toISOString() } });
}

export async function appendTimelineEventDb(
  userId: string,
  event: Omit<MonitorTimelineEvent, "id" | "timestamp"> & { timestamp?: string },
) {
  await ensureMongoReady();
  const db = await getDb();
  const created_at = event.timestamp ?? new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    monitor_id: event.monitorId ?? null,
    event_type: event.type,
    summary: event.summary,
    severity: event.severity ?? null,
    monitor_requirement: event.monitorRequirement ?? null,
    change_id: event.changeId ?? null,
    report_id: event.reportId ?? null,
    metadata: event.metadata ?? {},
    created_at,
  };
  await db.collection("monitor_timeline_events").insertOne(row);
  return mapTimelineRow(row);
}

export async function listTimelineEvents(userId: string, limit = 100) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("monitor_timeline_events")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return rows.map(mapTimelineRow);
}

export async function saveDetectedChangesDb(userId: string, changes: DetectedChange[]) {
  if (!changes.length) return [];
  await ensureMongoReady();
  const db = await getDb();
  const ops = changes.map((change) => ({
    updateOne: {
      filter: { id: change.id },
      update: {
        $set: {
          id: change.id,
          user_id: userId,
          monitor_id: change.monitorId ?? null,
          field: change.field,
          old_value: change.oldValue,
          new_value: change.newValue,
          source_url: change.sourceUrl,
          impact: change.impact,
          severity: change.severity,
          category: change.category,
          detected_at: change.detectedAt,
        },
      },
      upsert: true,
    },
  }));
  await db.collection("monitor_detected_changes").bulkWrite(ops);
  return changes;
}

export async function listDetectedChanges(userId: string, limit = 50) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("monitor_detected_changes")
    .find({ user_id: userId })
    .sort({ detected_at: -1 })
    .limit(limit)
    .toArray();
  return rows.map(mapChangeRow);
}

export async function savePageSnapshotDb(userId: string, snapshot: PageSnapshot) {
  await ensureMongoReady();
  const db = await getDb();
  const row = {
    id: snapshot.id,
    user_id: userId,
    monitor_id: snapshot.monitorId ?? null,
    url: snapshot.url,
    content_hash: snapshot.contentHash,
    fields: snapshot.fields,
    raw_excerpt: snapshot.rawExcerpt ?? null,
    bright_data_mode: snapshot.brightDataMode ?? null,
    collected_at: snapshot.collectedAt,
    created_at: new Date().toISOString(),
  };
  await db.collection("monitor_page_snapshots").insertOne(row);
  return mapSnapshotRow(row);
}

export async function getLatestPageSnapshot(userId: string, monitorId: string, url: string) {
  await ensureMongoReady();
  const db = await getDb();
  const row = await db
    .collection("monitor_page_snapshots")
    .find({ user_id: userId, monitor_id: monitorId, url })
    .sort({ collected_at: -1 })
    .limit(1)
    .next();
  return row ? mapSnapshotRow(row) : null;
}

export async function getLatestReportsByMonitor(userId: string): Promise<Record<string, ExecutiveIntelligenceReport>> {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("intelligence_reports")
    .find({ user_id: userId, monitor_id: { $ne: null } })
    .sort({ created_at: -1 })
    .limit(100)
    .toArray();

  const map: Record<string, ExecutiveIntelligenceReport> = {};
  for (const row of rows) {
    const monitorId = row.monitor_id as string;
    if (!monitorId || map[monitorId]) continue;
    map[monitorId] = row.report as ExecutiveIntelligenceReport;
  }
  return map;
}

function mapTimelineRow(row: Record<string, unknown>): MonitorTimelineEvent {
  return {
    id: String(row.id),
    type: row.event_type as MonitorTimelineEvent["type"],
    timestamp: String(row.created_at),
    monitorId: row.monitor_id ? String(row.monitor_id) : undefined,
    monitorRequirement: row.monitor_requirement ? String(row.monitor_requirement) : undefined,
    summary: String(row.summary),
    severity: row.severity ? (String(row.severity) as MonitorTimelineEvent["severity"]) : undefined,
    changeId: row.change_id ? String(row.change_id) : undefined,
    reportId: row.report_id ? String(row.report_id) : undefined,
    metadata: (row.metadata as Record<string, string>) ?? {},
  };
}

function mapChangeRow(row: Record<string, unknown>): DetectedChange {
  return {
    id: String(row.id),
    monitorId: row.monitor_id ? String(row.monitor_id) : undefined,
    field: String(row.field),
    oldValue: String(row.old_value),
    newValue: String(row.new_value),
    sourceUrl: String(row.source_url),
    impact: String(row.impact),
    severity: String(row.severity) as DetectedChange["severity"],
    category: String(row.category) as DetectedChange["category"],
    detectedAt: String(row.detected_at),
  };
}

function mapSnapshotRow(row: Record<string, unknown>): PageSnapshot {
  return {
    id: String(row.id),
    monitorId: row.monitor_id ? String(row.monitor_id) : undefined,
    url: String(row.url),
    contentHash: String(row.content_hash),
    fields: (row.fields as Record<string, string>) ?? {},
    rawExcerpt: row.raw_excerpt ? String(row.raw_excerpt) : undefined,
    brightDataMode: row.bright_data_mode
      ? (String(row.bright_data_mode) as PageSnapshot["brightDataMode"])
      : undefined,
    collectedAt: String(row.collected_at),
  };
}
