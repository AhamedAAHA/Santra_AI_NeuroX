import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ ok: true, verified: true });
}
