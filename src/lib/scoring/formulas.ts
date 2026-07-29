/**
 * SANTRA scoring formulas — risk ≠ confidence ≠ importance.
 *
 * Risk     = exposure (how severe / how broad)
 * Confidence = evidence quality (how trustworthy)
 * Importance = action priority (relevance × magnitude × urgency × reliability)
 */

import type {
  DetectedChange,
  EvidenceSource,
  ExecutiveIntelligenceReport,
  IntelligenceSignal,
  Severity,
  VerifiedClaim,
  ClaimVerificationStatus,
} from "@/types/intelligence";

export const SEVERITY_SCORE: Record<Severity, number> = {
  low: 30,
  medium: 52,
  high: 74,
  critical: 92,
};

export const CLAIM_STATUS_WEIGHT: Record<ClaimVerificationStatus, number> = {
  "evidence-backed": 1,
  partial: 0.55,
  unsupported: 0.12,
};

/** A report can never read as more trustworthy than the collection path allows. */
export const PROVIDER_CONFIDENCE_CEILING: Record<ExecutiveIntelligenceReport["provider"], number> = {
  "bright-data": 94,
  exa: 90,
  openai: 76,
  demo: 60,
};

export function clampScore(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Risk = 0.72·peakSeverity + 0.28·meanSeverity + breadthBonus + changeBonus
 * Breadth: +3 per extra matched signal (cap +9)
 * Change: +3 base, +2 per extra detected change (cap +8)
 */
export function computeRiskScore(
  matchedSignals: IntelligenceSignal[],
  fallbackSignal: IntelligenceSignal | undefined,
  detectedChanges?: DetectedChange[],
) {
  if (!matchedSignals.length) {
    const latent = fallbackSignal ? SEVERITY_SCORE[fallbackSignal.severity] : 40;
    return clampScore(latent * 0.45, 8, 42);
  }

  const severities = matchedSignals.map((signal) => SEVERITY_SCORE[signal.severity]);
  const peak = Math.max(...severities);
  const mean = severities.reduce((sum, value) => sum + value, 0) / severities.length;
  const breadthBonus = Math.min(9, (matchedSignals.length - 1) * 3);
  const changeBonus = detectedChanges?.length
    ? Math.min(8, 3 + (detectedChanges.length - 1) * 2)
    : 0;

  return clampScore(peak * 0.72 + mean * 0.28 + breadthBonus + changeBonus, 10, 99);
}

/**
 * Confidence = 0.42·claimQuality + 0.23·sourceQuality + 0.17·citationCoverage + 0.18·modelConfidence
 * Capped by providerConfidenceCeiling.
 */
export function computeConfidence(
  claims: VerifiedClaim[],
  sources: EvidenceSource[],
  signals: IntelligenceSignal[],
  provider: ExecutiveIntelligenceReport["provider"],
  analysisConfidence: number,
) {
  const claimQuality = claims.length
    ? claims.reduce((sum, claim) => sum + CLAIM_STATUS_WEIGHT[claim.status], 0) / claims.length
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

  return clampScore(score * 100, 10, PROVIDER_CONFIDENCE_CEILING[provider]);
}

/**
 * Importance = 0.30·relevance + 0.20·magnitude + 0.15·urgency + 0.15·reliability
 *            + 0.10·overlap + 0.10·corroboration
 *
 * High ≥ 75 · Medium ≥ 45 · Low < 45
 */
export function computeImportanceScore(input: {
  matchedSignals: IntelligenceSignal[];
  detectedChanges?: DetectedChange[];
  sources?: EvidenceSource[];
  claims?: VerifiedClaim[];
  riskScore: number;
  confidence: number;
}) {
  const { matchedSignals, detectedChanges = [], sources = [], claims = [], riskScore, confidence } =
    input;

  if (!matchedSignals.length && !detectedChanges.length) {
    return clampScore(riskScore * 0.35, 5, 35);
  }

  const peakSeverity = matchedSignals.length
    ? Math.max(...matchedSignals.map((s) => SEVERITY_SCORE[s.severity]))
    : detectedChanges.length
      ? SEVERITY_SCORE[detectedChanges[0].severity]
      : 40;

  const relevance = peakSeverity / 100;
  const magnitude = detectedChanges.length
    ? Math.min(1, 0.45 + detectedChanges.length * 0.18)
    : matchedSignals.length
      ? Math.min(1, 0.35 + matchedSignals.length * 0.12)
      : 0.25;
  const urgency = riskScore / 100;
  const reliability = confidence / 100;
  const overlap = Math.min(1, matchedSignals.length / 4);
  const corroborated = claims.filter((c) => c.status === "evidence-backed").length;
  const corroboration = claims.length
    ? corroborated / claims.length
    : sources.some((s) => Boolean(s.url))
      ? 0.55
      : 0.25;

  const score =
    relevance * 0.3 +
    magnitude * 0.2 +
    urgency * 0.15 +
    reliability * 0.15 +
    overlap * 0.1 +
    corroboration * 0.1;

  return clampScore(score * 100, 5, 99);
}

export function importanceBand(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export const SCORING_FORMULA_DOCS = {
  risk: "0.72·peakSeverity + 0.28·meanSeverity + breadthBonus(≤9) + changeBonus(≤8)",
  confidence:
    "0.42·claimQuality + 0.23·sourceQuality + 0.17·citationCoverage + 0.18·modelConfidence (provider ceiling)",
  importance:
    "0.30·relevance + 0.20·magnitude + 0.15·urgency + 0.15·reliability + 0.10·overlap + 0.10·corroboration",
} as const;
