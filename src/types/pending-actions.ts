import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

export type PendingActionStatus = "pending" | "approved" | "dismissed" | "executed";

export type PendingActionEvent = "crm_export" | "monitor_alert";

export type PendingAction = {
  id: string;
  monitorId?: string;
  reportId?: string;
  status: PendingActionStatus;
  proposedAction: string;
  proposedEvent: PendingActionEvent;
  monitorRequirement?: string;
  reportSnapshot?: ExecutiveIntelligenceReport;
  createdAt: string;
  resolvedAt?: string;
};
