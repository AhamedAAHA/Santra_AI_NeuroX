import type { GtmRoutePlan } from "@/lib/bright-data/router";
import type { GtmEvidenceBundle } from "@/services/bright-data";

export type GtmAgentStageName =
  | "intake"
  | "routing"
  | "collection"
  | "fallback"
  | "analysis"
  | "change_detection"
  | "report"
  | "hitl_queue";

export type GtmAgentStage = {
  stage: GtmAgentStageName;
  label: string;
  detail: string;
  timestamp: string;
};

export type GtmAgentCollectionResult = {
  evidence: string;
  provider: "bright-data" | "exa" | "demo";
  query: string;
  targetUrl?: string;
  plan: GtmRoutePlan;
  steps: GtmEvidenceBundle["steps"];
  stages: GtmAgentStage[];
};
