import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getPendingAction, resolvePendingAction } from "@/lib/db/pending-actions";
import { isMongoConfigured } from "@/lib/mongo/config";
import {
  getServerPendingAction,
  updateServerPendingAction,
} from "@/lib/pending-actions-server";
import type { PendingActionStatus } from "@/types/pending-actions";

export const runtime = "nodejs";

const allowedStatuses: PendingActionStatus[] = ["approved", "dismissed", "executed"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { status?: PendingActionStatus };

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: "status must be approved, dismissed, or executed." },
      { status: 400 },
    );
  }

  if (!isMongoConfigured()) {
    const existing = getServerPendingAction(auth.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Action not found." }, { status: 404 });
    }
    if (body.status === "approved" && existing.status !== "pending") {
      return NextResponse.json({ error: "Only pending actions can be approved." }, { status: 409 });
    }
    if (body.status === "executed" && existing.status !== "approved") {
      return NextResponse.json({ error: "Only approved actions can be executed." }, { status: 409 });
    }
    const action = updateServerPendingAction(auth.user.id, id, body.status);
    return NextResponse.json({ action });
  }

  try {
    const existing = await getPendingAction(auth.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Action not found." }, { status: 404 });
    }
    if (body.status === "approved" && existing.status !== "pending") {
      return NextResponse.json({ error: "Only pending actions can be approved." }, { status: 409 });
    }
    if (body.status === "executed" && existing.status !== "approved") {
      return NextResponse.json({ error: "Only approved actions can be executed." }, { status: 409 });
    }

    const action = await resolvePendingAction(auth.user.id, id, body.status);
    return NextResponse.json({ action });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update action." },
      { status: 500 },
    );
  }
}
