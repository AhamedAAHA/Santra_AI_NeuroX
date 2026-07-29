import { NextResponse } from "next/server";
import { listPitchLive } from "@/lib/pitch/sessions";

export const runtime = "nodejs";

export async function GET() {
  try {
    const live = await listPitchLive(50);
    return NextResponse.json({
      ok: true,
      ...live,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load live board." },
      { status: 500 },
    );
  }
}
