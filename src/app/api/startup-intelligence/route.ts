import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { formatInferenceError, isLlmAuthError } from "@/lib/llm/inference";
import { generateStartupIntelligence } from "@/services/startup-intelligence";
import type { StartupIntelligenceRequest } from "@/types/startup-intelligence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensurePlatformSecrets();
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const limited = await checkRateLimit(auth.user.id, "intelligence").catch(() => ({ allowed: true as const }));
    if (!limited.allowed) {
      return NextResponse.json({ error: limited.message }, { status: 429 });
    }

    const body = (await request.json()) as Partial<StartupIntelligenceRequest>;
    const startupIdea = body.startupIdea?.trim();
    const industry = body.industry?.trim();
    const country = body.country?.trim();
    const targetAudience = body.targetAudience?.trim();
    const competitorName = body.competitorName?.trim();

    if (!startupIdea || !industry || !country || !targetAudience) {
      return NextResponse.json(
        { error: "Startup idea, industry, country, and target audience are required." },
        { status: 400 },
      );
    }

    const result = await generateStartupIntelligence({
      startupIdea,
      industry,
      country,
      targetAudience,
      competitorName,
      sriLankaMode: body.sriLankaMode === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Startup intelligence route failed", error);
    const message = formatInferenceError(error);
    const status = isLlmAuthError(error) ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
