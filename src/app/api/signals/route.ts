import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getLatestBriefing, getLatestSignals, getSignalsForRun } from "@/lib/db/intelligence";
import { isMongoConfigured } from "@/lib/mongo/config";
import { signalStream } from "@/data/mock-intelligence";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    if (!isMongoConfigured()) {
      return NextResponse.json(
        { signals: signalStream, source: "sample", generatedAt: new Date().toISOString() },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const userId = auth.user.id;
    const briefing = await getLatestBriefing(userId);
    const monitorSignals = await getLatestSignals(userId, 50);

    if (monitorSignals.length) {
      return NextResponse.json(
        {
          signals: monitorSignals,
          source: monitorSignals.some((s) => s.source.includes("bright") || s.source.includes("http"))
            ? "live"
            : "monitor",
          generatedAt: new Date().toISOString(),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!briefing) {
      return NextResponse.json(
        { signals: signalStream, source: "sample", generatedAt: new Date().toISOString() },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const signals = await getSignalsForRun(userId, String(briefing.id));
    const source = briefing.provider === "openai" ? "live" : "sample";

    return NextResponse.json(
      {
        signals: signals.length ? signals : signalStream,
        source,
        generatedAt: briefing.created_at,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Signals route failed", error);
    return NextResponse.json(
      { signals: signalStream, source: "sample", generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
