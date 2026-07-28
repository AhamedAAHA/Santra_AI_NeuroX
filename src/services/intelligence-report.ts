import type {
  BrightDataCollectionMode,
  ClaimSourceRecord,
  ClaimVerificationStatus,
  DetectedChange,
  EvidenceSource,
  ExecutiveIntelligenceReport,
  IntelligenceAnalysis,
  IntelligenceSignal,
  VerifiedClaim,
} from "@/types/intelligence";
import { formatEvidenceExcerpt, formatEvidenceTitle } from "@/lib/evidence/format-evidence";
import { buildNamedVerdict } from "@/lib/gtm/report-headline";
import { normalizeTextList } from "@/lib/gtm/text-list";

const severityScore: Record<IntelligenceSignal["severity"], number> = {
  low: 30,
  medium: 52,
  high: 74,
  critical: 92,
};

const claimStatusWeight: Record<ClaimVerificationStatus, number> = {
  "evidence-backed": 1,
  partial: 0.55,
  unsupported: 0.12,
};

/** A report can never read as more trustworthy than the collection path allows. */
const providerConfidenceCeiling: Record<ExecutiveIntelligenceReport["provider"], number> = {
  "bright-data": 94,
  exa: 90,
  openai: 76,
  demo: 60,
};

function clampScore(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hostFromSource(source: string) {
  const url = source.match(/https?:\/\/[^\s)]+/i)?.[0];
  if (!url) return undefined;

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function evidenceUrlFromRaw(raw: string, index: number) {
  const urls = Array.from(raw.matchAll(/https?:\/\/[^\s"',)\\]+/gi)).map((match) => match[0]);
  return urls[index];
}

function inferBrightDataMode(evidence: string, index: number): BrightDataCollectionMode | undefined {
  const sections = evidence.split(/###\s+/);
  const section = sections[index + 1] ?? sections[sections.length - 1] ?? "";
  const modeMatch = section.match(/\((serp|unlocker|scraper|browser|mcp)\)/i);
  return modeMatch ? (modeMatch[1].toLowerCase() as BrightDataCollectionMode) : undefined;
}

function excerptForSignal(signal: IntelligenceSignal, evidence: string): string {
  return formatEvidenceExcerpt(evidence, {
    hint: signal.title,
    fallback: signal.summary,
  });
}

function claimStatusFromEvidence(
  signal: IntelligenceSignal,
  excerpt: string,
  url?: string,
): ClaimVerificationStatus {
  const hasUrl = Boolean(url);
  const hasExcerpt = excerpt.length >= 40;
  const hasChangeValues =
    Boolean(signal.oldValue && signal.newValue) &&
    (excerpt.includes(signal.oldValue!.replace("$", "")) ||
      excerpt.includes(signal.newValue!.replace("$", "")));

  if (hasUrl && hasExcerpt && (hasChangeValues || signal.confidence >= 0.85)) {
    return "evidence-backed";
  }
  if (hasUrl || hasExcerpt || signal.confidence >= 0.68) {
    return "partial";
  }
  return "unsupported";
}

function buildEvidenceSources(
  signals: IntelligenceSignal[],
  evidence: string,
  provider: ExecutiveIntelligenceReport["provider"],
  collectionMeta?: { collectedAt?: string; brightDataMode?: BrightDataCollectionMode },
): EvidenceSource[] {
  const sourceMap = new Map<string, EvidenceSource>();
  const collectedAt = collectionMeta?.collectedAt ?? new Date().toISOString();

  signals.forEach((signal, index) => {
    const url = signal.sourceUrl ?? evidenceUrlFromRaw(evidence, index);
    const brightDataMode = collectionMeta?.brightDataMode ?? inferBrightDataMode(evidence, index);
    const publisher = hostFromSource(signal.source) ?? (provider === "bright-data" ? "Collected web evidence" : signal.source);
    const id = `source-${index + 1}`;
    const key = `${publisher}-${url ?? signal.source}`;
    if (sourceMap.has(key)) return;

    sourceMap.set(key, {
      id,
      title: formatEvidenceTitle(signal.title, signal.source),
      url,
      publisher,
      freshness: signal.timestamp || "latest collected run",
      reliability: provider === "bright-data" ? Math.min(96, Math.round(signal.confidence * 100 + 5)) : 72,
      claimSupported: signal.summary || signal.title,
      collectedAt,
      brightDataMode,
      excerpt: excerptForSignal(signal, evidence),
    });
  });

  if (!sourceMap.size) {
    sourceMap.set("demo-evidence", {
      id: "source-1",
      title: provider === "bright-data" ? "Collected web evidence" : "Demo intelligence stream",
      publisher: provider === "bright-data" ? "Bright Data" : "SANTRA demo dataset",
      freshness: "current run",
      reliability: provider === "bright-data" ? 82 : 58,
      claimSupported: "Monitor requirement requires further corroboration.",
      collectedAt,
      brightDataMode: collectionMeta?.brightDataMode,
      excerpt: formatEvidenceExcerpt(evidence, { fallback: "Evidence collected for this monitor run." }),
    });
  }

  return Array.from(sourceMap.values()).slice(0, 6);
}

function findSourceForSignal(
  signal: IntelligenceSignal,
  sources: EvidenceSource[],
  evidence: string,
  index: number,
): EvidenceSource {
  const signalUrl = signal.sourceUrl ?? evidenceUrlFromRaw(evidence, index);
  if (signalUrl) {
    const byUrl = sources.find((source) => source.url === signalUrl);
    if (byUrl) return byUrl;
  }
  return sources[index % sources.length] ?? sources[0];
}

function buildEvidenceBackedClaims(
  signals: IntelligenceSignal[],
  sources: EvidenceSource[],
  evidence: string,
  collectionMeta?: { collectedAt?: string; brightDataMode?: BrightDataCollectionMode },
): VerifiedClaim[] {
  const collectedAt = collectionMeta?.collectedAt ?? new Date().toISOString();

  if (!signals.length) {
    const fallbackSource = sources[0];
    return [
      {
        id: "claim-1",
        claim: "No matching signal crossed the configured monitor threshold.",
        status: "partial",
        confidence: 52,
        sourceIds: fallbackSource ? [fallbackSource.id] : [],
        sourceRecords: fallbackSource
          ? [
              {
                sourceId: fallbackSource.id,
                url: fallbackSource.url,
                excerpt: fallbackSource.excerpt ?? evidence.slice(0, 200),
                collectedAt,
                brightDataMode: fallbackSource.brightDataMode,
                verificationStatus: "partial",
              },
            ]
          : [],
      },
    ];
  }

  return signals.slice(0, 5).map((signal, index) => {
    const source = findSourceForSignal(signal, sources, evidence, index);
    const excerpt = excerptForSignal(signal, evidence);
    const status = claimStatusFromEvidence(signal, excerpt, source.url);
    const sourceRecord: ClaimSourceRecord = {
      sourceId: source.id,
      url: source.url ?? signal.sourceUrl,
      excerpt,
      collectedAt,
      brightDataMode: source.brightDataMode ?? collectionMeta?.brightDataMode,
      verificationStatus: status,
    };

    return {
      id: `claim-${index + 1}`,
      claim: typeof signal.oldValue === "string" && typeof signal.newValue === "string" && signal.oldValue.length > 0 && signal.newValue.length > 0
        ? `${signal.title}: ${signal.oldValue} → ${signal.newValue}`
        : `${signal.title}: ${signal.summary}`,
      status,
      confidence: Math.round(signal.confidence * 100),
      sourceIds: [source.id],
      sourceRecords: [sourceRecord],
    };
  });
}

/**
 * Risk measures exposure (how severe and how broad), never model certainty.
 * Deriving it from confidence made both headline numbers collapse to one value.
 */
function computeRiskScore(
  matchedSignals: IntelligenceSignal[],
  fallbackSignal: IntelligenceSignal | undefined,
  detectedChanges?: DetectedChange[],
) {
  if (!matchedSignals.length) {
    const latent = fallbackSignal ? severityScore[fallbackSignal.severity] : 40;
    return clampScore(latent * 0.45, 8, 42);
  }

  const severities = matchedSignals.map((signal) => severityScore[signal.severity]);
  const peak = Math.max(...severities);
  const mean = severities.reduce((sum, value) => sum + value, 0) / severities.length;
  const breadthBonus = Math.min(9, (matchedSignals.length - 1) * 3);
  const changeBonus = detectedChanges?.length
    ? Math.min(8, 3 + (detectedChanges.length - 1) * 2)
    : 0;

  return clampScore(peak * 0.72 + mean * 0.28 + breadthBonus + changeBonus, 10, 99);
}

/** Confidence measures evidence quality, independent of how bad the news is. */
function computeConfidence(
  claims: VerifiedClaim[],
  sources: EvidenceSource[],
  signals: IntelligenceSignal[],
  provider: ExecutiveIntelligenceReport["provider"],
  analysisConfidence: number,
) {
  const claimQuality = claims.length
    ? claims.reduce((sum, claim) => sum + claimStatusWeight[claim.status], 0) / claims.length
    : 0.25;
  const sourceQuality = sources.length
    ? sources.reduce((sum, source) => sum + source.reliability, 0) / sources.length / 100
    : 0.4;
  const citationCoverage = sources.length
    ? sources.filter((source) => Boolean(source.url)).length / sources.length
    : 0;
  const modelConfidence = signals.length
    ? signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length
    : analysisConfidence;

  const score =
    claimQuality * 0.42 + sourceQuality * 0.23 + citationCoverage * 0.17 + modelConfidence * 0.18;

  return clampScore(score * 100, 10, providerConfidenceCeiling[provider]);
}

export function createExecutiveReport({
  requirement,
  analysis,
  matchedSignals,
  evidence,
  provider,
  detectedChanges,
  collectionMeta,
}: {
  requirement: string;
  analysis: IntelligenceAnalysis;
  matchedSignals: IntelligenceSignal[];
  evidence: string;
  provider: ExecutiveIntelligenceReport["provider"];
  detectedChanges?: DetectedChange[];
  collectionMeta?: { collectedAt?: string; brightDataMode?: BrightDataCollectionMode };
}): ExecutiveIntelligenceReport {
  const signals = matchedSignals.length ? matchedSignals : analysis.signals;
  const sources = buildEvidenceSources(signals, evidence, provider, collectionMeta);
  const claims = buildEvidenceBackedClaims(signals, sources, evidence, collectionMeta);
  const topSignal = matchedSignals[0] ?? analysis.signals[0];
  const riskScore = computeRiskScore(matchedSignals, topSignal, detectedChanges);
  const confidence = computeConfidence(
    claims,
    sources,
    signals,
    provider,
    analysis.confidenceScore || 0.62,
  );
  const unsupportedCount = claims.filter((claim) => claim.status === "unsupported").length;
  const partialCount = claims.filter((claim) => claim.status === "partial").length;
  const hallucinationRisk =
    provider === "demo" || unsupportedCount ? "high" : partialCount > claims.length / 2 ? "medium" : "low";

  const changeSummary =
    detectedChanges?.length &&
    ` Snapshot diff detected ${detectedChanges.length} change${detectedChanges.length === 1 ? "" : "s"} since the last collection.`;

  return {
    id: crypto.randomUUID(),
    monitorRequirement: requirement,
    generatedAt: new Date().toISOString(),
    provider,
    verdict: buildNamedVerdict({
      matchedSignals,
      detectedChanges,
      requirement,
    }),
    riskScore,
    confidence,
    situation: matchedSignals.length
      ? `${analysis.summary}${changeSummary || ""} The strongest matching signal is "${topSignal.title}".`
      : `${analysis.summary} No collected signal fully matched the configured threshold yet.`,
    impact: detectedChanges?.[0]
      ? detectedChanges[0].impact
      : matchedSignals.length
        ? `Potential impact is concentrated around ${topSignal.category} with ${topSignal.severity} severity.`
        : "Impact remains watchlist-level until stronger corroborated evidence appears.",
    actionPlan: normalizeTextList(
      analysis.recommendations,
      [
        "Validate the collected evidence with a human owner.",
        "Keep the monitor active until the signal stabilizes.",
        "Prepare a stakeholder update if the risk score rises.",
      ],
    ).slice(0, 5),
    watchItems: [
      ...normalizeTextList(analysis.risks).slice(0, 3),
      ...normalizeTextList(analysis.opportunities)
        .slice(0, 2)
        .map((item) => `Opportunity: ${item}`),
    ].slice(0, 5),
    evidenceSources: sources,
    verifiedClaims: claims,
    observedFacts: matchedSignals.slice(0, 4).map((signal) =>
      signal.oldValue && signal.newValue
        ? `${signal.title} (${signal.oldValue} → ${signal.newValue})`
        : signal.summary,
    ),
    forecasts: normalizeTextList(analysis.opportunities).slice(0, 3),
    hallucinationRisk,
    detectedChanges,
  };
}
