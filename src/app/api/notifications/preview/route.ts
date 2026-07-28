import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { formatWatchAlertEmail } from "@/lib/notifications/format-watch";
import { SAMPLE_REPORT } from "@/lib/reports/sample-report";

export const runtime = "nodejs";

/** Dev/preview helper: returns the redesigned watch alert HTML without sending. */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "html";

  const formatted = formatWatchAlertEmail({
    report: SAMPLE_REPORT,
    requirement: SAMPLE_REPORT.monitorRequirement,
    matchedCount: SAMPLE_REPORT.detectedChanges?.length ?? 3,
    changeCount: SAMPLE_REPORT.detectedChanges?.length ?? 3,
  });

  if (format === "json") {
    return NextResponse.json({
      subject: formatted.subject,
      text: formatted.text,
      html: formatted.html,
    });
  }

  if (format === "text") {
    return new NextResponse(formatted.text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(formatted.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
