/**
 * Noise / materiality filter — drop cosmetic churn that should never trigger HITL.
 * Ignores footer years, cookie banners, nav chrome, and tiny price wobbles.
 */

import type { DetectedChange, IntelligenceSignal, Severity } from "@/types/intelligence";

const NOISE_FIELD_PATTERNS = [
  /\bcopyright\b/i,
  /\bcookie\b/i,
  /\bprivacy policy\b/i,
  /\bterms of (service|use)\b/i,
  /\bnavigation\b/i,
  /\bfooter\b/i,
  /\bheader\b/i,
  /\bmenu\b/i,
  /\ball rights reserved\b/i,
  /\blast updated\b/i,
  /\bpowered by\b/i,
];

const NOISE_VALUE_PATTERNS = [
  /^©?\s*20\d{2}$/i,
  /^20\d{2}$/,
  /accept (all )?cookies/i,
  /we use cookies/i,
];

const MATERIAL_FIELD_HINTS = [
  /pricing|price|plan|tier|package|enterprise|starter|pro\b/i,
  /hiring|career|job|vacanc/i,
  /feature|product|launch|announce/i,
  /competitor|rival|positioning/i,
];

export function isCosmeticFieldChange(field: string, oldValue: string, newValue: string): boolean {
  const blob = `${field} ${oldValue} ${newValue}`;
  if (NOISE_FIELD_PATTERNS.some((pattern) => pattern.test(field) || pattern.test(blob))) {
    return true;
  }
  if (NOISE_VALUE_PATTERNS.some((pattern) => pattern.test(oldValue) || pattern.test(newValue))) {
    return true;
  }

  // Year-only footer churn: 2025 → 2026
  if (/^20\d{2}$/.test(oldValue.trim()) && /^20\d{2}$/.test(newValue.trim())) {
    return true;
  }

  const oldNum = parseFloat(oldValue.replace(/[^0-9.]/g, ""));
  const newNum = parseFloat(newValue.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(oldNum) && !Number.isNaN(newNum) && oldNum > 0) {
    const pct = Math.abs(((newNum - oldNum) / oldNum) * 100);
    // Sub-2% price wobble on non-pricing fields is noise
    if (pct < 2 && !MATERIAL_FIELD_HINTS.some((pattern) => pattern.test(field))) {
      return true;
    }
  }

  return false;
}

export function isMaterialChange(change: Pick<DetectedChange, "field" | "oldValue" | "newValue" | "severity">) {
  if (isCosmeticFieldChange(change.field, change.oldValue, change.newValue)) {
    return false;
  }
  return true;
}

export function filterMaterialChanges<T extends DetectedChange>(changes: T[]): T[] {
  return changes.filter((change) => isMaterialChange(change));
}

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Drop low-signal noise rows that do not clear minimum severity or look like chrome. */
export function filterNoiseSignals(
  signals: IntelligenceSignal[],
  minimumSeverity: Severity = "low",
): IntelligenceSignal[] {
  return signals.filter((signal) => {
    if (severityRank[signal.severity] < severityRank[minimumSeverity]) return false;
    const blob = `${signal.title} ${signal.summary}`;
    if (NOISE_FIELD_PATTERNS.some((pattern) => pattern.test(blob))) return false;
    if (NOISE_VALUE_PATTERNS.some((pattern) => pattern.test(blob))) return false;
    return true;
  });
}
