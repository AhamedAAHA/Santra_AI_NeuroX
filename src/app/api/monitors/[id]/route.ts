import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { deleteMonitor, updateMonitor, updateMonitorActive } from "@/lib/db/monitors";
import { isMongoConfigured } from "@/lib/mongo/config";
import type { Severity } from "@/types/intelligence";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      active?: boolean;
      requirement?: string;
      category?: string;
      minimumSeverity?: Severity;
      keywords?: string[];
      targetUrl?: string | null;
      searchQuery?: string | null;
      plainSummary?: string | null;
    };

    const hasActiveOnly =
      typeof body.active === "boolean" &&
      body.requirement === undefined &&
      body.category === undefined &&
      body.minimumSeverity === undefined &&
      body.keywords === undefined &&
      body.targetUrl === undefined &&
      body.searchQuery === undefined &&
      body.plainSummary === undefined;

    if (hasActiveOnly) {
      if (isMongoConfigured()) {
        await updateMonitorActive(auth.user.id, id, body.active!);
      }
      return NextResponse.json({ ok: true, active: body.active });
    }

    const requirement = body.requirement?.trim();
    if (requirement !== undefined && !requirement) {
      return NextResponse.json({ error: "Requirement cannot be empty." }, { status: 400 });
    }

    if (
      requirement === undefined &&
      body.category === undefined &&
      body.minimumSeverity === undefined &&
      body.keywords === undefined &&
      body.targetUrl === undefined &&
      body.searchQuery === undefined &&
      body.plainSummary === undefined &&
      typeof body.active !== "boolean"
    ) {
      return NextResponse.json({ error: "No monitor fields to update." }, { status: 400 });
    }

    if (isMongoConfigured()) {
      const updated = await updateMonitor(auth.user.id, id, {
        requirement,
        category: body.category,
        minimum_severity: body.minimumSeverity,
        keywords: body.keywords,
        target_url: body.targetUrl,
        active: body.active,
        search_query: body.searchQuery,
        plain_summary: body.plainSummary,
      });
      if (!updated) {
        return NextResponse.json({ error: "Monitor not found." }, { status: 404 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update monitor." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (isMongoConfigured()) {
    await deleteMonitor(auth.user.id, id);
  }
  return NextResponse.json({ ok: true });
}
