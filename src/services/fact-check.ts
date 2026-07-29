import { createChatCompletionWithFallback, isLlmAuthError } from "@/lib/llm/inference";
import { isLlmConfigured } from "@/lib/llm/client";
import { isFeatherlessConfigured } from "@/lib/llm/featherless";
import { getLlmProviderLabel } from "@/lib/llm/client";
import { normalizeClaimStatus, type ClaimVerificationStatus, type ExecutiveIntelligenceReport, type FactCheckSummary, type VerifiedClaim } from "@/types/intelligence";
import { computeConfidence } from "@/lib/scoring/formulas";

type VerifierRow = {
  claimId?: string;
  claim?: string;
  status?: string;
  note?: string;
};

const STATUS_RANK: Record<ClaimVerificationStatus, number> = {
  "evidence-backed": 3,
  partial: 2,
  unsupported: 1,
};

function stricterStatus(a: ClaimVerificationStatus, b: ClaimVerificationStatus): ClaimVerificationStatus {
  return STATUS_RANK[a] <= STATUS_RANK[b] ? a : b;
}

function parseVerifierStatus(value: unknown): ClaimVerificationStatus {
  if (typeof value !== "string") return "partial";
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (normalized.includes("evidence") || normalized === "backed" || normalized === "supported") {
    return "evidence-backed";
  }
  if (normalized.includes("unsupport") || normalized.includes("false") || normalized.includes("reject")) {
    return "unsupported";
  }
  return "partial";
}

/**
 * Second-model fact-check: re-score claims against evidence excerpts.
 * Prefer Featherless as verifier when AIML/OpenAI was the synthesizer (or vice versa).
 */
export async function factCheckExecutiveReport(
  report: ExecutiveIntelligenceReport,
  evidence: string,
): Promise<ExecutiveIntelligenceReport> {
  if (!isLlmConfigured() || !report.verifiedClaims.length) {
    return report;
  }

  const synthesizer =
    report.provider === "demo"
      ? "heuristic"
      : getLlmProviderLabel() || (isFeatherlessConfigured() ? "featherless" : "llm");
  const verifierLabel = isFeatherlessConfigured() && getLlmProviderLabel() ? "featherless" : getLlmProviderLabel() || "llm";

  const claimBlock = report.verifiedClaims
    .map(
      (claim, index) =>
        `${index + 1}. id=${claim.id}\nclaim=${claim.claim}\nsynthesizer_status=${claim.status}\nconfidence=${claim.confidence}`,
    )
    .join("\n\n");

  const evidenceBlock = [
    ...report.evidenceSources.map(
      (source) =>
        `- ${source.title} (${source.publisher}${source.url ? ` · ${source.url}` : ""})\n  excerpt: ${(source.excerpt || source.claimSupported || "").slice(0, 280)}`,
    ),
    evidence.trim() ? `Raw evidence (truncated):\n${evidence.slice(0, 6000)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { response, provider } = await createChatCompletionWithFallback(
      {
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are SANTRA's fact-check verifier. Re-score each claim ONLY against the provided evidence. Do not invent facts. Prefer unsupported when evidence is missing. Return JSON: { \"claims\": [ { \"claimId\": string, \"claim\": string, \"status\": \"evidence-backed\"|\"partial\"|\"unsupported\", \"note\": string } ] }",
          },
          {
            role: "user",
            content: [
              `Monitor: ${report.monitorRequirement}`,
              `Verdict: ${report.verdict}`,
              "",
              "Claims to verify:",
              claimBlock,
              "",
              "Evidence:",
              evidenceBlock || "(no excerpts)",
            ].join("\n"),
          },
        ],
      },
      {
        // Prefer the alternate provider so synthesizer ≠ verifier when both exist.
        preferFeatherless: Boolean(getLlmProviderLabel()),
      },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) return report;

    const parsed = JSON.parse(content) as { claims?: VerifierRow[] };
    const rows = Array.isArray(parsed.claims) ? parsed.claims : [];
    const byId = new Map<string, VerifierRow>();
    const byText = new Map<string, VerifierRow>();
    for (const row of rows) {
      if (row.claimId) byId.set(String(row.claimId), row);
      if (row.claim?.trim()) byText.set(row.claim.trim().toLowerCase(), row);
    }

    let corroborated = 0;
    let contested = 0;
    let dropped = 0;

    const mergedClaims: VerifiedClaim[] = report.verifiedClaims.map((claim) => {
      const row =
        byId.get(claim.id) ||
        byText.get(claim.claim.trim().toLowerCase()) ||
        undefined;
      const verifierStatus = row ? parseVerifierStatus(row.status) : "partial";
      const synthesizerStatus = normalizeClaimStatus(claim.status);
      const finalStatus = stricterStatus(synthesizerStatus, verifierStatus);

      if (synthesizerStatus === verifierStatus && finalStatus === "evidence-backed") corroborated += 1;
      else if (synthesizerStatus !== verifierStatus) contested += 1;
      if (finalStatus === "unsupported") dropped += 1;

      return {
        ...claim,
        status: finalStatus,
        confidence:
          finalStatus === "unsupported"
            ? Math.min(claim.confidence, 42)
            : finalStatus === "partial"
              ? Math.min(claim.confidence, 72)
              : Math.max(claim.confidence, 78),
      };
    });

    const factCheck: FactCheckSummary = {
      synthesizer,
      verifier: provider || verifierLabel,
      corroborated,
      contested,
      dropped,
      claims: report.verifiedClaims.map((claim, index) => {
        const merged = mergedClaims[index];
        const row = byId.get(claim.id) || byText.get(claim.claim.trim().toLowerCase());
        return {
          claimId: claim.id,
          claim: claim.claim,
          synthesizerStatus: normalizeClaimStatus(claim.status),
          verifierStatus: row ? parseVerifierStatus(row.status) : "partial",
          finalStatus: merged.status,
          note: row?.note?.trim() || undefined,
        };
      }),
      ranAt: new Date().toISOString(),
    };

    const confidence = computeConfidence(
      mergedClaims,
      report.evidenceSources,
      [],
      report.provider,
      report.confidence / 100,
    );

    const unsupportedCount = mergedClaims.filter((claim) => claim.status === "unsupported").length;
    const partialCount = mergedClaims.filter((claim) => claim.status === "partial").length;
    const hallucinationRisk =
      report.provider === "demo" || unsupportedCount
        ? "high"
        : partialCount > mergedClaims.length / 2
          ? "medium"
          : "low";

    // Prefer corroborated / non-unsupported claims in observed facts ordering.
    const strongFacts = mergedClaims
      .filter((claim) => claim.status !== "unsupported")
      .map((claim) => claim.claim)
      .slice(0, 4);

    return {
      ...report,
      verifiedClaims: mergedClaims,
      confidence,
      hallucinationRisk,
      factCheck,
      observedFacts: strongFacts.length ? strongFacts : report.observedFacts,
      situation:
        contested > 0
          ? `${report.situation} Fact-check: ${corroborated} corroborated, ${contested} contested, ${dropped} unsupported after verifier pass.`
          : report.situation,
    };
  } catch (error) {
    if (isLlmAuthError(error)) {
      console.warn("Fact-check skipped — LLM auth error");
      return report;
    }
    console.warn("Fact-check skipped", error);
    return report;
  }
}
