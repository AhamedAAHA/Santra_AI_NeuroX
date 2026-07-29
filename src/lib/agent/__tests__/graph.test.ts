import { describe, expect, it } from "vitest";
import { AGENT_GRAPH_NODES, activeGraphNodeIds, AGENT_GRAPH_SUMMARY } from "@/lib/agent/graph";

describe("agent graph", () => {
  it("exposes the full named decision graph", () => {
    expect(AGENT_GRAPH_NODES.length).toBeGreaterThanOrEqual(9);
    expect(AGENT_GRAPH_SUMMARY).toContain("human_review");
    expect(AGENT_GRAPH_NODES.map((n) => n.id)).toContain("observe");
    expect(AGENT_GRAPH_NODES.map((n) => n.id)).toContain("audit");
  });

  it("maps runtime stages onto graph nodes", () => {
    const active = activeGraphNodeIds(["intake", "collection", "change_detection", "hitl_queue"]);
    expect(active.has("plan")).toBe(true);
    expect(active.has("collect")).toBe(true);
    expect(active.has("observe")).toBe(true);
    expect(active.has("human_review")).toBe(true);
  });
});
