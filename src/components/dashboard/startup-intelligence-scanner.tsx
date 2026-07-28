"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Gauge,
  LineChart,
  Loader2,
  MapPin,
  Rocket,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readResponseJson } from "@/lib/http/read-response-json";
import { syncLocalSessionToCookie } from "@/lib/local-auth";
import { cn } from "@/lib/utils";
import type { RiskLevel, StartupIntelligenceReport } from "@/types/startup-intelligence";

type ScoreKey = keyof StartupIntelligenceReport["scores"];

const scoreLabels: Record<Exclude<ScoreKey, "santraScore">, string> = {
  marketPotential: "Market Potential",
  competitionLevel: "Competition Level",
  executionDifficulty: "Execution Difficulty",
  revenuePotential: "Revenue Potential",
  scalability: "Scalability",
  riskLevel: "Risk Level",
};

function ScoreBar({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-white/65">{label}</span>
        <span className={cn("text-lg font-semibold", highlight ? "text-sentra-cyan" : "text-white")}>{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all duration-700", highlight ? "bg-sentra-cyan" : "bg-violet-400/80")}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ListSection({ title, items, accent }: { title: string; items: string[]; accent?: "cyan" | "rose" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-white/62">
            <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", accent === "rose" ? "bg-rose-300" : "bg-sentra-cyan")} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskChip({ level }: { level: RiskLevel }) {
  const color = level === "green" ? "success" : level === "yellow" ? "default" : "risk";
  return <Badge variant={color}>{level.toUpperCase()}</Badge>;
}

function RiskList({
  title,
  items,
}: {
  title: string;
  items: Array<{ item: string; level: RiskLevel }>;
}) {
  return (
    <Card className="p-4" glow>
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((entry) => (
          <div key={`${title}-${entry.item}`} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs leading-5 text-white/65">{entry.item}</p>
            <RiskChip level={entry.level} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StartupIntelligenceScanner({ embedded = false }: { embedded?: boolean }) {
  const [startupIdea, setStartupIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [sriLankaMode, setSriLankaMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<StartupIntelligenceReport | null>(null);
  const [provider, setProvider] = useState<"openai" | "demo" | null>(null);

  const riskCount = useMemo(() => {
    if (!report) return 0;
    return [
      ...report.startupRiskIntelligence.technicalRisks,
      ...report.startupRiskIntelligence.marketRisks,
      ...report.startupRiskIntelligence.legalRisks,
      ...report.startupRiskIntelligence.operationalRisks,
      ...report.startupRiskIntelligence.financialRisks,
    ].length;
  }, [report]);

  async function generateBriefing() {
    if (!startupIdea.trim() || !industry.trim() || !country.trim() || !targetAudience.trim()) {
      toast.error("Complete all required fields", {
        description: "Enter opportunity, industry, country/market, and ICP / target buyers.",
      });
      return;
    }

    setLoading(true);
    try {
      syncLocalSessionToCookie();
      const response = await fetch("/api/startup-intelligence", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupIdea: startupIdea.trim(),
          industry: industry.trim(),
          country: country.trim(),
          targetAudience: targetAudience.trim(),
          competitorName: competitorName.trim() || undefined,
          sriLankaMode,
        }),
      });

      const data = await readResponseJson<{ report?: StartupIntelligenceReport; provider?: "openai" | "demo"; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(data.error || "Could not generate intelligence briefing.");
      }

      if (data.report) {
        setReport(data.report);
        setProvider(data.provider ?? "openai");
        toast.success("Market validation ready", {
          description:
            data.provider === "demo" ? "Using demo data - add OpenAI key for live analysis." : "Powered by OpenAI.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Briefing failed.";
      toast.error("Generation failed", { description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Card className={cn("p-5 md:p-6", embedded && "border-white/[0.08]")} glow={!embedded}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {!embedded && (
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-5 w-5 text-sentra-cyan" />
                <p className="font-semibold text-white">B2B Market Validation</p>
              </div>
            )}
            <p className={cn("text-sm text-white/50", !embedded && "mt-2", embedded && "text-white/55")}>
              {embedded
                ? "Enter opportunity, ICP, and market — get competitive fit and GTM playbooks."
                : "Validate a B2B opportunity for RevOps and GTM teams — ICP fit, competitive pressure, demand signals, and go-to-market playbooks."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sriLankaMode}
            onClick={() => setSriLankaMode((value) => !value)}
            className={cn(
              "sentra-focus flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
              sriLankaMode
                ? "border-cyan-200/35 bg-cyan-300/12 text-cyan-50"
                : "border-white/10 bg-white/[0.04] text-white/55",
            )}
          >
            Sri Lanka mode
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1.5 md:col-span-2 xl:col-span-3">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">B2B opportunity</span>
            <input
              value={startupIdea}
              onChange={(event) => setStartupIdea(event.target.value)}
              placeholder="e.g. Autonomous competitor monitoring for RevOps teams"
              className="sentra-focus rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Industry</span>
            <input
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="e.g. B2B SaaS / RevOps"
              className="sentra-focus rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Country / market</span>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="e.g. United States / APAC"
              className="sentra-focus rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">ICP / buyers</span>
            <input
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              placeholder="e.g. VP Sales, RevOps leads"
              className="sentra-focus rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
          <label className="grid gap-1.5 md:col-span-2 xl:col-span-3">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Competitor (optional)</span>
            <input
              value={competitorName}
              onChange={(event) => setCompetitorName(event.target.value)}
              placeholder="e.g. Crayon, Klue, Kompyte"
              className="sentra-focus rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </div>

        <Button variant="neon" className="mt-5" onClick={generateBriefing} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Validate market opportunity
        </Button>
      </Card>

      {loading && !report && (
        <Card className="p-6 text-sm text-white/55" glow>
          Building B2B market validation with live model analysis...
        </Card>
      )}

      {report && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={provider === "openai" ? "cyan" : "violet"}>
              {provider === "openai" ? "OpenAI - Live analysis" : "Demo mode"}
            </Badge>
            {sriLankaMode && <Badge variant="success">🇱🇰 Sri Lanka tailored</Badge>}
            <Badge variant="violet">{riskCount} risk signals mapped</Badge>
          </div>

          <Card className="p-6" glow>
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">Executive Summary</p>
            <p className="mt-3 text-sm leading-7 text-white/72">{report.executiveSummary}</p>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <ListSection title="Market Opportunities" items={report.marketOpportunities} />
            <ListSection title="Competitor Analysis" items={report.competitorAnalysis} />
            <ListSection title="Key Risks" items={report.risks} accent="rose" />
            <Card className="p-4" glow>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sentra-cyan" />
                <p className="text-sm font-medium text-white">Growth Potential</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/62">{report.growthPotential}</p>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6" glow>
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-sentra-cyan" />
                <h3 className="text-xl font-semibold text-white">Market Size Estimate</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/68">{report.marketSizeEstimate}</p>
            </Card>
            <Card className="p-6" glow>
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-sentra-cyan" />
                <h3 className="text-xl font-semibold text-white">Suggested Business Model</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/68">{report.suggestedBusinessModel}</p>
            </Card>
          </div>

          <Card className="p-6" glow>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-sentra-cyan" />
              <h3 className="text-xl font-semibold text-white">GTM Command Center</h3>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-sentra-cyan" />
                  <p className="text-sm font-medium text-white">Customer Persona</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/62">{report.gtm.customerPersona}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-medium text-white">Ideal Customer Profile (ICP)</p>
                <p className="mt-3 text-sm leading-6 text-white/62">{report.gtm.idealCustomerProfile}</p>
              </Card>
              <ListSection title="Acquisition Channels" items={report.gtm.acquisitionChannels} />
              <ListSection title="Launch Plan" items={report.gtm.launchPlan} />
              <ListSection title="Pricing Suggestions" items={report.gtm.pricingSuggestions} />
              <ListSection title="Growth Loops" items={report.gtm.growthLoops} />
              <ListSection title="Marketing Strategy" items={report.gtm.marketingStrategy} />
              <Card className="p-4 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sentra-cyan" />
                  <p className="text-sm font-medium text-white">Positioning Statement</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">{report.gtm.positioningStatement}</p>
              </Card>
            </div>
          </Card>

          <Card className="p-6" glow>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-sentra-cyan" />
                <h3 className="text-xl font-semibold text-white">Opportunity Score Engine</h3>
              </div>
              <div className="rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-4 py-2 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">SANTRA Opportunity Score</p>
                <p className="text-3xl font-bold text-white">{report.scores.santraScore}/100</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(Object.keys(scoreLabels) as Array<Exclude<ScoreKey, "santraScore">>).map((key) => (
                <ScoreBar key={key} label={scoreLabels[key]} value={report.scores[key]} />
              ))}
            </div>
          </Card>

          <Card className="p-6" glow>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-sentra-cyan" />
              <h3 className="text-xl font-semibold text-white">GTM Risk Intelligence</h3>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <RiskList title="Technical Risks" items={report.startupRiskIntelligence.technicalRisks} />
              <RiskList title="Market Risks" items={report.startupRiskIntelligence.marketRisks} />
              <RiskList title="Legal Risks" items={report.startupRiskIntelligence.legalRisks} />
              <RiskList title="Operational Risks" items={report.startupRiskIntelligence.operationalRisks} />
              <RiskList title="Financial Risks" items={report.startupRiskIntelligence.financialRisks} />
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6" glow>
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-sentra-cyan" />
                <h3 className="text-xl font-semibold text-white">Competitor Intelligence</h3>
              </div>
              <p className="mt-3 text-sm text-white/68">Focused competitor: {report.competitorIntelligence.competitorName}</p>
              <div className="mt-4 grid gap-3">
                <ListSection title="Strengths" items={report.competitorIntelligence.strengths} />
                <ListSection title="Weaknesses" items={report.competitorIntelligence.weaknesses} accent="rose" />
                <ListSection title="Market Gaps" items={report.competitorIntelligence.marketGaps} />
                <ListSection title="Differentiation Opportunities" items={report.competitorIntelligence.differentiationOpportunities} />
                <ListSection title='"How can I beat this competitor?"' items={report.competitorIntelligence.howToBeat} />
              </div>
            </Card>

            <Card className="p-6" glow>
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-sentra-cyan" />
                <h3 className="text-xl font-semibold text-white">Competitor Battle Card</h3>
              </div>
              <p className="mt-3 text-sm text-white/68">You vs {report.competitorBattleCard.competitorName}</p>
              <div className="mt-4 grid gap-3">
                <ListSection title="Feature Comparison" items={report.competitorBattleCard.featureComparison} />
                <ListSection title="Pricing Comparison" items={report.competitorBattleCard.pricingComparison} />
                <ListSection title="Market Position" items={report.competitorBattleCard.marketPositionComparison} />
                <ListSection title="Differentiation" items={report.competitorBattleCard.differentiation} />
              </div>
              <Card className="mt-4 p-4">
                <p className="text-sm font-medium text-white">Recommended attack strategy</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{report.competitorBattleCard.recommendedAttackStrategy}</p>
              </Card>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6" glow>
              <h3 className="text-xl font-semibold text-white">Startup Validation Engine</h3>
              <p className="mt-3 text-sm leading-6 text-white/68">{report.startupValidationEngine.isProblemWorthSolving}</p>
              <div className="mt-4 grid gap-3">
                <ListSection title="Existing Solutions" items={report.startupValidationEngine.existingSolutions} />
                <ListSection title="Customer Pain Points" items={report.startupValidationEngine.customerPainPoints} />
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-200/25 bg-cyan-300/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">Validation Score</p>
                <p className="mt-2 text-3xl font-bold text-white">{report.startupValidationEngine.validationScore}/100</p>
              </div>
            </Card>

            <Card className="p-6" glow>
              <h3 className="text-xl font-semibold text-white">Investor Readiness Analyzer</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Attractiveness</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{report.investorReadiness.investorAttractivenessScore}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Funding Readiness</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{report.investorReadiness.fundingReadinessScore}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/68">{report.investorReadiness.wouldInvestorsFundThis}</p>
              <div className="mt-4 grid gap-3">
                <ListSection title="Key Weaknesses" items={report.investorReadiness.keyWeaknesses} accent="rose" />
                <ListSection title="What Investors Will Ask" items={report.investorReadiness.investorQuestions} />
                <ListSection title="Suggested Improvements" items={report.investorReadiness.suggestedImprovements} />
              </div>
            </Card>
          </div>

          <Card className="p-6" glow>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sentra-cyan" />
              <h3 className="text-xl font-semibold text-white">Founder Action Plan</h3>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              <ListSection title="Next 7 Days" items={report.actionPlan.next7Days} />
              <ListSection title="Next 30 Days" items={report.actionPlan.next30Days} />
              <ListSection title="Next 90 Days" items={report.actionPlan.next90Days} />
              <ListSection title="Next 180 Days" items={report.actionPlan.next180Days} />
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="p-6 xl:col-span-2" glow>
              <h3 className="text-xl font-semibold text-white">Executive Summary Page (One-Page Briefing)</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ListSection title="Opportunity overview" items={[report.executiveBriefing.startupOverview]} />
                <ListSection title="Market Opportunity" items={[report.executiveBriefing.marketOpportunity]} />
                <ListSection title="Competition" items={[report.executiveBriefing.competition]} />
                <ListSection title="GTM Strategy" items={[report.executiveBriefing.gtmStrategy]} />
                <ListSection title="Risks" items={[report.executiveBriefing.risks]} />
                <ListSection title="Funding Readiness" items={[report.executiveBriefing.fundingReadiness]} />
              </div>
              <ListSection title="Action Plan" items={[report.executiveBriefing.actionPlan]} />
              <p className="mt-4 text-xs text-white/42">PDF export can be added from this structured section.</p>
            </Card>

            <Card className="p-6" glow>
              <h3 className="text-xl font-semibold text-white">GTM Opportunity Score</h3>
              <div className="mt-4 grid gap-3">
                <ScoreBar label="Innovation" value={report.startupDnaScore.innovation} />
                <ScoreBar label="Scalability" value={report.startupDnaScore.scalability} />
                <ScoreBar label="Defensibility" value={report.startupDnaScore.defensibility} />
                <ScoreBar label="Revenue Potential" value={report.startupDnaScore.revenuePotential} />
                <ScoreBar label="Market Timing" value={report.startupDnaScore.marketTiming} />
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-200/25 bg-cyan-300/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">Overall</p>
                <p className="mt-2 text-3xl font-bold text-white">{report.startupDnaScore.overall}/100</p>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6" glow>
              <h3 className="text-xl font-semibold text-white">Pitch Deck Generator</h3>
              <div className="mt-4 grid gap-3">
                <ListSection title="Problem" items={[report.pitchDeckGenerator.problem]} />
                <ListSection title="Solution" items={[report.pitchDeckGenerator.solution]} />
                <ListSection title="Market" items={[report.pitchDeckGenerator.market]} />
                <ListSection title="Business Model" items={[report.pitchDeckGenerator.businessModel]} />
                <ListSection title="Competition" items={[report.pitchDeckGenerator.competition]} />
                <ListSection title="GTM" items={[report.pitchDeckGenerator.gtm]} />
                <ListSection title="Financials" items={[report.pitchDeckGenerator.financials]} />
                <ListSection title="Ask" items={[report.pitchDeckGenerator.ask]} />
              </div>
            </Card>
            <Card className="p-6" glow>
              <h3 className="text-xl font-semibold text-white">First Customer Playbook</h3>
              <div className="mt-4 grid gap-3">
                <ListSection title="Get First 10 Customers" items={report.firstCustomerPlaybook.first10Customers} />
                <ListSection title="Get First 50 Customers" items={report.firstCustomerPlaybook.first50Customers} />
                <ListSection title="Get First 100 Customers" items={report.firstCustomerPlaybook.first100Customers} />
                {sriLankaMode && (
                  <ListSection title="Sri Lanka Mode Insights" items={report.sriLankaModeInsights} />
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
