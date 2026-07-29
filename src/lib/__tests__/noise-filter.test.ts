import { describe, expect, it } from "vitest";
import {
  filterMaterialChanges,
  filterNoiseSignals,
  isCosmeticFieldChange,
  isMaterialChange,
} from "@/lib/noise-filter";
import type { DetectedChange, IntelligenceSignal } from "@/types/intelligence";

describe("noise filter", () => {
  it("drops footer year and cookie chrome", () => {
    expect(isCosmeticFieldChange("footer copyright", "2025", "2026")).toBe(true);
    expect(isCosmeticFieldChange("cookie banner", "Accept cookies", "Accept all cookies")).toBe(true);
    expect(isCosmeticFieldChange("Pro plan", "$99", "$129")).toBe(false);
  });

  it("keeps material pricing changes", () => {
    expect(
      isMaterialChange({
        field: "ApexAnalytics Pro",
        oldValue: "$99",
        newValue: "$129",
        severity: "high",
      }),
    ).toBe(true);
  });

  it("filters cosmetic changes from a batch", () => {
    const changes: DetectedChange[] = [
      {
        id: "1",
        field: "copyright year",
        oldValue: "2025",
        newValue: "2026",
        sourceUrl: "https://example.com",
        detectedAt: new Date().toISOString(),
        impact: "none",
        severity: "low",
        category: "market",
      },
      {
        id: "2",
        field: "Pro plan",
        oldValue: "$99",
        newValue: "$129",
        sourceUrl: "https://example.com/pricing",
        detectedAt: new Date().toISOString(),
        impact: "renewal",
        severity: "high",
        category: "pricing",
      },
    ];
    const material = filterMaterialChanges(changes);
    expect(material).toHaveLength(1);
    expect(material[0].field).toBe("Pro plan");
  });

  it("drops noise signals below severity or matching chrome text", () => {
    const signals: IntelligenceSignal[] = [
      {
        id: "a",
        title: "Cookie policy updated",
        source: "site",
        summary: "We use cookies on this site",
        category: "market",
        severity: "low",
        confidence: 0.5,
        timestamp: "now",
      },
      {
        id: "b",
        title: "Pro pricing increased",
        source: "site",
        summary: "$99 to $129",
        category: "pricing",
        severity: "high",
        confidence: 0.9,
        timestamp: "now",
      },
    ];
    const filtered = filterNoiseSignals(signals, "medium");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("b");
  });
});
