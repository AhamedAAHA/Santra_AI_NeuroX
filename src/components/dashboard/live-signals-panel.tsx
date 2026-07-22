import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignalFeed } from "@/components/dashboard/signal-feed";
import { Badge } from "@/components/ui/badge";
import type { DashboardSignalSource } from "@/hooks/use-dashboard-signals";
import type { IntelligenceSignal } from "@/types/intelligence";

export function LiveSignalsPanel({
  signals,
  source,
  loading,
  lastUpdated,
  variant = "card",
}: {
  signals: IntelligenceSignal[];
  source: DashboardSignalSource;
  loading: boolean;
  lastUpdated: Date | null;
  variant?: "card" | "embedded";
}) {
  return (
    <SignalFeed
      signals={signals}
      variant={variant}
      headerMeta={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/38">
              Synced {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Badge variant={source === "live" || source === "monitor" ? "cyan" : "violet"}>
            {loading
              ? "Syncing signals"
              : source === "live"
                ? "Live briefing signals"
                : source === "monitor"
                  ? "Watchlist intelligence signals"
                  : "Preview signals"}
          </Badge>
        </div>
      }
      footer={
        variant === "embedded" ? (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
            <Link href="/alerts" className="inline-flex items-center gap-1 text-sentra-cyan/90 underline-offset-2 hover:underline">
              Monitors <ArrowRight className="h-3 w-3" />
            </Link>
            <Link href="/reports" className="underline-offset-2 hover:text-white/70 hover:underline">
              History
            </Link>
          </div>
        ) : undefined
      }
    />
  );
}
