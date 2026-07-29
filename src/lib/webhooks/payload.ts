import { claimStatusLabel, type ExecutiveIntelligenceReport } from "@/types/intelligence";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.SANTRA_APP_URL?.trim() ||
    process.env.SENTRA_APP_URL?.trim() ||
    "https://santra-ai-neurox.vercel.app"
  ).replace(/\/$/, "");
}

/** Full structured envelope — same truth as the report page. */
export function buildSantraWebhookEnvelope(report: ExecutiveIntelligenceReport) {
  const claimStats = { backed: 0, partial: 0, unsupported: 0 };
  for (const claim of report.verifiedClaims ?? []) {
    if (claim.status === "evidence-backed") claimStats.backed += 1;
    else if (claim.status === "partial") claimStats.partial += 1;
    else claimStats.unsupported += 1;
  }

  return {
    schemaVersion: "santra.webhook.v2",
    reportId: report.id,
    generatedAt: report.generatedAt,
    provider: report.provider,
    deepLink: `${appBaseUrl()}/reports?reportId=${encodeURIComponent(report.id)}`,
    requirement: report.monitorRequirement,
    verdict: report.verdict,
    situation: report.situation,
    impact: report.impact,
    riskScore: report.riskScore,
    confidence: report.confidence,
    importanceScore: report.importanceScore ?? 0,
    importanceBand: report.importanceBand ?? "low",
    hallucinationRisk: report.hallucinationRisk,
    actionPlan: report.actionPlan ?? [],
    watchItems: report.watchItems ?? [],
    observedFacts: report.observedFacts ?? [],
    forecasts: report.forecasts ?? [],
    detectedChanges: (report.detectedChanges ?? []).map((change) => ({
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      severity: change.severity,
      category: change.category,
      sourceUrl: change.sourceUrl,
      impact: change.impact,
    })),
    evidenceSources: (report.evidenceSources ?? []).map((source) => ({
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      reliability: source.reliability,
      excerpt: source.excerpt,
      freshness: source.freshness,
    })),
    verifiedClaims: (report.verifiedClaims ?? []).map((claim) => ({
      claim: claim.claim,
      status: claimStatusLabel(claim.status),
      statusKey: claim.status,
      confidence: claim.confidence,
      sourceUrls: (claim.sourceRecords ?? [])
        .map((record) => record.url)
        .filter((url): url is string => Boolean(url)),
    })),
    claimStats,
    factCheck: report.factCheck
      ? {
          synthesizer: report.factCheck.synthesizer,
          verifier: report.factCheck.verifier,
          corroborated: report.factCheck.corroborated,
          contested: report.factCheck.contested,
          dropped: report.factCheck.dropped,
          ranAt: report.factCheck.ranAt,
        }
      : undefined,
  };
}

export type SantraWebhookEnvelope = ReturnType<typeof buildSantraWebhookEnvelope>;
