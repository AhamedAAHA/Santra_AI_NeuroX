import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { createPendingAction, listPendingActions } from "@/lib/db/pending-actions";
import { isMongoConfigured } from "@/lib/mongo/config";
import {
  createLocalPendingAction,
  loadLocalPendingActions,
} from "@/lib/pending-actions-storage";
import type { PendingActionEvent } from "@/types/pending-actions";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) {
    return NextResponse.json({ actions: loadLocalPendingActions() });
  }

  try {
    const actions = await listPendingActions(auth.user.id);
    return NextResponse.json({ actions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load action queue." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    monitorId?: string;
    reportId?: string;
    proposedAction?: string;
    proposedEvent?: PendingActionEvent;
    monitorRequirement?: string;
    reportSnapshot?: ExecutiveIntelligenceReport;
  };

  const proposedAction = body.proposedAction?.trim();
  if (!proposedAction) {
    return NextResponse.json({ error: "proposedAction is required." }, { status: 400 });
  }

  if (!isMongoConfigured()) {
    const action = createLocalPendingAction({
      monitorId: body.monitorId,
      reportId: body.reportId,
      proposedAction,
      proposedEvent: body.proposedEvent,
      monitorRequirement: body.monitorRequirement,
      reportSnapshot: body.reportSnapshot,
    });
    return NextResponse.json({ action });
  }

  try {
    const action = await createPendingAction(auth.user.id, {
      monitorId: body.monitorId,
      reportId: body.reportId,
      proposedAction,
      proposedEvent: body.proposedEvent,
      monitorRequirement: body.monitorRequirement,
      reportSnapshot: body.reportSnapshot,
    });
    return NextResponse.json({ action });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to queue action." },
      { status: 500 },
    );
  }
}
