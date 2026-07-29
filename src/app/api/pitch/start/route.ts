import { NextResponse } from "next/server";
import { recordPitchStart } from "@/lib/pitch/sessions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      role?: string;
      source?: string;
    } | null;

    const name = body?.name?.trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name (at least 2 characters)." }, { status: 400 });
    }

    const entry = await recordPitchStart({
      name,
      role: body?.role,
      source: body?.source,
    });

    return NextResponse.json({ ok: true, session: entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record start." },
      { status: 500 },
    );
  }
}
