"use client";

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

type AgentActivityLogProps = {
  stages: GtmAgentStage[];
  running?: boolean;
  className?: string;
};

export function AgentActivityLog({ stages, running, className }: AgentActivityLogProps) {
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
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/35">Agent activity</p>
      {!stages.length && !running && (
        <p className="text-white/40">&gt; Agent idle — run a monitor check to see reasoning steps</p>
      )}
      <ul className="grid gap-2">
        {stages.map((entry) => (
          <li key={`${entry.timestamp}-${entry.stage}`} className="grid gap-0.5">
            <span className={cn("font-semibold", stageTone[entry.stage])}>
              [{entry.stage}] {entry.label}
            </span>
            <span className="text-white/55">{entry.detail}</span>
          </li>
        ))}
      </ul>
      {running && <p className="mt-2 text-cyan-200/80">&gt; Agent running…</p>}
    </div>
  );
}
