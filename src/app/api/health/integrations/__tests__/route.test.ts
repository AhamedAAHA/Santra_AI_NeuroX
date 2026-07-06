import { describe, expect, it, vi } from "vitest";

const ensureMongoReady = vi.fn();
const getIntegrationStatusWithDiscovery = vi.fn();

vi.mock("@/lib/mongo/client", () => ({
  ensureMongoReady,
}));

vi.mock("@/lib/mongo/config", () => ({
  isMongoConfigured: () => true,
}));

vi.mock("@/lib/integrations", () => ({
  getIntegrationStatusWithDiscovery,
}));

describe("GET /api/health/integrations", () => {
  it("returns integration payload with mongodb status", async () => {
    getIntegrationStatusWithDiscovery.mockResolvedValue({ mongodb: true, openai: true, llm: { ready: true } });
    ensureMongoReady.mockResolvedValue(undefined);

    const { GET } = await import("../route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(ensureMongoReady).toHaveBeenCalled();
    expect(data.mongodbReady).toBe(true);
    expect(data.openai).toBe(true);
  });
});
