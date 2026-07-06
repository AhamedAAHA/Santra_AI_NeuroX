"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readResponseJson } from "@/lib/http/read-response-json";
import type { PendingAction } from "@/types/pending-actions";

type ActionQueuePanelProps = {
  refreshKey?: number;
  onActionResolved?: () => void;
};

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

  async function resolveAction(id: string, status: "approved" | "dismissed") {
    setBusyId(id);
    try {
      const response = await fetch(`/api/pending-actions/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await readResponseJson<{ action?: PendingAction; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to update action.");
      toast.success(status === "approved" ? "Action approved" : "Action dismissed");
      await loadActions();
      onActionResolved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update action.");
    } finally {
      setBusyId(null);
    }
  }

  const pending = actions.filter((action) => action.status === "pending");
  const approved = actions.filter((action) => action.status === "approved");

  return (
    <Card className="p-5" glow>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/35">Human-in-the-loop</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Action approval queue</h3>
          <p className="mt-2 text-sm text-white/55">
            The agent proposes CRM and automation actions. Nothing executes until a GTM owner approves.
          </p>
        </div>
        <ShieldCheck className="h-6 w-6 shrink-0 text-sentra-cyan" />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-white/45">Loading queue…</p>
      ) : !pending.length && !approved.length ? (
        <p className="mt-4 text-sm text-white/45">
          No actions queued. Run a monitor check to generate an approval item when signals match.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {pending.map((action) => (
            <div
              key={action.id}
              className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="risk">Pending approval</Badge>
                {action.monitorRequirement && (
                  <span className="text-xs text-white/45">{action.monitorRequirement}</span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/78">{action.proposedAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busyId === action.id}
                  onClick={() => void resolveAction(action.id, "approved")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === action.id}
                  onClick={() => void resolveAction(action.id, "dismissed")}
                >
                  <XCircle className="h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))}

          {approved.map((action) => (
            <div
              key={action.id}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.04] p-4"
            >
              <Badge variant="success">Approved — ready to execute</Badge>
              <p className="mt-2 text-sm leading-6 text-white/78">{action.proposedAction}</p>
              <p className="mt-2 text-xs text-white/45">
                Open the linked report and use Trigger workflow with this approval.
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
