import type { ImageInvestigationReport } from "@/types/image-intelligence";
import type { ExecutiveIntelligenceReport, IntelligenceAnalysis } from "@/types/intelligence";
import type {
  FaceIntelligenceReport,
  WorkspaceHistoryEntry,
  WorkspaceHistoryKind,
} from "@/types/workspace-history";
import type { WorldEngineReport } from "@/types/world-engine";
import { buildNamedVerdict, isGenericVerdict } from "@/lib/gtm/report-headline";

export const WORKSPACE_HISTORY_KEY = "santra-workspace-history";
export const WORKSPACE_HISTORY_EVENT = "santra:workspace-history-updated";

const LEGACY_REPORTS_KEY = "santra-intelligence-reports";
const LEGACY_IMAGE_KEY = "santra-image-investigations";
const LEGACY_FACE_KEY = "santra-face-intelligence";
const MIGRATION_FLAG = "santra-workspace-history-migrated-v1";

const MAX_ENTRIES = 120;

function readRawList(): WorkspaceHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WORKSPACE_HISTORY_KEY) || "[]") as WorkspaceHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(WORKSPACE_HISTORY_KEY);
    return [];
  }
}

function writeRawList(entries: WorkspaceHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKSPACE_HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  window.dispatchEvent(new CustomEvent(WORKSPACE_HISTORY_EVENT));
}

export function entryFromMonitorReport(report: ExecutiveIntelligenceReport, monitorId?: string): WorkspaceHistoryEntry {
  const title = !report.verdict?.trim()
    ? report.monitorRequirement || "Untitled brief"
    : isGenericVerdict(report.verdict)
      ? buildNamedVerdict({
          matchedSignals: [],
          detectedChanges: report.detectedChanges,
          requirement: report.monitorRequirement,
        })
      : report.verdict;

  return {
    id: report.id,
    kind: "monitor_report",
    title,
    subtitle: report.monitorRequirement,
    summary: report.situation.slice(0, 280),
    createdAt: report.generatedAt,
    provider: report.provider,
    tags: ["Monitor"],
    preview: { riskScore: report.riskScore, confidence: report.confidence },
    payload: { kind: "monitor_report", report, monitorId },
  };
}

function entryFromImageReport(report: ImageInvestigationReport): WorkspaceHistoryEntry {
  return {
    id: report.id,
    kind: "image_forensics",
    title: `${report.status} · ${report.prompt.slice(0, 72)}`,
    subtitle: report.files.map((file) => file.name).join(", ") || "Visual evidence",
    summary: report.summary,
    createdAt: report.createdAt,
    provider: report.source,
    tags: ["Visual forensics"],
    preview: {
      confidence: report.scores.confidence,
      status: report.status,
      threatLevel: report.threatLevel,
    },
    payload: { kind: "image_forensics", report },
  };
}

function entryFromFaceReport(report: FaceIntelligenceReport): WorkspaceHistoryEntry {
  return {
    id: report.id,
    kind: "face_intelligence",
    title: `${report.imageName} · ${report.scores.authenticity}% authentic`,
    subtitle: report.caseId,
    summary: report.summary,
    createdAt: report.createdAt,
    tags: ["Face intelligence"],
    preview: {
      confidence: report.scores.authenticity,
      status: report.scores.aiGenerated > 55 ? "AI signal elevated" : "Within normal range",
    },
    payload: { kind: "face_intelligence", report },
  };
}

function entryFromWorldReport(report: WorldEngineReport): WorkspaceHistoryEntry {
  return {
    id: report.id,
    kind: "world_engine",
    title: report.headline,
    subtitle: report.query,
    summary: report.executiveSummary.slice(0, 280),
    createdAt: report.generatedAt,
    provider: report.provider,
    tags: ["World Engine"],
    preview: { riskScore: report.riskIndex, confidence: report.confidence },
    payload: { kind: "world_engine", report },
  };
}

function entryFromBriefing(query: string, analysis: IntelligenceAnalysis, provider?: string): WorkspaceHistoryEntry {
  const id = `briefing-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  return {
    id,
    kind: "gtm_briefing",
    title: analysis.summary.slice(0, 96),
    subtitle: query,
    summary: analysis.summary,
    createdAt,
    provider,
    tags: ["GTM briefing"],
    preview: { confidence: Math.round((analysis.confidenceScore ?? 0) * 100) },
    payload: { kind: "gtm_briefing", query, analysis, provider },
  };
}

function migrateLegacyEntries(existing: WorkspaceHistoryEntry[]) {
  if (typeof window === "undefined") return existing;
  if (window.localStorage.getItem(MIGRATION_FLAG) === "1") return existing;

  const merged = [...existing];
  const seen = new Set(existing.map((entry) => entry.id));

  try {
    const monitorReports = JSON.parse(
      window.localStorage.getItem(LEGACY_REPORTS_KEY) || "[]",
    ) as ExecutiveIntelligenceReport[];
    for (const report of monitorReports) {
      if (!report?.id || seen.has(report.id)) continue;
      merged.push(entryFromMonitorReport(report));
      seen.add(report.id);
    }
  } catch {
    // ignore
  }

  try {
    const imageReports = JSON.parse(
      window.localStorage.getItem(LEGACY_IMAGE_KEY) || "[]",
    ) as ImageInvestigationReport[];
    for (const report of imageReports) {
      if (!report?.id || seen.has(report.id)) continue;
      merged.push(entryFromImageReport(report));
      seen.add(report.id);
    }
  } catch {
    // ignore
  }

  try {
    const faceReports = JSON.parse(
      window.localStorage.getItem(LEGACY_FACE_KEY) || "[]",
    ) as FaceIntelligenceReport[];
    for (const report of faceReports) {
      if (!report?.id || seen.has(report.id)) continue;
      merged.push(entryFromFaceReport(report));
      seen.add(report.id);
    }
  } catch {
    // ignore
  }

  window.localStorage.setItem(MIGRATION_FLAG, "1");
  return merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, MAX_ENTRIES);
}

export function listWorkspaceHistory(): WorkspaceHistoryEntry[] {
  const migrated = migrateLegacyEntries(readRawList());
  if (migrated.length !== readRawList().length || migrated.some((entry, index) => entry.id !== readRawList()[index]?.id)) {
    writeRawList(migrated);
  }
  return migrated;
}

export function appendWorkspaceHistory(entry: WorkspaceHistoryEntry) {
  const current = listWorkspaceHistory();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, MAX_ENTRIES);
  writeRawList(next);
  return entry;
}

export function removeWorkspaceHistoryEntry(id: string) {
  const next = listWorkspaceHistory().filter((entry) => entry.id !== id);
  writeRawList(next);
  return next;
}

/** Update or clear the named-signal headline on a saved monitor report. Pass `null` to delete. */
export function updateMonitorReportHeadline(reportId: string, headline: string | null) {
  const trimmed = headline?.trim() ?? "";
  const next = listWorkspaceHistory().map((entry) => {
    if (entry.id !== reportId || entry.payload.kind !== "monitor_report") return entry;
    const report = { ...entry.payload.report, verdict: trimmed };
    return {
      ...entry,
      title: trimmed || entry.subtitle || "Untitled brief",
      payload: { ...entry.payload, report },
    };
  });
  writeRawList(next);
  return next.find((entry) => entry.id === reportId);
}

/** Clear named-signal headlines on every saved monitor report. */
export function clearAllMonitorHeadlines() {
  const next = listWorkspaceHistory().map((entry) => {
    if (entry.payload.kind !== "monitor_report") return entry;
    const report = { ...entry.payload.report, verdict: "" };
    return {
      ...entry,
      title: entry.subtitle || "Untitled brief",
      payload: { ...entry.payload, report },
    };
  });
  writeRawList(next);
  return next;
}

export function updateWorldEngineHeadline(reportId: string, headline: string | null) {
  const trimmed = headline?.trim() ?? "";
  const next = listWorkspaceHistory().map((entry) => {
    if (entry.id !== reportId || entry.payload.kind !== "world_engine") return entry;
    const report = { ...entry.payload.report, headline: trimmed };
    return {
      ...entry,
      title: trimmed || entry.subtitle || "Untitled brief",
      payload: { ...entry.payload, report },
    };
  });
  writeRawList(next);
  return next.find((entry) => entry.id === reportId);
}

export function clearWorkspaceHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WORKSPACE_HISTORY_KEY);
  window.localStorage.removeItem(MIGRATION_FLAG);
  [LEGACY_REPORTS_KEY, LEGACY_IMAGE_KEY, LEGACY_FACE_KEY].forEach((key) => window.localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent(WORKSPACE_HISTORY_EVENT));
}

export function historyKindLabel(kind: WorkspaceHistoryKind) {
  switch (kind) {
    case "monitor_report":
      return "GTM monitor";
    case "image_forensics":
      return "Archived visual analysis";
    case "face_intelligence":
      return "Archived face analysis";
    case "world_engine":
      return "Competitor intelligence";
    case "gtm_briefing":
      return "GTM briefing";
    default:
      return "Analysis";
  }
}

export function recordMonitorReportHistory(report: ExecutiveIntelligenceReport, monitorId?: string) {
  return appendWorkspaceHistory(entryFromMonitorReport(report, monitorId));
}

export function recordImageForensicsHistory(report: ImageInvestigationReport) {
  return appendWorkspaceHistory(entryFromImageReport(report));
}

export function recordFaceIntelligenceHistory(report: FaceIntelligenceReport) {
  return appendWorkspaceHistory(entryFromFaceReport(report));
}

export function recordWorldEngineHistory(report: WorldEngineReport) {
  return appendWorkspaceHistory(entryFromWorldReport(report));
}

export function recordGtmBriefingHistory(query: string, analysis: IntelligenceAnalysis, provider?: string) {
  return appendWorkspaceHistory(entryFromBriefing(query, analysis, provider));
}

export function mergeHistoryEntries(local: WorkspaceHistoryEntry[], server: WorkspaceHistoryEntry[]) {
  const seen = new Set(local.map((entry) => entry.id));
  const merged = [...local];
  for (const entry of server) {
    if (!entry?.id || seen.has(entry.id)) continue;
    merged.push(entry);
    seen.add(entry.id);
  }
  return merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function mergeServerMonitorReports(
  local: WorkspaceHistoryEntry[],
  serverReports: Array<{ id: string; report: ExecutiveIntelligenceReport; created_at?: string }>,
) {
  const serverEntries = serverReports
    .filter((row) => row.report?.id)
    .map((row) => entryFromMonitorReport(row.report, undefined));
  return mergeHistoryEntries(local, serverEntries);
}
