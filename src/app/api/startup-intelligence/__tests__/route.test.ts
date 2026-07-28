import { describe, expect, it, vi } from "vitest";

const ensurePlatformSecrets = vi.fn();
const requireApiUser = vi.fn();
const checkRateLimit = vi.fn();
const generateStartupIntelligence = vi.fn();

vi.mock("@/lib/secrets/platform-secrets", () => ({
  ensurePlatformSecrets,
}));

vi.mock("@/lib/auth/session", () => ({
  requireApiUser,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit,
}));

vi.mock("@/services/startup-intelligence", () => ({
  generateStartupIntelligence,
}));

describe("POST /api/startup-intelligence", () => {
  it("returns 400 when required fields are missing", async () => {
    requireApiUser.mockResolvedValue({ user: { id: "u-1" } });
    checkRateLimit.mockResolvedValue({ allowed: true });

    const { POST } = await import("../route");
    const request = new Request("http://localhost/api/startup-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupIdea: "AI app" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns generated startup intelligence payload", async () => {
    requireApiUser.mockResolvedValue({ user: { id: "u-1" } });
    checkRateLimit.mockResolvedValue({ allowed: true });
    generateStartupIntelligence.mockResolvedValue({ report: { executiveSummary: "ok" }, provider: "openai" });

    const { POST } = await import("../route");
    const request = new Request("http://localhost/api/startup-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startupIdea: "AI app",
        industry: "SaaS",
        country: "Sri Lanka",
        targetAudience: "SMEs",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.provider).toBe("openai");
    expect(generateStartupIntelligence).toHaveBeenCalled();
  });
});
