import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getPendingAction, resolvePendingAction } from "@/lib/db/pending-actions";
import { isMongoConfigured } from "@/lib/mongo/config";
import {
  deliverAutomationWebhook,
  resolveAutomationWebhookUrl,
  type AutomationWebhookEvent,
} from "@/lib/webhooks/delivery";
import {
  getServerPendingAction,
  updateServerPendingAction,
} from "@/lib/pending-actions-server";
import type { WorkspaceContext } from "@/lib/gtm/workspace-context";
import type { ExecutiveIntelligenceReport, IntelligenceAnalysis } from "@/types/intelligence";

export const runtime = "nodejs";

/** CRM export and workflow automation — requires an approved pending action (HITL gate). */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    webhookUrl?: string;
    event?: AutomationWebhookEvent;
    workspace?: WorkspaceContext;
    report?: ExecutiveIntelligenceReport;
    analysis?: IntelligenceAnalysis;
    requirement?: string;
    monitorId?: string;
    pendingActionId?: string;
  } | null;

  const pendingActionId = body?.pendingActionId?.trim();
  if (!pendingActionId) {
    return NextResponse.json(
      {
        error:
          "Human approval required. Approve an action in the queue, then execute with pendingActionId.",
      },
      { status: 400 },
    );
  }

  const webhookUrl = resolveAutomationWebhookUrl(body?.webhookUrl);
  if (!webhookUrl) {
    return NextResponse.json(
      {
        error:
          "Provide an automation webhook URL or set SENTRA_AUTOMATION_WEBHOOK_URL (or TRIGGERWARE_WEBHOOK_URL).",
      },
      { status: 400 },
    );
  }

  const report = body?.report ?? undefined;
  const useMongo = isMongoConfigured();
  const serverAction = !useMongo ? getServerPendingAction(auth.user.id, pendingActionId) : null;
  let resolvedReport = report ?? serverAction?.reportSnapshot;
  let monitorRequirement = body?.requirement ?? serverAction?.monitorRequirement;
  let monitorId = body?.monitorId ?? serverAction?.monitorId;

  if (useMongo) {
    try {
      const pending = await getPendingAction(auth.user.id, pendingActionId);
      if (!pending) {
        return NextResponse.json({ error: "Pending action not found." }, { status: 404 });
      }
      if (pending.status !== "approved") {
        return NextResponse.json(
          { error: "Action must be approved before webhook delivery." },
          { status: 403 },
        );
      }
      resolvedReport = resolvedReport ?? pending.reportSnapshot;
      monitorRequirement = monitorRequirement ?? pending.monitorRequirement;
      monitorId = monitorId ?? pending.monitorId;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to verify approval." },
        { status: 500 },
      );
    }
  } else {
    if (!serverAction) {
      return NextResponse.json({ error: "Pending action not found." }, { status: 404 });
    }
    if (serverAction.status !== "approved") {
      return NextResponse.json(
        { error: "Action must be approved before webhook delivery." },
        { status: 403 },
      );
    }
  }

  try {
    const payload = await deliverAutomationWebhook({
      webhookUrl,
      event: body?.event,
      workspace: body?.workspace,
      report: resolvedReport,
      analysis: body?.analysis,
      requirement: monitorRequirement,
      monitorId,
    });

    if (useMongo) {
      await resolvePendingAction(auth.user.id, pendingActionId, "executed");
    } else {
      updateServerPendingAction(auth.user.id, pendingActionId, "executed");
    }

    return NextResponse.json({ ok: true, payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Automation webhook delivery failed." },
      { status: error instanceof Error && error.message.includes("valid HTTPS") ? 400 : 502 },
    );
  }
}
