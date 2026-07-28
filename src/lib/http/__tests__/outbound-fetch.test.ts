import { describe, expect, it } from "vitest";
import { describeOutboundFetchError } from "@/lib/http/outbound-fetch";

describe("describeOutboundFetchError", () => {
  it("explains bare fetch failed with host", () => {
    const message = describeOutboundFetchError(
      Object.assign(new TypeError("fetch failed"), {
        cause: Object.assign(new Error("connect"), { code: "ETIMEDOUT" }),
      }),
      "https://webhook.site/abc",
    );
    expect(message).toContain("webhook.site");
    expect(message).toMatch(/timed out/i);
  });

  it("explains DNS failures", () => {
    const message = describeOutboundFetchError(
      Object.assign(new TypeError("fetch failed"), {
        cause: Object.assign(new Error("getaddrinfo"), { code: "ENOTFOUND" }),
      }),
      "https://hooks.slack.com/services/x",
    );
    expect(message).toContain("hooks.slack.com");
    expect(message).toMatch(/resolve/i);
  });
});
