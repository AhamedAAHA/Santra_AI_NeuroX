"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Link2, Settings2, ShieldCheck, Workflow, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getWorkspaceContext } from "@/lib/gtm/workspace-context";
import { readResponseJson } from "@/lib/http/read-response-json";
import { getAutomationWebhookUrl, isAllowedWebhook, saveAutomationWebhookUrl } from "@/lib/webhooks";
import { cn } from "@/lib/utils";
import type { PendingAction } from "@/types/pending-actions";

type ActionQueuePanelProps = {
  refreshKey?: number;
  onActionResolved?: () => void;
};

/** Strip boilerplate prefixes so rows stay scannable. */
function shortActionLabel(action: PendingAction) {
  const raw = action.proposedAction?.trim() || "Automation trigger";
  return (
    raw
      .replace(/^Review and approve CRM\/automation trigger:\s*/i, "")
      .replace(/^Review and approve automation:\s*/i, "")
      .replace(/^Review monitor brief:\s*/i, "")
      .trim() || raw
  );
}

export function ActionQueuePanel({ refreshKey = 0, onActionResolved }: ActionQueuePanelProps) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destinationError, setDestinationError] = useState("");
  const webhookInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

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
    const timeout = window.setTimeout(() => {
      setWebhookUrl(getAutomationWebhookUrl());
      void loadActions(refreshKey > 0);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadActions, refreshKey]);

  useEffect(() => {
    if (!destinationOpen) return;
    const timeout = window.setTimeout(() => webhookInputRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDestinationOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [destinationOpen]);

  function persistWebhook(next = webhookUrl) {
    saveAutomationWebhookUrl(next);
  }

  function openDestination(message = "") {
    setDestinationError(message);
    setDestinationOpen(true);
  }

  function saveDestination() {
    const trimmed = webhookUrl.trim();
    if (trimmed && !isAllowedWebhook(trimmed)) {
      setDestinationError("Use an HTTPS webhook URL (Zapier, Make, webhook.site, TriggerWare…).");
      return;
    }
    persistWebhook(trimmed);
    setDestinationError("");
    setDestinationOpen(false);
    toast.success(trimmed ? "Destination saved" : "Destination cleared", {
      description: trimmed
        ? "Approved actions will POST to this webhook."
        : "Set a webhook before Approve & run or Execute.",
    });
  }

  async function executeApprovedAction(action: PendingAction) {
    const trimmed = webhookUrl.trim() || getAutomationWebhookUrl().trim();
    if (!trimmed) {
      openDestination("Paste a CRM / automation webhook URL, then try again.");
      throw new Error("Set a destination webhook, then try again.");
    }
    if (!isAllowedWebhook(trimmed)) {
      openDestination("Use an HTTPS webhook URL (Zapier, Make, webhook.site, TriggerWare…).");
      throw new Error("Use an HTTPS webhook URL.");
    }

    persistWebhook(trimmed);
    setWebhookUrl(trimmed);

    const response = await fetch("/api/automation/webhook", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: trimmed,
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
              : "Set a destination webhook, then tap Execute.",
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
  const trimmedWebhook = webhookUrl.trim();
  const webhookConnected = Boolean(trimmedWebhook && isAllowedWebhook(trimmedWebhook));

  return (
    <>
      <Card className="p-4 md:p-5" glow>
        <div className="flex items-start justify-between gap-3">
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
              Approve before automation runs. Reject cancels.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => openDestination()}
              className={cn(
                "sentra-focus inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                webhookConnected
                  ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
                  : "border-white/12 bg-white/[0.04] text-white/65 hover:border-white/20 hover:text-white/85",
              )}
              aria-haspopup="dialog"
              aria-expanded={destinationOpen}
            >
              <Link2 className="h-3 w-3" />
              {webhookConnected ? "Connected" : "Not connected"}
              <Settings2 className="h-3 w-3 opacity-70" />
            </button>
            <ShieldCheck className="hidden h-5 w-5 text-sentra-cyan sm:block" />
          </div>
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
                Approved — set destination if needed, then Execute. Agent cannot skip this gate.
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

      {destinationOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-sentra-ink/80 px-4 py-8 backdrop-blur-xl"
          onClick={() => setDestinationOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-sentra-panel shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Automation</p>
                <h4 id={titleId} className="mt-1 text-lg font-semibold text-white">
                  Destination webhook
                </h4>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Where approved GTM actions should be sent.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setDestinationOpen(false)}
                aria-label="Close destination settings"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="hitl-crm-webhook" className="text-xs font-medium text-white/70">
                  HTTPS webhook URL
                </label>
                <Badge variant={webhookConnected ? "success" : "default"} className="px-2 py-0.5 text-[10px]">
                  <Link2 className="mr-1 h-3 w-3" />
                  {webhookConnected ? "Connected" : "Not connected"}
                </Badge>
              </div>
              <Input
                id="hitl-crm-webhook"
                ref={webhookInputRef}
                value={webhookUrl}
                onChange={(event) => {
                  setWebhookUrl(event.target.value);
                  if (destinationError) setDestinationError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveDestination();
                  }
                }}
                placeholder="https://hooks.zapier.com/… or webhook.site/…"
                className="h-11"
                aria-invalid={Boolean(destinationError)}
                aria-describedby={destinationError ? "hitl-webhook-error" : "hitl-webhook-help"}
              />
              {destinationError ? (
                <p id="hitl-webhook-error" className="text-[11px] leading-4 text-amber-100/90">
                  {destinationError}
                </p>
              ) : (
                <p id="hitl-webhook-help" className="text-[11px] leading-4 text-white/40">
                  Paste a URL from Zapier, Make, TriggerWare, HubSpot middleware, or webhook.site.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
              <Button variant="ghost" onClick={() => setDestinationOpen(false)}>
                Cancel
              </Button>
              <Button variant="neon" onClick={saveDestination}>
                Save destination
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
