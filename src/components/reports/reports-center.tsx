"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  FileCheck2,
  FileText,
  History,
  Radar,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EditableHeadline } from "@/components/reports/editable-headline";
import { MonitorIntelBrief } from "@/components/reports/monitor-intel-brief";
import { WorkspacePage, WorkspacePageHeader, WorkspaceSection } from "@/components/workspace/workspace-page";
import { downloadGtmBriefing } from "@/lib/gtm/export-report";
import { coerceTextListItem } from "@/lib/gtm/text-list";
import {
  WORKSPACE_HISTORY_EVENT,
  clearAllMonitorHeadlines,
  historyKindLabel,
  listWorkspaceHistory,
  mergeHistoryEntries,
  removeWorkspaceHistoryEntry,
  updateMonitorReportHeadline,
  updateWorldEngineHeadline,
} from "@/lib/history/workspace-history";
import { downloadWorldReport } from "@/lib/world-engine/export-report";
import type { WorkspaceHistoryEntry, WorkspaceHistoryKind } from "@/types/workspace-history";
import { isGenericVerdict, buildNamedVerdict } from "@/lib/gtm/report-headline";

const kindIcons: Partial<Record<WorkspaceHistoryKind, typeof Radar>> = {
  monitor_report: Radar,
  gtm_briefing: Sparkles,
};

export function ReportsCenter() {
  const [entries, setEntries] = useState<WorkspaceHistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      const local = listWorkspaceHistory();
      const response = await fetch("/api/history", { credentials: "include" });
      const data = (await response.json().catch(() => ({}))) as {
        entries?: WorkspaceHistoryEntry[];
        schemaReady?: boolean;
        error?: string;
      };

      if (response.ok) {
        const merged = mergeHistoryEntries(local, data.entries ?? []);
        setEntries(merged);
        setSelectedId((current) => current ?? merged[0]?.id);
        setLoadMessage(
          data.schemaReady === false
            ? "Cloud history is unavailable - showing analyses saved on this device."
            : "",
        );
      } else {
        throw new Error(data.error || "History could not be loaded.");
      }
    } catch (error) {
      const local = listWorkspaceHistory();
      setEntries(local);
      setSelectedId(local[0]?.id);
      setLoadMessage(error instanceof Error ? error.message : "Showing device history only.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadEntries());
    const onUpdate = () => void loadEntries();
    window.addEventListener(WORKSPACE_HISTORY_EVENT, onUpdate);
    return () => window.removeEventListener(WORKSPACE_HISTORY_EVENT, onUpdate);
  }, [loadEntries]);

  const filtered = useMemo(() => {
    const startupOnly = entries.filter((entry) => entry.kind === "monitor_report" || entry.kind === "gtm_briefing");
    const needle = query.trim().toLowerCase();
    if (!needle) return startupOnly;
    return startupOnly.filter((entry) =>
      `${entry.title} ${entry.subtitle} ${entry.summary} ${entry.kind} ${entry.provider ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [entries, query]);

  const selected = filtered.find((entry) => entry.id === selectedId) ?? filtered[0];

  const monitorHeadlineCount = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.kind === "monitor_report" &&
          entry.payload.kind === "monitor_report" &&
          Boolean(entry.payload.report.verdict?.trim()),
      ).length,
    [entries],
  );

  function handleClearAllHeadlines() {
    clearAllMonitorHeadlines();
    setEntries(listWorkspaceHistory());
  }

  function handleRemoveEntry(id: string) {
    removeWorkspaceHistoryEntry(id);
    const next = listWorkspaceHistory();
    setEntries(next);
    setSelectedId((current) => (current === id ? next[0]?.id : current));
  }

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="GTM intel briefs"
        title="Reports"
        description="Named competitor signals, risk vs confidence, evidence charts, and HITL webhook delivery — not just a count of matches."
      />

      <WorkspaceSection>
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="p-5 md:p-6" glow>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">History</p>
                <p className="mt-1 text-xs text-white/45">
                  {filtered.length} saved run{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
              <History className="h-7 w-7 text-santra-cyan" />
            </div>
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/35" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search monitor reports, GTM briefs, and agent runs..."
                className="pl-9"
              />
            </div>
            {monitorHeadlineCount > 0 ? (
              <div className="mt-4">
                <Button type="button" variant="ghost" size="sm" onClick={handleClearAllHeadlines}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all headlines
                </Button>
              </div>
            ) : null}
            {loadMessage && (
              <p className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-100/70">
                {loadMessage}
              </p>
            )}
            <div className="mt-5 grid max-h-[min(42vh,22rem)] gap-3 overflow-y-auto overscroll-contain pr-1 lg:max-h-[68vh]">
              {loading ? (
                <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/50">
                  Loading history...
                </p>
              ) : filtered.length ? (
                filtered.map((entry) => {
                  const Icon = kindIcons[entry.kind] ?? FileCheck2;
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-2xl border p-4 transition ${
                        selected?.id === entry.id
                          ? "border-cyan-200/30 bg-cyan-300/10"
                          : "border-white/10 bg-white/[0.045]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className="santra-focus w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="cyan">{historyKindLabel(entry.kind)}</Badge>
                          <span className="text-xs text-white/40">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-3 flex items-start gap-2">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-santra-cyan" />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium text-white">
                              {entry.kind === "monitor_report" && entry.payload.kind === "monitor_report"
                                ? entry.payload.report.verdict?.trim()
                                  ? isGenericVerdict(entry.payload.report.verdict)
                                    ? buildNamedVerdict({
                                        matchedSignals: [],
                                        detectedChanges: entry.payload.report.detectedChanges,
                                        requirement: entry.payload.report.monitorRequirement,
                                      })
                                    : entry.payload.report.verdict
                                  : entry.subtitle || "No headline"
                                : entry.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{entry.subtitle}</p>
                            {entry.preview?.riskScore != null && (
                              <p className="mt-1.5 text-[11px] text-white/35">
                                Risk {entry.preview.riskScore}
                                {entry.preview.confidence != null ? ` · Confidence ${entry.preview.confidence}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEntry(entry.id)}
                          aria-label="Remove from history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm leading-6 text-white/45">
                  <p>No history yet.</p>
                  <p className="mt-2 text-xs text-white/38">
                    Run a monitor check on Monitors or open Strategy Desk for a briefing — results appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="min-h-0 p-4 md:min-h-[680px] md:p-7" glow>
            {selected ? (
              <HistoryDetail
                entry={selected}
                onMonitorHeadlineChange={(headline) => {
                  updateMonitorReportHeadline(selected.id, headline || null);
                  setEntries(listWorkspaceHistory());
                }}
                onWorldHeadlineChange={(headline) => {
                  updateWorldEngineHeadline(selected.id, headline || null);
                  setEntries(listWorkspaceHistory());
                }}
              />
            ) : (
              <div className="grid min-h-[12rem] place-items-center text-center md:min-h-[560px]">
                <div>
                  <FileCheck2 className="mx-auto h-10 w-10 text-santra-cyan" />
                  <h2 className="mt-4 text-xl font-semibold text-white">Select a saved analysis</h2>
                  <p className="mt-2 text-sm text-white/45">Pick any run from the left to review the full output.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </WorkspaceSection>
    </WorkspacePage>
  );
}

function HistoryDetail({
  entry,
  onMonitorHeadlineChange,
  onWorldHeadlineChange,
}: {
  entry: WorkspaceHistoryEntry;
  onMonitorHeadlineChange: (headline: string) => void;
  onWorldHeadlineChange: (headline: string) => void;
}) {
  if (entry.payload.kind === "monitor_report") {
    const selected = entry.payload.report;
    return (
      <div className="grid gap-6">
        <HistoryDetailHeader entry={entry} />
        <MonitorIntelBrief
          report={selected}
          monitorId={entry.payload.monitorId}
          onHeadlineChange={onMonitorHeadlineChange}
        />
      </div>
    );
  }

  if (entry.payload.kind === "face_intelligence") {
    const report = entry.payload.report;
    return (
      <div className="grid gap-5">
        <HistoryDetailHeader entry={entry} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Authenticity", `${report.scores.authenticity}%`],
            ["AI generated", `${report.scores.aiGenerated}%`],
            ["Deepfake", `${report.scores.deepfake}%`],
            ["Readiness", `${report.scores.readiness}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <ReportSection title="Summary" body={report.summary} />
        <div className="grid gap-5 lg:grid-cols-2">
          <ListSection title="Authentic indicators" items={report.authenticReasons} />
          <ListSection title="Manipulation indicators" items={report.manipulationReasons} />
        </div>
        <ListSection title="Review notes" items={report.anomalies} />
      </div>
    );
  }

  if (entry.payload.kind === "world_engine") {
    const report = entry.payload.report;
    return (
      <div className="grid gap-5">
        <HistoryDetailHeader entry={entry} />
        <EditableHeadline
          value={report.headline}
          label="Headline"
          onSave={onWorldHeadlineChange}
          onDelete={() => onWorldHeadlineChange("")}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="Risk index" value={`${report.riskIndex}%`} />
          <MetricTile label="Confidence" value={`${report.confidence}%`} />
          <MetricTile label="Signals" value={String(report.signals.length)} />
        </div>
        <ReportSection title="Executive summary" body={report.executiveSummary} />
        <ReportSection title="Outlook" body={report.outlook} />
        <ReportSection title="Recommendation" body={report.recommendation} />
        {report.reasoning.length ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Reasoning stages</p>
            <ul className="mt-3 grid gap-2">
              {report.reasoning.map((stage) => (
                <li key={stage.stage} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-white/68">
                  <span className="font-medium text-white">{stage.stage}</span>
                  <span className="text-white/45"> · {stage.confidence}%</span>
                  <p className="mt-2 leading-6">{stage.finding}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (entry.payload.kind === "gtm_briefing") {
    const { analysis, query } = entry.payload;
    return (
      <div className="grid gap-5">
        <HistoryDetailHeader entry={entry} />
        <p className="text-sm text-white/45">Query: {query}</p>
        <ReportSection title="Summary" body={analysis.summary} />
        <ListSection title="Risks" items={analysis.risks} />
        <ListSection title="Opportunities" items={analysis.opportunities} />
        <ListSection title="Recommendations" items={analysis.recommendations} />
        {analysis.signals.length ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Signals</p>
            <ul className="mt-3 grid gap-2">
              {analysis.signals.map((signal) => (
                <li key={signal.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-white/68">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{signal.title}</span>
                    <Badge variant={signal.severity === "critical" ? "risk" : "default"}>{signal.severity}</Badge>
                  </div>
                  <p className="mt-2 leading-6">{signal.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <HistoryDetailHeader entry={entry} />
      <p className="text-sm text-white/55">This history entry type is no longer supported in the current workspace.</p>
    </div>
  );
}

function HistoryDetailHeader({ entry }: { entry: WorkspaceHistoryEntry }) {
  const Icon = kindIcons[entry.kind] ?? FileCheck2;

  function downloadMarkdown() {
    if (entry.payload.kind === "gtm_briefing") {
      downloadGtmBriefing(entry.payload.query, entry.payload.analysis, {
        provider: entry.provider,
        format: "markdown",
      });
      return;
    }
    if (entry.payload.kind === "world_engine") {
      downloadWorldReport(entry.payload.report, "markdown");
    }
  }

  function downloadJson() {
    if (entry.payload.kind === "gtm_briefing") {
      downloadGtmBriefing(entry.payload.query, entry.payload.analysis, {
        provider: entry.provider,
        format: "json",
      });
      return;
    }
    if (entry.payload.kind === "world_engine") {
      downloadWorldReport(entry.payload.report, "json");
    }
  }

  const canDownload =
    entry.payload.kind === "gtm_briefing" || entry.payload.kind === "world_engine";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-5 w-5 text-santra-cyan" />
        <Badge variant="cyan">{historyKindLabel(entry.kind)}</Badge>
        {entry.provider && <Badge variant="default">{entry.provider}</Badge>}
        <span className="text-xs text-white/40">{new Date(entry.createdAt).toLocaleString()}</span>
      </div>
      {canDownload ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={downloadMarkdown}>
            <FileText className="h-4 w-4" /> Download brief
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={downloadJson}>
            <Download className="h-4 w-4" /> JSON
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{title}</p>
      <ul className="mt-3 grid gap-2">
        {items.map((item, index) => {
          const text = coerceTextListItem(item);
          if (!text) return null;
          return (
            <li
              key={`${title}-${index}-${text.slice(0, 48)}`}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-white/68"
            >
              {text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReportSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{title}</p>
      <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-white/68">
        {body}
      </p>
    </div>
  );
}
