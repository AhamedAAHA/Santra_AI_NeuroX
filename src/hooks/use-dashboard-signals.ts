"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntelligenceSignal } from "@/types/intelligence";

export const DASHBOARD_SIGNALS_UPDATED_EVENT = "santra:dashboard-signals-updated";
const SESSION_SNAPSHOT_KEY = "santra-dashboard-signal-snapshot";

export type DashboardSignalSource = "live" | "sample" | "monitor" | "empty";

export type DashboardSignalSnapshot = {
  signals: IntelligenceSignal[];
  source: DashboardSignalSource;
  loading: boolean;
  lastUpdated: Date | null;
};

type SignalsResponse = {
  signals?: IntelligenceSignal[];
  source?: DashboardSignalSource;
  generatedAt?: string;
};

function resolvedDate(generatedAt?: string) {
  const value = generatedAt ? new Date(generatedAt) : new Date();
  return Number.isNaN(value.getTime()) ? new Date() : value;
}

function readSessionSnapshot() {
  try {
    const value = window.sessionStorage.getItem(SESSION_SNAPSHOT_KEY);
    return value ? (JSON.parse(value) as SignalsResponse) : null;
  } catch {
    window.sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
    return null;
  }
}

/** Same on server and first client paint - session cache applied after mount. */
const INITIAL_SNAPSHOT: DashboardSignalSnapshot = {
  signals: [],
  source: "empty",
  loading: true,
  lastUpdated: null,
};

function isLiveSource(source?: DashboardSignalSource) {
  return source === "live" || source === "monitor";
}

function getInitialSnapshot(): DashboardSignalSnapshot {
  if (typeof window === "undefined") return INITIAL_SNAPSHOT;
  const cached = readSessionSnapshot();
  // Never hydrate Tesla/sample preview blobs from an older session.
  if (!cached?.signals?.length || !isLiveSource(cached.source)) return INITIAL_SNAPSHOT;
  return {
    signals: cached.signals ?? [],
    source: cached.source ?? "empty",
    loading: false,
    lastUpdated: cached.generatedAt ? resolvedDate(cached.generatedAt) : null,
  };
}

export function useDashboardSignals(refreshInterval = 60000) {
  const [snapshot, setSnapshot] = useState<DashboardSignalSnapshot>(getInitialSnapshot);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/signals", { cache: "no-store" });
      if (!response.ok) throw new Error("Signal request failed.");
      const data = (await response.json()) as SignalsResponse;
      const sessionSnapshot = readSessionSnapshot();
      const keepSessionLive =
        !isLiveSource(data.source) &&
        isLiveSource(sessionSnapshot?.source) &&
        Boolean(sessionSnapshot?.signals?.length);
      const nextData = keepSessionLive && sessionSnapshot ? sessionSnapshot : data;

      setSnapshot({
        signals: nextData.signals ?? [],
        source: nextData.source ?? "empty",
        loading: false,
        lastUpdated: resolvedDate(nextData.generatedAt),
      });

      if (isLiveSource(nextData.source) && nextData.signals?.length) {
        window.sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(nextData));
      } else if (!isLiveSource(nextData.source)) {
        window.sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
      }
    } catch {
      setSnapshot((current) => ({ ...current, loading: false, lastUpdated: new Date() }));
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);

    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, refreshInterval);

    const onSignalsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<SignalsResponse>).detail;
      if (!detail?.signals) {
        void refresh();
        return;
      }

      const source = detail.source ?? "empty";
      setSnapshot({
        signals: detail.signals,
        source,
        loading: false,
        lastUpdated: resolvedDate(detail.generatedAt),
      });
      if (isLiveSource(source) && detail.signals.length) {
        window.sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(detail));
      } else {
        window.sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
      }
    };

    window.addEventListener(DASHBOARD_SIGNALS_UPDATED_EVENT, onSignalsUpdated);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener(DASHBOARD_SIGNALS_UPDATED_EVENT, onSignalsUpdated);
    };
  }, [refresh, refreshInterval]);

  return snapshot;
}
