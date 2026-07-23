"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { motion } from "framer-motion";
import { Bot, FileText, Globe2, Mic2, MicOff, Paperclip, Phone, PhoneOff, Radar, Send, Sparkles, TerminalSquare, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { AiOrb } from "@/components/shared/ai-orb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LiveAgentLogs } from "@/features/activity-console/ai-activity-console";
import { StudioModal } from "@/features/world-engine/studio-modal";
import { SuggestedPromptsMenu } from "@/components/shared/suggested-prompts-menu";
import { repairLocalSessionFromCookie, syncLocalSessionToCookie } from "@/lib/local-auth";
import { useGtmLiveCall } from "@/hooks/use-gtm-live-call";
import { usePipelineLogs } from "@/hooks/use-pipeline-logs";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { useTypewriter } from "@/hooks/use-typewriter";
import { chatPipelineScript } from "@/lib/pipeline-log-scripts";
import { getWorkspaceContext } from "@/lib/gtm/workspace-context";
import { VoiceLanguageSelector } from "@/components/voice/language-selector";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace/workspace-page";
import { abortVoiceController, isAbortError } from "@/lib/voice/abort";
import { playPipelinedVoice } from "@/lib/voice/pipelined-playback";
import { cn } from "@/lib/utils";
import { useSettings } from "@/settings/settings-context";
import type { ChatDocumentEvidence, ChatMessage, ChatProvider } from "@/types/intelligence";

const prompts = [
  "Analyze Tesla competitors",
  "Monitor ApexAnalytics pricing page for tier changes",
  "Summarize competitor hiring signals in enterprise sales",
  "Draft a battlecard vs our top rival",
  "Summarize current market trends",
  "Monitor pricing changes",
];

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    createdAt: new Date().toISOString(),
    content:
      "I am SANTRA AI, your B2B GTM intelligence agent. Ask me to analyze competitors, summarize pricing risk, interpret monitor signals, or draft an executive brief.",
  },
];

const assistantMarkdownComponents: Components = {
  h1: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold text-white first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mb-3 mt-6 text-lg font-semibold text-white first:mt-0">{children}</h2>,
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-sentra-cyan first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="mb-3 text-sm leading-7 text-white/72 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  ul: ({ children }) => (
    <ul className="mb-4 space-y-2 pl-1 last:mb-0 [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2.5 [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-sentra-cyan">
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-white/72 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-6 text-white/72">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-words text-sentra-cyan underline decoration-cyan-300/30 underline-offset-4 transition"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r-2xl border-l-2 border-sentra-cyan/60 bg-white/[0.04] px-4 py-3">
      {children}
    </blockquote>
  ),
};

function AssistantMessage({ content, animated }: { content: string; animated?: boolean }) {
  const displayed = useTypewriter(content, animated);

  return (
    <div className="max-w-none">
      <ReactMarkdown components={assistantMarkdownComponents}>{displayed}</ReactMarkdown>
    </div>
  );
}

export function ChatInterface({
  hideChrome = false,
  onRequestDeepBrief,
}: {
  hideChrome?: boolean;
  onRequestDeepBrief?: (query: string) => void;
} = {}) {
  const { settings, updateSettings } = useSettings();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useGtmAgent, setUseGtmAgent] = useState(false);
  const [chatMode, setChatMode] = useState<"live" | "unavailable" | null>(null);
  const [attachedDocument, setAttachedDocument] = useState<ChatDocumentEvidence | null>(null);
  const [parsingDocument, setParsingDocument] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "loading" | "playing">("idle");
  const [activeVoiceText, setActiveVoiceText] = useState<string | null>(null);
  const handledPromptRef = useRef<string | null>(null);
  const autoGreetingStartedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const voiceAbortRef = useRef<AbortController | null>(null);
  const voiceRunIdRef = useRef(0);
  const currentVoiceTextRef = useRef<string | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef(messages);
  const threadIdRef = useRef(threadId);
  const useGtmAgentRef = useRef(useGtmAgent);
  const loadingRef = useRef(loading);
  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.id,
    [messages],
  );
  const speaking = voiceStatus !== "idle";
  const pipeline = usePipelineLogs(chatPipelineScript);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const {
    listening,
    transcribing,
    liveTranscript,
    toggleSpeechInput,
    stopSpeechInput,
  } = useSpeechInput({
    value: input,
    onChange: setInput,
    getContext: () => input,
    language: settings.voice.language,
  });

  messagesRef.current = messages;
  threadIdRef.current = threadId;
  useGtmAgentRef.current = useGtmAgent;
  loadingRef.current = loading;

  function finishVoicePlayback() {
    currentVoiceTextRef.current = null;
    setActiveVoiceText(null);
    if (speakingTimeoutRef.current) {
      window.clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setVoiceStatus("idle");
  }

  function resetVoicePlayback() {
    voiceRunIdRef.current += 1;
    const controller = voiceAbortRef.current;
    voiceAbortRef.current = null;
    abortVoiceController(controller);
    finishVoicePlayback();
  }

  useEffect(() => {
    repairLocalSessionFromCookie();
    syncLocalSessionToCookie();
  }, []);

  useEffect(() => {
    fetch("/api/health/integrations")
      .then((response) => response.json())
      .then(
        (data: {
          aiml?: boolean;
          featherless?: boolean;
          llm?: { ready?: boolean };
        }) => {
          const hasProvider = Boolean(data?.aiml || data?.featherless);
          if (hasProvider || data?.llm?.ready) {
            setChatMode("live");
            return;
          }
          setChatMode("unavailable");
        },
      )
      .catch(() => setChatMode("unavailable"));
  }, []);

  useEffect(() => {
    fetch("/api/chat/threads", { method: "POST" })
      .then((response) => response.json())
      .then((data: { thread?: { id: string } }) => {
        if (data.thread?.id) setThreadId(data.thread.id);
      })
      .catch(() => {
        // Thread creation requires Supabase auth.
      });
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", resetVoicePlayback);

    return () => {
      window.removeEventListener("pagehide", resetVoicePlayback);
      resetVoicePlayback();
      stopSpeechInput();
    };
  }, [stopSpeechInput]);

  useEffect(() => {
    if (pathname !== "/chat") {
      const timeout = window.setTimeout(resetVoicePlayback, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [pathname]);

  useEffect(() => {
    if (!settings.voice.microphone) stopSpeechInput();
  }, [settings.voice.microphone, stopSpeechInput]);

  useEffect(() => {
    if (!settings.voice.enabled) queueMicrotask(resetVoicePlayback);
  }, [settings.voice.enabled]);

  useEffect(() => {
    if (autoGreetingStartedRef.current) return;
    if (!settings.voice.enabled || !settings.voice.autoPlayback) return;

    autoGreetingStartedRef.current = true;
    const timeout = window.setTimeout(() => {
      void playVoice(initialMessages[0].content, { automatic: true });
    }, 700);

    return () => window.clearTimeout(timeout);
    // The greeting should run once per chat mount, using the initial voice handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, loading]);

  async function handleDocumentSelect(file: File | null) {
    if (!file || parsingDocument) return;

    setParsingDocument(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/documents/parse", { method: "POST", body: formData });
      const data = (await response.json()) as {
        document?: ChatDocumentEvidence;
        error?: string;
      };

      if (!response.ok || !data.document?.text) {
        throw new Error(data.error ?? "Could not read document.");
      }

      setAttachedDocument(data.document);
      toast.success(`Attached ${data.document.fileName}`, {
        description: data.document.ocrUsed
          ? "Smart OCR extracted text (AIML or Featherless vision)."
          : data.document.truncated
            ? "Large file trimmed for analysis context."
            : `${data.document.charCount?.toLocaleString() ?? ""} characters loaded.`,
      });
    } catch (error) {
      toast.error("Document upload failed.", {
        description: error instanceof Error ? error.message : "Please try another file.",
      });
    } finally {
      setParsingDocument(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  }

  async function sendMessage(nextInput = input, options?: { fromLiveCall?: boolean }) {
    const trimmed = nextInput.trim();
    const document = options?.fromLiveCall ? null : attachedDocument;
    if ((!trimmed && !document) || loadingRef.current) return null;
    stopSpeechInput();

    const displayContent = trimmed || `Analyze the uploaded document: ${document!.fileName}`;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayContent,
      createdAt: new Date().toISOString(),
      attachment: document
        ? {
            fileName: document.fileName,
            mimeType: document.mimeType,
            charCount: document.charCount,
            truncated: document.truncated,
            ocrUsed: document.ocrUsed,
          }
        : undefined,
    };

    const history = messagesRef.current;
    setMessages((current) => [...current, userMessage]);
    setInput("");
    if (!options?.fromLiveCall) setAttachedDocument(null);
    setLoading(true);
    pipeline.start();

    try {
      const payload = {
        message: displayContent,
        history,
        threadId: threadIdRef.current,
        document: document ?? undefined,
        workspace: getWorkspaceContext(),
        useGtmAgent: useGtmAgentRef.current || Boolean(options?.fromLiveCall),
      };

      const postChat = () =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

      repairLocalSessionFromCookie();
      syncLocalSessionToCookie();

      let response = await postChat();
      if (response.status === 401) {
        repairLocalSessionFromCookie();
        syncLocalSessionToCookie();
        response = await postChat();
      }

      const data = (await response.json()) as {
        message?: string;
        provider?: ChatProvider;
        threadId?: string;
        error?: string;
        hint?: string;
      };

      if (data.threadId) setThreadId(data.threadId);

      if (!response.ok || typeof data.message !== "string" || !data.message.trim()) {
        if (response.status === 401) {
          throw new Error(data.hint ? `${data.error ?? "Sign in required."} ${data.hint}` : data.error ?? "Sign in required.");
        }
        if (response.status === 502 && data.hint) {
          throw new Error(`${data.error ?? "AI provider error."} ${data.hint}`);
        }
        throw new Error(data.error || "SANTRA returned an empty response.");
      }

      const reply = data.message;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
          provider: data.provider,
        },
      ]);
      return reply;
    } catch (error) {
      toast.error("SANTRA could not complete the analysis.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return null;
    } finally {
      pipeline.complete();
      setLoading(false);
    }
  }

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (!prompt || handledPromptRef.current === prompt) return;

    handledPromptRef.current = prompt;
    void sendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per unique prompt URL
  }, [searchParams]);

  async function playVoice(content: string, options?: { automatic?: boolean; silentToast?: boolean }) {
    if (!settings.voice.enabled) {
      if (!options?.automatic && !options?.silentToast) toast.message("AI voice response is disabled in Settings.");
      return;
    }

    if (speaking && currentVoiceTextRef.current === content) {
      resetVoicePlayback();
      return;
    }

    resetVoicePlayback();
    const runId = voiceRunIdRef.current;
    const abortController = new AbortController();
    voiceAbortRef.current = abortController;
    currentVoiceTextRef.current = content;
    setActiveVoiceText(content);
    setVoiceStatus("loading");

    try {
      const result = await playPipelinedVoice(
        content,
        { volume: settings.voice.volume, speed: settings.voice.speed, voiceMode: settings.voice.mode, language: settings.voice.language },
        abortController.signal,
        {
          onStatus: (status) => {
            if (voiceRunIdRef.current !== runId) return;
            if (status !== "idle") setVoiceStatus(status);
          },
        },
      );

      if (abortController.signal.aborted || voiceRunIdRef.current !== runId) return;
      if (result === "cancelled") return;

      if (result === "demo") {
        if (!options?.silentToast) {
          toast.message("Using browser voice", {
            description: "Add SPEECHMATICS_API_KEY for premium English TTS, or keep using browser speech.",
          });
        }
        await new Promise<void>((resolve) => {
          speakingTimeoutRef.current = window.setTimeout(() => {
            finishVoicePlayback();
            resolve();
          }, 1800);
        });
        return;
      }

      if (result === "completed" || result === "empty") {
        finishVoicePlayback();
      }
    } catch (error) {
      if (isAbortError(error) || voiceRunIdRef.current !== runId) return;
      finishVoicePlayback();
      const blockedAutoplay =
        options?.automatic &&
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "AbortError");

      if (blockedAutoplay) {
        if (!options?.silentToast) {
          toast.message("Voice greeting is ready", {
            description: "Click Voice controls if your browser blocked autoplay.",
          });
        }
        return;
      }

      if (!options?.silentToast) {
        toast.error("Voice playback failed.", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    }
  }

  const handleLiveUtterance = useCallback(async (text: string) => {
    return sendMessage(text, { fromLiveCall: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendMessage uses refs for latest state
  }, []);

  const handleLiveSpeak = useCallback(
    async (text: string) => {
      await playVoice(text, { automatic: true, silentToast: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playVoice closes over current settings
    [settings.voice.enabled, settings.voice.volume, settings.voice.speed, settings.voice.mode, settings.voice.language],
  );

  const handleLiveStopSpeak = useCallback(() => {
    resetVoicePlayback();
  }, []);

  const liveCall = useGtmLiveCall({
    language: settings.voice.language,
    onUtterance: handleLiveUtterance,
    onSpeak: handleLiveSpeak,
    onStopSpeak: handleLiveStopSpeak,
  });

  const liveCallStatusLabel =
    liveCall.status === "connecting"
      ? "Connecting…"
      : liveCall.status === "listening"
        ? "Listening…"
        : liveCall.status === "thinking"
          ? "Thinking…"
          : liveCall.status === "speaking"
            ? "Speaking…"
            : "Live call";

  function requestDeepBrief() {
    if (!onRequestDeepBrief) return;
    const fromInput = input.trim();
    const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content?.trim();
    const query = fromInput || lastUser;
    if (!query) {
      toast.message("Add a competitor question first.", {
        description: "Type or say what to investigate, then open Deep brief.",
      });
      return;
    }
    if (liveCall.active) liveCall.endCall();
    onRequestDeepBrief(query);
  }

  const body = (
    <>
      {chatMode === "unavailable" && (
        <p className={cn("mb-4 rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100", !hideChrome && "-mt-2")}>
          Live chat needs <code className="font-mono text-xs">AIML_API_KEY</code> or{" "}
          <code className="font-mono text-xs">FEATHERLESS_API_KEY</code> in{" "}
          <code className="font-mono text-xs">.env.local</code>, then restart{" "}
          <code className="font-mono text-xs">npm run dev</code>.
        </p>
      )}
      <div
        className={cn(
          "grid min-w-0 gap-5",
          !hideChrome && "xl:grid-cols-[minmax(0,1fr)_280px]",
        )}
      >
        <Card
          className={cn(
            "flex min-w-0 flex-col overflow-hidden",
            hideChrome
              ? "min-h-[calc(100svh-12.5rem)] border-white/[0.08] md:min-h-[calc(100vh-11rem)]"
              : "min-h-[calc(100svh-11rem)] md:min-h-[calc(100vh-9rem)]",
          )}
          glow={!hideChrome}
        >
          {!hideChrome && (
            <div className="border-b border-white/10 px-5 py-3 md:px-6">
              <p className="text-sm text-white/50">Account context from Monitors is applied automatically.</p>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 md:p-5">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "min-w-0",
                  message.role === "user" ? "ml-auto max-w-3xl" : "mr-auto max-w-4xl",
                )}
              >
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl bg-gradient-to-r from-sentra-cyan to-sentra-violet p-[1px]"
                      : "rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  }
                >
                  <div className={message.role === "user" ? "rounded-2xl bg-sentra-ink px-4 py-3 text-white" : ""}>
                    {message.role === "assistant" && (
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-300/10 text-sentra-cyan">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium text-white">SANTRA</span>
                        {message.provider && (
                          <span className="hidden rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45 sm:inline-flex">
                            {message.provider === "featherless-document"
                              ? "Document"
                              : message.provider === "aiml-document"
                                ? "Document"
                                : message.provider === "gtm-agent"
                                  ? "GTM agent"
                                  : message.provider === "aiml-search"
                                    ? "Live search"
                                    : "LLM"}
                          </span>
                        )}
                        <button
                          type="button"
                          className={cn(
                            "ml-auto rounded-full border border-white/10 p-1.5 text-white/50 transition",
                            speaking &&
                              activeVoiceText === message.content &&
                              "border-cyan-200/40 bg-cyan-300/10 text-cyan-100",
                          )}
                          onClick={() => void playVoice(message.content)}
                          disabled={!settings.voice.enabled}
                          aria-label={
                            speaking && activeVoiceText === message.content
                              ? "Stop voice response"
                              : "Play voice response"
                          }
                        >
                          {voiceStatus === "loading" && activeVoiceText === message.content ? (
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <AssistantMessage content={message.content} animated={message.id === lastAssistantId} />
                    ) : (
                      <div>
                        {message.attachment && (
                          <p className="mb-2 flex items-center gap-2 text-xs text-sentra-cyan/90">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{message.attachment.fileName}</span>
                          </p>
                        )}
                        <p className="break-words text-sm leading-6 text-white/80">{message.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="mr-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-white/65">
                  <Sparkles className="h-4 w-4 animate-pulse text-sentra-cyan" />
                  Collecting evidence and drafting a response…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 p-3 md:p-4">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant={liveCall.active ? "neon" : "ghost"}
                size="sm"
                className={cn("h-8 rounded-full px-3 text-xs", liveCall.active && "ring-1 ring-rose-400/50")}
                onClick={() => liveCall.toggleCall()}
                disabled={listening || transcribing}
                aria-pressed={liveCall.active}
                title="Continuous live call"
              >
                {liveCall.active ? <PhoneOff className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                {liveCall.active ? "End call" : "Live call"}
              </Button>
              {onRequestDeepBrief && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={requestDeepBrief}
                  disabled={liveCall.active || loading}
                  title="Open Deep brief"
                >
                  <Radar className="h-3.5 w-3.5" />
                  Deep brief
                </Button>
              )}
              <Button
                type="button"
                variant={useGtmAgent ? "neon" : "ghost"}
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => setUseGtmAgent((current) => !current)}
              >
                <Globe2 className="h-3.5 w-3.5" />
                {useGtmAgent ? "Agent on" : "GTM agent"}
              </Button>
              {settings.analyst.liveLogs && (loading || pipeline.logs.length > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setLogModalOpen(true)}
                >
                  <TerminalSquare className="h-3.5 w-3.5" />
                  Log
                </Button>
              )}
              <SuggestedPromptsMenu
                prompts={prompts}
                disabled={liveCall.active || loading}
                menuId="gtm-ask-suggested-menu"
                buttonLabel="Prompts"
                menuSubtitle="Quick GTM questions"
                onSelect={(suggestion) => void sendMessage(suggestion)}
              />
            </div>
            {liveCall.active && (
              <div className="mb-3 rounded-xl border border-rose-300/25 bg-rose-400/[0.08] px-3 py-2.5 text-sm text-rose-50/90">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                  <span className="font-medium">{liveCallStatusLabel}</span>
                  <span className="text-rose-100/50">·</span>
                  <span className="text-xs text-rose-100/70">Speak, pause for answers, interrupt anytime.</span>
                </div>
                {(liveCall.partial || liveCall.lastHeard) && (
                  <p className="mt-2 text-xs leading-5 text-rose-50/75">
                    {liveCall.partial ? (
                      <>
                        <span className="text-rose-100/50">Hearing: </span>
                        {liveCall.partial}
                      </>
                    ) : (
                      <>
                        <span className="text-rose-100/50">You said: </span>
                        {liveCall.lastHeard}
                      </>
                    )}
                  </p>
                )}
              </div>
            )}
            {attachedDocument && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-300/[0.06] px-3 py-2 text-sm text-cyan-50/90">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {attachedDocument.fileName}
                </span>
                <button
                  type="button"
                  className="rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setAttachedDocument(null)}
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={documentInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,text/markdown,text/csv,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => void handleDocumentSelect(event.target.files?.[0] ?? null)}
            />
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={
                  attachedDocument
                    ? "Ask about this document, or press Send to summarize it…"
                    : liveCall.active
                      ? "Live call active — speak or type…"
                      : "Ask about competitors, pricing, or GTM risk…"
                }
                className="min-h-[3.25rem] resize-none sm:min-h-14"
              />
              <div className="grid grid-cols-3 gap-2 sm:contents">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-full shrink-0 sm:h-14 sm:w-14"
                  onClick={() => documentInputRef.current?.click()}
                  disabled={parsingDocument || liveCall.active}
                  aria-label="Attach document"
                >
                  {parsingDocument ? (
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </Button>
                {settings.voice.microphone && (
                  <Button
                    type="button"
                    variant={listening ? "neon" : "ghost"}
                    className={cn(
                      "h-12 w-full shrink-0 sm:h-14 sm:w-14",
                      listening && "ring-1 ring-rose-400/50",
                    )}
                    onClick={() => void toggleSpeechInput()}
                    disabled={liveCall.active || (!listening && (transcribing || loading))}
                    aria-label={listening ? "Stop voice input" : "Voice input"}
                  >
                    {transcribing && !listening ? (
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    ) : listening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic2 className="h-5 w-5" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="neon"
                  className="h-12 w-full shrink-0 sm:h-14 sm:w-14"
                  onClick={() => sendMessage()}
                  disabled={loading || (!input.trim() && !attachedDocument)}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-white/35">
              {listening
                ? liveTranscript
                  ? `Listening: ${liveTranscript}`
                  : "Listening…"
                : hideChrome
                  ? "Enter to send · Shift+Enter for new line"
                  : !settings.voice.microphone
                    ? "Microphone input is disabled in Settings."
                    : transcribing
                      ? "Refining transcript..."
                      : "Attach PDF, DOCX, TXT, or images. Ask about competitors, pricing, or GTM risk."}
            </p>
            {listening && settings.voice.microphone && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-rose-100">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
                  </span>
                  Recording…
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="border border-rose-300/30 bg-rose-400/10 text-rose-50 hover:bg-rose-400/20"
                  onClick={() => void toggleSpeechInput()}
                >
                  <MicOff className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        </Card>

        {!hideChrome && (
          <aside className="min-w-0">
            <Card className="p-5 text-center xl:sticky xl:top-24" glow>
              <AiOrb speaking={speaking || listening || transcribing || loading || liveCall.active} size="md" className="mx-auto" />
              <h3 className="mt-5 text-lg font-semibold text-white">Voice analyst</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {loading
                  ? "Collecting live evidence…"
                  : voiceStatus === "loading"
                    ? "Preparing voice…"
                    : voiceStatus === "playing"
                      ? "Speaking. Click a voice button to stop."
                      : listening
                        ? "Tap Stop when you are done speaking."
                        : "Use the mic beside the prompt, or play a response aloud."}
              </p>
              {listening && settings.voice.microphone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full border border-rose-300/30 bg-rose-400/10 text-rose-50 hover:bg-rose-400/20"
                  onClick={() => void toggleSpeechInput()}
                >
                  <MicOff className="h-4 w-4" />
                  Stop listening
                </Button>
              )}
              <VoiceLanguageSelector
                className="mt-4 w-full"
                compact
                value={settings.voice.language}
                onChange={(language) =>
                  updateSettings((current) => ({
                    ...current,
                    voice: { ...current.voice, language },
                  }))
                }
              />
              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => {
                  const latestAssistant = [...messages]
                    .reverse()
                    .find((message) => message.role === "assistant");

                  if (!latestAssistant) {
                    toast.message("No analyst response available yet.");
                    return;
                  }

                  void playVoice(latestAssistant.content);
                }}
                disabled={!settings.voice.enabled}
              >
                {voiceStatus === "loading" ? (
                  <Sparkles className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic2 className="h-4 w-4" />
                )}
                {speaking ? "Stop voice" : "Voice controls"}
              </Button>
            </Card>
          </aside>
        )}
      </div>

      <StudioModal
        open={logModalOpen && settings.analyst.liveLogs}
        title="Intelligence activity log"
        description="OpenAI analysis and pipeline telemetry for this request."
        onClose={() => setLogModalOpen(false)}
        className="max-w-6xl"
      >
        <LiveAgentLogs
          logs={pipeline.logs}
          running={pipeline.running}
          className="h-[clamp(360px,60vh,640px)] rounded-2xl border border-cyan-300/[0.08] bg-black/10"
        />
      </StudioModal>
    </>
  );

  if (hideChrome) return body;

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        badge="B2B GTM agent"
        title="GTM Advisor"
        description="Ask about competitors, pricing risk, monitor signals, battlecards, or executive briefs."
      />
      {body}
    </WorkspacePage>
  );
}
