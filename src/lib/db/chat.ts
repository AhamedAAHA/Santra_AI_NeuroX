import { randomUUID } from "crypto";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type { ChatMessage, ChatProvider } from "@/types/intelligence";

export async function listChatThreads(userId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("chat_threads")
    .find({ user_id: userId }, { projection: { id: 1, title: 1, updated_at: 1 } })
    .sort({ updated_at: -1 })
    .limit(30)
    .toArray();
  return rows;
}

export async function createChatThread(userId: string, title = "New conversation") {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const thread = { id: randomUUID(), user_id: userId, title, created_at: now, updated_at: now };
  await db.collection("chat_threads").insertOne(thread);
  return { id: thread.id, title: thread.title, updated_at: thread.updated_at };
}

export async function getThreadMessages(userId: string, threadId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("chat_messages")
    .find({ thread_id: threadId, user_id: userId })
    .sort({ created_at: 1 })
    .toArray();

  return rows.map(
    (row): ChatMessage => ({
      id: String(row.id),
      role: row.role as ChatMessage["role"],
      content: String(row.content),
      createdAt: String(row.created_at),
      provider: (row.provider as ChatProvider | null) ?? undefined,
    }),
  );
}

export async function appendChatMessage(
  userId: string,
  threadId: string,
  message: { role: "user" | "assistant"; content: string; provider?: ChatProvider },
) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    thread_id: threadId,
    user_id: userId,
    role: message.role,
    content: message.content,
    provider: message.provider ?? null,
    created_at: now,
  };
  await db.collection("chat_messages").insertOne(row);

  const threadUpdate: Record<string, string> = { updated_at: now };
  if (message.role === "user" && message.content.length > 0) {
    threadUpdate.title = message.content.slice(0, 60);
  }
  await db.collection("chat_threads").updateOne({ id: threadId, user_id: userId }, { $set: threadUpdate });

  return {
    id: row.id,
    role: row.role as ChatMessage["role"],
    content: row.content,
    createdAt: row.created_at,
    provider: (row.provider as ChatProvider | null) ?? undefined,
  };
}
