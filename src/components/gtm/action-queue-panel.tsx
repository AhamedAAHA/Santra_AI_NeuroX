"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Workflow, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getWorkspaceContext } from "@/lib/gtm/workspace-context";
import { readResponseJson } from "@/lib/http/read-response-json";
import { getAutomationWebhookUrl } from "@/lib/webhooks";
import { cn } from "@/lib/utils";
import type { PendingAction } from "@/types/pending-actions";

type ActionQueuePanelProps = {
  refreshKey?: number;
  onActionResolved?: () => void;
};

/** Strip boilerplate prefixes so rows stay scannable. */
function shortActionLabel(action: PendingAction) {
  const raw = action.proposedAction?.trim() || "Automation trigger";
  return raw
    .replace(/^Review and approve CRM\/automation trigger:\s*/i, "")
    .replace(/^Review and approve automation:\s*/i, "")
    .replace(/^Review monitor brief:\s*/i, "")
    .trim() || raw;
}

export function ActionQueuePanel({ refreshKey = 0, onActionResolved }: ActionQueuePanelProps) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadActions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/pending-actions", { credentials: "include" });
      const data = await readResponseJson<{ actions?: PendingAction[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to load action queue.");
      setActions(data.actions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load action queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadActions(refreshKey > 0), 0);
    return () => window.clearTimeout(timeout);
  }, [loadActions, refreshKey]);

  async function executeApprovedAction(action: PendingAction) {
    const webhookUrl = getAutomationWebhookUrl().trim();
    const response = await fetch("/api/automation/webhook", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: webhookUrl || undefined,
        event: action.proposedEvent ?? "monitor_alert",
        pendingActionId: action.id,
        workspace: getWorkspaceContext(),
        report: action.reportSnapshot,
        requirement: action.monitorRequirement,
        monitorId: action.monitorId,
      }),
    });
    const data = await readResponseJson<{ error?: string }>(response);
    if (!response.ok) {
      throw new Error(data.error || "Automation webhook delivery failed.");
    }
  }

  async function dismissAction(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/pending-actions/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      const data = await readResponseJson<{ action?: PendingAction; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to reject action.");
      toast.success("Action rejected");
      await loadActions();
      onActionResolved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject action.");
    } finally {
      setBusyId(null);
    }
  }

  async function approveAndExecute(action: PendingAction) {
    setBusyId(action.id);
    try {
      const response = await fetch(`/api/pending-actions/${action.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await readResponseJson<{ action?: PendingAction; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to approve action.");

      const approved = data.action ?? { ...action, status: "approved" as const };

      try {
        await executeApprovedAction(approved);
        toast.success("Approved & executed", {
          description: "HITL gate passed — automation webhook delivered.",
        });
      } catch (executeError) {
        toast.warning("Approved — execution pending", {
          description:
            executeError instanceof Error
              ? executeError.message
              : "Add a CRM/automation webhook, then tap Execute.",
        });
      }

      await loadActions();
      onActionResolved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve action.");
    } finally {
      setBusyId(null);
    }
  }

  async function retryExecute(action: PendingAction) {
    setBusyId(action.id);
    try {
      await executeApprovedAction(action);
      toast.success("Workflow triggered", {
        description: "SANTRA forwarded this approved GTM event to your automation webhook.",
      });
      await loadActions();
      onActionResolved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Automation trigger failed.");
    } finally {
      setBusyId(null);
    }
  }

  const pending = actions.filter((action) => action.status === "pending");
  const approved = actions.filter((action) => action.status === "approved");
  const hasItems = pending.length > 0 || approved.length > 0;

  return (
    <Card className="p-4 md:p-5" glow>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">HITL action queue</h3>
            {hasItems && (
              <span className="text-xs text-white/40">
                {pending.length} pending · {approved.length} to execute
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/45">
            Human-in-the-loop: Approve &amp; run triggers the CRM webhook. Reject cancels.
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-sentra-cyan" />
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-white/45">Loading queue…</p>
      ) : !hasItems ? (
        <p className="mt-3 text-sm text-white/45">
          No actions queued. Run Check now when signals match — approval is required before automation.
        </p>
      ) : (
        <div className="mt-3 max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
          {pending.map((action) => (
            <div
              key={action.id}
              className="flex flex-col gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="risk" className="px-2 py-0.5 text-[10px]">
                    Needs approval
                  </Badge>
                  {action.monitorRequirement && (
                    <span className="truncate text-[11px] text-white/40">{action.monitorRequirement}</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-white/85" title={action.proposedAction}>
                  {shortActionLabel(action)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <Button
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={busyId === action.id}
                  onClick={() => void approveAndExecute(action)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {busyId === action.id ? "…" : "Approve & run"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-xs"
                  disabled={busyId === action.id}
                  onClick={() => void dismissAction(action.id)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}

          {approved.length > 0 && (
            <p
              className={cn(
                "rounded-lg border border-emerald-300/15 bg-emerald-300/[0.04] px-3 py-2 text-[11px] leading-5 text-white/50",
                pending.length > 0 && "mt-1",
              )}
            >
              Approved — set a CRM/automation webhook below, then Execute. Agent cannot skip this gate.
            </p>
          )}

          {approved.map((action) => (
            <div
              key={action.id}
              className="flex flex-col gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success" className="px-2 py-0.5 text-[10px]">
                    Approved
                  </Badge>
                  {action.monitorRequirement && (
                    <span className="truncate text-[11px] text-white/40">{action.monitorRequirement}</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-white/85" title={action.proposedAction}>
                  {shortActionLabel(action)}
                </p>
              </div>
              <div className="flex shrink-0">
                <Button
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={busyId === action.id}
                  onClick={() => void retryExecute(action)}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  {busyId === action.id ? "…" : "Execute"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
