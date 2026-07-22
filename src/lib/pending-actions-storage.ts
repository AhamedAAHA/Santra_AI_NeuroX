const STORAGE_KEY = "sentra-pending-actions";

import type { PendingAction, PendingActionEvent } from "@/types/pending-actions";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

export function loadLocalPendingActions(): PendingAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as PendingAction[];
  } catch {
    return [];
  }
}

export function saveLocalPendingActions(actions: PendingAction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(actions.slice(0, 100)));
}

export function createLocalPendingAction(input: {
  monitorId?: string;
  reportId?: string;
  proposedAction: string;
  proposedEvent?: PendingActionEvent;
  monitorRequirement?: string;
  reportSnapshot?: ExecutiveIntelligenceReport;
}): PendingAction {
  const action: PendingAction = {
    id: crypto.randomUUID(),
    monitorId: input.monitorId,
    reportId: input.reportId,
    status: "pending",
    proposedAction: input.proposedAction,
    proposedEvent: input.proposedEvent ?? "monitor_alert",
    monitorRequirement: input.monitorRequirement,
    reportSnapshot: input.reportSnapshot,
    createdAt: new Date().toISOString(),
  };
  saveLocalPendingActions([action, ...loadLocalPendingActions()]);
  return action;
}

export function updateLocalPendingAction(
  id: string,
  status: PendingAction["status"],
): PendingAction | null {
  const actions = loadLocalPendingActions();
  const index = actions.findIndex((item) => item.id === id);
  if (index < 0) return null;
  actions[index] = {
    ...actions[index],
    status,
    resolvedAt: new Date().toISOString(),
  };
  saveLocalPendingActions(actions);
  return actions[index];
}

export function getLocalPendingAction(id: string) {
  return loadLocalPendingActions().find((item) => item.id === id) ?? null;
}
