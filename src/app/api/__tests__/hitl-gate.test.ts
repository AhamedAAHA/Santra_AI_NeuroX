import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HITL gate contracts", () => {
  it("requires pendingActionId on alert webhooks", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/alerts/webhook/route.ts"),
      "utf8",
    );
    expect(source).toContain("pendingActionId");
    expect(source).toContain("Human approval required");
    expect(source).toContain('pending.status !== "approved"');
  });

  it("requires approved pending action on automation webhooks", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/automation/webhook/route.ts"),
      "utf8",
    );
    expect(source).toContain("pendingActionId");
    expect(source).toContain("Action must be approved before webhook delivery");
  });
});
