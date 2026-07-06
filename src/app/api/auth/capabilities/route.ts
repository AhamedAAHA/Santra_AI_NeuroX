import { NextResponse } from "next/server";
import { isMongoConfigured, mongoConnectionHint } from "@/lib/mongo/config";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({
      database: "none",
      providers: { email: false, google: false, github: false },
      workspaceReady: false,
    });
  }

  let workspaceReady = false;
  let workspaceError: string | undefined;
  try {
    await ensureMongoReady();
    const db = await getDb();
    await db.command({ ping: 1 });
    workspaceReady = true;
  } catch (error) {
    workspaceReady = false;
    workspaceError = mongoConnectionHint(error);
  }

  return NextResponse.json(
    {
      database: "mongodb",
      providers: { email: true, google: false, github: false },
      workspaceReady,
      workspaceError,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
