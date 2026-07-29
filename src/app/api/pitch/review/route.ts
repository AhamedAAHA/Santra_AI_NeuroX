import { NextResponse } from "next/server";
import { recordPitchReview } from "@/lib/pitch/sessions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
      name?: string;
      role?: string;
      rating?: number;
      comment?: string;
      favorite?: string;
    } | null;

    const rating = Number(body?.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
    }

    const comment = body?.comment?.trim() ?? "";
    if (comment.length < 3) {
      return NextResponse.json({ error: "Please write a short review." }, { status: 400 });
    }

    const entry = await recordPitchReview({
      sessionId: body?.sessionId ?? "unknown",
      name: body?.name?.trim() || "Anonymous",
      role: body?.role,
      rating,
      comment,
      favorite: body?.favorite,
    });

    return NextResponse.json({ ok: true, review: entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save review." },
      { status: 500 },
    );
  }
}
