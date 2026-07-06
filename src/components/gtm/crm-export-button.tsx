"use client";

import { useEffect, useState } from "react";
import { Send, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWorkspaceContext } from "@/lib/gtm/workspace-context";
import { getAutomationWebhookUrl, saveAutomationWebhookUrl } from "@/lib/webhooks";
import { readResponseJson } from "@/lib/http/read-response-json";
import type { ExecutiveIntelligenceReport, IntelligenceAnalysis } from "@/types/intelligence";
import type { PendingAction } from "@/types/pending-actions";

type AutomationWebhookPanelProps = {
  report?: ExecutiveIntelligenceReport;
  analysis?: IntelligenceAnalysis;
  requirement?: string;
  monitorId?: string;
  pendingActionId?: string;
};

export function AutomationWebhookPanel({
  report,
  analysis,
  requirement,
  monitorId,
  pendingActionId,
}: AutomationWebhookPanelProps) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [exporting, setExporting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [approvedActionId, setApprovedActionId] = useState(pendingActionId ?? "");

  useEffect(() => {
    const timeout = window.setTimeout(() => setWebhookUrl(getAutomationWebhookUrl()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (pendingActionId) setApprovedActionId(pendingActionId);
  }, [pendingActionId]);

  useEffect(() => {
    if (approvedActionId || !report) return;
    void (async () => {
      try {
        const response = await fetch("/api/pending-actions", { credentials: "include" });
        const data = await readResponseJson<{ actions?: PendingAction[] }>(response);
        const match = (data.actions ?? []).find(
          (action) =>
            action.status === "approved" &&
            (action.reportId === report.id || action.monitorId === monitorId),
        );
        if (match) setApprovedActionId(match.id);
      } catch {
        // optional lookup
      }
    })();
  }, [approvedActionId, report, monitorId]);

  function persistUrl() {
    saveAutomationWebhookUrl(webhookUrl);
  }

  async function postAutomation(event: "crm_export" | "monitor_alert") {
    const trimmed = webhookUrl.trim();
    if (!trimmed) {
      toast.error("Add a CRM or automation webhook URL first.", {
        description: "HubSpot middleware, Zapier, Make, TriggerWare, or any HTTPS webhook.",
      });
      return;
    }

    const actionId = approvedActionId.trim();
    if (!actionId) {
      toast.error("Approve this action in the queue before executing.", {
        description: "Human-in-the-loop: SANTRA never fires automation without approval.",
      });
      return;
    }

    const response = await fetch("/api/automation/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: trimmed,
        event,
        pendingActionId: actionId,
        workspace: getWorkspaceContext(),
        report,
        analysis,
        requirement,
        monitorId,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Automation webhook delivery failed.");

    persistUrl();
  }

  async function exportToCrm() {
    setExporting(true);
    try {
      await postAutomation("crm_export");
      toast.success("Exported to CRM webhook", {
        description: "Structured account intel payload delivered after approval.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CRM export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function triggerWorkflow() {
    setTriggering(true);
    try {
      await postAutomation("monitor_alert");
      toast.success("Workflow triggered", {
        description: "SANTRA forwarded this approved GTM event to your automation webhook.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Automation trigger failed.");
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-white/45">
        Automation is gated by human approval. Approve in the Action Queue, then execute here.
      </p>
      <Input
        value={approvedActionId}
        onChange={(event) => setApprovedActionId(event.target.value)}
        placeholder="Approved action ID (auto-filled when available)"
        className="h-10"
        aria-label="Approved pending action ID"
      />
      <Input
        value={webhookUrl}
        onChange={(event) => setWebhookUrl(event.target.value)}
        onBlur={persistUrl}
        placeholder="CRM / automation webhook (HubSpot, Zapier, TriggerWare…)"
        className="h-10"
        aria-label="CRM and automation webhook URL"
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" disabled={exporting} onClick={() => void exportToCrm()}>
          <Send className="h-4 w-4" />
          {exporting ? "Exporting…" : "Export to CRM"}
        </Button>
        <Button variant="ghost" size="sm" disabled={triggering} onClick={() => void triggerWorkflow()}>
          <Workflow className="h-4 w-4" />
          {triggering ? "Triggering…" : "Trigger workflow"}
        </Button>
      </div>
    </div>
  );
}
