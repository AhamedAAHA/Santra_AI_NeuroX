"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Radio,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditableHeadline } from "@/components/reports/editable-headline";
import { ReportTrendChart } from "@/components/reports/report-trend-chart";
import { downloadMonitorReport } from "@/lib/gtm/export-report";
import {
  buildReportViewModel,
  buildRiskTrendPoints,
  type RiskTrendPoint,
} from "@/lib/reports/view-model";
import { claimStatusLabel, normalizeClaimStatus, type ExecutiveIntelligenceReport } from "@/types/intelligence";
import { cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#fb7185",
  high: "#fb923c",
  medium: "#38bdf8",
  low: "#94a3b8",
};

type BriefTab = "charts" | "evidence" | "claims";

function ScoreMeter({
  label,
  value,
  tone,
  caption,
}: {
  label: string;
  value: number;
  tone: "risk" | "confidence";
  caption: string;
}) {
  const fill =
    tone === "risk"
      ? value >= 80
        ? "bg-rose-400"
        : value >= 65
          ? "bg-amber-400"
          : "bg-sky-400"
      : "bg-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p className={`mt-1 text-3xl font-semibold ${tone === "risk" ? "text-rose-100" : "text-cyan-100"}`}>
            {value}
            <span className="text-base font-medium text-white/40">%</span>
          </p>
        </div>
        <p className="max-w-[9rem] text-right text-[11px] leading-4 text-white/40">{caption}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function MonitorIntelBrief({
  report,
  monitorId,
  riskTrend: riskTrendProp,
  onHeadlineChange,
}: {
  report: ExecutiveIntelligenceReport;
  monitorId?: string;
  riskTrend?: RiskTrendPoint[];
  /** Persist edited/deleted headline. Pass empty string to delete. */
  onHeadlineChange?: (headline: string) => void;
}) {
  const [headlineOverride, setHeadlineOverride] = useState<{
    reportId: string;
    value: string;
  } | null>(null);
  const [tab, setTab] = useState<BriefTab>("charts");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [loadedTrend, setLoadedTrend] = useState<RiskTrendPoint[]>([]);

  const localHeadline =
    headlineOverride?.reportId === report.id ? headlineOverride.value : null;

  const displayReport = useMemo(
    () => (localHeadline === null ? report : { ...report, verdict: localHeadline }),
    [report, localHeadline],
  );

  const vm = useMemo(() => buildReportViewModel(displayReport), [displayReport]);
  const headline = localHeadline ?? vm.headline;

  useEffect(() => {
    if (riskTrendProp?.length || !monitorId) return;
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/history", { credentials: "include" });
          if (!response.ok) return;
          const data = (await response.json().catch(() => null)) as {
            entries?: Array<{
              id: string;
              kind?: string;
              createdAt?: string;
              payload?: { kind?: string; monitorId?: string; report?: ExecutiveIntelligenceReport };
            }>;
          } | null;
          const rows = (data?.entries ?? [])
            .filter(
              (entry) =>
                entry.payload?.kind === "monitor_report" &&
                entry.payload.monitorId === monitorId &&
                entry.payload.report,
            )
            .map((entry) => ({
              id: entry.id,
              report: entry.payload!.report!,
              created_at: entry.createdAt,
            }));
          setLoadedTrend(buildRiskTrendPoints(rows, 8));
        } catch {
          // trend is optional
        }
      })();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [monitorId, riskTrendProp]);

  const riskTrend = riskTrendProp?.length ? riskTrendProp : loadedTrend;

  function applyHeadline(next: string) {
    setHeadlineOverride({ reportId: report.id, value: next });
    onHeadlineChange?.(next);
  }

  const filteredChanges = severityFilter
    ? vm.changes.filter((row) => row.severity === severityFilter)
    : vm.changes;

  return (
    <div className="grid gap-6">
      <header className="grid gap-5 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="risk">{vm.riskScore}% exposure</Badge>
            <Badge variant="cyan">{vm.confidence}% evidence quality</Badge>
            <Badge variant={vm.hallucinationRisk === "low" ? "success" : "risk"}>
              {vm.hallucinationRisk} hallucination risk
            </Badge>
            <Badge variant="default">
              {vm.signalCount} signal{vm.signalCount === 1 ? "" : "s"}
            </Badge>
            <Badge variant="default">{vm.provider === "demo" ? "Demo evidence" : vm.provider}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => downloadMonitorReport(displayReport, "markdown")}
            >
              <FileText className="h-4 w-4" /> Download brief
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => downloadMonitorReport(displayReport, "json")}
            >
              <Download className="h-4 w-4" /> JSON
            </Button>
          </div>
        </div>

        <div>
          <EditableHeadline value={headline} onSave={applyHeadline} onDelete={() => applyHeadline("")} />
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-white/50">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-santra-cyan" />
            <span>
              <span className="text-white/35">Monitor · </span>
              {vm.monitorRequirement}
            </span>
          </p>
        </div>

        {vm.competitors.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Competitors in this brief</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {vm.competitors.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-50"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreMeter
            label="Risk (exposure)"
            value={vm.riskScore}
            tone="risk"
            caption="How severe / broad the matched signals are"
          />
          <ScoreMeter
            label="Confidence (evidence)"
            value={vm.confidence}
            tone="confidence"
            caption="How well claims are backed by sources"
          />
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-5">
          <section>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Situation</p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-white/70">
              {vm.situation}
            </p>
          </section>
          <section>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Impact</p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-white/70">
              {vm.impact}
            </p>
          </section>

          {filteredChanges.length ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Observed changes</p>
                {severityFilter ? (
                  <button
                    type="button"
                    className="text-[11px] text-cyan-100/80 hover:text-cyan-50"
                    onClick={() => setSeverityFilter(null)}
                  >
                    Clear {severityFilter} filter
                  </button>
                ) : null}
              </div>
              <ul className="mt-3 grid gap-2">
                {filteredChanges.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white/70"
                  >
                    <p className="leading-6">{row.text}</p>
                    {row.meta && <p className="mt-1 text-[11px] text-white/35">{row.meta}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Action plan</p>
            <ul className="mt-3 grid gap-2">
              {vm.actionPlan.map((text, index) => (
                <li
                  key={`action-${index}-${text.slice(0, 48)}`}
                  className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-white/70"
                >
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid content-start gap-4">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
            {(
              [
                ["charts", "Charts"],
                ["evidence", "Evidence"],
                ["claims", "Claims"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                  tab === id ? "bg-cyan-300/15 text-cyan-50" : "text-white/45 hover:text-white/70",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "charts" ? (
            <div className="grid gap-5">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Risk over time</p>
                <p className="mt-1 text-[11px] text-white/35">Rose = risk · Cyan = confidence</p>
                <div className="mt-3">
                  <ReportTrendChart points={riskTrend} />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Signal severity mix</p>
                <p className="mt-1 text-[11px] text-white/35">Click a bar to filter observed changes</p>
                <div className="mt-3 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vm.severityData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                      <XAxis
                        dataKey="severity"
                        tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{
                          background: "#0c0f1a",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[8, 8, 0, 0]}
                        cursor="pointer"
                        onClick={(data) => {
                          const severity = (data as { severity?: string } | undefined)?.severity;
                          if (!severity) return;
                          setSeverityFilter((current) => (current === severity ? null : severity));
                        }}
                      >
                        {vm.severityData.map((entry) => (
                          <Cell
                            key={entry.severity}
                            fill={SEVERITY_COLORS[entry.severity] ?? "#6272ff"}
                            opacity={!severityFilter || severityFilter === entry.severity ? 1 : 0.35}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {vm.reliabilityData.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Source reliability</p>
                  <div className="mt-3 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={vm.reliabilityData}
                        layout="vertical"
                        margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={78}
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          contentStyle={{
                            background: "#0c0f1a",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="reliability" fill="#53f4ff" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </div>
          ) : null}

          {tab === "claims" ? (
            <section>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Claim verification</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                  {vm.claimStats.backed} evidence-backed
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  {vm.claimStats.partial} partial
                </span>
                <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-rose-100">
                  {vm.claimStats.unsupported} unsupported
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {vm.verifiedClaims.slice(0, 8).map((claim) => {
                  const status = normalizeClaimStatus(claim.status);
                  return (
                    <div key={claim.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            status === "evidence-backed" ? "success" : status === "partial" ? "default" : "risk"
                          }
                        >
                          {claimStatusLabel(status)}
                        </Badge>
                        <span className="text-xs text-cyan-100/58">{claim.confidence}%</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/62">{claim.claim}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {tab === "evidence" ? (
            <section>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Evidence</p>
              <div className="mt-3 grid gap-2">
                {vm.evidenceSources.map((source) => (
                  <div key={source.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{source.publisher}</p>
                        <p className="mt-1 text-xs text-white/40">{source.freshness}</p>
                      </div>
                      <Badge variant={source.reliability >= 80 ? "success" : "default"}>
                        {source.reliability}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/50">{source.claimSupported}</p>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-100"
                      >
                        Open source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <section className="rounded-[24px] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/[0.07] via-transparent to-violet-500/[0.06] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-santra-cyan" />
              <p className="text-sm font-semibold text-white">Read here, then send with your OK</p>
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Needs your OK before sending
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              This brief is your decision room inside SANTRA. After you approve below, we can deliver the same
              summary to Slack, Zapier, or your other tools — where your team already works.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/50 sm:mt-0.5">
            <Radio className="h-3.5 w-3.5 text-emerald-200" />
            Detect → Your OK → Send
          </div>
        </div>

        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-stretch">
          {[
            ["1. Detect", "Monitor finds a meaningful change"],
            ["2. Your OK", "Review this brief, then approve"],
            ["3. Send", "Deliver to Slack / Zapier / CRM"],
          ].map(([step, detail]) => (
            <li
              key={step}
              className="flex h-full min-h-[4.5rem] flex-col justify-center rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
            >
              <p className="text-xs font-medium text-cyan-100">{step}</p>
              <p className="mt-1 text-[11px] leading-4 text-white/45">{detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
          <div className="flex h-full min-h-[9.5rem] flex-col rounded-2xl border border-white/10 bg-black/25 p-3.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Slack / Discord preview</p>
            <p className="mt-2 flex-1 text-sm leading-6 text-white/75">{vm.channel.slackLine}</p>
          </div>
          <div className="flex h-full min-h-[9.5rem] flex-col rounded-2xl border border-white/10 bg-black/25 p-3.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">What gets sent</p>
            <ul className="mt-2 grid flex-1 content-start gap-2">
              {vm.channel.crmFields.map((field) => (
                <li key={field.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-3 text-xs">
                  <span className="text-white/35">{field.label}</span>
                  <span className="truncate text-white/75" title={field.value}>
                    {field.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
