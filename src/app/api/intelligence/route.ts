import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getLatestBriefing, saveIntelligenceRun } from "@/lib/db/intelligence";
import { isMongoConfigured } from "@/lib/mongo/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { enrichQueryWithWorkspace, type WorkspaceContext } from "@/lib/gtm/workspace-context";
import { runGtmAgentCollection } from "@/services/gtm-agent";
import { generateEnterpriseAnalysis } from "@/services/openai";

export const runtime = "nodejs";

async function runIntelligence(query: string, workspace?: WorkspaceContext | null) {
  const enrichedQuery = enrichQueryWithWorkspace(query, workspace);
  const collection = await runGtmAgentCollection({ searchQuery: enrichedQuery });
  const analysis = await generateEnterpriseAnalysis(enrichedQuery, collection.evidence, workspace);
  return {
    provider: collection.provider,
    analysis,
    cacheHit: false,
    agentStages: collection.stages,
    evidencePreview: collection.evidence.slice(0, 2000),
  };
}

export async function POST(request: Request) {
  try {
    await ensurePlatformSecrets();
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const limited = await checkRateLimit(auth.user.id, "intelligence").catch((rateError) => {
      console.warn("Intelligence rate limit skipped", rateError);
      return { allowed: true as const };
    });
    if (!limited.allowed) {
      return NextResponse.json({ error: limited.message }, { status: 429 });
    }

    const body = (await request.json()) as { query?: string; workspace?: WorkspaceContext };
    const query =
      body.query?.trim() ||
      "Summarize competitive intelligence and GTM risks for my B2B workspace";
    const result = await runIntelligence(query, body.workspace);

    if (isMongoConfigured()) {
      try {
        await saveIntelligenceRun(auth.user.id, {
          query,
          provider: result.provider === "bright-data" || result.provider === "exa" ? "bright-data" : "demo",
          evidencePreview: result.evidencePreview || result.analysis.summary,
          analysis: result.analysis,
        });
      } catch (error) {
        console.warn("Intelligence persistence skipped", error);
      }
    }

    return NextResponse.json({
      provider: result.provider,
      analysis: result.analysis,
      cacheHit: result.cacheHit,
      agentStages: result.agentStages,
    });
  } catch (error) {
    console.error("Intelligence route failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate intelligence" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    if (isMongoConfigured()) {
      const briefing = await getLatestBriefing(auth.user.id);
      if (briefing) {
        return NextResponse.json({
          provider: briefing.provider,
          analysis: briefing.analysis,
          cached: true,
        });
      }
    }

    return NextResponse.json({ analysis: null, cached: false });
  } catch (error) {
    console.error("Intelligence GET failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate intelligence" },
      { status: 500 },
    );
  }
}
