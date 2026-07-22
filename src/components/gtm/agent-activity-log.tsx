"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GtmAgentStage } from "@/types/gtm-agent";

const stageTone: Record<GtmAgentStage["stage"], string> = {
  intake: "text-cyan-200",
  routing: "text-violet-200",
  collection: "text-blue-200",
  fallback: "text-amber-200",
  analysis: "text-fuchsia-200",
  change_detection: "text-rose-200",
  report: "text-emerald-200",
  hitl_queue: "text-amber-100",
};

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

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px]",
        className,
      )}
      role="log"
      aria-live="polite"
      aria-label="GTM agent activity"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Agent reasoning</p>
        {running && (
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100">
            Live
          </span>
        )}
      </div>
      {!stages.length && !running && (
        <p className="text-white/40">&gt; Agent idle — run Check now to watch dynamic tool routing</p>
      )}
      <ul className="grid gap-2">
        {visibleEntries.map((entry, index) => (
          <li
            key={`${"timestamp" in entry ? entry.timestamp : "preview"}-${entry.stage}-${index}`}
            className="grid gap-0.5"
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
