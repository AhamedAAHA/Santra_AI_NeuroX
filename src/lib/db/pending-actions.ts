import { randomUUID } from "crypto";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type { PendingAction, PendingActionEvent } from "@/types/pending-actions";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

type DbPendingAction = {
  id: string;
  monitor_id: string | null;
  report_id: string | null;
  status: PendingAction["status"];
  proposed_action: string;
  proposed_event: PendingActionEvent;
  monitor_requirement: string | null;
  report_snapshot: ExecutiveIntelligenceReport | null;
  created_at: string;
  resolved_at: string | null;
};

function mapRow(row: DbPendingAction): PendingAction {
  return {
    id: row.id,
    monitorId: row.monitor_id ?? undefined,
    reportId: row.report_id ?? undefined,
    status: row.status,
    proposedAction: row.proposed_action,
    proposedEvent: row.proposed_event,
    monitorRequirement: row.monitor_requirement ?? undefined,
    reportSnapshot: row.report_snapshot ?? undefined,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

export async function createPendingAction(
  userId: string,
  input: {
    monitorId?: string;
    reportId?: string;
    proposedAction: string;
    proposedEvent?: PendingActionEvent;
    monitorRequirement?: string;
    reportSnapshot?: ExecutiveIntelligenceReport;
  },
) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const row: DbPendingAction & { user_id: string } = {
    id: randomUUID(),
    user_id: userId,
    monitor_id: input.monitorId ?? null,
    report_id: input.reportId ?? null,
    proposed_action: input.proposedAction,
    proposed_event: input.proposedEvent ?? "monitor_alert",
    monitor_requirement: input.monitorRequirement ?? null,
    report_snapshot: input.reportSnapshot ?? null,
    status: "pending",
    created_at: now,
    resolved_at: null,
  };
  await db.collection("pending_actions").insertOne(row);
  const { user_id: _, ...mapped } = row;
  return mapRow(mapped);
}

export async function listPendingActions(userId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection<DbPendingAction>("pending_actions")
    .find({ user_id: userId, status: { $in: ["pending", "approved"] } })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();
  return rows.map(mapRow);
}

export async function getPendingAction(userId: string, id: string) {
  await ensureMongoReady();
  const db = await getDb();
  const row = await db.collection<DbPendingAction & { user_id: string }>("pending_actions").findOne({
    user_id: userId,
    id,
  });
  if (!row) return null;
  const { user_id: _, ...mapped } = row;
  return mapRow(mapped);
}

export async function resolvePendingAction(
  userId: string,
  id: string,
  status: PendingAction["status"],
) {
  await ensureMongoReady();
  const db = await getDb();
  const resolved_at = new Date().toISOString();
  const result = await db.collection<DbPendingAction & { user_id: string }>("pending_actions").findOneAndUpdate(
    { user_id: userId, id },
    { $set: { status, resolved_at } },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Failed to update action.");
  const { user_id: _, ...mapped } = result;
  return mapRow(mapped);
}
