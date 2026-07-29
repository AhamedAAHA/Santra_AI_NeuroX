import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensurePlatformSecrets, getPlatformEnv } from "@/lib/secrets/platform-secrets";
import { buildSpeechmaticsRtWsUrl } from "@/lib/voice/speechmatics-rt-url";

export const runtime = "nodejs";

const JWT_TTL_SECONDS = 600;

export async function POST() {
  try {
    await ensurePlatformSecrets();
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const limited = await checkRateLimit(auth.user.id, "voice");
    if (!limited.allowed) {
      return NextResponse.json({ error: limited.message }, { status: 429 });
    }

    const apiKey = getPlatformEnv("SPEECHMATICS_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Add SPEECHMATICS_API_KEY to enable live call transcription." },
        { status: 503 },
      );
    }

    const response = await fetch("https://mp.speechmatics.com/v1/api_keys?type=rt", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl: JWT_TTL_SECONDS }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => undefined);
      console.error("Speechmatics RT JWT failed", response.status, details);
      return NextResponse.json(
        { error: "Unable to mint Speechmatics realtime token." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as { key_value?: string };
    const jwt = payload.key_value?.trim();
    if (!jwt) {
      return NextResponse.json({ error: "Speechmatics returned an empty token." }, { status: 502 });
    }

    const wsUrl = buildSpeechmaticsRtWsUrl(jwt, process.env.SPEECHMATICS_RT_URL);

    return NextResponse.json({
      jwt,
      ttlSeconds: JWT_TTL_SECONDS,
      expiresAt: Date.now() + JWT_TTL_SECONDS * 1000,
      wsUrl,
    });
  } catch (error) {
    console.error("RT token route failed", error);
    const message =
      error instanceof Error && /mongo|timeout|server selection/i.test(error.message)
        ? "Database timed out while starting the live call. Retry in a moment."
        : "Unable to mint realtime token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
