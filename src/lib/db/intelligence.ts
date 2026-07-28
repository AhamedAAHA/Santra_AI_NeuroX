import { randomUUID } from "crypto";
import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type { IntelligenceAnalysis, IntelligenceSignal } from "@/types/intelligence";

export async function saveIntelligenceRun(
  userId: string,
  input: {
    query: string;
    provider: "bright-data" | "openai" | "demo" | "exa";
    evidencePreview: string;
    analysis: IntelligenceAnalysis;
  },
) {
  await ensureMongoReady();
  const db = await getDb();
  const runId = randomUUID();
  const now = new Date().toISOString();

  await db.collection("intelligence_runs").insertOne({
    id: runId,
    user_id: userId,
    query: input.query,
    provider: input.provider,
    evidence_preview: input.evidencePreview.slice(0, 2000),
    analysis: input.analysis,
    created_at: now,
  });

  if (input.analysis.signals.length) {
    await db.collection("signals").insertMany(
      input.analysis.signals.map((signal) => ({
        id: signal.id || randomUUID(),
        run_id: runId,
        user_id: userId,
        title: signal.title,
        source: signal.source,
        summary: signal.summary,
        category: signal.category,
        severity: signal.severity,
        confidence: signal.confidence,
        signal_timestamp: signal.timestamp,
        created_at: now,
      })),
    );
  }

  return runId;
}

export async function getSignalsForRun(userId: string, runId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("signals")
    .find({ run_id: runId, user_id: userId })
    .sort({ created_at: -1 })
    .toArray();

  return rows.map(
    (row): IntelligenceSignal => ({
      id: String(row.id),
      title: String(row.title),
      source: String(row.source),
      summary: String(row.summary),
      category: row.category as IntelligenceSignal["category"],
      severity: row.severity as IntelligenceSignal["severity"],
      confidence: Number(row.confidence),
      timestamp: String(row.signal_timestamp),
    }),
  );
}

export async function getLatestSignals(userId: string, limit = 20) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection("signals")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();

  return rows.map(
    (row): IntelligenceSignal => ({
      id: String(row.id),
      title: String(row.title),
      source: String(row.source),
      summary: String(row.summary),
      category: row.category as IntelligenceSignal["category"],
      severity: row.severity as IntelligenceSignal["severity"],
      confidence: Number(row.confidence),
      timestamp: String(row.signal_timestamp),
    }),
  );
}

export async function getLatestBriefing(userId: string) {
  await ensureMongoReady();
  const db = await getDb();
  return db.collection("intelligence_runs").findOne(
    { user_id: userId },
    { sort: { created_at: -1 }, projection: { id: 1, query: 1, provider: 1, analysis: 1, created_at: 1 } },
  );
}
