import { describe, expect, it } from "vitest";
import {
  computeConfidence,
  computeImportanceScore,
  computeRiskScore,
  importanceBand,
} from "@/lib/scoring/formulas";
import type {
  DetectedChange,
  EvidenceSource,
  IntelligenceSignal,
  VerifiedClaim,
} from "@/types/intelligence";

function signal(partial: Partial<IntelligenceSignal> & Pick<IntelligenceSignal, "severity">): IntelligenceSignal {
  return {
    id: partial.id ?? "s1",
    title: partial.title ?? "Pricing change",
    source: partial.source ?? "https://example.com/pricing",
    summary: partial.summary ?? "Pro plan moved",
    category: partial.category ?? "pricing",
    severity: partial.severity,
    confidence: partial.confidence ?? 0.9,
    timestamp: partial.timestamp ?? new Date().toISOString(),
  };
}

describe("scoring formulas", () => {
  it("keeps risk independent of confidence", () => {
    const matched = [
      signal({ severity: "critical", confidence: 0.4 }),
      signal({ id: "s2", severity: "high", confidence: 0.4 }),
    ];
    const risk = computeRiskScore(matched, matched[0], []);
    expect(risk).toBeGreaterThanOrEqual(70);

    const claims: VerifiedClaim[] = [
      {
        id: "c1",
        claim: "price up",
        status: "unsupported",
        confidence: 40,
        sourceIds: [],
        sourceRecords: [],
      },
    ];
    const sources: EvidenceSource[] = [
      {
        id: "src1",
        title: "src",
        publisher: "demo",
        freshness: "now",
        reliability: 40,
        claimSupported: "x",
      },
    ];
    const confidence = computeConfidence(claims, sources, matched, "demo", 0.4);
    expect(confidence).toBeLessThan(risk);
  });

  it("raises importance for corroborated pricing changes", () => {
    const matched = [signal({ severity: "high", confidence: 0.92 })];
    const changes: DetectedChange[] = [
      {
        id: "ch1",
        field: "Pro plan",
        oldValue: "$99",
        newValue: "$129",
        sourceUrl: "https://example.com/pricing",
        detectedAt: new Date().toISOString(),
        impact: "renewal pressure",
        severity: "high",
        category: "pricing",
      },
    ];
    const claims: VerifiedClaim[] = [
      {
        id: "c1",
        claim: "Pro $99 → $129",
        status: "evidence-backed",
        confidence: 90,
        sourceIds: ["src1"],
        sourceRecords: [],
      },
    ];
    const sources: EvidenceSource[] = [
      {
        id: "src1",
        title: "Pricing",
        url: "https://example.com/pricing",
        publisher: "example.com",
        freshness: "now",
        reliability: 90,
        claimSupported: "Pro plan",
      },
    ];
    const risk = computeRiskScore(matched, matched[0], changes);
    const confidence = computeConfidence(claims, sources, matched, "bright-data", 0.9);
    const importance = computeImportanceScore({
      matchedSignals: matched,
      detectedChanges: changes,
      sources,
      claims,
      riskScore: risk,
      confidence,
    });
    expect(importance).toBeGreaterThanOrEqual(60);
    expect(importanceBand(importance)).not.toBe("low");
  });

  it("returns low latent risk when nothing matched", () => {
    expect(computeRiskScore([], undefined, [])).toBeLessThanOrEqual(42);
  });
});
