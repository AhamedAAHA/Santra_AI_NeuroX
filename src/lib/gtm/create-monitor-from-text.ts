import { cleanMonitorRequirement, recordMonitorHistory } from "@/lib/monitor-history";
import { fetchMonitorIntent } from "@/lib/monitor-intent-client";
import {
  loadPersistedMonitors,
  savePersistedMonitors,
  type PersistedMonitor,
} from "@/lib/monitor-workspace-storage";
import { readResponseJson } from "@/lib/http/read-response-json";
import type { MonitorIntent, Severity } from "@/types/intelligence";

export type CreatedMonitorFromText = {
  id: string;
  requirement: string;
  category: string;
  plainSummary?: string;
  searchQuery?: string;
  keywords?: string[];
  targetUrl?: string;
  minimumSeverity?: Severity;
};

function toPersistedMonitor(input: {
  id: string;
  requirement: string;
  searchQuery?: string;
  plainSummary?: string;
  category: string;
  minimumSeverity: Severity;
  keywords?: string[];
  targetUrl?: string;
}): PersistedMonitor {
  return {
    id: input.id,
    requirement: input.requirement,
    searchQuery: input.searchQuery,
    plainSummary: input.plainSummary,
    category: input.category,
    minimumSeverity: input.minimumSeverity,
    active: true,
    createdAt: new Date().toISOString(),
    keywords: input.keywords ?? [],
    targetUrl: input.targetUrl,
    alertedSignalIds: [],
  };
}

/** Create a monitor from free text (chat → Watch this). */
export async function createMonitorFromText(rawText: string): Promise<CreatedMonitorFromText> {
  const trimmed = rawText.trim();
  if (trimmed.length < 8) {
    throw new Error("Need a clearer topic to watch — try naming a competitor, page, or pricing change.");
  }

  const intent: MonitorIntent = await fetchMonitorIntent(trimmed);
  const requirement = cleanMonitorRequirement(intent.normalizedRequirement || trimmed);
  if (requirement.length < 3) {
    throw new Error("Describe what you want to watch in a few words.");
  }

  const searchQuery = intent.searchQuery?.trim() || requirement;
  const payload = {
    requirement,
    searchQuery,
    plainSummary: intent.plainSummary,
    category: intent.category,
    minimumSeverity: intent.minimumSeverity,
    keywords: intent.keywords ?? [],
    targetUrl: intent.targetUrl,
    active: true,
  };

  let monitor = toPersistedMonitor({
    id: crypto.randomUUID(),
    requirement,
    searchQuery,
    plainSummary: intent.plainSummary,
    category: intent.category,
    minimumSeverity: intent.minimumSeverity,
    keywords: intent.keywords,
    targetUrl: intent.targetUrl,
  });

  try {
    const response = await fetch("/api/monitors", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readResponseJson<{
      monitor?: {
        id: string;
        requirement: string;
        category: string;
        minimum_severity: Severity;
        keywords: string[];
        active: boolean;
      };
      error?: string;
    }>(response);

    if (response.ok && data.monitor) {
      monitor = toPersistedMonitor({
        id: data.monitor.id,
        requirement: data.monitor.requirement,
        searchQuery,
        plainSummary: intent.plainSummary,
        category: data.monitor.category,
        minimumSeverity: data.monitor.minimum_severity,
        keywords: data.monitor.keywords,
        targetUrl: intent.targetUrl,
      });
    } else if (response.status !== 401 && response.status !== 403) {
      throw new Error(data.error || "Could not create monitor.");
    }
  } catch (error) {
    if (error instanceof Error && /Could not create|Describe what|Need a clearer/i.test(error.message)) {
      throw error;
    }
  }

  const existing = loadPersistedMonitors().filter((item) => item.id !== monitor.id);
  savePersistedMonitors([monitor, ...existing]);
  recordMonitorHistory({ requirement: monitor.requirement, category: monitor.category });

  return {
    id: monitor.id,
    requirement: monitor.requirement,
    category: monitor.category,
    plainSummary: monitor.plainSummary,
    searchQuery: monitor.searchQuery,
    keywords: monitor.keywords,
    targetUrl: monitor.targetUrl,
    minimumSeverity: monitor.minimumSeverity as Severity,
  };
}
