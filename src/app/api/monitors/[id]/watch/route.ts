import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";
import {
  getMonitor,
  isAllowedWatchInterval,
  pickWatchState,
  startMonitorWatch,
  stopMonitorWatch,
  WATCH_INTERVAL_OPTIONS_MS,
} from "@/lib/db/monitors";
import { isMongoConfigured } from "@/lib/mongo/config";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function mongoRequiredResponse() {
  return NextResponse.json(
    {
      error: "MongoDB is required for background email watch.",
      hint: "Configure MONGODB_URI, then start watching from the report again.",
    },
    { status: 503 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) return mongoRequiredResponse();

  const { id } = await context.params;
  const monitor = await getMonitor(auth.user.id, id);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found." }, { status: 404 });
  }

  const user = await findUserById(auth.user.id);

  return NextResponse.json({
    watch: pickWatchState(monitor),
    email: user?.email ?? auth.user.email ?? null,
    allowedIntervalsMs: [...WATCH_INTERVAL_OPTIONS_MS],
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) return mongoRequiredResponse();

  const { id } = await context.params;
  const monitor = await getMonitor(auth.user.id, id);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { intervalMs?: number } | null;
  if (!isAllowedWatchInterval(body?.intervalMs)) {
    return NextResponse.json(
      {
        error: "Invalid watch interval.",
        allowedIntervalsMs: [...WATCH_INTERVAL_OPTIONS_MS],
      },
      { status: 400 },
    );
  }

  const ok = await startMonitorWatch(auth.user.id, id, body.intervalMs);
  if (!ok) {
    return NextResponse.json({ error: "Monitor not found." }, { status: 404 });
  }

  const updated = await getMonitor(auth.user.id, id);
  const user = await findUserById(auth.user.id);

  return NextResponse.json({
    watch: pickWatchState(updated),
    email: user?.email ?? auth.user.email ?? null,
    message: "Background email watch started.",
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) return mongoRequiredResponse();

  const { id } = await context.params;
  const monitor = await getMonitor(auth.user.id, id);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found." }, { status: 404 });
  }

  await stopMonitorWatch(auth.user.id, id);
  const updated = await getMonitor(auth.user.id, id);

  return NextResponse.json({
    watch: pickWatchState(updated),
    message: "Background email watch stopped.",
  });
}
