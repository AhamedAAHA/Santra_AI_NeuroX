"use client";

import Link from "next/link";
import { ArrowRight, Radar, Rocket, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { LiveSignalsPanel } from "@/components/dashboard/live-signals-panel";
import { StartupIntelligenceScanner } from "@/components/dashboard/startup-intelligence-scanner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WorkspacePage, WorkspacePageHeader, WorkspaceSection } from "@/components/workspace/workspace-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardSignals } from "@/hooks/use-dashboard-signals";

export default function DashboardPage() {
  const { signals, source, loading, lastUpdated } = useDashboardSignals();
  const criticalSignals = signals.filter((signal) => signal.severity === "critical").length;
  const competitorSignals = signals.filter((signal) => signal.category === "competitor").length;
  const marketSignals = signals.filter((signal) => signal.category === "market").length;

  const metrics = [
    {
      icon: Radar,
      label: "GTM monitors",
      value: "Agent loop",
      trend: "HITL gated",
      tone: "live" as const,
    },
    {
      icon: Target,
      label: "Competitor intel",
      value: "Battlecards",
      trend: "Pricing + hiring",
      tone: "neutral" as const,
    },
    {
      icon: TrendingUp,
      label: "Risk index",
      value: "0–100",
      trend: "Executive briefs",
      tone: "live" as const,
    },
    {
      icon: Rocket,
      label: "Approved actions",
      value: "CRM ready",
      trend: "Webhook queue",
      tone: "neutral" as const,
    },
  ];

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="B2B GTM Agent"
        title="SANTRA AI — Autonomous GTM Intelligence"
        description="Monitor competitors, collect live evidence, and route executive briefs to your revenue stack — with human approval before automation runs."
      />

      <WorkspaceSection
        title="Competitive intelligence monitors"
        description="Lead with the GTM agent: create monitors on /alerts for autonomous competitive tracking with human-in-the-loop approvals."
      >
        <Card className="p-6" glow>
          <p className="text-sm leading-7 text-white/65">
            Open <strong className="text-white">GTM Monitors</strong> to run the full agent loop — intent parsing,
            Exa and Bright Data collection, change detection, executive reports, and the approval queue.
          </p>
          <Button asChild variant="neon" className="mt-4">
            <Link href="/alerts">
              Open GTM Monitors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </WorkspaceSection>

      <WorkspaceSection
        title="Idea validation (optional)"
        description="Secondary module for early-stage concept scoring — the primary NeuroX workflow is GTM Monitors on /alerts."
      >
        <StartupIntelligenceScanner />
      </WorkspaceSection>

      <WorkspaceSection
        title="Platform capabilities"
        description="B2B GTM intelligence tooling for competitive monitoring, analyst workflows, and approved automation."
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        title="Live GTM signals"
        description="Competitor, pricing, and risk signals from your monitors and latest agent analysis runs."
      >
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6" glow>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/35">Intelligence status</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {loading
                    ? "Syncing live GTM signals..."
                    : source === "live"
                      ? "Live briefing intelligence online"
                      : source === "monitor"
                        ? "Monitor-driven intelligence online"
                        : "Preview intelligence mode"}
                </h3>
              </div>
              <Radar className="h-6 w-6 text-sentra-cyan" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={TrendingUp}
                label="Total signals"
                value={String(signals.length)}
                trend={source === "sample" ? "Preview data" : "Live stream"}
                tone={source === "sample" ? "neutral" : "live"}
              />
              <MetricCard
                icon={Target}
                label="Competitor signals"
                value={String(competitorSignals)}
                trend="Positioning + pricing shifts"
                tone="neutral"
              />
              <MetricCard
                icon={ShieldAlert}
                label="Critical signals"
                value={String(criticalSignals)}
                trend={criticalSignals > 0 ? "Immediate review needed" : "No urgent alerts"}
                tone={criticalSignals > 0 ? "attention" : "live"}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="neon">
                <Link href="/alerts">
                  Open GTM Monitors <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/chat">Ask GTM Advisor</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/42">
              Market signals: {marketSignals}. Data source:{" "}
              {source === "sample" ? "preview intelligence" : source === "monitor" ? "monitor checks" : "live analysis"}.
            </p>
          </Card>

          <LiveSignalsPanel signals={signals.slice(0, 8)} source={source} loading={loading} lastUpdated={lastUpdated} />
        </div>
      </WorkspaceSection>

      <WorkspaceSection title="Go deeper">
        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <Card className="p-6" glow>
            <Target className="h-7 w-7 text-sentra-cyan" />
            <h3 className="mt-5 text-2xl font-semibold text-white">GTM Command Center</h3>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Generate ICP, personas, channels, launch plans, and positioning for B2B revenue teams.
            </p>
          </Card>
          <Card className="p-6" glow>
            <Rocket className="h-7 w-7 text-sentra-cyan" />
            <h3 className="mt-5 text-2xl font-semibold text-white">Executive rollout plan</h3>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Turn monitor findings into 7-day, 30-day, and 90-day GTM response plans for your team.
            </p>
            <Button asChild variant="neon" className="mt-5">
              <Link href="/chat">
                Ask SANTRA AI <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </WorkspaceSection>
    </WorkspacePage>
  );
}
