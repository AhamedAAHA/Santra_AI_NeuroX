import type {
  DetectedChange,
  ExecutiveIntelligenceReport,
  IntelligenceSignal,
} from "@/types/intelligence";
import { coerceTextListItem } from "@/lib/gtm/text-list";

const GENERIC_VERDICT =
  /^(?:\d+\s+)?monitored signals? require(?:s)? review$|^\d+\s+signals? need review/i;

/** Pull a short competitor / brand-like token from a title or URL host. */
export function extractCompetitorLabel(input?: string) {
  if (!input?.trim()) return undefined;
  const text = input.trim();

  try {
    if (/^https?:\/\//i.test(text)) {
      const host = new URL(text).hostname.replace(/^www\./, "");
      const brand = host.split(".")[0];
      if (brand && brand.length > 1) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
  } catch {
    // fall through
  }

  const named = text.match(
    /\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\b/,
  );
  if (named?.[1] && named[1].length >= 3 && !/^(The|This|Monitor|SANTRA)$/i.test(named[1])) {
    return named[1];
  }

  const firstWords = text.split(/[\s—–|:]+/).filter(Boolean).slice(0, 3).join(" ");
  return firstWords.length > 40 ? `${firstWords.slice(0, 37)}…` : firstWords || undefined;
}

export function collectCompetitorLabels(options: {
  signals?: IntelligenceSignal[];
  changes?: DetectedChange[];
  report?: ExecutiveIntelligenceReport;
  limit?: number;
}) {
  const limit = options.limit ?? 6;
  const labels: string[] = [];

  for (const change of options.changes ?? options.report?.detectedChanges ?? []) {
    const fromField = extractCompetitorLabel(change.field);
    const fromUrl = extractCompetitorLabel(change.sourceUrl);
    if (fromField) labels.push(fromField);
    else if (fromUrl) labels.push(fromUrl);
  }

  for (const signal of options.signals ?? []) {
    const label =
      extractCompetitorLabel(signal.title) ||
      extractCompetitorLabel(signal.sourceUrl) ||
      extractCompetitorLabel(signal.source);
    if (label) labels.push(label);
  }

  for (const fact of options.report?.observedFacts ?? []) {
    const label = extractCompetitorLabel(fact);
    if (label) labels.push(label);
  }

  return Array.from(new Set(labels.map((item) => item.trim()).filter(Boolean))).slice(0, limit);
}

/**
 * Human-facing verdict: name the change / signal, not a generic count.
 * Example: "ApexAnalytics Pro $99 → $129 · pricing · high"
 */
export function buildNamedVerdict(options: {
  matchedSignals: IntelligenceSignal[];
  detectedChanges?: DetectedChange[];
  requirement?: string;
}) {
  const { matchedSignals, detectedChanges, requirement } = options;
  const topChange = detectedChanges?.[0];
  const topSignal = matchedSignals[0];

  if (topChange) {
    const brand =
      extractCompetitorLabel(topChange.field) ||
      extractCompetitorLabel(topChange.sourceUrl) ||
      "Competitor";
    const changeBit =
      topChange.oldValue && topChange.newValue
        ? `${topChange.oldValue} → ${topChange.newValue}`
        : topChange.field;
    const extras = [topChange.category, topChange.severity].filter(Boolean).join(" · ");
    const base = `${brand}: ${changeBit}`;
    return extras ? `${base} · ${extras}` : base;
  }

  if (topSignal) {
    const title = topSignal.title.trim();
    const changeBit =
      topSignal.oldValue && topSignal.newValue
        ? `${topSignal.oldValue} → ${topSignal.newValue}`
        : null;
    const extras = [topSignal.category, topSignal.severity].filter(Boolean).join(" · ");
    const base = changeBit ? `${title} (${changeBit})` : title;
    return extras ? `${base} · ${extras}` : base;
  }

  if (requirement?.trim()) {
    return `Watchlist: ${requirement.trim().slice(0, 120)}`;
  }

  return "No monitored signal crossed the action threshold";
}

export function isGenericVerdict(verdict?: string) {
  return Boolean(verdict && GENERIC_VERDICT.test(verdict.trim()));
}

/** Prefer named signal/change for UI lists; fall back to monitor requirement. */
export function resolveActionHeadline(options: {
  proposedAction?: string;
  monitorRequirement?: string;
  report?: ExecutiveIntelligenceReport;
}) {
  const report = options.report;

  if (report) {
    if (!isGenericVerdict(report.verdict)) {
      return cleanHeadline(report.verdict);
    }

    const rebuilt = buildNamedVerdict({
      matchedSignals: [],
      detectedChanges: report.detectedChanges,
      requirement: report.monitorRequirement,
    });
    if (!isGenericVerdict(rebuilt) && !rebuilt.startsWith("Watchlist:")) {
      return cleanHeadline(rebuilt);
    }

    if (report.observedFacts?.[0]) {
      return cleanHeadline(report.observedFacts[0]);
    }

    const fromSituation = report.situation.match(/strongest matching signal is "([^"]+)"/i);
    if (fromSituation?.[1]) {
      return cleanHeadline(fromSituation[1]);
    }
  }

  const proposed = options.proposedAction?.trim();
  if (proposed && !isGenericVerdict(proposed) && !/^\d+\s+signals? need review/i.test(proposed)) {
    return cleanHeadline(proposed);
  }

  return cleanHeadline(options.monitorRequirement?.trim() || "Monitor update");
}

function cleanHeadline(raw: string) {
  return raw
    .replace(/^Review and approve CRM\/automation trigger:\s*/i, "")
    .replace(/^Review and approve automation:\s*/i, "")
    .replace(/^Review monitor brief:\s*/i, "")
    .replace(/^\d+\s+signals? need review\s*[—–-]\s*/i, "")
    .trim();
}

export function buildSeverityChartData(report: ExecutiveIntelligenceReport) {
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const change of report.detectedChanges ?? []) {
    counts[change.severity] = (counts[change.severity] ?? 0) + 1;
  }
  return (["critical", "high", "medium", "low"] as const).map((severity) => ({
    severity,
    count: counts[severity] ?? 0,
  }));
}

export function buildReliabilityChartData(report: ExecutiveIntelligenceReport) {
  return (report.evidenceSources ?? []).slice(0, 6).map((source) => ({
    name: (source.publisher || "Source").slice(0, 18),
    reliability: source.reliability,
  }));
}

export function buildWebhookChannelPreview(report: ExecutiveIntelligenceReport) {
  const headline = resolveActionHeadline({
    proposedAction: report.verdict,
    monitorRequirement: report.monitorRequirement,
    report,
  });

  return {
    slackLine: `SANTRA alert — ${headline} (risk ${report.riskScore} · confidence ${report.confidence})`,
    crmFields: [
      { label: "Verdict", value: headline },
      { label: "Risk", value: `${report.riskScore}` },
      { label: "Confidence", value: `${report.confidence}` },
      { label: "Monitor", value: report.monitorRequirement },
      { label: "Next action", value: coerceTextListItem(report.actionPlan[0]) || "Review with owner" },
    ],
  };
}
