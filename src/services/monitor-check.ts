import { getSignalsForRun, saveIntelligenceRun } from "@/lib/db/intelligence";
import { createPendingAction } from "@/lib/db/pending-actions";
import { createServerPendingAction } from "@/lib/pending-actions-server";
import {
  appendTimelineEventDb,
  updateMonitorCheckState as persistMonitorCheckState,
} from "@/lib/db/monitor-workspace";
import { recordMonitorEvents, updateMonitorChecked } from "@/lib/db/monitors";
import { saveIntelligenceReport } from "@/lib/db/reports";
import { filterSignalsForMonitor } from "@/lib/monitor-match";
import { enrichQueryWithWorkspace, type WorkspaceContext } from "@/lib/gtm/workspace-context";
import { runGtmAgentCollection } from "@/services/gtm-agent";
import { createExecutiveReport } from "@/services/intelligence-report";
import { runChangeDetection } from "@/services/change-detection";
import { runChangeDetectionWithDb } from "@/services/change-detection-db";
import { generateEnterpriseAnalysis } from "@/services/openai";
import type { GtmAgentStage } from "@/types/gtm-agent";
import type { PendingAction } from "@/types/pending-actions";
import type { BrightDataCollectionMode, Severity } from "@/types/intelligence";
import { isMongoConfigured } from "@/lib/mongo/config";
import { notifyBandGtmEvent } from "@/services/band-agent";

export type MonitorCheckInput = {
  id: string;
  requirement: string;
  category: string;
  minimum_severity: Severity;
  keywords: string[];
  target_url: string | null;
};

export type MonitorCheckResult = {
  provider: "bright-data" | "exa" | "openai" | "demo";
  searchQuery: string;
  matchedCount: number;
  signalCount: number;
  signals: ReturnType<typeof filterSignalsForMonitor>;
  analysis: Awaited<ReturnType<typeof generateEnterpriseAnalysis>>;
  report: ReturnType<typeof createExecutiveReport>;
  detectedChanges: Array<{
    id: string;
    field: string;
    oldValue: string;
    newValue: string;
    sourceUrl: string;
    severity: Severity;
  }>;
  evidencePreview: string;
  agentStages: GtmAgentStage[];
  pendingAction?: PendingAction;
};

function inferBrightDataModeFromEvidence(evidence: string): BrightDataCollectionMode | undefined {
  const modeMatch = evidence.match(/\((serp|unlocker|scraper|browser|mcp)\)/i);
  return modeMatch ? (modeMatch[1].toLowerCase() as BrightDataCollectionMode) : undefined;
}

function buildProposedAction(report: ReturnType<typeof createExecutiveReport>, matchedCount: number) {
  const headline = (report.verdict || report.situation || "Monitor update").trim();
  if (matchedCount > 0) {
    return `${matchedCount} signal${matchedCount === 1 ? "" : "s"} need review — ${headline}`;
  }
  return headline;
}

export async function runMonitorCheck(
  monitor: MonitorCheckInput,
  options?: {
    userId?: string;
    persist?: boolean;
    workspace?: WorkspaceContext | null;
    searchQuery?: string;
    targetUrl?: string | null;
  },
): Promise<MonitorCheckResult> {
  const collectionQuery = options?.searchQuery?.trim() || monitor.requirement;
  const enrichedRequirement = enrichQueryWithWorkspace(monitor.requirement, options?.workspace);
  const targetUrl = options?.targetUrl ?? monitor.target_url;

  const collection = await runGtmAgentCollection({
    searchQuery: collectionQuery,
    targetUrl,
  });

  const evidence = collection.evidence;
  const provider = collection.provider;
  const agentStages = [...collection.stages];

  const canPersist = Boolean(options?.persist && options.userId && isMongoConfigured());
  const changeResult = canPersist
    ? await runChangeDetectionWithDb({
        userId: options!.userId!,
        monitorId: monitor.id,
        evidence,
        targetUrl,
      })
    : runChangeDetection({
        monitorId: monitor.id,
        evidence,
        targetUrl,
      });

  agentStages.push({
    stage: "change_detection",
    label: "Change detection",
    detail:
      changeResult.changes.length > 0
        ? `${changeResult.changes.length} material change${changeResult.changes.length === 1 ? "" : "s"} detected`
        : "No material pricing or field changes detected",
    timestamp: new Date().toISOString(),
  });

  const analysis = await generateEnterpriseAnalysis(enrichedRequirement, evidence, options?.workspace);

  agentStages.push({
    stage: "analysis",
    label: "Executive analysis",
    detail: analysis.summary.slice(0, 200),
    timestamp: new Date().toISOString(),
  });

  const mergedSignals = [
    ...changeResult.changeSignals,
    ...analysis.signals.filter(
      (signal) => !changeResult.changeSignals.some((change) => change.title.includes(signal.title.slice(0, 20))),
    ),
  ];

  const persistProvider =
    provider === "bright-data" || provider === "exa" ? "bright-data" : "demo";

  let savedSignals = mergedSignals;
  if (canPersist) {
    try {
      const runId = await saveIntelligenceRun(options!.userId!, {
        query: monitor.requirement,
        provider: persistProvider,
        evidencePreview: evidence.slice(0, 2000) || analysis.summary,
        analysis: { ...analysis, signals: mergedSignals },
      });
      savedSignals = await getSignalsForRun(options!.userId!, runId);
    } catch (error) {
      console.warn("Monitor run persistence skipped", error);
    }
  }

  const matched = filterSignalsForMonitor(
    {
      requirement: monitor.requirement,
      category: monitor.category as "any",
      minimumSeverity: monitor.minimum_severity,
      keywords: monitor.keywords,
    },
    savedSignals.length ? savedSignals : mergedSignals,
  );

  if (canPersist) {
    try {
      await recordMonitorEvents(options!.userId!, monitor.id, matched);
      await updateMonitorChecked(options!.userId!, monitor.id);
      await persistMonitorCheckState(options!.userId!, monitor.id, {
        last_matched_count: matched.length,
        last_signal_count: mergedSignals.length,
        last_summary: analysis.summary?.slice(0, 280) ?? null,
        last_search_query: collectionQuery,
        last_match_title: matched[0]?.title ?? mergedSignals[0]?.title ?? null,
        last_provider: provider,
        last_checked_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Monitor event persistence skipped", error);
    }
  }

  const collectionMeta = {
    collectedAt: changeResult.snapshot.collectedAt,
    brightDataMode: inferBrightDataModeFromEvidence(evidence),
  };

  const report = createExecutiveReport({
    requirement: monitor.requirement,
    analysis: { ...analysis, signals: mergedSignals },
    matchedSignals: matched,
    evidence,
    provider,
    detectedChanges: changeResult.changes,
    collectionMeta,
  });

  agentStages.push({
    stage: "report",
    label: "Executive report",
    detail: report.verdict,
    timestamp: new Date().toISOString(),
  });

  let pendingAction: PendingAction | undefined;
  const shouldQueueHitl = matched.length > 0 || changeResult.changes.length > 0;

  if (shouldQueueHitl && options?.userId) {
    try {
      const queueInput = {
        monitorId: monitor.id,
        reportId: report.id,
        proposedAction: buildProposedAction(report, matched.length),
        proposedEvent: "monitor_alert" as const,
        monitorRequirement: monitor.requirement,
        reportSnapshot: report,
      };

      pendingAction = canPersist
        ? await createPendingAction(options.userId, queueInput)
        : createServerPendingAction(options.userId, queueInput);

      void notifyBandGtmEvent({
        title: "GTM monitor — approval required",
        summary: report.verdict,
        monitorId: monitor.id,
        proposedAction: pendingAction.proposedAction,
      });
      agentStages.push({
        stage: "hitl_queue",
        label: "Awaiting human approval",
        detail: pendingAction.proposedAction,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Pending action queue skipped", error);
    }
  }

  if (canPersist) {
    try {
      await saveIntelligenceReport(options!.userId!, report, monitor.id);
    } catch (error) {
      console.warn("Report persistence skipped", error);
    }

    const userId = options!.userId!;

    for (const change of changeResult.changes) {
      try {
        await appendTimelineEventDb(userId, {
          type: "change_detected",
          monitorId: monitor.id,
          monitorRequirement: monitor.requirement,
          summary: `${change.field} changed from ${change.oldValue} to ${change.newValue}`,
          severity: change.severity,
          changeId: change.id,
          metadata: {
            sourceUrl: change.sourceUrl,
            oldValue: change.oldValue,
            newValue: change.newValue,
            field: change.field,
          },
        });
      } catch (error) {
        console.warn("Timeline change event skipped", error);
      }
    }

    try {
      await appendTimelineEventDb(userId, {
        type: "check_complete",
        monitorId: monitor.id,
        monitorRequirement: monitor.requirement,
        summary: `Agent check completed - ${matched.length} match${matched.length === 1 ? "" : "es"} from ${provider === "bright-data" ? "live Bright Data" : "analysis"}.`,
        metadata: { provider, matchedCount: String(matched.length) },
      });
    } catch (error) {
      console.warn("Timeline check event skipped", error);
    }

    for (const signal of matched) {
      try {
        await appendTimelineEventDb(userId, {
          type: "signal_matched",
          monitorId: monitor.id,
          monitorRequirement: monitor.requirement,
          summary: signal.title,
          severity: signal.severity,
        });
      } catch (error) {
        console.warn("Timeline signal event skipped", error);
      }
    }

    try {
      await appendTimelineEventDb(userId, {
        type: "report_generated",
        monitorId: monitor.id,
        monitorRequirement: monitor.requirement,
        reportId: report.id,
        summary: report.verdict,
        severity: report.riskScore >= 80 ? "critical" : report.riskScore >= 65 ? "high" : "medium",
        metadata: { riskScore: String(report.riskScore) },
      });
    } catch (error) {
      console.warn("Timeline report event skipped", error);
    }
  }

  return {
    provider,
    searchQuery: collectionQuery,
    matchedCount: matched.length,
    signalCount: mergedSignals.length,
    signals: matched,
    analysis: { ...analysis, signals: mergedSignals },
    report,
    detectedChanges: changeResult.changes,
    evidencePreview: evidence.slice(0, 6000) || analysis.summary.slice(0, 6000),
    agentStages,
    pendingAction,
  };
}

export function monitorCheckErrorStatus(_error?: unknown) {
  return 500;
}
