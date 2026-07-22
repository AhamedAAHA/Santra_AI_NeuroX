"use client";

import Link from "next/link";
import { ArrowRight, Radar, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { LiveSignalsPanel } from "@/components/dashboard/live-signals-panel";
import { WorkspacePage, WorkspacePageHeader, WorkspaceSection } from "@/components/workspace/workspace-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDashboardSignals } from "@/hooks/use-dashboard-signals";

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  hint: string;
  tone?: "live" | "attention" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
            tone === "attention" ? "bg-rose-400/10 text-rose-200" : "bg-cyan-300/10 text-sentra-cyan",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-white">{value}</p>
        </div>
      </div>
      <p
        className={cn(
          "mt-2 truncate text-[11px]",
          tone === "attention" ? "text-rose-200/75" : tone === "live" ? "text-emerald-200/75" : "text-white/40",
        )}
      >
        {hint}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { signals, source, loading, lastUpdated } = useDashboardSignals();
  const criticalSignals = signals.filter((signal) => signal.severity === "critical").length;
  const competitorSignals = signals.filter((signal) => signal.category === "competitor").length;
  const marketSignals = signals.filter((signal) => signal.category === "market").length;

  const sourceHint =
    source === "sample" ? "Preview data" : source === "monitor" ? "From monitors" : "Live analysis";

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="B2B GTM Agent"
        title="Command center"
        description="Status from your monitors and signals — approve actions before automation runs."
        actions={
          <Button asChild variant="neon" size="sm">
            <Link href="/alerts">
              Open GTM Monitors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="Total signals"
          value={loading ? "…" : String(signals.length)}
          hint={sourceHint}
          tone={source === "sample" ? "neutral" : "live"}
        />
        <Kpi
          icon={Target}
          label="Competitor"
          value={loading ? "…" : String(competitorSignals)}
          hint="Positioning + pricing"
        />
        <Kpi
          icon={ShieldAlert}
          label="Critical"
          value={loading ? "…" : String(criticalSignals)}
          hint={criticalSignals > 0 ? "Needs review" : "All clear"}
          tone={criticalSignals > 0 ? "attention" : "live"}
        />
        <Kpi
          icon={Radar}
          label="Market"
          value={loading ? "…" : String(marketSignals)}
          hint="Category mix"
        />
      </div>

      <WorkspaceSection title="Live signals" description="Latest competitor, pricing, and risk activity.">
        <Card className="p-4 md:p-5" glow>
          <LiveSignalsPanel
            signals={signals.slice(0, 6)}
            source={source}
            loading={loading}
            lastUpdated={lastUpdated}
            variant="embedded"
          />
        </Card>
      </WorkspaceSection>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/40">
        <Link href="/alerts" className="text-sentra-cyan/90 underline-offset-2 hover:underline">
          GTM Monitors (demo path)
        </Link>
        <Link href="/chat?mode=ask" className="underline-offset-2 hover:text-white/70 hover:underline">
          Ask GTM Advisor
        </Link>
        <Link href="/chat?mode=brief" className="underline-offset-2 hover:text-white/70 hover:underline">
          Deep brief
        </Link>
        <Link href="/chat?mode=validate" className="underline-offset-2 hover:text-white/70 hover:underline">
          Market validation
        </Link>
        <Link href="/reports" className="underline-offset-2 hover:text-white/70 hover:underline">
          History
        </Link>
      </p>
    </WorkspacePage>
  );
}
