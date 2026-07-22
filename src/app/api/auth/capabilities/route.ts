import { NextResponse } from "next/server";
import { allowDemoAuthFallback } from "@/lib/demo/runtime";
import { getAppOrigin, getOAuthCallbackUrl, getOAuthProvidersStatus } from "@/lib/auth/oauth-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_CAPABILITIES = {
  database: "none" as const,
  providers: { email: false, google: false, github: false },
  workspaceReady: false,
  demoAuthAllowed: allowDemoAuthFallback(),
};

export async function GET() {
  const demoAuthAllowed = allowDemoAuthFallback();

  try {
    const { isMongoConfigured, mongoConnectionHint } = await import("@/lib/mongo/config");

    if (!isMongoConfigured()) {
      return NextResponse.json(
        { ...FALLBACK_CAPABILITIES, demoAuthAllowed },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    let workspaceReady = false;
    let workspaceError: string | undefined;

    try {
      const { ensureMongoReady, getDb } = await import("@/lib/mongo/client");
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
        providers: {
          email: true,
          google: getOAuthProvidersStatus().google,
          github: getOAuthProvidersStatus().github,
        },
        oauthCallbacks: {
          github: getOAuthCallbackUrl("github"),
          google: getOAuthCallbackUrl("google"),
          appOrigin: getAppOrigin(),
        },
        workspaceReady,
        workspaceError,
        demoAuthAllowed,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[auth/capabilities]", error);
    return NextResponse.json(
      {
        ...FALLBACK_CAPABILITIES,
        demoAuthAllowed,
        workspaceError: "Workspace check failed on this host. Use demo sign-in if enabled.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
