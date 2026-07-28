"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BellRing, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLocalSession } from "@/lib/local-auth";
import { cn } from "@/lib/utils";

const INTERVAL_LABELS: Array<{ ms: number; label: string }> = [
  { ms: 30 * 60 * 1000, label: "Every 30 minutes" },
  { ms: 60 * 60 * 1000, label: "Every 1 hour" },
  { ms: 6 * 60 * 60 * 1000, label: "Every 6 hours" },
  { ms: 12 * 60 * 60 * 1000, label: "Every 12 hours" },
  { ms: 24 * 60 * 60 * 1000, label: "Daily" },
];

type WatchState = {
  watch_enabled: boolean;
  watch_interval_ms: number | null;
  watch_started_at: string | null;
  watch_email_enabled: boolean;
  last_notified_at: string | null;
};

type EmailConfigStatus = {
  configured: boolean;
  hasApiKey: boolean;
  from: string | null;
  sandbox: boolean;
  email?: string | null;
};

type BackgroundEmailWatchPanelProps = {
  monitorId: string;
  className?: string;
};

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function intervalLabel(ms: number | null) {
  if (!ms) return null;
  return INTERVAL_LABELS.find((item) => item.ms === ms)?.label ?? `Every ${Math.round(ms / 3_600_000)}h`;
}

export function BackgroundEmailWatchPanel({ monitorId, className }: BackgroundEmailWatchPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [watch, setWatch] = useState<WatchState | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [intervalMs, setIntervalMs] = useState(60 * 60 * 1000);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [config, setConfig] = useState<EmailConfigStatus | null>(null);
  const [testing, setTesting] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/test", { credentials: "include" });
      if (!response.ok) return;
      const data = (await response.json().catch(() => null)) as EmailConfigStatus | null;
      if (data) setConfig(data);
    } catch {
      // config badge is advisory only
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/monitors/${monitorId}/watch`, { credentials: "include" });
      const data = (await response.json().catch(() => null)) as {
        watch?: WatchState;
        email?: string | null;
        error?: string;
        hint?: string;
      } | null;

      setUnavailable(null);

      if (response.status === 503) {
        setUnavailable(data?.hint || data?.error || "MongoDB is required for background watch.");
        setWatch(null);
        return;
      }

      if (!response.ok) {
        setUnavailable(data?.error || "Unable to load watch status.");
        return;
      }

      if (data?.watch) {
        setWatch(data.watch);
        if (data.watch.watch_interval_ms) setIntervalMs(data.watch.watch_interval_ms);
      }
      setEmail(data?.email ?? getLocalSession()?.email ?? null);
    } catch {
      setUnavailable("Unable to load watch status.");
    } finally {
      setLoading(false);
    }
  }, [monitorId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
      void loadConfig();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load, loadConfig]);

  async function sendTestEmail() {
    setTesting(true);
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as {
        sent?: boolean;
        to?: string;
        error?: string;
        hint?: string;
      } | null;

      if (!response.ok || !data?.sent) {
        toast.error(data?.error || "Test email failed to send.", {
          description: data?.hint,
          duration: 12_000,
        });
        return;
      }

      toast.success(`Test email sent to ${data.to}`, {
        description: "Check your inbox and spam folder.",
      });
    } catch {
      toast.error("Test email failed to send.");
    } finally {
      setTesting(false);
    }
  }

  async function startWatch() {
    setSaving(true);
    try {
      const response = await fetch(`/api/monitors/${monitorId}/watch`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalMs }),
      });
      const data = (await response.json().catch(() => null)) as {
        watch?: WatchState;
        email?: string | null;
        error?: string;
        hint?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        toast.error(data?.error || "Could not start background watch.", {
          description: data?.hint,
        });
        return;
      }

      if (data?.watch) setWatch(data.watch);
      if (data?.email) setEmail(data.email);
      toast.success(data?.message || "Background email watch started.", {
        description: email ? `Alerts will go to ${email}` : "Uses your registered account email.",
      });
    } catch {
      toast.error("Could not start background watch.");
    } finally {
      setSaving(false);
    }
  }

  async function stopWatch() {
    setSaving(true);
    try {
      const response = await fetch(`/api/monitors/${monitorId}/watch`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as {
        watch?: WatchState;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        toast.error(data?.error || "Could not stop background watch.");
        return;
      }

      if (data?.watch) setWatch(data.watch);
      toast.success(data?.message || "Background email watch stopped.");
    } catch {
      toast.error("Could not stop background watch.");
    } finally {
      setSaving(false);
    }
  }

  const watching = Boolean(watch?.watch_enabled);

  return (
    <div className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6", className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-santra-cyan">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">Background email watch</p>
          <h4 className="mt-1 text-base font-semibold text-white">Keep monitoring after Check now</h4>
          <p className="mt-1 text-sm leading-6 text-white/48">
            SANTRA re-checks this monitor on a schedule and emails you when signals or changes appear.
            Check now, CRM automation, and approval queue stay the same.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading watch status…
        </div>
      ) : unavailable ? (
        <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100/85">
          {unavailable}
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm text-white/70">
            <span className="text-xs uppercase tracking-[0.16em] text-white/35">Check period</span>
            <select
              value={intervalMs}
              disabled={saving}
              onChange={(event) => setIntervalMs(Number(event.target.value))}
              className="santra-focus h-11 rounded-2xl border border-white/10 bg-santra-panel px-4 text-sm text-white outline-none"
            >
              {INTERVAL_LABELS.map((option) => (
                <option key={option.ms} value={option.ms}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-santra-cyan" />
            <div className="min-w-0">
              <p className="text-sm text-white/80">Email alerts</p>
              <p className="mt-0.5 truncate text-xs text-white/45">
                {email ? `Sends to ${email}` : "Uses your registered account email"}
              </p>
            </div>
          </div>

          {config && !config.configured ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-amber-100/85">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 text-xs leading-5">
                <p className="text-sm font-medium text-amber-50">Email provider not configured</p>
                <p className="mt-0.5">
                  {config.hasApiKey
                    ? "Add SANTRA_EMAIL_FROM to .env.local"
                    : "Add RESEND_API_KEY and SANTRA_EMAIL_FROM to .env.local"}
                  , then restart the dev server. Watch still runs, but no email is sent.
                </p>
              </div>
            </div>
          ) : null}

          {config?.configured && config.sandbox ? (
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/60">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/80" />
              <p className="min-w-0 text-xs leading-5">
                Using Resend&apos;s shared test sender. It only delivers to the email that owns your Resend
                account. Verify a domain and set SANTRA_EMAIL_FROM to send anywhere.
              </p>
            </div>
          ) : null}

          {watching ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50/90">
              <p className="font-medium">Watching · {intervalLabel(watch?.watch_interval_ms ?? intervalMs)}</p>
              <p className="mt-1 text-xs text-cyan-100/65">
                Started {formatWhen(watch?.watch_started_at ?? null) ?? "recently"}
                {watch?.last_notified_at
                  ? ` · Last email ${formatWhen(watch.last_notified_at)}`
                  : " · No alert email yet"}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {watching ? (
              <>
                <Button variant="neon" disabled={saving} onClick={() => void startWatch()}>
                  {saving ? "Updating…" : "Update period"}
                </Button>
                <Button variant="ghost" disabled={saving} onClick={() => void stopWatch()}>
                  Stop watching
                </Button>
              </>
            ) : (
              <Button variant="neon" disabled={saving} onClick={() => void startWatch()}>
                {saving ? "Starting…" : "Start email watch"}
              </Button>
            )}
            <Button variant="ghost" disabled={testing} onClick={() => void sendTestEmail()}>
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {testing ? "Sending…" : "Send test email"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
