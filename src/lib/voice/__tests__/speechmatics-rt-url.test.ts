import { describe, expect, it } from "vitest";
import { buildSpeechmaticsRtWsUrl, resolveSpeechmaticsRtWsBase } from "@/lib/voice/speechmatics-rt-url";

function fakeJwt(aud: string | string[]) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ aud, product: "rt" })).toString("base64url");
  return `${header}.${payload}.sig`;
}

describe("speechmatics rt url", () => {
  it("routes EU audience JWTs to eu.rt", () => {
    const jwt = fakeJwt(["eu", "eu-1"]);
    expect(resolveSpeechmaticsRtWsBase({ jwt })).toBe("wss://eu.rt.speechmatics.com/v2");
    expect(buildSpeechmaticsRtWsUrl(jwt)).toContain("eu.rt.speechmatics.com");
    expect(buildSpeechmaticsRtWsUrl(jwt)).toContain(`jwt=${encodeURIComponent(jwt)}`);
  });

  it("routes US audience JWTs to us.rt", () => {
    expect(resolveSpeechmaticsRtWsBase({ jwt: fakeJwt(["usa"]) })).toBe(
      "wss://us.rt.speechmatics.com/v2",
    );
  });

  it("lets SPEECHMATICS_RT_URL override audience routing", () => {
    expect(
      resolveSpeechmaticsRtWsBase({
        jwt: fakeJwt(["eu"]),
        envUrl: "wss://global.rt.speechmatics.com/v2/",
      }),
    ).toBe("wss://global.rt.speechmatics.com/v2");
  });
});
