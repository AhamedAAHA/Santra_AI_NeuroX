"use client";

import type { ReactNode } from "react";
import { AlertTriangle, BriefcaseBusiness, LineChart, Megaphone, Tags } from "lucide-react";
import { signalStream } from "@/data/mock-intelligence";
import { cn } from "@/lib/utils";
import type { IntelligenceSignal, Severity } from "@/types/intelligence";
import { Card } from "@/components/ui/card";

const severityClass: Record<Severity, string> = {
  low: "border-sky-300/20 bg-sky-400/10 text-sky-100",
  medium: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  high: "border-orange-300/20 bg-orange-400/10 text-orange-100",
  critical: "border-rose-300/25 bg-rose-400/10 text-rose-100",
};

const categoryIcon: Record<IntelligenceSignal["category"], typeof AlertTriangle> = {
  competitor: Megaphone,
  market: LineChart,
  risk: AlertTriangle,
  pricing: Tags,
  hiring: BriefcaseBusiness,
  sentiment: AlertTriangle,
};

function formatSignalTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SignalFeed({
  signals = signalStream,
  headerMeta,
  variant = "card",
  footer,
}: {
  signals?: IntelligenceSignal[];
  headerMeta?: ReactNode;
  variant?: "card" | "embedded";
  footer?: ReactNode;
}) {
  const embedded = variant === "embedded";

  const content = (
    <>
      <div className={cn("flex flex-wrap items-start justify-between gap-4", embedded ? "mb-4" : "mb-6")}>
        <div className="min-w-0">
          {!embedded && <p className="text-sm uppercase tracking-[0.24em] text-white/35">Live signals</p>}
          {embedded ? (
            <h4 className="text-sm font-medium text-white/70">Activity</h4>
          ) : (
            <h3 className="mt-2 text-2xl font-semibold text-white">Autonomous activity feed</h3>
          )}
        </div>
        <div className="flex items-center gap-3">
          {headerMeta}
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sentra-cyan opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-sentra-cyan" />
          </span>
        </div>
      </div>
      <div className={cn("grid gap-3", embedded && "max-h-[28rem] overflow-y-auto overscroll-contain pr-1")}>
        {signals.map((signal) => {
          const Icon = categoryIcon[signal.category];
          return (
            <div
              key={signal.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors"
            >
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-sentra-cyan">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{signal.title}</h4>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", severityClass[signal.severity])}>
                      {signal.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/50 line-clamp-2">{signal.summary}</p>
                  <p className="mt-1.5 break-words text-[11px] text-white/35">
                    {signal.source} · {Math.round(signal.confidence * 100)}% · {formatSignalTime(signal.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {signals.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/45">
            No matching signals for this.
          </div>
        )}
      </div>
      {footer}
    </>
  );

  if (embedded) {
    return (
      <div id="signals" className="scroll-mt-28">
        {content}
      </div>
    );
  }

  return (
    <Card id="signals" className="scroll-mt-28 p-5 md:p-6" glow>
      {content}
    </Card>
  );
}
