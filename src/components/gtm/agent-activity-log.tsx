"use client";

import { useEffect, useMemo, useState } from "react";
import { AGENT_GRAPH_NODES, activeGraphNodeIds } from "@/lib/agent/graph";
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
  notify_email: "text-teal-200",
};

/** Expected stages shown while a check is in flight (transparent reasoning for demos). */
export const LIVE_REASONING_PREVIEW: Array<Pick<GtmAgentStage, "stage" | "label" | "detail">> = [
  { stage: "intake", label: "Plan · goal received", detail: "Parsing monitor requirement…" },
  { stage: "routing", label: "Tool router", detail: "Selecting Bright Data / Exa / LLM tools…" },
  { stage: "collection", label: "Collect", detail: "Gathering live web intelligence…" },
  { stage: "change_detection", label: "Observe", detail: "Diffing snapshots + noise filter…" },
  { stage: "analysis", label: "Reason", detail: "Synthesizing grounded brief…" },
  { stage: "report", label: "Reflect · scored report", detail: "Risk · confidence · importance…" },
  { stage: "hitl_queue", label: "Human review", detail: "Approval inbox before anything is sent…" },
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
    () => visibleEntries.map((entry) => entry.stage),
    [visibleEntries],
  );

  const graphActive = useMemo(
    () => activeGraphNodeIds(activeStageNames),
    [activeStageNames],
  );

  const recoveryCount = stages.filter((entry) => entry.stage === "fallback").length;
  const memoryUsed = stages.some((entry) => entry.stage === "memory");
  const hitlQueued = stages.some((entry) => entry.stage === "hitl_queue");

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px]",
        className,
      )}
      role="log"
      aria-live="polite"
      aria-label="GTM agent decision graph"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Agent graph</p>
          <p className="mt-1 text-[11px] text-white/45">
            plan → collect → observe → reason → HITL → execute → audit
          </p>
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
          {hitlQueued && (
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] text-emerald-100">
              HITL gated
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
        {AGENT_GRAPH_NODES.map((node) => {
          const hit = graphActive.has(node.id);
          const recovering = node.id === "collect" && activeStageNames.includes("fallback");
          return (
            <span
              key={node.id}
              title={node.detail}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] tracking-wide transition",
                hit
                  ? recovering
                    ? "border-amber-300/35 bg-amber-300/10 text-amber-50"
                    : node.id === "human_review"
                      ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-50"
                      : "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                  : "border-white/10 bg-white/[0.03] text-white/35",
              )}
            >
              {node.label}
            </span>
          );
        })}
      </div>

      {!stages.length && !running && (
        <p className="text-white/40">&gt; Agent idle — run Check now to watch the decision graph</p>
      )}
      <ul className="grid gap-2">
        {visibleEntries.map((entry, index) => (
          <li
            key={`${"timestamp" in entry ? entry.timestamp : "preview"}-${entry.stage}-${index}`}
            className={cn(
              "grid gap-0.5 rounded-xl px-2 py-1.5",
              entry.stage === "fallback" && "border border-amber-300/20 bg-amber-300/[0.06]",
              entry.stage === "memory" && "border border-sky-300/15 bg-sky-300/[0.05]",
              entry.stage === "hitl_queue" && "border border-emerald-300/20 bg-emerald-300/[0.06]",
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
