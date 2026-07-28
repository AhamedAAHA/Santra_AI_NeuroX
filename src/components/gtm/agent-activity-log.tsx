"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { GtmAgentStage, GtmAgentStageName } from "@/types/gtm-agent";

const stageTone: Record<GtmAgentStageName, string> = {
  intake: "text-cyan-200",
  routing: "text-violet-200",
  collection: "text-blue-200",
  fallback: "text-amber-200",
  memory: "text-sky-200",
  analysis: "text-fuchsia-200",
  change_detection: "text-rose-200",
  report: "text-emerald-200",
  hitl_queue: "text-amber-100",
};

const TRAIL_STEPS: Array<{ id: string; label: string; stages: GtmAgentStageName[] }> = [
  { id: "goal", label: "1 · Goal", stages: ["intake"] },
  { id: "route", label: "2 · Tool route", stages: ["routing", "memory"] },
  { id: "tools", label: "3 · Tools", stages: ["fallback", "collection"] },
  { id: "decide", label: "4 · Decide", stages: ["change_detection", "analysis"] },
  { id: "result", label: "5 · Result", stages: ["report", "hitl_queue"] },
];

/** Expected stages shown while a check is in flight (transparent reasoning for demos). */
export const LIVE_REASONING_PREVIEW: Array<Pick<GtmAgentStage, "stage" | "label" | "detail">> = [
  { stage: "intake", label: "Goal received", detail: "Parsing monitor requirement…" },
  { stage: "routing", label: "Tool route planned", detail: "Selecting Bright Data / Exa / LLM tools…" },
  { stage: "collection", label: "Collecting evidence", detail: "Gathering live web intelligence…" },
  { stage: "change_detection", label: "Change detection", detail: "Diffing against prior snapshot…" },
  { stage: "analysis", label: "Executive analysis", detail: "Synthesizing grounded brief…" },
  { stage: "report", label: "Executive report", detail: "Packaging verdict, risks, actions…" },
  { stage: "hitl_queue", label: "HITL gate", detail: "Queueing CRM action for human approval…" },
];

type AgentActivityLogProps = {
  stages: GtmAgentStage[];
  running?: boolean;
  className?: string;
};

export function AgentActivityLog({ stages, running, className }: AgentActivityLogProps) {
  const [previewCount, setPreviewCount] = useState(1);
  const showPreview = Boolean(running) && stages.length === 0;

  useEffect(() => {
    if (!showPreview) return;

    const resetId = window.setTimeout(() => {
      setPreviewCount(1);
    }, 0);

    const tickId = window.setInterval(() => {
      setPreviewCount((count) => Math.min(count + 1, LIVE_REASONING_PREVIEW.length));
    }, 900);

    return () => {
      window.clearTimeout(resetId);
      window.clearInterval(tickId);
    };
  }, [showPreview]);

  const visibleEntries = showPreview
    ? LIVE_REASONING_PREVIEW.slice(0, previewCount)
    : stages;

  const activeStageNames = useMemo(
    () => new Set(visibleEntries.map((entry) => entry.stage)),
    [visibleEntries],
  );

  const recoveryCount = stages.filter((entry) => entry.stage === "fallback").length;
  const memoryUsed = stages.some((entry) => entry.stage === "memory");

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px]",
        className,
      )}
      role="log"
      aria-live="polite"
      aria-label="GTM agent decision trail"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Decision trail</p>
          <p className="mt-1 text-[11px] text-white/45">Goal → route → tools → decide → result</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {memoryUsed && (
            <span className="rounded-full border border-sky-300/25 bg-sky-300/10 px-2 py-0.5 text-[10px] text-sky-100">
              Memory
            </span>
          )}
          {recoveryCount > 0 && (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-100">
              Recovered ×{recoveryCount}
            </span>
          )}
          {running && (
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100">
              Live
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TRAIL_STEPS.map((step) => {
          const hit = step.stages.some((name) => activeStageNames.has(name));
          const recovering = step.id === "tools" && activeStageNames.has("fallback");
          return (
            <span
              key={step.id}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] tracking-wide transition",
                hit
                  ? recovering
                    ? "border-amber-300/35 bg-amber-300/10 text-amber-50"
                    : "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                  : "border-white/10 bg-white/[0.03] text-white/35",
              )}
            >
              {step.label}
            </span>
          );
        })}
      </div>

      {!stages.length && !running && (
        <p className="text-white/40">&gt; Agent idle — run Check now to watch dynamic tool routing</p>
      )}
      <ul className="grid gap-2">
        {visibleEntries.map((entry, index) => (
          <li
            key={`${"timestamp" in entry ? entry.timestamp : "preview"}-${entry.stage}-${index}`}
            className={cn(
              "grid gap-0.5 rounded-xl px-2 py-1.5",
              entry.stage === "fallback" && "border border-amber-300/20 bg-amber-300/[0.06]",
              entry.stage === "memory" && "border border-sky-300/15 bg-sky-300/[0.05]",
            )}
          >
            <span className={cn("font-semibold", stageTone[entry.stage])}>
              [{entry.stage}] {entry.label}
            </span>
            <span className="text-white/55">{entry.detail}</span>
          </li>
        ))}
      </ul>
      {running && !showPreview && <p className="mt-2 text-cyan-200/80">&gt; Agent still running…</p>}
      {showPreview && <p className="mt-2 animate-pulse text-cyan-200/80">&gt; Reasoning in progress…</p>}
    </div>
  );
}
