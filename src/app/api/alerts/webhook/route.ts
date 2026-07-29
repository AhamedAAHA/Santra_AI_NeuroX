import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getPendingAction } from "@/lib/db/pending-actions";
import { isMongoConfigured } from "@/lib/mongo/config";
import { getServerPendingAction } from "@/lib/pending-actions-server";
import { deliverAlertWebhook } from "@/lib/webhooks/delivery";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

export const runtime = "nodejs";

/** Alert webhooks require an approved pending action — same HITL gate as automation. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    webhookUrl?: string;
    report?: ExecutiveIntelligenceReport;
    pendingActionId?: string;
  } | null;

  const pendingActionId = body?.pendingActionId?.trim();
  if (!pendingActionId) {
    return NextResponse.json(
      {
        error:
          "Human approval required. Approve an action in the Approval inbox, then send with pendingActionId.",
      },
      { status: 400 },
    );
  }

  if (!body?.webhookUrl) {
    return NextResponse.json({ error: "A valid HTTPS webhook URL is required." }, { status: 400 });
  }

  const useMongo = isMongoConfigured();
  let report = body.report;

  if (useMongo) {
    try {
      const pending = await getPendingAction(auth.user.id, pendingActionId);
      if (!pending) {
        return NextResponse.json({ error: "Pending action not found." }, { status: 404 });
      }
      if (pending.status !== "approved") {
        return NextResponse.json(
          { error: "Action must be approved before alert webhook delivery." },
          { status: 403 },
        );
      }
      report = report ?? pending.reportSnapshot;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to verify approval." },
        { status: 500 },
      );
    }
  } else {
    const serverAction = getServerPendingAction(auth.user.id, pendingActionId);
    if (!serverAction) {
      return NextResponse.json({ error: "Pending action not found." }, { status: 404 });
    }
    if (serverAction.status !== "approved") {
      return NextResponse.json(
        { error: "Action must be approved before alert webhook delivery." },
        { status: 403 },
      );
    }
    report = report ?? serverAction.reportSnapshot;
  }

  if (!report) {
    return NextResponse.json({ error: "Report payload is required." }, { status: 400 });
  }

  try {
    await deliverAlertWebhook(body.webhookUrl, report);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook delivery failed." },
      { status: error instanceof Error && error.message.includes("valid HTTPS") ? 400 : 502 },
    );
  }
}
