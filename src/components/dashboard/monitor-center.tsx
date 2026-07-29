"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BellRing, Bot, Pencil, Pause, Play, Radar, Sparkles, TimerReset, Trash2, X, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackgroundEmailWatchPanel } from "@/components/gtm/background-email-watch-panel";
import { ReportApprovalPanel } from "@/components/gtm/report-approval-panel";
import { AgentActivityLog } from "@/components/gtm/agent-activity-log";
import { MonitorIntelBrief } from "@/components/reports/monitor-intel-brief";
import { getWorkspaceContext } from "@/lib/gtm/workspace-context";
import { buildClientMemoryBrief } from "@/lib/gtm/agent-memory";
import { useWorkspaceSession } from "@/lib/hooks/use-workspace-session";
import { fetchMonitorIntent } from "@/lib/monitor-intent-client";
import { inferMonitorIntentHeuristically } from "@/lib/monitor-intent-heuristic";
import { readResponseJson } from "@/lib/http/read-response-json";
import { signInFor } from "@/lib/landing/auth-links";
import {
  buildPersonalizedSuggestions,
  cleanMonitorRequirement,
  plainEnglishMonitorSummary,
  recordMonitorHistory,
} from "@/lib/monitor-history";
import { repairLocalStorageQuota, syncLocalSessionToCookie } from "@/lib/local-auth";
import { MonitorPromptField } from "@/components/dashboard/monitor-prompt-field";
import { getAlertWebhookUrl, saveAlertWebhookUrl } from "@/lib/webhooks";
import { WorkspaceSection } from "@/components/workspace/workspace-page";
import { cn } from "@/lib/utils";
import { ChangeDetectionPanel } from "@/components/dashboard/change-detection-panel";
import { MonitorTimeline } from "@/components/dashboard/monitor-timeline";
import { initializePresetDemoStorage, PRESET_DEMO_MONITOR_REQUIREMENT } from "@/lib/demo/preset-scenario";
import { recordMonitorReportHistory } from "@/lib/history/workspace-history";
import { loadPersistedMonitors, type PersistedMonitor } from "@/lib/monitor-workspace-storage";
import type { GtmAgentStage } from "@/types/gtm-agent";
import type { PendingAction } from "@/types/pending-actions";
import type { DetectedChange, ExecutiveIntelligenceReport, IntelligenceSignal, MonitorIntent, MonitorTimelineEvent, Severity } from "@/types/intelligence";

type SignalCategory = IntelligenceSignal["category"];

type Monitor = {
  id: string;
  requirement: string;
  searchQuery?: string;
  plainSummary?: string;
  category: "any" | SignalCategory;
  minimumSeverity: Severity;
  active: boolean;
  createdAt: string;
  lastCheckedAt?: string;
  lastMatchedCount?: number;
  lastSignalCount?: number;
  lastSummary?: string;
  lastSearchQuery?: string;
  lastMatchTitle?: string;
  lastProvider?: string;
  keywords?: string[];
  targetUrl?: string;
  alertedSignalIds: string[];
};

type SelectedReport = {
  monitor: Monitor;
  signal?: IntelligenceSignal;
  report?: ExecutiveIntelligenceReport;
};

const categories: Array<"any" | SignalCategory> = [
  "any",
  "competitor",
  "market",
  "risk",
  "pricing",
  "hiring",
  "sentiment",
];
const severities: Severity[] = ["low", "medium", "high", "critical"];

function buildLocalMonitor(input: {
  requirement: string;
  searchQuery?: string;
  plainSummary?: string;
  category: Monitor["category"];
  minimumSeverity: Severity;
  keywords?: string[];
  targetUrl?: string;
}): Monitor {
  return {
    id: crypto.randomUUID(),
    requirement: input.requirement,
    searchQuery: input.searchQuery,
    plainSummary: input.plainSummary,
    category: input.category,
    minimumSeverity: input.minimumSeverity,
    keywords: input.keywords ?? [],
    targetUrl: input.targetUrl,
    active: true,
    createdAt: new Date().toISOString(),
    alertedSignalIds: [],
  };
}

function fromPersistedMonitor(row: PersistedMonitor): Monitor {
  return {
    id: row.id,
    requirement: row.requirement,
    searchQuery: row.searchQuery,
    plainSummary: row.plainSummary,
    category: (row.category as Monitor["category"]) || "any",
    minimumSeverity: (row.minimumSeverity as Severity) || "medium",
    keywords: row.keywords ?? [],
    targetUrl: row.targetUrl,
    active: row.active,
    createdAt: row.createdAt,
    lastCheckedAt: row.lastCheckedAt,
    lastMatchedCount: row.lastMatchedCount,
    lastSignalCount: row.lastSignalCount,
    lastSummary: row.lastSummary,
    lastSearchQuery: row.lastSearchQuery,
    lastMatchTitle: row.lastMatchTitle,
    lastProvider: row.lastProvider,
    alertedSignalIds: row.alertedSignalIds ?? [],
  };
}

export function MonitorCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready: sessionReady, signedIn } = useWorkspaceSession();
  const aiAbortRef = useRef<AbortController | null>(null);
  const intentAbortRef = useRef<AbortController | null>(null);
  const checkMonitorNowRef = useRef<((monitorId: string, options?: { automated?: boolean }) => Promise<void>) | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [, setSignals] = useState<IntelligenceSignal[]>([]);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [requirement, setRequirement] = useState("");
  const [category, setCategory] = useState<"any" | SignalCategory>("any");
  const [minimumSeverity, setMinimumSeverity] = useState<Severity>("medium");
  const [monitorIntent, setMonitorIntent] = useState<MonitorIntent | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState("");
  const [selectedReport, setSelectedReport] = useState<SelectedReport | null>(null);
  const [reportsByMonitor, setReportsByMonitor] = useState<Record<string, ExecutiveIntelligenceReport>>({});
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [demoAutopilot, setDemoAutopilot] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [creatingMonitor, setCreatingMonitor] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);
  const [showActivity, setShowActivity] = useState(false);
  // Start null on server + first client paint to avoid Notification.permission hydration mismatch.
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported" | null
  >(null);
  const [agentStages, setAgentStages] = useState<GtmAgentStage[]>([]);
  const [actionQueueRefreshKey, setActionQueueRefreshKey] = useState(0);
  const [selectedPendingActionId, setSelectedPendingActionId] = useState<string | undefined>();
  const [waitingApprovalCount, setWaitingApprovalCount] = useState(0);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [editRequirement, setEditRequirement] = useState("");
  const [editCategory, setEditCategory] = useState<Monitor["category"]>("any");
  const [editSeverity, setEditSeverity] = useState<Severity>("medium");
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setNotificationPermission(
        typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
      );
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    repairLocalStorageQuota();
    syncLocalSessionToCookie();

    // Hydrate device-local monitors first (Watch this / offline creates).
    // Defer setState so the effect stays a sync boundary (react-hooks/set-state-in-effect).
    const local = loadPersistedMonitors().map(fromPersistedMonitor);
    const hydrateTimeout =
      local.length > 0
        ? window.setTimeout(() => {
            if (cancelled) return;
            setMonitors((current) => {
              const byId = new Map(current.map((item) => [item.id, item]));
              for (const item of local) {
                if (!byId.has(item.id)) byId.set(item.id, item);
              }
              return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            });
          }, 0)
        : null;

    async function loadWorkspace() {
      try {
        const response = await fetch("/api/monitors/workspace", { credentials: "include" });
        if (cancelled || response.status === 401 || response.status === 403) return;

        const data = await readResponseJson<{
          localMode?: boolean;
          monitors?: Monitor[];
          reportsByMonitorId?: Record<string, ExecutiveIntelligenceReport>;
          timeline?: MonitorTimelineEvent[];
          detectedChanges?: DetectedChange[];
          signals?: IntelligenceSignal[];
        }>(response);

        if (cancelled) return;
        if (data.localMode) return;

        if (data.monitors?.length) {
          setMonitors((current) => {
            const byId = new Map(data.monitors!.map((item) => [item.id, item]));
            for (const item of current) {
              if (!byId.has(item.id)) byId.set(item.id, item);
            }
            return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          });
        }
        if (data.reportsByMonitorId) setReportsByMonitor(data.reportsByMonitorId);
        if (data.signals?.length) setSignals(data.signals);
        if (data.detectedChanges?.length) setDetectedChanges(data.detectedChanges);
      } catch {
        // Workspace load failed - user can still create monitors.
      }
    }

    void loadWorkspace();
    return () => {
      cancelled = true;
      if (hydrateTimeout) window.clearTimeout(hydrateTimeout);
    };
  }, []);

  const promptSuggestions = useMemo(
    () =>
      buildPersonalizedSuggestions(
        monitors.map((m) => ({
          requirement: cleanMonitorRequirement(m.requirement),
          category: m.category,
          createdAt: m.createdAt,
        })),
      ),
    [monitors],
  );

  const promptSuggestionsTitle = monitors.length > 0 ? "Based on your monitors" : "Quick examples";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setWebhookUrl(getAlertWebhookUrl());
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    saveAlertWebhookUrl(webhookUrl);
  }, [webhookUrl]);

  useEffect(() => {
    const guidePrompt = searchParams.get("guidePrompt");
    if (!guidePrompt) return;

    const timeout = window.setTimeout(() => setRequirement(guidePrompt), 0);
    return () => window.clearTimeout(timeout);
  }, [searchParams]);

  // Strategy Desk "Watch this" → create monitor → land here and auto-run first check.
  const autoCheckStartedRef = useRef<string | null>(null);
  useEffect(() => {
    const runCheckId = searchParams.get("runCheck")?.trim();
    if (!runCheckId) return;
    if (autoCheckStartedRef.current === runCheckId) return;

    let monitor = monitors.find((item) => item.id === runCheckId);
    if (!monitor) {
      const persisted = loadPersistedMonitors().find((item) => item.id === runCheckId);
      if (!persisted) return;
      monitor = fromPersistedMonitor(persisted);
      // Defer so we don't call setState synchronously in the effect body.
      const pending = monitor;
      window.setTimeout(() => {
        setMonitors((current) => [pending, ...current.filter((item) => item.id !== pending.id)]);
      }, 0);
    }

    autoCheckStartedRef.current = runCheckId;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("runCheck");
    const next = params.toString();
    router.replace(next ? `/alerts?${next}` : "/alerts", { scroll: false });
    toast.message("Running first live check…", {
      description: monitor.plainSummary || monitor.requirement,
    });
    void checkMonitorNow(runCheckId, { monitor });
    // One-shot URL trigger; checkMonitorNow closes over latest helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitors, searchParams, router]);

  function enrichIntent(intent: MonitorIntent, rawInput: string): MonitorIntent {
    return {
      ...intent,
      plainSummary:
        intent.plainSummary ??
        plainEnglishMonitorSummary({
          requirement: rawInput,
          normalizedRequirement: intent.normalizedRequirement,
          category: intent.category,
          minimumSeverity: intent.minimumSeverity,
        }),
    };
  }

  useEffect(() => {
    const input = requirement.trim();
    intentAbortRef.current?.abort();

    if (input.length < 8) {
      const timeout = window.setTimeout(() => {
        setMonitorIntent(null);
        setIntentLoading(false);
        setIntentError("");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const abortController = new AbortController();
    intentAbortRef.current = abortController;
    const timeout = window.setTimeout(async () => {
      setIntentLoading(true);
      setIntentError("");

      try {
        const response = await fetch("/api/monitor-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({ input }),
        });
        const data = await readResponseJson<{ intent?: MonitorIntent; error?: string }>(response);

        if (response.status === 401 || response.status === 403 || !response.ok) {
          const local = enrichIntent(inferMonitorIntentHeuristically(input), input);
          setMonitorIntent(local);
          setCategory(local.category);
          setMinimumSeverity(local.minimumSeverity);
          setIntentError("");
          return;
        }

        if (!data.intent) {
          throw new Error(data.error || "SANTRA could not understand this monitor yet.");
        }

        const intent = enrichIntent(data.intent, input);
        setMonitorIntent(intent);
        setCategory(intent.category);
        setMinimumSeverity(intent.minimumSeverity);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const local = enrichIntent(inferMonitorIntentHeuristically(input), input);
        setMonitorIntent(local);
        setCategory(local.category);
        setMinimumSeverity(local.minimumSeverity);
        setIntentError("");
      } finally {
        if (!abortController.signal.aborted) {
          setIntentLoading(false);
        }
      }
    }, 700);

    return () => {
      window.clearTimeout(timeout);
      abortController.abort();
    };
  }, [requirement]);

  const activeMonitorCount = monitors.filter((monitor) => monitor.active).length;

  function updateMonitorCheckState(
    monitorId: string,
    patch: Pick<
      Monitor,
      | "lastCheckedAt"
      | "lastMatchedCount"
      | "lastSignalCount"
      | "lastSummary"
      | "lastSearchQuery"
      | "lastMatchTitle"
      | "lastProvider"
    >,
  ) {
    setMonitors((current) =>
      current.map((item) => (item.id === monitorId ? { ...item, ...patch } : item)),
    );
  }

  async function openReport(
    monitor: Monitor,
    signal?: IntelligenceSignal,
    report?: ExecutiveIntelligenceReport,
    pendingActionId?: string,
  ) {
    aiAbortRef.current?.abort();
    if (pendingActionId) {
      setSelectedPendingActionId(pendingActionId);
    } else if (report) {
      setSelectedPendingActionId(undefined);
      void (async () => {
        try {
          const response = await fetch("/api/pending-actions", { credentials: "include" });
          const data = await readResponseJson<{ actions?: PendingAction[] }>(response);
          const match = (data.actions ?? []).find(
            (action) =>
              (action.status === "pending" || action.status === "approved") &&
              (action.reportId === report.id ||
                action.reportSnapshot?.id === report.id ||
                action.monitorId === monitor.id),
          );
          if (match) setSelectedPendingActionId(match.id);
        } catch {
          // optional link
        }
      })();
    } else {
      setSelectedPendingActionId(undefined);
    }

    if (report) {
      setSelectedReport({ monitor, signal, report });
      setAiSummary("");
      setAiError("");
      setAiLoading(false);
      return;
    }

    if (!signal) {
      const cachedReport = reportsByMonitor[monitor.id];
      if (cachedReport) {
        setSelectedReport({ monitor, report: cachedReport });
      } else {
        toast.info("No report available for this monitor yet. Run Check now to generate one.");
      }
      return;
    }

    const abortController = new AbortController();
    aiAbortRef.current = abortController;
    setSelectedReport({ monitor, signal });
    setAiSummary("");
    setAiError("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          message: [
            "Create a detailed situation report for this automated monitor alert.",
            `Monitor requirement: ${monitor.requirement}`,
            `Matched signal: ${signal.title}`,
            `Signal summary: ${signal.summary}`,
            `Category: ${signal.category}`,
            `Severity: ${signal.severity}`,
            `Confidence: ${Math.round(signal.confidence * 100)}%`,
            `Source: ${signal.source}`,
            "Return concise markdown with: situation summary, why it matters, immediate actions, and watch items.",
          ].join("\n"),
          history: [],
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || !data.message?.trim()) {
        throw new Error(data.error || "AI report could not be generated.");
      }

      setAiSummary(data.message);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAiError(error instanceof Error ? error.message : "AI analysis failed.");
      setAiSummary(
        [
          "### Situation summary",
          `${signal.title}. ${signal.summary}`,
          "",
          "### Immediate actions",
          `- Validate the signal against the monitored requirement: ${monitor.requirement}.`,
          "- Assign an owner to review the source and decide whether escalation is needed.",
          "- Keep this monitor active until the signal stabilizes or is resolved.",
        ].join("\n"),
      );
    } finally {
      if (!abortController.signal.aborted) {
        setAiLoading(false);
      }
    }
  }

  function closeReport() {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setSelectedReport(null);
    setSelectedPendingActionId(undefined);
    setAiSummary("");
    setAiError("");
    setAiLoading(false);
  }

  function openPendingAction(action: PendingAction) {
    const report = action.reportSnapshot;
    if (!report) {
      toast.info("No report snapshot for this item yet.");
      return;
    }

    const matchedMonitor =
      (action.monitorId ? monitors.find((item) => item.id === action.monitorId) : undefined) ??
      monitors.find((item) => item.requirement === action.monitorRequirement);

    const monitor: Monitor = matchedMonitor ?? {
      id: action.monitorId ?? `pending-${action.id}`,
      requirement: action.monitorRequirement ?? report.monitorRequirement ?? "Monitor",
      category: "any",
      minimumSeverity: "medium",
      active: true,
      createdAt: action.createdAt,
      alertedSignalIds: [],
    };

    void openReport(monitor, undefined, report, action.id);
  }

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/pending-actions", { credentials: "include" });
          const data = await readResponseJson<{ actions?: PendingAction[] }>(response);
          if (cancelled || !response.ok) return;
          const waiting = (data.actions ?? []).filter((item) => item.status === "pending").length;
          setWaitingApprovalCount(waiting);
        } catch {
          if (!cancelled) setWaitingApprovalCount(0);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [actionQueueRefreshKey]);

  async function openFirstWaitingApproval() {
    try {
      const response = await fetch("/api/pending-actions", { credentials: "include" });
      const data = await readResponseJson<{ actions?: PendingAction[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Unable to load approvals.");
      const first =
        (data.actions ?? []).find((item) => item.status === "pending") ??
        (data.actions ?? []).find((item) => item.status === "approved");
      if (!first) {
        toast.info("Nothing waiting for your OK right now.");
        return;
      }
      openPendingAction(first);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open approvals.");
    }
  }

  async function createMonitor() {
    const trimmed = requirement.trim();
    if (!trimmed) {
      toast.error("Describe what you want SANTRA to watch.");
      return;
    }

    if (sessionReady && !signedIn) {
      router.push(signInFor("/alerts"));
      return;
    }

    setCreatingMonitor(true);
    let resolvedIntent: MonitorIntent;
    try {
      resolvedIntent = monitorIntent && !intentLoading
        ? enrichIntent(monitorIntent, trimmed)
        : enrichIntent(await fetchMonitorIntent(trimmed), trimmed);
      setMonitorIntent(resolvedIntent);
      setCategory(resolvedIntent.category);
      setMinimumSeverity(resolvedIntent.minimumSeverity);
    } catch (error) {
      setCreatingMonitor(false);
      toast.error(error instanceof Error ? error.message : "Could not interpret your monitor.");
      return;
    }

    const interpretedRequirement = cleanMonitorRequirement(resolvedIntent.normalizedRequirement);
    const searchQuery = resolvedIntent.searchQuery?.trim() || interpretedRequirement;
    if (interpretedRequirement.length < 3) {
      setCreatingMonitor(false);
      toast.error("Describe what you want to watch in a few words.");
      return;
    }
    const monitorPayload = {
      requirement: interpretedRequirement,
      searchQuery,
      plainSummary: resolvedIntent.plainSummary,
      category: resolvedIntent.category,
      minimumSeverity: resolvedIntent.minimumSeverity,
      keywords: resolvedIntent.keywords ?? [],
      targetUrl: resolvedIntent.targetUrl,
      active: true,
    };

    let monitor: Monitor | null = null;

    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(monitorPayload),
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
        localMode?: boolean;
        error?: string;
      }>(response);

      if (response.ok && data.monitor) {
        monitor = {
          id: data.monitor.id,
          requirement: data.monitor.requirement,
          searchQuery,
          plainSummary: resolvedIntent.plainSummary,
          category: data.monitor.category as Monitor["category"],
          minimumSeverity: data.monitor.minimum_severity,
          keywords: data.monitor.keywords,
          targetUrl: resolvedIntent.targetUrl,
          active: data.monitor.active,
          createdAt: new Date().toISOString(),
          alertedSignalIds: [],
        };
      } else if (response.status === 401 || response.status === 403) {
        monitor = buildLocalMonitor(monitorPayload);
      } else {
        throw new Error(data.error || "Could not save monitor.");
      }
    } catch (error) {
      if (error instanceof Error && /401|sign in|unauthorized/i.test(error.message)) {
        monitor = buildLocalMonitor(monitorPayload);
      } else {
        setCreatingMonitor(false);
        toast.error(error instanceof Error ? error.message : "Could not create monitor.");
        return;
      }
    }

    if (!monitor) {
      setCreatingMonitor(false);
      return;
    }

    recordMonitorHistory({ requirement: monitor.requirement, category: monitor.category });

    const savedMonitor = monitor;

    setMonitors((current) => [savedMonitor, ...current.filter((item) => item.id !== savedMonitor.id)]);
    setRequirement("");
    setMonitorIntent(null);
    toast.success("Monitor started", { description: "Running a live check…" });

    try {
      await checkMonitorNow(savedMonitor.id, { monitor: savedMonitor });
    } catch {
      toast.message("Monitor saved - tap Check now to run the live scan.", { duration: 5000 });
    } finally {
      setCreatingMonitor(false);
    }
  }

  async function loadPresetDemo() {
    setDemoLoading(true);
    try {
      const response = await fetch("/api/demo/preset", { method: "POST" });
      const data = (await response.json()) as {
        monitor?: Monitor;
        signals?: IntelligenceSignal[];
        report?: ExecutiveIntelligenceReport;
        detectedChanges?: DetectedChange[];
        timeline?: MonitorTimelineEvent[];
        error?: string;
      };

      if (!response.ok) throw new Error(data.error || "Demo could not be loaded.");

      const bundle = initializePresetDemoStorage();
      const monitor = data.monitor ?? bundle.monitor;
      const report = data.report ?? bundle.report;
      const changes = data.detectedChanges ?? [bundle.detectedChange];

      setMonitors((current) => {
        const withoutDemo = current.filter((item) => item.id !== monitor.id);
        return [{ ...monitor, lastCheckedAt: new Date().toISOString() }, ...withoutDemo];
      });
      setSignals((current) => {
        const incoming = data.signals ?? bundle.signals;
        const merged = [...incoming, ...current];
        const seen = new Set<string>();
        return merged.filter((signal) => {
          if (seen.has(signal.id)) return false;
          seen.add(signal.id);
          return true;
        });
      });
      setReportsByMonitor((current) => ({ ...current, [monitor.id]: report }));
      recordMonitorReportHistory(report, monitor.id);
      setDetectedChanges(changes);
      setTimelineKey((current) => current + 1);
      setRequirement(PRESET_DEMO_MONITOR_REQUIREMENT);
      setCategory("pricing");
      setMinimumSeverity("high");

      const firstSignal = bundle.signals?.[0];
      toast.success("Competitive pricing demo loaded", {
        description: "ApexAnalytics Pro changed from $99 to $129 with evidence, report, and timeline.",
        action: firstSignal ? { label: "Open report", onClick: () => openReport(monitor, firstSignal, report) } : undefined,
      });
      openReport(monitor, firstSignal, report);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo load failed.");
    } finally {
      setDemoLoading(false);
    }
  }

  async function checkMonitorNow(
    monitorId: string,
    options?: { automated?: boolean; monitor?: Monitor },
  ) {
    const monitor = options?.monitor ?? monitors.find((item) => item.id === monitorId);
    if (!monitor) {
      toast.error("Monitor not found. Refresh the page and try again.");
      return;
    }

    setCheckingId(monitorId);
    setAgentStages([]);
    try {
      syncLocalSessionToCookie();

      const runCheck = () =>
        fetch(`/api/monitors/${monitorId}/check`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirement: monitor.requirement,
            searchQuery: monitor.searchQuery ?? monitor.requirement,
            category: monitor.category,
            minimumSeverity: monitor.minimumSeverity,
            keywords: monitor.keywords ?? [],
            targetUrl: monitor.targetUrl,
            workspace: getWorkspaceContext(),
            memoryBrief: buildClientMemoryBrief({
              monitorId: monitor.id,
              requirement: monitor.requirement,
            }),
          }),
        });

      let response = await runCheck();
      if (response.status === 401 || response.status === 403) {
        syncLocalSessionToCookie();
        response = await runCheck();
      }

      const data = await readResponseJson<{
        signals?: IntelligenceSignal[];
        provider?: string;
        searchQuery?: string;
        matchedCount?: number;
        signalCount?: number;
        analysis?: { summary?: string; signals?: IntelligenceSignal[] };
        report?: ExecutiveIntelligenceReport;
        evidencePreview?: string;
        detectedChanges?: DetectedChange[];
        agentStages?: GtmAgentStage[];
        pendingAction?: PendingAction;
        emailNotification?: {
          sent: boolean;
          reason?: string;
          detail?: string;
          hint?: string;
          to?: string;
        };
        error?: string;
      }>(response);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expired - sign in again to run live checks.", {
            action: { label: "Sign in", onClick: () => router.push(signInFor("/alerts")) },
          });
          return;
        }
        if (response.status === 404) {
          toast.error(data.error || "Monitor not found - refresh and try again.");
          return;
        }
        if (!data.error && response.status >= 500) {
          throw new Error(`Live check failed (${response.status}). Try again in a moment.`);
        }
        throw new Error(data.error || "Check failed.");
      }

      if (data.agentStages?.length) {
        setAgentStages(data.agentStages);
      }

      const emailOutcome = data.emailNotification;
      if (emailOutcome?.sent) {
        toast.success(
          emailOutcome.to ? `Alert email sent to ${emailOutcome.to}` : "Alert email sent",
        );
      } else if (
        emailOutcome &&
        emailOutcome.reason !== "watch_disabled" &&
        emailOutcome.reason !== "no_findings"
      ) {
        toast.error("Alert email not sent", {
          description: [emailOutcome.detail, emailOutcome.hint].filter(Boolean).join(" "),
          duration: 12_000,
        });
      }

      const matched = data.signals ?? [];
      const topMatch = matched[0];
      const allSignals = data.analysis?.signals ?? matched;
      const summary = data.analysis?.summary ?? data.report?.situation ?? data.report?.verdict;

      updateMonitorCheckState(monitorId, {
        lastCheckedAt: new Date().toISOString(),
        lastMatchedCount: data.matchedCount ?? matched.length,
        lastSignalCount: data.signalCount ?? allSignals.length,
        lastSummary: summary?.slice(0, 280),
        lastSearchQuery: data.searchQuery ?? monitor.searchQuery,
        lastMatchTitle: topMatch?.title ?? allSignals[0]?.title,
        lastProvider: data.provider,
      });

      if (allSignals.length) {
        setSignals((current) => {
          const merged = [...allSignals, ...current];
          const seen = new Set<string>();
          return merged.filter((signal) => {
            if (seen.has(signal.id)) return false;
            seen.add(signal.id);
            return true;
          });
        });
      }

      if (data.detectedChanges?.length) {
        setDetectedChanges((current) => {
          const merged = [...data.detectedChanges!, ...current];
          const seen = new Set<string>();
          return merged.filter((change) => {
            if (seen.has(change.id)) return false;
            seen.add(change.id);
            return true;
          });
        });
        setTimelineKey((current) => current + 1);
      }

      if (data.report) {
        recordMonitorReportHistory(data.report, monitorId);
        fetch("/api/history", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report: data.report, monitorId }),
        }).catch(() => {});
        setReportsByMonitor((current) => ({ ...current, [monitorId]: data.report! }));
        const displaySignal = matched[0] ?? allSignals[0];
        toast.success("Evidence-backed report ready", {
          description: data.report.verdict,
          action: { label: "Open", onClick: () => openReport(monitor, displaySignal, data.report) },
        });

        const hasFindings = matched.length > 0 || (data.detectedChanges?.length ?? 0) > 0;
        if (hasFindings && data.pendingAction) {
          toast.message("HITL gate — approve before webhook send", {
            description: "Open the Approval inbox to edit and approve delivery.",
            action: {
              label: "Approve",
              onClick: () => openReport(monitor, matched[0] ?? allSignals[0], data.report, data.pendingAction?.id),
            },
          });
        }
      }

      setTimelineKey((current) => current + 1);

      matched.forEach((signal) => {
        toast.success("Monitor match", {
          description: signal.title,
          action: {
            label: "Report",
            onClick: () => openReport(monitor, signal, data.report, data.pendingAction?.id),
          },
        });
      });

      if (data.report && matched.length) {
        if (notificationPermission === "granted") {
          new Notification("SANTRA monitor match", {
            body: `${data.report.verdict} - risk ${data.report.riskScore}%`,
          });
        }
      }

      let queuedActionId = data.pendingAction?.id;
      if (data.pendingAction) {
        setSelectedPendingActionId(data.pendingAction.id);
        setActionQueueRefreshKey((current) => current + 1);
        toast.message("Waiting in Approval inbox", {
          description: data.pendingAction.proposedAction,
          action: data.report
            ? {
                label: "Open report",
                onClick: () => openReport(monitor, matched[0], data.report, data.pendingAction?.id),
              }
            : undefined,
        });
      } else if (data.report && (matched.length > 0 || (data.detectedChanges?.length ?? 0) > 0)) {
        try {
          const queueResponse = await fetch("/api/pending-actions", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              monitorId,
              reportId: data.report.id,
              proposedAction: data.report.verdict || "Monitor signals need review",
              proposedEvent: "monitor_alert",
              monitorRequirement: monitor.requirement,
              reportSnapshot: data.report,
            }),
          });
          const queueData = await readResponseJson<{ action?: PendingAction }>(queueResponse);
          if (queueResponse.ok && queueData.action) {
            queuedActionId = queueData.action.id;
            setSelectedPendingActionId(queueData.action.id);
            setActionQueueRefreshKey((current) => current + 1);
            toast.message("Waiting in Approval inbox", {
              description: queueData.action.proposedAction,
              action: {
                label: "Open report",
                onClick: () => openReport(monitor, matched[0], data.report, queueData.action?.id),
              },
            });
          }
        } catch {
          // optional local queue
        }
      }

      toast.message("Check complete", {
        description:
          data.provider === "bright-data"
            ? `${data.signalCount ?? allSignals.length} signals from live Bright Data · ${data.matchedCount ?? matched.length} highlighted`
            : data.provider === "exa"
              ? `${data.signalCount ?? allSignals.length} signals from Exa web search · ${data.matchedCount ?? matched.length} highlighted`
              : `${data.matchedCount ?? matched.length} matches (configure Exa or Bright Data for live evidence).`,
      });

      if (options?.automated && data.report && monitor) {
        toast.message("Autopilot run complete", {
          description: data.report.verdict,
          action: {
            label: "Open report",
            onClick: () => openReport(monitor, matched[0], data.report, queuedActionId),
          },
        });
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Check failed.";
      if (/401|403|signed in|unauthorized/i.test(message)) {
        toast.error("Session expired - sign in again to run live checks.", {
          action: { label: "Sign in", onClick: () => router.push(signInFor("/alerts")) },
        });
        return;
      }
      if (/JSON|invalid response|unexpected end/i.test(message)) {
        toast.error("Live check did not finish - tap Check now to retry.");
        return;
      }
      toast.error(message);
    } finally {
      setCheckingId(null);
    }
  }
  useEffect(() => {
    checkMonitorNowRef.current = checkMonitorNow;
  }, [checkMonitorNow]);

  useEffect(() => {
    if (!demoAutopilot || checkingId) return;
    const active = monitors.find((monitor) => monitor.active);
    if (!active) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) void checkMonitorNowRef.current?.(active.id, { automated: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [demoAutopilot, monitors, checkingId]);

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      toast.error("Browser notifications are not supported here.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      toast.success("Browser alerts enabled.");
    }
  }

  function toggleMonitor(id: string) {
    setMonitors((current) =>
      current.map((monitor) =>
        monitor.id === id ? { ...monitor, active: !monitor.active } : monitor,
      ),
    );
    const monitor = monitors.find((item) => item.id === id);
    if (monitor) {
      fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !monitor.active }),
      }).catch(() => {});
    }
  }

  async function removeMonitor(id: string) {
    try {
      await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    } catch {
      // Still remove locally if API fails in demo mode.
    }
    setMonitors((current) => current.filter((monitor) => monitor.id !== id));
  }

  function openEditMonitor(monitor: Monitor) {
    setEditingMonitor(monitor);
    setEditRequirement(monitor.requirement);
    setEditCategory(monitor.category);
    setEditSeverity(monitor.minimumSeverity);
    setEditTargetUrl(monitor.targetUrl ?? "");
  }

  function closeEditMonitor() {
    if (savingEdit) return;
    setEditingMonitor(null);
  }

  async function saveEditMonitor() {
    if (!editingMonitor) return;
    const trimmed = editRequirement.trim();
    if (!trimmed) {
      toast.error("Monitor requirement cannot be empty.");
      return;
    }

    setSavingEdit(true);
    try {
      const resolvedIntent = enrichIntent(await fetchMonitorIntent(trimmed), trimmed);
      const interpretedRequirement = cleanMonitorRequirement(resolvedIntent.normalizedRequirement);
      const searchQuery = resolvedIntent.searchQuery?.trim() || interpretedRequirement;
      if (interpretedRequirement.length < 3) {
        toast.error("Describe what you want to watch in a few words.");
        return;
      }

      const plainSummary =
        resolvedIntent.plainSummary ??
        plainEnglishMonitorSummary({
          requirement: trimmed,
          normalizedRequirement: interpretedRequirement,
          category: editCategory === "any" ? resolvedIntent.category : editCategory,
          minimumSeverity: editSeverity || resolvedIntent.minimumSeverity,
        });
      const category = editCategory === "any" ? resolvedIntent.category : editCategory;
      const minimumSeverity = editSeverity || resolvedIntent.minimumSeverity;
      const keywords = resolvedIntent.keywords ?? editingMonitor.keywords ?? [];
      const targetUrl = editTargetUrl.trim() || resolvedIntent.targetUrl || undefined;

      const response = await fetch(`/api/monitors/${editingMonitor.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement: interpretedRequirement,
          searchQuery,
          plainSummary,
          category,
          minimumSeverity,
          keywords,
          targetUrl: targetUrl ?? null,
        }),
      });
      const data = await readResponseJson<{ error?: string }>(response);
      if (!response.ok && response.status !== 404) {
        throw new Error(data.error || "Could not update monitor.");
      }

      setMonitors((current) =>
        current.map((monitor) =>
          monitor.id === editingMonitor.id
            ? {
                ...monitor,
                requirement: interpretedRequirement,
                searchQuery,
                plainSummary,
                category,
                minimumSeverity,
                keywords,
                targetUrl,
              }
            : monitor,
        ),
      );
      recordMonitorHistory({ requirement: interpretedRequirement, category });
      toast.success("Monitor updated");
      setEditingMonitor(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update monitor.");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <>
      <Card className="mb-4 border-cyan-300/20 bg-cyan-300/[0.04] p-4 md:p-5" glow>
        <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/70">Judge demo path · Phase 2</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Autonomous B2B GTM loop</h2>
        <ol className="mt-3 grid gap-2 text-sm text-white/65 sm:grid-cols-5">
          <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-white/35">1</span>
            Create monitor
          </li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-white/35">2</span>
            Check now → tools
          </li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-white/35">3</span>
            Evidence + brief
          </li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-white/35">4</span>
            Your OK
          </li>
          <li className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-white/35">5</span>
            Send to your tools
          </li>
        </ol>
        <p className="mt-3 text-xs text-white/45">
          Watch Agent reasoning below for dynamic tool routing. Nothing is sent until you approve.
        </p>
      </Card>

      {waitingApprovalCount > 0 && (
        <Card className="mb-4 border-amber-300/25 bg-amber-400/[0.06] p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {waitingApprovalCount} waiting for your OK
              </p>
              <p className="mt-1 text-xs text-white/50">
                Open a full report to review the Approval inbox and send to your tools.
              </p>
            </div>
            <Button size="sm" variant="neon" onClick={() => void openFirstWaitingApproval()}>
              Open report
            </Button>
          </div>
        </Card>
      )}

      <WorkspaceSection id="create-signal-monitor">
        {sessionReady && !signedIn && (
          <div className="mb-4 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Sign in to save monitors and run live checks.{" "}
            <button
              type="button"
              className="santra-focus font-medium underline underline-offset-2"
              onClick={() => router.push(signInFor("/alerts"))}
            >
              Sign in
            </button>
          </div>
        )}
        <Card className="p-5 md:p-6" glow>
          <Badge variant="cyan">New monitor</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-white">What should we watch?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Describe a B2B competitive signal in plain language. The GTM agent interprets intent, collects live
            evidence, and waits for your OK before sending anything out.
          </p>

          <div className="mt-6 space-y-5">
            <MonitorPromptField
              value={requirement}
              onChange={setRequirement}
              suggestions={promptSuggestions}
              suggestionsTitle={promptSuggestionsTitle}
              onPickSuggestion={(selection) => {
                setRequirement(selection.requirement);
                if (selection.category) {
                  setCategory(selection.category);
                }
              }}
            />

            {(intentLoading || monitorIntent) && (
              <div className="rounded-xl border border-cyan-200/15 bg-cyan-300/5 px-4 py-3 text-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className={cn("mt-0.5 h-4 w-4 shrink-0 text-santra-cyan", intentLoading && "animate-pulse")} />
                  <div className="min-w-0 space-y-2">
                    {intentLoading ? (
                      <p className="text-white/50">SANTRA is understanding what you want to watch…</p>
                    ) : monitorIntent ? (
                      <>
                        <p className="leading-6 text-white/75">
                          {monitorIntent.plainSummary ??
                            plainEnglishMonitorSummary({
                              requirement,
                              normalizedRequirement: monitorIntent.normalizedRequirement,
                              category: monitorIntent.category,
                              minimumSeverity: monitorIntent.minimumSeverity,
                            })}
                        </p>
                        {monitorIntent.searchQuery && (
                          <p className="text-xs text-white/40">
                            Search query: {monitorIntent.searchQuery}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="cyan">{monitorIntent.category}</Badge>
                          <Badge variant="risk">{monitorIntent.minimumSeverity}+ priority</Badge>
                          {monitorIntent.provider !== "heuristic" && (
                            <Badge variant="success">AI understood</Badge>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {intentError && !intentLoading && (
              <p className="text-sm text-amber-100/90">{intentError}</p>
            )}
          </div>

          <details className="group mt-6 rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.02]">
            <summary className="santra-focus cursor-pointer list-none px-4 py-3 text-sm text-white/55 marker:content-none hover:text-white/75 [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-white/70">Options</span>
              <span className="text-white/40"> — category, severity, alert webhook, demo</span>
            </summary>
            <div className="space-y-5 border-t border-white/10 px-4 pb-4 pt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-xs text-white/45">
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as "any" | SignalCategory)}
                    className="santra-focus h-11 rounded-2xl border border-white/10 bg-santra-panel px-4 text-sm text-white"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item === "any" ? "Any category" : item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-xs text-white/45">
                  Minimum severity
                  <select
                    value={minimumSeverity}
                    onChange={(event) => setMinimumSeverity(event.target.value as Severity)}
                    className="santra-focus h-11 rounded-2xl border border-white/10 bg-santra-panel px-4 text-sm text-white"
                  >
                    {severities.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-2">
                <label htmlFor="alert-webhook-url" className="text-xs font-medium text-white/60">
                  Alert webhook
                  <span className="ml-1 font-normal text-white/35">(Slack, Discord — optional)</span>
                </label>
                <Input
                  id="alert-webhook-url"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://hooks.slack.com/services/…"
                  className="h-10"
                  aria-label="Alert webhook URL"
                />
                <p className="text-[11px] leading-4 text-white/35">
                  Slack/Discord post a readable alert. Generic URLs (webhook.site, Zapier) include a plain <span className="font-mono text-white/50">summary</span>. Approve &amp; send still lives in the report popup.
                </p>
                {webhookUrl.trim() && (
                  <Badge variant="success" className="w-fit">
                    Alert webhook saved · HITL required
                  </Badge>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(
                    [
                      ["webhook.site", "https://webhook.site/"],
                      ["Slack", "https://api.slack.com/messaging/webhooks"],
                      ["Discord", "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"],
                      ["Zapier", "https://zapier.com/apps/webhook/help"],
                    ] as const
                  ).map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55 hover:text-cyan-100"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-fit"
                  onClick={enableBrowserNotifications}
                  disabled={
                    notificationPermission === null ||
                    notificationPermission === "granted" ||
                    notificationPermission === "unsupported"
                  }
                >
                  <BellRing className="h-4 w-4" />
                  {notificationPermission === "granted" ? "Browser alerts on" : "Enable browser alerts"}
                </Button>
                <Button variant="neon" className="w-fit" onClick={loadPresetDemo} disabled={demoLoading}>
                  <Zap className="h-4 w-4" />
                  {demoLoading ? "Loading…" : "Load pricing demo"}
                </Button>
                <Button
                  variant={demoAutopilot ? "neon" : "ghost"}
                  onClick={() => setDemoAutopilot((current) => !current)}
                  disabled={!activeMonitorCount}
                >
                  <TimerReset className="h-4 w-4" />
                  {demoAutopilot ? "Autopilot on" : "Autopilot"}
                </Button>
              </div>
            </div>
          </details>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/45">
              {activeMonitorCount === 0
                ? "No active monitors yet"
                : `${activeMonitorCount} active monitor${activeMonitorCount === 1 ? "" : "s"}`}
            </p>
            <Button variant="neon" onClick={createMonitor} disabled={creatingMonitor || intentLoading} className="sm:min-w-[200px]">
              <Radar className="h-4 w-4" />
              {creatingMonitor ? "Starting…" : intentLoading ? "Understanding…" : "Start monitoring"}
            </Button>
          </div>
        </Card>

        <AgentActivityLog
          className="mt-6"
          stages={agentStages}
          running={Boolean(checkingId)}
        />

        {monitors.length > 0 && (
          <div className="mt-6 grid gap-3">
            <h3 className="text-lg font-semibold text-white">Your monitors</h3>
            {monitors.map((monitor) => {
              const report = reportsByMonitor[monitor.id];
              const matchCount = monitor.lastMatchedCount ?? 0;
              const signalCount = monitor.lastSignalCount ?? matchCount;
              const lastChecked = monitor.lastCheckedAt
                ? new Date(monitor.lastCheckedAt).toLocaleString()
                : null;

              return (
              <Card key={monitor.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={monitor.active ? "success" : "default"}>
                        {monitor.active ? "Active" : "Paused"}
                      </Badge>
                      <span className="text-xs text-white/40">
                        {signalCount} signal{signalCount === 1 ? "" : "s"} · {matchCount} highlighted · {monitor.category}
                      </span>
                      {monitor.lastProvider && (
                        <span className="text-xs text-white/30">
                          {monitor.lastProvider === "bright-data"
                            ? "Bright Data"
                            : monitor.lastProvider === "exa"
                              ? "Exa"
                              : monitor.lastProvider === "openai"
                                ? "LLM analysis"
                                : "Demo evidence"}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-white">
                      {monitor.plainSummary ?? monitor.requirement}
                    </p>
                    {monitor.searchQuery && monitor.searchQuery !== monitor.requirement && (
                      <p className="mt-1 text-xs text-white/35">Search: {monitor.lastSearchQuery ?? monitor.searchQuery}</p>
                    )}
                    {lastChecked && (
                      <p className="mt-1 text-xs text-white/35">Last checked {lastChecked}</p>
                    )}
                    {monitor.lastSummary && (
                      <p className="mt-2 text-xs leading-5 text-white/50 line-clamp-3">{monitor.lastSummary}</p>
                    )}
                    {report ? (
                      <button
                        type="button"
                        className="santra-focus mt-2 text-left text-xs font-medium text-cyan-100/80 hover:text-cyan-100"
                        onClick={() => openReport(monitor, undefined, report)}
                      >
                        View full report →
                      </button>
                    ) : monitor.lastMatchTitle ? (
                      <p className="mt-1 text-xs text-cyan-100/80">
                        Latest finding: {monitor.lastMatchTitle}
                      </p>
                    ) : lastChecked ? (
                      <p className="mt-1 text-xs text-white/40">Live scan complete - open the report for evidence details.</p>
                    ) : (
                      <p className="mt-1 text-xs text-white/40">Tap Check now to run the first live scan.</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="neon"
                      size="sm"
                      disabled={checkingId === monitor.id}
                      onClick={() => checkMonitorNow(monitor.id)}
                    >
                      {checkingId === monitor.id ? "Checking…" : "Check now"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditMonitor(monitor)}
                      aria-label="Edit monitor"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleMonitor(monitor.id)} aria-label={monitor.active ? "Pause monitor" : "Resume monitor"}>
                      {monitor.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeMonitor(monitor.id)} aria-label="Delete monitor">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
            })}

            <Button
              type="button"
              variant="ghost"
              className="w-fit text-sm text-white/45"
              onClick={() => setShowActivity((value) => !value)}
            >
              {showActivity ? "Hide activity log" : "Show activity log"}
            </Button>
            {showActivity && (
              <>
                {detectedChanges.length > 0 ? (
                  <ChangeDetectionPanel changes={detectedChanges.slice(0, 6)} />
                ) : (
                  <Card className="p-4 text-sm text-white/45">
                    No snapshot diffs yet. Run Check now twice on the same monitor to detect price or field changes from live evidence.
                  </Card>
                )}
                <MonitorTimeline key={timelineKey} />
              </>
            )}
          </div>
        )}
      </WorkspaceSection>

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-santra-ink/80 px-3 py-4 backdrop-blur-xl sm:px-4 sm:py-8"
          style={{
            paddingBottom: "max(1rem, var(--santra-mobile-nav-clearance))",
          }}
          onClick={closeReport}
        >
          <div
            className="my-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-santra-panel shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 md:p-6">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Executive intel brief</p>
                {!selectedReport.report ? (
                  <>
                    <h3 className="mt-2 text-lg font-semibold text-white md:text-2xl">
                      {selectedReport.signal?.title}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
                      Monitor · {selectedReport.monitor.requirement}
                    </p>
                  </>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" onClick={closeReport} aria-label="Close report">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[calc(100dvh-10rem-var(--santra-mobile-nav-clearance))] overflow-y-auto overscroll-contain sm:max-h-[min(78vh,900px)]">
              {selectedReport.report ? (
                <div className="grid gap-0">
                  <div className="p-5 md:p-6">
                    <MonitorIntelBrief
                      report={selectedReport.report}
                      monitorId={selectedReport.monitor.id}
                      showSendGuide={false}
                      onHeadlineChange={(headline) => {
                        const nextReport = { ...selectedReport.report!, verdict: headline };
                        setSelectedReport({ ...selectedReport, report: nextReport });
                        recordMonitorReportHistory(nextReport, selectedReport.monitor.id);
                      }}
                    />
                  </div>
                  <div className="border-t border-white/10 p-5 md:p-6">
                    <ReportApprovalPanel
                      pendingActionId={selectedPendingActionId}
                      report={selectedReport.report}
                      requirement={selectedReport.monitor.requirement}
                      monitorId={selectedReport.monitor.id}
                      refreshKey={actionQueueRefreshKey}
                      onSelectAction={openPendingAction}
                      onResolved={() => setActionQueueRefreshKey((value) => value + 1)}
                    />
                  </div>
                  <div className="border-t border-white/10 p-5 md:p-6">
                    <BackgroundEmailWatchPanel monitorId={selectedReport.monitor.id} />
                  </div>
                </div>
              ) : (
                <div className="p-5 md:p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-white/35">Signal details</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Situation</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{selectedReport.signal?.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Source</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{selectedReport.signal?.source}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10 text-santra-cyan">
                        <Bot className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">AI assistant analysis</p>
                        <p className="text-xs text-white/42">Situation summary and recommended next moves</p>
                      </div>
                    </div>
                    <div className="mt-5 min-h-48 rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                      {aiLoading ? (
                        <div className="flex h-40 items-center justify-center gap-3 text-sm text-white/60">
                          <Sparkles className="h-4 w-4 animate-pulse text-santra-cyan" />
                          SANTRA is analyzing the alert...
                        </div>
                      ) : (
                        <>
                          {aiError && (
                            <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                              {aiError}
                            </div>
                          )}
                          <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-sm prose-p:leading-7 prose-p:text-white/68 prose-li:text-sm prose-li:text-white/68 prose-strong:text-white">
                            <ReactMarkdown>{aiSummary}</ReactMarkdown>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {editingMonitor && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-santra-ink/80 px-3 py-4 backdrop-blur-xl sm:px-4 sm:py-8"
          style={{
            paddingBottom: "max(1rem, var(--santra-mobile-nav-clearance))",
          }}
          onClick={closeEditMonitor}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-monitor-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-santra-panel shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">GTM monitor</p>
                <h4 id="edit-monitor-title" className="mt-1 text-lg font-semibold text-white">
                  Edit monitor
                </h4>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Update the watch goal. Live scans use Exa when Bright Data is not configured.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={closeEditMonitor}
                aria-label="Close edit monitor"
                disabled={savingEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <label className="grid gap-2 text-xs text-white/55">
                What should SANTRA watch?
                <Textarea
                  value={editRequirement}
                  onChange={(event) => setEditRequirement(event.target.value)}
                  placeholder="Alert me when…"
                  className="min-h-28"
                  disabled={savingEdit}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-xs text-white/45">
                  Category
                  <select
                    value={editCategory}
                    onChange={(event) => setEditCategory(event.target.value as Monitor["category"])}
                    className="santra-focus h-11 rounded-2xl border border-white/10 bg-santra-panel px-4 text-sm text-white"
                    disabled={savingEdit}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item === "any" ? "Any category" : item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-xs text-white/45">
                  Minimum severity
                  <select
                    value={editSeverity}
                    onChange={(event) => setEditSeverity(event.target.value as Severity)}
                    className="santra-focus h-11 rounded-2xl border border-white/10 bg-santra-panel px-4 text-sm text-white"
                    disabled={savingEdit}
                  >
                    {severities.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-xs text-white/45">
                Target URL <span className="text-white/30">(optional)</span>
                <Input
                  value={editTargetUrl}
                  onChange={(event) => setEditTargetUrl(event.target.value)}
                  placeholder="https://competitor.com/pricing"
                  className="h-11"
                  disabled={savingEdit}
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
              <Button variant="ghost" onClick={closeEditMonitor} disabled={savingEdit}>
                Cancel
              </Button>
              <Button variant="neon" onClick={() => void saveEditMonitor()} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
