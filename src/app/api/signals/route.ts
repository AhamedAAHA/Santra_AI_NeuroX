import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getLatestBriefing, getLatestSignals, getSignalsForRun } from "@/lib/db/intelligence";
import { isMongoConfigured } from "@/lib/mongo/config";

export const runtime = "nodejs";

function emptySignalsResponse(generatedAt = new Date().toISOString()) {
  return NextResponse.json(
    { signals: [], source: "empty", generatedAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    if (!isMongoConfigured()) {
      return emptySignalsResponse();
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
      return emptySignalsResponse();
    }

    const signals = await getSignalsForRun(userId, String(briefing.id));
    if (!signals.length) {
      return emptySignalsResponse(briefing.created_at);
    }

    const source = briefing.provider === "openai" ? "live" : "monitor";

    return NextResponse.json(
      {
        signals,
        source,
        generatedAt: briefing.created_at,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Signals route failed", error);
    return emptySignalsResponse();
  }
}
