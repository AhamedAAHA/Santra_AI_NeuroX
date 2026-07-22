import { getPlatformEnv } from "@/lib/secrets/platform-secrets";

export type ExaEvidence = {
  provider: "exa";
  query: string;
  evidence: string;
  resultCount: number;
  targetUrl?: string;
};

function getExaApiKey() {
  return getPlatformEnv("EXA_API_KEY") || process.env.EXA_API_KEY?.trim();
}

export function isExaConfigured() {
  return Boolean(getExaApiKey());
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function formatExaResults(
  results: Array<{
    title?: string;
    url?: string;
    publishedDate?: string;
    highlights?: string[];
    text?: string;
  }>,
) {
  return results
    .map((result, index) => {
      const highlights = result.highlights?.join("\n") ?? "";
      const text = result.text?.slice(0, 2500) ?? "";
      const body = highlights || text || "(no excerpt)";
      return `### ${result.title ?? `Result ${index + 1}`} (${result.url ?? "exa"})\n${body}`;
    })
    .join("\n\n")
    .slice(0, 16_000);
}

/** Collect GTM evidence via Exa search + optional URL contents. */
export async function collectExaIntelligence(
  query: string,
  targetUrl?: string,
): Promise<ExaEvidence | null> {
  const apiKey = getExaApiKey();
  if (!apiKey) return null;

  const steps: string[] = [];

  if (targetUrl) {
    try {
      const contentsResponse = await fetch("https://api.exa.ai/contents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          urls: [targetUrl],
          text: { maxCharacters: 5000 },
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (contentsResponse.ok) {
        const contentsJson = (await contentsResponse.json()) as {
          results?: Array<{ title?: string; url?: string; text?: string }>;
        };
        const formatted = formatExaResults(contentsJson.results ?? []);
        if (formatted.trim()) {
          steps.push(`### Exa URL contents (${targetUrl})\n${formatted}`);
        }
      }
    } catch (error) {
      console.warn("Exa contents collection failed", error);
    }
  }

  try {
    const includeDomains = targetUrl ? [hostFromUrl(targetUrl)].filter(Boolean) : undefined;
    const searchResponse = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        type: "fast",
        numResults: 5,
        ...(includeDomains?.length ? { includeDomains } : {}),
        contents: { highlights: { maxCharacters: 2000 } },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!searchResponse.ok) {
      const detail = await searchResponse.text();
      console.warn("Exa search failed", searchResponse.status, detail.slice(0, 200));
      if (!steps.length) return null;
    } else {
      const searchJson = (await searchResponse.json()) as {
        results?: Array<{
          title?: string;
          url?: string;
          publishedDate?: string;
          highlights?: string[];
        }>;
      };
      const formatted = formatExaResults(searchJson.results ?? []);
      if (formatted.trim()) {
        steps.push(`### Exa search (${query})\n${formatted}`);
      }
    }
  } catch (error) {
    console.warn("Exa search collection failed", error);
    if (!steps.length) return null;
  }

  const evidence = steps.join("\n\n").slice(0, 16_000);
  if (!evidence.trim()) return null;

  return {
    provider: "exa",
    query,
    evidence,
    resultCount: steps.length,
    targetUrl,
  };
}
