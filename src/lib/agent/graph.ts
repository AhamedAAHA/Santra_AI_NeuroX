/**
 * Explicit SANTRA agent graph — CompetitorPulse-style named nodes for judges.
 * Runtime stages map onto these graph nodes for the Activity trail UI.
 */

import type { GtmAgentStageName } from "@/types/gtm-agent";

export type AgentGraphNodeId =
  | "plan"
  | "tool_router"
  | "collect"
  | "observe"
  | "reason"
  | "reflect"
  | "escalate"
  | "recommend"
  | "human_review"
  | "execute"
  | "audit";

export type AgentGraphNode = {
  id: AgentGraphNodeId;
  label: string;
  detail: string;
  stages: GtmAgentStageName[];
};

/** Canonical 11-node decision graph (intake → HITL → audit). */
export const AGENT_GRAPH_NODES: AgentGraphNode[] = [
  {
    id: "plan",
    label: "Plan",
    detail: "Load monitor goal, category, severity, keywords",
    stages: ["intake"],
  },
  {
    id: "tool_router",
    label: "Tool router",
    detail: "Select Bright Data / Exa / MCP path (+ memory)",
    stages: ["routing", "memory"],
  },
  {
    id: "collect",
    label: "Collect",
    detail: "Gather live web evidence (with recovery fallbacks)",
    stages: ["collection", "fallback"],
  },
  {
    id: "observe",
    label: "Observe",
    detail: "Snapshot diff + noise filter for material changes",
    stages: ["change_detection"],
  },
  {
    id: "reason",
    label: "Reason",
    detail: "LLM synthesis of situation, risks, opportunities",
    stages: ["analysis"],
  },
  {
    id: "reflect",
    label: "Reflect",
    detail: "Score risk · confidence · importance independently",
    stages: ["report"],
  },
  {
    id: "escalate",
    label: "Escalate",
    detail: "Low confidence or conflicts route to human review",
    stages: ["hitl_queue"],
  },
  {
    id: "recommend",
    label: "Recommend",
    detail: "Named verdict + action plan for GTM owners",
    stages: ["report"],
  },
  {
    id: "human_review",
    label: "Human review",
    detail: "HITL gate — edit / approve / dismiss before send",
    stages: ["hitl_queue"],
  },
  {
    id: "execute",
    label: "Execute",
    detail: "Webhook / Slack / CRM only after explicit approval",
    stages: ["notify_email"],
  },
  {
    id: "audit",
    label: "Audit",
    detail: "Timeline events + approval history persisted",
    stages: ["report", "hitl_queue", "notify_email"],
  },
];

export function activeGraphNodeIds(stageNames: GtmAgentStageName[]): Set<AgentGraphNodeId> {
  const active = new Set<AgentGraphNodeId>();
  for (const node of AGENT_GRAPH_NODES) {
    if (node.stages.some((stage) => stageNames.includes(stage))) {
      active.add(node.id);
    }
  }
  return active;
}

export const AGENT_GRAPH_SUMMARY =
  "plan → tool_router → collect → observe → reason → reflect → escalate → recommend → human_review → execute → audit";
