"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, PencilLine, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getWorkspaceContext } from "@/lib/gtm/workspace-context";
import { resolveActionHeadline } from "@/lib/gtm/report-headline";
import { readResponseJson } from "@/lib/http/read-response-json";
import {
  WEBHOOK_DESTINATION_SUGGESTIONS,
  describeWebhookDestination,
} from "@/lib/webhooks/destinations";
import { getAutomationWebhookUrl, isAllowedWebhook, saveAutomationWebhookUrl } from "@/lib/webhooks";
import { cn } from "@/lib/utils";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";
import type { PendingAction } from "@/types/pending-actions";

type ReportApprovalPanelProps = {
  pendingActionId?: string;
  report?: ExecutiveIntelligenceReport;
  requirement?: string;
  monitorId?: string;
  refreshKey?: number;
  onResolved?: () => void;
  onSelectAction?: (action: PendingAction) => void;
};

function actionHeadline(action: PendingAction) {
  return resolveActionHeadline({
    proposedAction: action.proposedAction,
    monitorRequirement: action.monitorRequirement,
    report: action.reportSnapshot,
  });
}

export function ReportApprovalPanel({
  pendingActionId,
  report,
  requirement,
  monitorId,
  refreshKey = 0,
  onResolved,
  onSelectAction,
}: ReportApprovalPanelProps) {
  const [inbox, setInbox] = useState<PendingAction[]>([]);
  const [action, setAction] = useState<PendingAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftAction, setDraftAction] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pending-actions", { credentials: "include" });
      const data = await readResponseJson<{ actions?: PendingAction[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to load approvals.");
      const actions = data.actions ?? [];
      setInbox(actions);

      const match =
        (pendingActionId ? actions.find((item) => item.id === pendingActionId) : undefined) ??
        actions.find(
          (item) =>
            (item.status === "pending" || item.status === "approved") &&
            (item.reportId === report?.id ||
              item.reportSnapshot?.id === report?.id ||
              item.monitorId === monitorId),
        ) ??
        null;

      setAction(match);
      setDraftAction(match?.proposedAction ?? "");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load approvals.");
      setInbox([]);
      setAction(null);
    } finally {
      setLoading(false);
    }
  }, [pendingActionId, report?.id, monitorId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDestinationUrl(getAutomationWebhookUrl()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadInbox();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadInbox, refreshKey]);

  function persistDestination(next = destinationUrl) {
    saveAutomationWebhookUrl(next);
  }

  async function sendToDestination(approved: PendingAction) {
    const trimmed = destinationUrl.trim() || getAutomationWebhookUrl().trim();
    if (!trimmed) {
      throw new Error("Add a link under Where to send, then try again.");
    }
    if (!isAllowedWebhook(trimmed)) {
      throw new Error("Use an HTTPS link (Slack, Zapier, Make, webhook.site…).");
    }

    persistDestination(trimmed);
    setDestinationUrl(trimmed);

    const response = await fetch("/api/automation/webhook", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: trimmed,
        event: approved.proposedEvent ?? "monitor_alert",
        pendingActionId: approved.id,
        workspace: getWorkspaceContext(),
        report: approved.reportSnapshot ?? report,
        requirement: approved.monitorRequirement ?? requirement,
        monitorId: approved.monitorId ?? monitorId,
      }),
    });
    const data = await readResponseJson<{ error?: string }>(response);
    if (!response.ok) {
      throw new Error(data.error || "Could not send to your tools.");
    }
  }

  async function rejectAction(target: PendingAction) {
    setBusy(true);
    try {
      const response = await fetch(`/api/pending-actions/${target.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      const data = await readResponseJson<{ action?: PendingAction; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to reject.");
      toast.success("Rejected");
      await loadInbox();
      onResolved?.();
      if (action?.id === target.id) {
        setAction(data.action ?? { ...target, status: "dismissed" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject.");
    } finally {
      setBusy(false);
    }
  }

  async function approveAndSend() {
    if (!action || action.status !== "pending") return;
    setBusy(true);
    try {
      const editedText =
        editing && draftAction.trim() && draftAction.trim() !== action.proposedAction
          ? draftAction.trim()
          : undefined;

      const response = await fetch(`/api/pending-actions/${action.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          ...(editedText ? { proposedAction: editedText } : {}),
        }),
      });
      const data = await readResponseJson<{ action?: PendingAction; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to approve.");

      const approved = data.action ?? {
        ...action,
        status: "approved" as const,
        proposedAction: editedText ?? action.proposedAction,
      };
      setAction(approved);
      setEditing(false);

      try {
        await sendToDestination(approved);
        toast.success("Approved and sent", {
          description: "Your brief was delivered to the link you set.",
        });
        setAction({ ...approved, status: "executed" });
      } catch (executeError) {
        toast.warning("Approved — not sent yet", {
          description:
            executeError instanceof Error
              ? executeError.message
              : "Add Where to send, then tap Send again.",
        });
      }

      await loadInbox();
      onResolved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve.");
    } finally {
      setBusy(false);
    }
  }

  async function sendAgain() {
    if (!action || (action.status !== "approved" && action.status !== "executed")) return;
    setBusy(true);
    try {
      await sendToDestination(action);
      toast.success("Sent", {
        description: "Delivered to the link under Where to send.",
      });
      await loadInbox();
      onResolved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  const pending = inbox.filter((item) => item.status === "pending");
  const approved = inbox.filter((item) => item.status === "approved");
  const hasInbox = pending.length > 0 || approved.length > 0;
  const waiting = action?.status === "pending";
  const canResend = action?.status === "approved" || action?.status === "executed";
  const destinationOk = Boolean(destinationUrl.trim() && isAllowedWebhook(destinationUrl.trim()));
  const destinationMeta = describeWebhookDestination(destinationUrl);
  const activeId = action?.id ?? pendingActionId;

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-white">Approval inbox</p>
          {hasInbox && (
            <span className="text-xs text-white/40">
              {pending.length} waiting · {approved.length} approved
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-white/45">
          Pick an item to review this brief, then approve and send below.
        </p>

        {loading ? (
          <p className="mt-3 text-sm text-white/45">Loading inbox…</p>
        ) : !hasInbox ? (
          <p className="mt-3 text-sm text-white/45">
            Nothing waiting. Run Check now when a monitor finds something — you&apos;ll approve here before anything is sent.
          </p>
        ) : (
          <div className="mt-3 max-h-[min(16rem,40vh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            {[...pending, ...approved].map((item) => {
              const selected = item.id === activeId;
              const headline = actionHeadline(item);
              const risk = item.reportSnapshot?.riskScore;
              const confidence = item.reportSnapshot?.confidence;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "flex cursor-pointer flex-col gap-2 rounded-xl border px-3 py-2.5 transition santra-focus sm:flex-row sm:items-center sm:gap-3",
                    selected
                      ? "border-cyan-300/35 bg-cyan-300/10"
                      : item.status === "pending"
                        ? "border-amber-300/20 bg-black/20 hover:border-amber-300/35"
                        : "border-emerald-300/20 bg-black/20 hover:border-emerald-300/35",
                  )}
                  onClick={() => onSelectAction?.(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectAction?.(item);
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={item.status === "pending" ? "risk" : "success"}
                        className="px-2 py-0.5 text-[10px]"
                      >
                        {item.status === "pending" ? "Waiting for you" : "Approved"}
                      </Badge>
                      {typeof risk === "number" && (
                        <span className="text-[11px] text-rose-100/70">Risk {risk}</span>
                      )}
                      {typeof confidence === "number" && (
                        <span className="text-[11px] text-cyan-100/60">Conf {confidence}</span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-white" title={headline}>
                      {headline}
                    </p>
                    {item.monitorRequirement && (
                      <p className="mt-0.5 truncate text-[11px] text-white/40" title={item.monitorRequirement}>
                        Monitor · {item.monitorRequirement}
                      </p>
                    )}
                  </div>
                  {item.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 shrink-0 px-2.5 text-xs"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        void rejectAction(item);
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/[0.06] via-transparent to-transparent p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">Review & send</p>
              {action && action.status !== "dismissed" && (
                <Badge variant={waiting ? "risk" : "success"} className="px-2 py-0.5 text-[10px]">
                  {waiting ? "Waiting for you" : action.status === "executed" ? "Sent" : "Approved"}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-white/45">
              Read the brief above, then approve before anything goes to your other tools.
            </p>
          </div>
        </div>

        {!action || action.status === "dismissed" ? (
          <p className="text-sm leading-6 text-white/50">
            {action?.status === "dismissed"
              ? "This item was rejected. Nothing was sent."
              : hasInbox
                ? "Select an item above to approve and send."
                : "No approval is linked to this report yet."}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-white/70">Message to send</label>
                {waiting && !editing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={busy}
                    onClick={() => {
                      setDraftAction(action.proposedAction);
                      setEditing(true);
                    }}
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
              {editing ? (
                <Textarea
                  value={draftAction}
                  onChange={(event) => setDraftAction(event.target.value)}
                  className="min-h-[5.5rem] rounded-2xl px-3 py-2 text-sm"
                  placeholder="Rewrite what should be sent…"
                />
              ) : (
                <p className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-6 text-white/75">
                  {action.proposedAction}
                </p>
              )}
              {editing && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      setDraftAction(action.proposedAction);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    disabled={busy}
                    onClick={() => {
                      if (!draftAction.trim()) {
                        toast.error("Message cannot be empty.");
                        return;
                      }
                      setEditing(false);
                    }}
                  >
                    Save draft
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="report-where-to-send" className="text-xs font-medium text-white/70">
                  Where to send
                </label>
                <Badge variant={destinationOk ? "success" : "default"} className="px-2 py-0.5 text-[10px]">
                  {destinationOk ? `Ready · ${destinationMeta.label}` : destinationMeta.label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WEBHOOK_DESTINATION_SUGGESTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] text-cyan-50 transition hover:border-cyan-300/40"
                    title={item.hint}
                    onClick={() => {
                      if (!destinationUrl.trim()) setDestinationUrl(item.examplePlaceholder);
                      window.open(item.docsUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {item.label}
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </button>
                ))}
              </div>
              <Input
                id="report-where-to-send"
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                onBlur={() => persistDestination()}
                placeholder="https://hooks.slack.com/… or Zapier / webhook.site link"
                className="h-11"
                aria-label="Where to send"
              />
              <p className="text-[11px] leading-4 text-white/40">
                Tap a destination for setup docs, then paste the HTTPS webhook. Nothing is sent until you approve.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {waiting ? (
                <>
                  <Button size="sm" disabled={busy} onClick={() => void approveAndSend()}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {busy ? "Sending…" : "Approve & send"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void rejectAction(action)}>
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </>
              ) : canResend ? (
                <Button size="sm" disabled={busy} onClick={() => void sendAgain()}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {busy ? "Sending…" : "Send again"}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
