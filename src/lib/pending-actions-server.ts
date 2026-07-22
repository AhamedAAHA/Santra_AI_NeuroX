import { randomUUID } from "crypto";
import type { PendingAction, PendingActionEvent, PendingActionStatus } from "@/types/pending-actions";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

type StoreRow = PendingAction & { userId: string };

const globalStore = globalThis as typeof globalThis & {
  __santraPendingActions?: Map<string, StoreRow>;
};

function store(): Map<string, StoreRow> {
  if (!globalStore.__santraPendingActions) {
    globalStore.__santraPendingActions = new Map();
  }
  return globalStore.__santraPendingActions;
}

/** Server-side HITL queue used when MongoDB is not configured (demo-safe). */
export function createServerPendingAction(
  userId: string,
  input: {
    monitorId?: string;
    reportId?: string;
    proposedAction: string;
    proposedEvent?: PendingActionEvent;
    monitorRequirement?: string;
    reportSnapshot?: ExecutiveIntelligenceReport;
  },
): PendingAction {
  const action: StoreRow = {
    id: randomUUID(),
    userId,
    monitorId: input.monitorId,
    reportId: input.reportId,
    status: "pending",
    proposedAction: input.proposedAction,
    proposedEvent: input.proposedEvent ?? "monitor_alert",
    monitorRequirement: input.monitorRequirement,
    reportSnapshot: input.reportSnapshot,
    createdAt: new Date().toISOString(),
  };
  store().set(action.id, action);
  // Keep memory bounded for long-running demos
  if (store().size > 200) {
    const oldest = [...store().values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (oldest) store().delete(oldest.id);
  }
  const { userId: _userId, ...publicAction } = action;
  void _userId;
  return publicAction;
}

export function listServerPendingActions(userId: string): PendingAction[] {
  return [...store().values()]
    .filter((row) => row.userId === userId && (row.status === "pending" || row.status === "approved"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)
    .map((row) => {
      const { userId: _uid, ...action } = row;
      void _uid;
      return action;
    });
}

export function getServerPendingAction(userId: string, id: string): PendingAction | null {
  const row = store().get(id);
  if (!row || row.userId !== userId) return null;
  const { userId: _uid, ...action } = row;
  void _uid;
  return action;
}

export function updateServerPendingAction(
  userId: string,
  id: string,
  status: PendingActionStatus,
): PendingAction | null {
  const row = store().get(id);
  if (!row || row.userId !== userId) return null;
  const next: StoreRow = {
    ...row,
    status,
    resolvedAt: new Date().toISOString(),
  };
  store().set(id, next);
  const { userId: _uid, ...action } = next;
  void _uid;
  return action;
}
