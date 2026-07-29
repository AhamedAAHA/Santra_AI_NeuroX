import {
  buildReliabilityChartData,
  buildSeverityChartData,
  buildWebhookChannelPreview,
  collectCompetitorLabels,
  resolveActionHeadline,
} from "@/lib/gtm/report-headline";
import { coerceTextListItem } from "@/lib/gtm/text-list";
import {
  normalizeClaimStatus,
  type ExecutiveIntelligenceReport,
  type Severity,
} from "@/types/intelligence";

export type SeverityChartRow = { severity: Severity; count: number };
export type ReliabilityChartRow = { name: string; reliability: number };
export type ClaimStats = { backed: number; partial: number; unsupported: number };
export type ChangeRow = {
  id: string;
  text: string;
  meta?: string;
  severity?: Severity;
};
export type RiskTrendPoint = {
  reportId: string;
  generatedAt: string;
  riskScore: number;
  confidence: number;
  label: string;
};

export type ReportViewModel = {
  reportId: string;
  headline: string;
  monitorRequirement: string;
  situation: string;
  impact: string;
    riskScore: number;
  confidence: number;
  importanceScore: number;
  importanceBand: "high" | "medium" | "low";
  hallucinationRisk: ExecutiveIntelligenceReport["hallucinationRisk"];
  provider: ExecutiveIntelligenceReport["provider"];
  generatedAt: string;
  signalCount: number;
  matchedCount: number;
  changeCount: number;
  competitors: string[];
  claimStats: ClaimStats;
  severityData: SeverityChartRow[];
  reliabilityData: ReliabilityChartRow[];
  changes: ChangeRow[];
  actionPlan: string[];
  watchItems: string[];
  evidenceSources: ExecutiveIntelligenceReport["evidenceSources"];
  verifiedClaims: ExecutiveIntelligenceReport["verifiedClaims"];
  channel: ReturnType<typeof buildWebhookChannelPreview>;
};

export function buildClaimStats(report: ExecutiveIntelligenceReport): ClaimStats {
  const stats: ClaimStats = { backed: 0, partial: 0, unsupported: 0 };
  for (const claim of report.verifiedClaims ?? []) {
    const status = normalizeClaimStatus(claim.status);
    if (status === "evidence-backed") stats.backed += 1;
    else if (status === "partial") stats.partial += 1;
    else stats.unsupported += 1;
  }
  return stats;
}

export function buildChangeRows(report: ExecutiveIntelligenceReport): ChangeRow[] {
  if (report.detectedChanges?.length) {
    return report.detectedChanges.map((change) => ({
      id: change.id,
      text: `${change.field}: ${change.oldValue} → ${change.newValue}`,
      meta: `${change.category} · ${change.severity}`,
      severity: change.severity,
    }));
  }

  return (report.observedFacts ?? []).map((fact, index) => ({
    id: `fact-${index}`,
    text: fact,
  }));
}

export function buildReportViewModel(
  report: ExecutiveIntelligenceReport,
  options?: { matchedCount?: number },
): ReportViewModel {
  const changeRows = buildChangeRows(report);
  const changeCount = report.detectedChanges?.length ?? 0;
  const matchedCount = options?.matchedCount ?? Math.max(changeCount, report.observedFacts?.length ?? 0);
  const signalCount = Math.max(changeCount, report.observedFacts?.length ?? 0, report.verifiedClaims?.length ?? 0);

  return {
    reportId: report.id,
    headline: resolveActionHeadline({
      proposedAction: report.verdict,
      monitorRequirement: report.monitorRequirement,
      report,
    }),
    monitorRequirement: report.monitorRequirement,
    situation: report.situation,
    impact: report.impact,
    riskScore: report.riskScore,
    confidence: report.confidence,
    importanceScore: report.importanceScore ?? 0,
    importanceBand: report.importanceBand ?? "low",
    hallucinationRisk: report.hallucinationRisk,
    provider: report.provider,
    generatedAt: report.generatedAt,
    signalCount,
    matchedCount,
    changeCount,
    competitors: collectCompetitorLabels({ report }),
    claimStats: buildClaimStats(report),
    severityData: buildSeverityChartData(report) as SeverityChartRow[],
    reliabilityData: buildReliabilityChartData(report),
    changes: changeRows,
    actionPlan: (report.actionPlan ?? []).map((item) => coerceTextListItem(item)).filter(Boolean),
    watchItems: (report.watchItems ?? []).map((item) => coerceTextListItem(item)).filter(Boolean),
    evidenceSources: report.evidenceSources ?? [],
    verifiedClaims: report.verifiedClaims ?? [],
    channel: buildWebhookChannelPreview(report),
  };
}

export function buildRiskTrendPoints(
  reports: Array<{ id: string; report: ExecutiveIntelligenceReport; created_at?: string }>,
  limit = 8,
): RiskTrendPoint[] {
  return [...reports]
    .sort((a, b) => {
      const aTime = Date.parse(a.report.generatedAt || a.created_at || "") || 0;
      const bTime = Date.parse(b.report.generatedAt || b.created_at || "") || 0;
      return aTime - bTime;
    })
    .slice(-limit)
    .map((row) => {
      const generatedAt = row.report.generatedAt || row.created_at || new Date().toISOString();
      const date = new Date(generatedAt);
      const label = Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return {
        reportId: row.id || row.report.id,
        generatedAt,
        riskScore: row.report.riskScore,
        confidence: row.report.confidence,
        label,
      };
    });
}
