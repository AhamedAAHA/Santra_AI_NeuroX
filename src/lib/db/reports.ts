import { ensureMongoReady, getDb } from "@/lib/mongo/client";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

export type DbIntelligenceReport = {
  id: string;
  monitor_id: string | null;
  title: string;
  risk_score: number;
  confidence: number;
  hallucination_risk: ExecutiveIntelligenceReport["hallucinationRisk"];
  provider: ExecutiveIntelligenceReport["provider"];
  report: ExecutiveIntelligenceReport;
  created_at: string;
};

export async function saveIntelligenceReport(
  userId: string,
  report: ExecutiveIntelligenceReport,
  monitorId?: string,
) {
  await ensureMongoReady();
  const db = await getDb();
  const now = new Date().toISOString();
  const row = {
    id: report.id,
    user_id: userId,
    monitor_id: monitorId ?? null,
    title: report.verdict,
    risk_score: report.riskScore,
    confidence: report.confidence,
    hallucination_risk: report.hallucinationRisk,
    provider: report.provider,
    report,
    created_at: now,
  };
  await db.collection("intelligence_reports").insertOne(row);
  const { user_id: _, ...result } = row;
  return result as DbIntelligenceReport;
}

export async function listIntelligenceReports(userId: string) {
  await ensureMongoReady();
  const db = await getDb();
  const rows = await db
    .collection<DbIntelligenceReport & { user_id: string }>("intelligence_reports")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();
  return rows.map(({ user_id: _, ...report }) => report);
}
