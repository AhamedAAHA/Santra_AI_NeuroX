import { randomUUID } from "crypto";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import { isMongoConfigured } from "@/lib/mongo/config";

export type PitchRole = "judge" | "audience" | "other";

export type PitchStart = {
  id: string;
  name: string;
  role: PitchRole;
  source: string;
  startedAt: string;
};

export type PitchReview = {
  id: string;
  sessionId: string;
  name: string;
  role: PitchRole;
  rating: number;
  comment: string;
  favorite?: string;
  createdAt: string;
};

type MemoryStore = {
  starts: PitchStart[];
  reviews: PitchReview[];
};

declare global {
  var __santraPitchSessions: MemoryStore | undefined;
}

function memoryStore(): MemoryStore {
  if (!global.__santraPitchSessions) {
    global.__santraPitchSessions = { starts: [], reviews: [] };
  }
  return global.__santraPitchSessions;
}

function normalizeRole(raw: unknown): PitchRole {
  if (raw === "judge" || raw === "audience" || raw === "other") return raw;
  return "audience";
}

export async function recordPitchStart(input: {
  name: string;
  role?: string;
  source?: string;
}): Promise<PitchStart> {
  const entry: PitchStart = {
    id: randomUUID(),
    name: input.name.trim().slice(0, 80) || "Anonymous",
    role: normalizeRole(input.role),
    source: (input.source || "pitch").trim().slice(0, 64) || "pitch",
    startedAt: new Date().toISOString(),
  };

  memoryStore().starts.unshift(entry);
  memoryStore().starts = memoryStore().starts.slice(0, 500);

  if (isMongoConfigured()) {
    try {
      await ensureMongoReady();
      const db = await getDb();
      await db.collection("pitch_starts").insertOne({
        id: entry.id,
        name: entry.name,
        role: entry.role,
        source: entry.source,
        started_at: entry.startedAt,
      });
    } catch {
      // Memory store still has the event for this instance.
    }
  }

  return entry;
}

export async function recordPitchReview(input: {
  sessionId: string;
  name: string;
  role?: string;
  rating: number;
  comment: string;
  favorite?: string;
}): Promise<PitchReview> {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const entry: PitchReview = {
    id: randomUUID(),
    sessionId: input.sessionId.trim().slice(0, 80) || "unknown",
    name: input.name.trim().slice(0, 80) || "Anonymous",
    role: normalizeRole(input.role),
    rating,
    comment: input.comment.trim().slice(0, 1000),
    favorite: input.favorite?.trim().slice(0, 120) || undefined,
    createdAt: new Date().toISOString(),
  };

  memoryStore().reviews.unshift(entry);
  memoryStore().reviews = memoryStore().reviews.slice(0, 500);

  if (isMongoConfigured()) {
    try {
      await ensureMongoReady();
      const db = await getDb();
      await db.collection("pitch_reviews").insertOne({
        id: entry.id,
        session_id: entry.sessionId,
        name: entry.name,
        role: entry.role,
        rating: entry.rating,
        comment: entry.comment,
        favorite: entry.favorite ?? null,
        created_at: entry.createdAt,
      });
    } catch {
      // Keep memory copy.
    }
  }

  return entry;
}

export async function listPitchLive(limit = 40): Promise<{
  starts: PitchStart[];
  reviews: PitchReview[];
  startCount: number;
  reviewCount: number;
  avgRating: number | null;
}> {
  const mem = memoryStore();
  let starts = [...mem.starts];
  let reviews = [...mem.reviews];

  if (isMongoConfigured()) {
    try {
      await ensureMongoReady();
      const db = await getDb();
      const [dbStarts, dbReviews] = await Promise.all([
        db
          .collection("pitch_starts")
          .find({})
          .sort({ started_at: -1 })
          .limit(limit)
          .toArray(),
        db
          .collection("pitch_reviews")
          .find({})
          .sort({ created_at: -1 })
          .limit(limit)
          .toArray(),
      ]);

      const mappedStarts: PitchStart[] = dbStarts.map((row) => ({
        id: String(row.id ?? row._id),
        name: String(row.name ?? "Anonymous"),
        role: normalizeRole(row.role),
        source: String(row.source ?? "pitch"),
        startedAt: String(row.started_at ?? new Date().toISOString()),
      }));

      const mappedReviews: PitchReview[] = dbReviews.map((row) => ({
        id: String(row.id ?? row._id),
        sessionId: String(row.session_id ?? ""),
        name: String(row.name ?? "Anonymous"),
        role: normalizeRole(row.role),
        rating: Number(row.rating) || 0,
        comment: String(row.comment ?? ""),
        favorite: row.favorite ? String(row.favorite) : undefined,
        createdAt: String(row.created_at ?? new Date().toISOString()),
      }));

      // Prefer Mongo when available; merge any newer memory-only rows.
      const startIds = new Set(mappedStarts.map((s) => s.id));
      const reviewIds = new Set(mappedReviews.map((r) => r.id));
      starts = [
        ...mem.starts.filter((s) => !startIds.has(s.id)),
        ...mappedStarts,
      ].slice(0, limit);
      reviews = [
        ...mem.reviews.filter((r) => !reviewIds.has(r.id)),
        ...mappedReviews,
      ].slice(0, limit);
    } catch {
      // Use memory only.
    }
  }

  const ratings = reviews.map((r) => r.rating).filter((n) => n > 0);
  const avgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return {
    starts,
    reviews,
    startCount: starts.length,
    reviewCount: reviews.length,
    avgRating,
  };
}
