import { NextResponse } from "next/server";
import { listActiveMonitorsDueForCronWithUsers } from "@/lib/db/monitors";
import { isMongoConfigured } from "@/lib/mongo/config";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { runMonitorCheck } from "@/services/monitor-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CHECK_TIMEOUT_MS = 120_000;
/** Stay under maxDuration so the host cannot kill the run mid-batch. */
const BATCH_BUDGET_MS = 240_000;

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function timeoutAfter(ms: number) {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Monitor check timed out after ${Math.round(ms / 1000)}s`)), ms),
  );
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is required for scheduled monitor checks." }, { status: 503 });
  }

  try {
    await ensurePlatformSecrets();
    const due = await listActiveMonitorsDueForCronWithUsers(6);
    const results: Array<{
      monitorId: string;
      userId: string;
      matchedCount: number;
      provider: string;
      emailSent: boolean;
      emailStatus?: string;
    }> = [];
    const errors: Array<{ monitorId: string; error: string }> = [];
    const skipped: string[] = [];

    const startedAt = Date.now();

    for (const monitor of due) {
      const remaining = BATCH_BUDGET_MS - (Date.now() - startedAt);
      if (remaining < 30_000) {
        skipped.push(monitor.id);
        continue;
      }

      try {
        const result = await Promise.race([
          runMonitorCheck(
            {
              id: monitor.id,
              requirement: monitor.requirement,
              category: monitor.category,
              minimum_severity: monitor.minimum_severity,
              keywords: monitor.keywords,
              target_url: monitor.target_url,
            },
            {
              userId: monitor.user_id,
              persist: true,
            },
          ),
          timeoutAfter(Math.min(CHECK_TIMEOUT_MS, remaining)),
        ]);
        results.push({
          monitorId: monitor.id,
          userId: monitor.user_id,
          matchedCount: result.matchedCount,
          provider: result.provider,
          emailSent: Boolean(result.emailNotification?.sent),
          emailStatus: result.emailNotification?.sent
            ? "sent"
            : result.emailNotification?.reason,
        });
      } catch (error) {
        errors.push({
          monitorId: monitor.id,
          error: error instanceof Error ? error.message : "Monitor check failed",
        });
      }
    }

    if (skipped.length) {
      console.info(`Cron budget reached; ${skipped.length} monitor(s) deferred to the next run.`);
    }

    return NextResponse.json({ checked: results.length, results, errors, skipped });
  } catch (error) {
    console.error("Cron monitor check failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron monitor check failed" },
      { status: 500 },
    );
  }
}
