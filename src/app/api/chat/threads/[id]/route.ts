import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getThreadMessages } from "@/lib/db/chat";
import { isMongoConfigured } from "@/lib/mongo/config";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  const { id } = await context.params;
  const messages = await getThreadMessages(auth.user.id, id);
  return NextResponse.json({ messages });
}
