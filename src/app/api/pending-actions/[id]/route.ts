import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getPendingAction, patchPendingAction } from "@/lib/db/pending-actions";
import { isMongoConfigured } from "@/lib/mongo/config";
import {
  getServerPendingAction,
  patchServerPendingAction,
} from "@/lib/pending-actions-server";
import type { PendingActionStatus } from "@/types/pending-actions";

export const runtime = "nodejs";

const allowedStatuses: PendingActionStatus[] = ["approved", "dismissed", "executed"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: PendingActionStatus;
    proposedAction?: string;
  };

  const hasStatus = Boolean(body.status);
  const hasEdit = typeof body.proposedAction === "string";

  if (!hasStatus && !hasEdit) {
    return NextResponse.json(
      { error: "Provide status and/or proposedAction." },
      { status: 400 },
    );
  }

  if (body.status && !allowedStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: "status must be approved, dismissed, or executed." },
      { status: 400 },
    );
  }

  if (hasEdit && !body.proposedAction?.trim()) {
    return NextResponse.json({ error: "proposedAction cannot be empty." }, { status: 400 });
  }

  function validateTransition(
    currentStatus: PendingActionStatus,
  ): NextResponse | null {
    if (hasEdit && currentStatus !== "pending") {
      return NextResponse.json({ error: "Only pending actions can be edited." }, { status: 409 });
    }
    if (body.status === "approved" && currentStatus !== "pending") {
      return NextResponse.json({ error: "Only pending actions can be approved." }, { status: 409 });
    }
    if (body.status === "executed" && currentStatus !== "approved") {
      return NextResponse.json({ error: "Only approved actions can be executed." }, { status: 409 });
    }
    return null;
  }

  if (!isMongoConfigured()) {
    const existing = getServerPendingAction(auth.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Action not found." }, { status: 404 });
    }
    const invalid = validateTransition(existing.status);
    if (invalid) return invalid;

    const action = patchServerPendingAction(auth.user.id, id, {
      status: body.status,
      proposedAction: hasEdit ? body.proposedAction : undefined,
    });
    if (!action) {
      return NextResponse.json({ error: "Unable to update action." }, { status: 409 });
    }
    return NextResponse.json({ action });
  }

  try {
    const existing = await getPendingAction(auth.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Action not found." }, { status: 404 });
    }
    const invalid = validateTransition(existing.status);
    if (invalid) return invalid;

    const action = await patchPendingAction(auth.user.id, id, {
      status: body.status,
      proposedAction: hasEdit ? body.proposedAction : undefined,
    });
    return NextResponse.json({ action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update action.";
    const status = /not found/i.test(message) ? 404 : /edited|empty/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
