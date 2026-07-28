import { buildCrmExportPayload } from "@/lib/gtm/crm-payload";
import type { WorkspaceContext } from "@/lib/gtm/workspace-context";
import { postJsonWebhook } from "@/lib/http/outbound-fetch";
import { isAllowedWebhook } from "@/lib/webhooks";
import {
  formatAlertWebhookPayload,
  formatAutomationWebhookPayload,
} from "@/lib/webhooks/format";
import type { ExecutiveIntelligenceReport, IntelligenceAnalysis } from "@/types/intelligence";

export type AutomationWebhookEvent = "crm_export" | "monitor_alert";

export function resolveAutomationWebhookUrl(requested?: string) {
  return (
    requested?.trim() ||
    process.env.SANTRA_AUTOMATION_WEBHOOK_URL?.trim() ||
    process.env.SENTRA_AUTOMATION_WEBHOOK_URL?.trim() ||
    process.env.TRIGGERWARE_WEBHOOK_URL?.trim() ||
    ""
  );
}

export async function deliverAlertWebhook(webhookUrl: string, report: ExecutiveIntelligenceReport) {
  if (!isAllowedWebhook(webhookUrl)) {
    throw new Error("A valid HTTPS webhook URL is required.");
  }

  const { destination, body } = formatAlertWebhookPayload(webhookUrl, report);

  const response = await postJsonWebhook(webhookUrl, body, {
    "X-SANTRA-Event": "monitor_alert",
    "X-SANTRA-Destination": destination,
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}.`);
  }

  return body;
}

export async function deliverAutomationWebhook(options: {
  webhookUrl: string;
  event?: AutomationWebhookEvent;
  workspace?: WorkspaceContext;
  report?: ExecutiveIntelligenceReport;
  analysis?: IntelligenceAnalysis;
  requirement?: string;
  monitorId?: string;
  approvedAction?: string;
}) {
  const webhookUrl = options.webhookUrl.trim();
  if (!webhookUrl || !isAllowedWebhook(webhookUrl)) {
    throw new Error("A valid HTTPS CRM or automation webhook URL is required.");
  }

  const event = options.event ?? "monitor_alert";
  const crm = buildCrmExportPayload({
    workspace: options.workspace,
    report: options.report,
    analysis: options.analysis,
    requirement: options.requirement,
  });

  const { destination, body } = formatAutomationWebhookPayload({
    webhookUrl,
    event,
    crm,
    monitorId: options.monitorId,
    approvedAction: options.approvedAction,
    report: options.report,
    automation: {
      source: "santra-ai",
      action: event === "crm_export" ? "crm_export" : "gtm_monitor_trigger",
      description:
        event === "crm_export"
          ? "Structured GTM intel exported from SANTRA"
          : "SANTRA GTM monitor matched - run downstream workflow",
    },
  });

  const response = await postJsonWebhook(webhookUrl, body, {
    "X-SANTRA-Event": event,
    "X-SANTRA-Destination": destination,
    "X-TriggerWare-Source": "santra-ai",
  });

  if (!response.ok) {
    throw new Error(`Automation webhook returned ${response.status}.`);
  }

  return body;
}
