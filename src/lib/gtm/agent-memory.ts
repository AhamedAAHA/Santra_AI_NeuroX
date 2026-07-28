import { listWorkspaceHistory } from "@/lib/history/workspace-history";
import { loadLiveDetectedChanges } from "@/lib/monitor-workspace-storage";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

export type PriorMonitorRun = {
  monitorId?: string;
  requirement: string;
  generatedAt: string;
  verdict: string;
  riskScore: number;
  confidence: number;
  changes: string[];
  provider?: string;
};

function normalizeRequirement(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function requirementsMatch(a: string, b: string) {
  const left = normalizeRequirement(a);
  const right = normalizeRequirement(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

/** Prior monitor reports from local workspace history (same monitor or similar requirement). */
export function listPriorMonitorRuns(options: {
  monitorId?: string;
  requirement?: string;
  limit?: number;
  excludeReportId?: string;
}): PriorMonitorRun[] {
  const limit = options.limit ?? 5;
  const requirement = options.requirement?.trim();
  const monitorId = options.monitorId?.trim();

  const fromHistory: PriorMonitorRun[] = [];

  for (const entry of listWorkspaceHistory()) {
    if (entry.payload.kind !== "monitor_report") continue;
    const report = entry.payload.report;
    if (options.excludeReportId && report.id === options.excludeReportId) continue;

    const sameMonitor = Boolean(monitorId && entry.payload.monitorId === monitorId);
    const sameRequirement = Boolean(
      requirement && requirementsMatch(report.monitorRequirement, requirement),
    );
    if (!sameMonitor && !sameRequirement) continue;

    fromHistory.push({
      monitorId: entry.payload.monitorId,
      requirement: report.monitorRequirement,
      generatedAt: report.generatedAt,
      verdict: report.verdict,
      riskScore: report.riskScore,
      confidence: report.confidence,
      changes:
        report.detectedChanges
          ?.slice(0, 3)
          .map((change) => `${change.field}: ${change.oldValue} → ${change.newValue}`) ?? [],
      provider: report.provider,
    });
  }

  if (monitorId && fromHistory.length < 2) {
    const liveChanges = loadLiveDetectedChanges()
      .filter((change) => change.monitorId === monitorId)
      .slice(0, 4);
    if (liveChanges.length && !fromHistory.some((run) => run.changes.length)) {
      fromHistory.push({
        monitorId,
        requirement: requirement || "Prior detected changes",
        generatedAt: liveChanges[0]!.detectedAt,
        verdict: `${liveChanges.length} prior field change${liveChanges.length === 1 ? "" : "s"} on record`,
        riskScore: 0,
        confidence: 0,
        changes: liveChanges.map(
          (change) => `${change.field}: ${change.oldValue} → ${change.newValue}`,
        ),
      });
    }
  }

  return fromHistory
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, limit);
}

/** Compact brief injected into analysis so the agent reasons over prior runs. */
export function buildMemoryBrief(priors: PriorMonitorRun[]): string {
  if (!priors.length) return "";

  const lines = [
    "Prior monitor memory (use for trend context; prefer fresh evidence for claims):",
    ...priors.map((run, index) => {
      const when = new Date(run.generatedAt).toLocaleString();
      const scores =
        run.riskScore || run.confidence
          ? ` · risk ${run.riskScore} · confidence ${run.confidence}`
          : "";
      const changeLine = run.changes.length ? ` · changes: ${run.changes.join("; ")}` : "";
      return `${index + 1}. [${when}] ${run.verdict}${scores}${changeLine}`;
    }),
  ];

  if (priors.length >= 2) {
    lines.push(
      "If the same competitor/field moved more than once, call out the repeat pattern explicitly.",
    );
  }

  return lines.join("\n");
}

export function buildClientMemoryBrief(options: {
  monitorId?: string;
  requirement?: string;
}): string {
  return buildMemoryBrief(listPriorMonitorRuns(options));
}

export function enrichQueryWithMemory(query: string, memoryBrief?: string | null) {
  const brief = memoryBrief?.trim();
  if (!brief) return query;
  return `${query}\n\n${brief}`;
}

/** Server-safe summary from prior reports passed in the request body. */
export function buildMemoryBriefFromReports(reports: ExecutiveIntelligenceReport[]): string {
  const priors: PriorMonitorRun[] = reports.slice(0, 5).map((report) => ({
    requirement: report.monitorRequirement,
    generatedAt: report.generatedAt,
    verdict: report.verdict,
    riskScore: report.riskScore,
    confidence: report.confidence,
    changes:
      report.detectedChanges
        ?.slice(0, 3)
        .map((change) => `${change.field}: ${change.oldValue} → ${change.newValue}`) ?? [],
    provider: report.provider,
  }));
  return buildMemoryBrief(priors);
}
