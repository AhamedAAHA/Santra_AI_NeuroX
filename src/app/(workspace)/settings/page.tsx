"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Download,
  MonitorCog,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace/workspace-page";
import { VoiceLanguageSelector } from "@/components/voice/language-selector";
import { getVoiceLanguageOption, resolveBrowserTtsLanguage } from "@/lib/voice/languages";
import { type SentraSettings, type VoiceMode, useSettings } from "@/settings/settings-context";

type IntegrationStatus = {
  mongodb: boolean;
  mongodbReady?: boolean;
  secretsSource?: "env";
  aiml: boolean;
  openai: boolean;
  llm?: {
    ready: boolean;
    provider: "aiml" | "openai" | null;
    models: Record<string, string> | null;
  };
  aimlVoice?: boolean;
  speechmaticsVoice?: boolean;
  speechmaticsStt?: boolean;
  featherless?: boolean;
  featherlessModels?: { chat: string; vision: string } | null;
  brightData?: boolean;
  brightDataReady?: boolean;
  exa?: boolean;
  band?: boolean;
  toolsConfigured?: number;
};

type SettingSection = keyof SentraSettings;

const voiceModes: Array<{ id: VoiceMode; label: string }> = [
  { id: "professional", label: "Professional" },
  { id: "analyst", label: "Analyst" },
  { id: "calm", label: "Calm" },
  { id: "fast", label: "Fast Briefing" },
];

const SHOW_INTEGRATION_STATUS = process.env.NEXT_PUBLIC_SENTRA_SHOW_INTEGRATION_STATUS === "true";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, exportSettings, clearAnalysisHistory } = useSettings();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [testing, setTesting] = useState(false);

  const llmReady = Boolean(status?.openai || status?.llm?.ready);
  const voiceProfile = useMemo(() => voiceModes.find((mode) => mode.id === settings.voice.mode)?.label ?? "Professional", [settings.voice.mode]);
  const voiceLanguage = useMemo(() => getVoiceLanguageOption(settings.voice.language), [settings.voice.language]);

  useEffect(() => {
    if (!SHOW_INTEGRATION_STATUS) return;
    void testConnection(false);
  }, []);

  function save(mutator: (current: SentraSettings) => SentraSettings, message = "Settings saved") {
    updateSettings(mutator);
    toast.success(message);
  }

  function patchSection<TSection extends SettingSection>(
    section: TSection,
    patch: Partial<SentraSettings[TSection]>,
    message?: string,
  ) {
    save((current) => ({ ...current, [section]: { ...current[section], ...patch } }), message);
  }

  async function testConnection(showToast = true) {
    setTesting(true);
    try {
      const response = await fetch("/api/health/integrations");
      const data = (await response.json()) as IntegrationStatus;
      if (!response.ok) throw new Error("Connection test failed.");
      setStatus(data);
      const nextLlmReady = Boolean(data.openai || data.llm?.ready);
      if (showToast) {
        toast.success(nextLlmReady ? "OpenAI connection ready" : "Connection check complete", {
          description: nextLlmReady
            ? "AI provider is configured."
            : "Add OPENAI_API_KEY or AIML_API_KEY to enable live analysis.",
        });
      }
    } catch {
      setStatus(null);
      if (showToast) toast.error("Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  function resetAll() {
    resetSettings();
    toast.success("Defaults restored");
  }

  function clearHistory() {
    clearAnalysisHistory();
    toast.success("Analysis history cleared");
  }

  function testVoice() {
    if (!settings.voice.enabled) {
      toast.message("AI voice response is disabled.");
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Voice test is not supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      `SANTRA voice mode is ${voiceProfile}. Language is ${voiceLanguage.label}. Settings are active.`,
    );
    utterance.lang = resolveBrowserTtsLanguage(settings.voice.language);
    utterance.rate = settings.voice.speed;
    utterance.volume = settings.voice.volume;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="SANTRA Control Center"
        title="Settings"
        description="Configure voice, AI analyst behavior, privacy guardrails, and workspace experience."
        aside={
          SHOW_INTEGRATION_STATUS ? (
            <Card className="grid content-center gap-4 p-6" glow>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/42">System status</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Platform readiness</h2>
                </div>
                <StatusDot ok={llmReady} />
              </div>
              <div className="grid gap-2">
                <StatusLine label="OpenAI API (LLM)" ok={status?.openai || status?.llm?.ready} />
                <StatusLine label="Speechmatics voice (TTS)" ok={status?.speechmaticsVoice ?? status?.aimlVoice} />
                <StatusLine label="Speechmatics STT" ok={status?.speechmaticsStt ?? status?.speechmaticsVoice} />
                <StatusLine label="MongoDB workspace" ok={status?.mongodbReady ?? status?.mongodb} />
              </div>
            </Card>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <Button
          variant="neon"
          onClick={() => {
            updateSettings((current) => ({ ...current }));
            toast.success("Preferences saved locally");
          }}
        >
          <CheckCircle2 className="h-4 w-4" /> Save preferences
        </Button>
        <Button variant="ghost" onClick={resetAll}>
          <RotateCcw className="h-4 w-4" /> Reset defaults
        </Button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2 xl:gap-5">
        <div className="grid gap-4">
          <SettingsCard icon={Volume2} title="Voice Settings" subtitle="Control response playback, microphones, and analyst voice behavior.">
            <ToggleRow label="AI voice response" description="When disabled, AI replies stay text-only." checked={settings.voice.enabled} onChange={(value) => patchSection("voice", { enabled: value })} />
            <ToggleRow label="Microphone listening" description="Hides or disables mic input buttons across SANTRA." checked={settings.voice.microphone} onChange={(value) => patchSection("voice", { microphone: value })} />
            <ToggleRow label="Auto speech playback" description="Allows automatic spoken briefings when supported by the browser." checked={settings.voice.autoPlayback} onChange={(value) => patchSection("voice", { autoPlayback: value })} />
            <VoiceLanguageSelector
              value={settings.voice.language}
              onChange={(language) => patchSection("voice", { language }, "Speech language saved")}
            />
            <Segmented label="Voice mode" value={settings.voice.mode} options={voiceModes} onChange={(value) => patchSection("voice", { mode: value })} />
            <RangeRow label="Voice speed" value={settings.voice.speed} min={0.7} max={1.4} step={0.05} suffix="x" onChange={(value) => patchSection("voice", { speed: value }, "Voice speed saved")} />
            <RangeRow label="Voice volume" value={settings.voice.volume} min={0} max={1} step={0.05} formatter={(value) => `${Math.round(value * 100)}%`} onChange={(value) => patchSection("voice", { volume: value }, "Voice volume saved")} />
            <Button variant="ghost" onClick={testVoice}><Play className="h-4 w-4" /> Test voice</Button>
          </SettingsCard>

          <SettingsCard icon={BrainCircuit} title="AI Analyst Settings" subtitle="Tune GTM analyst behavior, reasoning output, and scoring layers.">
            <ToggleRow label="Live logs" checked={settings.analyst.liveLogs} onChange={(value) => patchSection("analyst", { liveLogs: value })} />
            <ToggleRow label="Source tracking" checked={settings.analyst.sourceTracking} onChange={(value) => patchSection("analyst", { sourceTracking: value })} />
            <ToggleRow label="AI reasoning summaries" checked={settings.analyst.reasoningSummaries} onChange={(value) => patchSection("analyst", { reasoningSummaries: value })} />
            <ToggleRow label="Automatic visualization generation" checked={settings.analyst.automaticVisualizations} onChange={(value) => patchSection("analyst", { automaticVisualizations: value })} />
            <ToggleRow label="Competitor intelligence mode" checked={settings.analyst.worldIntelligence} onChange={(value) => patchSection("analyst", { worldIntelligence: value })} />
            <ToggleRow label="Risk scoring" checked={settings.analyst.riskScoring} onChange={(value) => patchSection("analyst", { riskScoring: value })} />
            <ToggleRow label="Confidence scores" checked={settings.analyst.confidenceScores} onChange={(value) => patchSection("analyst", { confidenceScores: value })} />
          </SettingsCard>
        </div>

        <div className="grid gap-4">
          <SettingsCard icon={MonitorCog} title="UI / Experience Settings" subtitle="Adjust motion, background effects, and command center density.">
            <ToggleRow label="Animations" checked={settings.experience.animations} onChange={(value) => patchSection("experience", { animations: value })} />
            <ToggleRow label="Mouse hover effects" checked={settings.experience.mouseHoverEffects} onChange={(value) => patchSection("experience", { mouseHoverEffects: value })} />
            <ToggleRow label="Particle background" checked={settings.experience.particleBackground} onChange={(value) => patchSection("experience", { particleBackground: value })} />
            <ToggleRow label="Sound effects" checked={settings.experience.soundEffects} onChange={(value) => patchSection("experience", { soundEffects: value })} />
            <ToggleRow label="Compact mode" checked={settings.experience.compactMode} onChange={(value) => patchSection("experience", { compactMode: value })} />
            <ToggleRow label="Fullscreen command center mode" checked={settings.experience.fullscreenCommandCenter} onChange={(value) => patchSection("experience", { fullscreenCommandCenter: value })} />
          </SettingsCard>

          <SettingsCard icon={Sparkles} title="Data & Privacy" subtitle="Manage local analysis history and exported preferences.">
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="ghost" onClick={clearHistory}><Trash2 className="h-4 w-4" /> Clear analysis history</Button>
              <Button variant="ghost" onClick={exportSettings}><Download className="h-4 w-4" /> Export user data</Button>
            </div>
            <Button variant="ghost" className="mt-2" onClick={() => void testConnection(true)} disabled={testing}>
              <Activity className={cn("h-4 w-4", testing && "animate-pulse")} /> Test OpenAI connection
            </Button>
          </SettingsCard>
        </div>
      </div>

      <Card className="p-5" glow>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Preference storage</p>
            <p className="mt-1 text-xs text-white/45">Settings are saved in localStorage and applied across Voice AI, Live Logs, and AI Analyst.</p>
          </div>
          <Badge variant="violet">Local device policy</Badge>
        </div>
      </Card>

      {SHOW_INTEGRATION_STATUS && status ? (
        <Card className="p-6" glow>
          <h2 className="text-lg font-semibold text-white">Connection status</h2>
          <ul className="mt-5 space-y-4">
            <StatusRow label="MongoDB connection" ok={status.mongodb} />
            <StatusRow label="MongoDB workspace ready" ok={status.mongodbReady ?? status.mongodb} />
            <StatusRow label={`API keys (${status.secretsSource ?? "env"})`} ok={status.aiml || status.openai} />
            <StatusRow label="LLM (AIML / OpenAI)" ok={status.openai || status.llm?.ready} />
            <StatusRow label="Bright Data (web evidence)" ok={status.brightData} />
            <StatusRow label="Exa Search (fallback)" ok={status.exa} />
            <StatusRow label="Band.io notify" ok={status.band} optional />
            <StatusRow label="Featherless (open models)" ok={status.featherless} optional />
            <StatusRow label="Speechmatics voice (TTS)" ok={status.speechmaticsVoice ?? status.aimlVoice} />
            <StatusRow label="Speechmatics STT" ok={status.speechmaticsStt ?? status.speechmaticsVoice} />
            {typeof status.toolsConfigured === "number" && (
              <li className="text-sm text-white/55">
                External tools ready: <span className="text-white">{status.toolsConfigured}+</span> (need 3+ for Phase 2)
              </li>
            )}
          </ul>
        </Card>
      ) : null}
    </WorkspacePage>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 md:p-6" glow>
      <div className="mb-5 flex items-start gap-3 border-b border-white/10 pb-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.08] text-sentra-cyan">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-white/46">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3">{children}</div>
    </Card>
  );
}

function StatusRow({ label, ok, optional }: { label: string; ok?: boolean; optional?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="text-sm text-white/70">
        {label}
        {optional ? <span className="ml-1 text-white/35">(optional)</span> : null}
      </span>
      {ok ? (
        <span className="flex items-center gap-1 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Ready
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-amber-300">
          <XCircle className="h-4 w-4" /> Missing
        </span>
      )}
    </li>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="mt-1 text-xs leading-5 text-white/42">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "sentra-focus relative h-8 w-14 shrink-0 overflow-hidden rounded-full border transition",
          "self-end sm:self-auto",
          checked ? "border-cyan-200/35 bg-cyan-300/24 shadow-[inset_0_0_18px_rgba(83,244,255,.12)]" : "border-white/12 bg-white/[0.06]",
        )}
      >
        <motion.span
          initial={false}
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className={cn(
            "absolute left-1 top-1 block h-6 w-6 rounded-full",
            checked ? "bg-cyan-100 shadow-glow" : "bg-white/60",
          )}
        />
      </button>
    </div>
  );
}

function Segmented<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: Array<{ id: TValue; label: string }>;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "sentra-focus rounded-full border px-3 py-2 text-xs transition",
              value === option.id ? "border-cyan-200/35 bg-cyan-300/12 text-cyan-50" : "border-white/10 text-white/52",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  formatter,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  formatter?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-xs text-cyan-100/70">{formatter ? formatter(value) : `${value.toFixed(2)}${suffix}`}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-cyan-300"
      />
    </label>
  );
}

function StatusLine({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <span className="text-xs text-white/55">{label}</span>
      <span className={cn("flex items-center gap-1 text-[11px]", ok ? "text-emerald-200" : "text-amber-200")}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {ok ? "Ready" : "Fallback"}
      </span>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={cn("relative h-3 w-3 rounded-full", ok ? "bg-emerald-300" : "bg-amber-300")}>
      <span className={cn("absolute inset-0 animate-ping rounded-full", ok ? "bg-emerald-300" : "bg-amber-300")} />
    </span>
  );
}
