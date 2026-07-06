import { planGtmCollection } from "@/lib/bright-data/router";
import { collectFromPlan } from "@/services/gtm-research";
import { collectExaIntelligence, isExaConfigured } from "@/services/exa-search";
import type { GtmAgentCollectionResult, GtmAgentStage } from "@/types/gtm-agent";
import type { GtmEvidenceBundle } from "@/services/bright-data";

function stage(
  stageName: GtmAgentStage["stage"],
  label: string,
  detail: string,
): GtmAgentStage {
  return { stage: stageName, label, detail, timestamp: new Date().toISOString() };
}

export function buildAgentCollectionQuery(input: {
  searchQuery: string;
  targetUrl?: string | null;
}) {
  const query = input.searchQuery.trim();
  const url = input.targetUrl?.trim();
  if (!url) return query;
  if (query.includes(url)) return query;
  return `${query} ${url}`.trim();
}

async function collectWithExaFallback(
  query: string,
  targetUrl?: string | null,
): Promise<GtmEvidenceBundle | null> {
  if (!isExaConfigured()) return null;
  const exa = await collectExaIntelligence(query, targetUrl ?? undefined);
  if (!exa) return null;

  return {
    provider: "exa",
    query: exa.query,
    targetUrl: exa.targetUrl,
    steps: [
      {
        mode: "exa",
        label: "Exa Search",
        evidence: exa.evidence,
      },
    ],
    evidence: exa.evidence,
  };
}

/** Collect live GTM evidence with routed tools, Exa fallback, and stage logging. */
export async function runGtmAgentCollection(input: {
  searchQuery: string;
  targetUrl?: string | null;
  onStage?: (entry: GtmAgentStage) => void;
}): Promise<GtmAgentCollectionResult> {
  const stages: GtmAgentStage[] = [];
  const push = (entry: GtmAgentStage) => {
    stages.push(entry);
    input.onStage?.(entry);
  };

  const query = buildAgentCollectionQuery(input);
  const targetUrl = input.targetUrl?.trim() || undefined;
  push(stage("intake", "Goal received", query.slice(0, 240)));

  const plan = planGtmCollection(query, { preferMcp: true });
  const routeSummary = plan.steps.map((step) => step.label).join(" → ") || "SERP API";
  push(
    stage(
      "routing",
      "Tool route planned",
      `${routeSummary}${plan.useMcp ? " + Bright Data MCP" : ""}`,
    ),
  );

  let bundle = await collectFromPlan(plan, { multiSource: true });
  if (bundle.provider === "demo" && plan.steps.length > 1) {
    push(
      stage(
        "fallback",
        "Bright Data missed",
        "Retrying with alternate Bright Data modes",
      ),
    );
    bundle = await collectFromPlan(
      { ...plan, steps: plan.steps.slice().reverse() },
      { multiSource: false },
    );
  }

  if (bundle.provider === "demo" && isExaConfigured()) {
    push(
      stage(
        "fallback",
        "Switching to Exa",
        "Bright Data unavailable or credits exhausted — using Exa web search",
      ),
    );
    const exaBundle = await collectWithExaFallback(query, targetUrl);
    if (exaBundle) {
      bundle = exaBundle;
    }
  }

  if (bundle.steps.length && bundle.provider !== "demo") {
    const source = bundle.provider === "exa" ? "Exa" : "Bright Data";
    push(
      stage(
        "collection",
        "Evidence collected",
        `${source}: ${bundle.steps.map((step) => step.label).join(", ")}`,
      ),
    );
  } else {
    push(
      stage(
        "fallback",
        "Live evidence unavailable",
        "Continuing with demo or partial evidence for analysis",
      ),
    );
  }

  return {
    evidence: bundle.evidence,
    provider: bundle.provider,
    query: bundle.query,
    targetUrl: bundle.targetUrl,
    plan,
    steps: bundle.steps,
    stages,
  };
}
