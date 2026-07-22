import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { createChatThread, listChatThreads } from "@/lib/db/chat";
import { isMongoConfigured } from "@/lib/mongo/config";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) {
    return NextResponse.json({ threads: [] });
  }

  const threads = await listChatThreads(auth.user.id);
  return NextResponse.json({ threads });
}

export async function POST() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isMongoConfigured()) {
    return NextResponse.json({ thread: null, localMode: true });
  }

  const thread = await createChatThread(auth.user.id);
  return NextResponse.json({ thread });
}
