"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SpeechmaticsRealtimeSession } from "@/lib/voice/speechmatics-realtime";

export type LiveCallStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking";

type UseGtmLiveCallOptions = {
  language?: string;
  /** Submit a completed user utterance; return the assistant reply text. */
  onUtterance: (text: string) => Promise<string | null>;
  /** Speak the assistant reply; resolve when finished or aborted. */
  onSpeak: (text: string) => Promise<void>;
  /** Stop current TTS (barge-in). */
  onStopSpeak: () => void;
};

export function useGtmLiveCall({ language = "en", onUtterance, onSpeak, onStopSpeak }: UseGtmLiveCallOptions) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<LiveCallStatus>("idle");
  const [partial, setPartial] = useState("");
  const [lastHeard, setLastHeard] = useState("");

  const sessionRef = useRef<SpeechmaticsRealtimeSession | null>(null);
  const statusRef = useRef<LiveCallStatus>("idle");
  const turnIdRef = useRef(0);
  const activeRef = useRef(false);
  const onUtteranceRef = useRef(onUtterance);
  const onSpeakRef = useRef(onSpeak);
  const onStopSpeakRef = useRef(onStopSpeak);

  useEffect(() => {
    onUtteranceRef.current = onUtterance;
    onSpeakRef.current = onSpeak;
    onStopSpeakRef.current = onStopSpeak;
  }, [onUtterance, onSpeak, onStopSpeak]);

  const setCallStatus = useCallback((next: LiveCallStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const handleUtterance = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activeRef.current) return;

      const phase = statusRef.current;
      if (phase === "thinking" || phase === "connecting") return;

      if (phase === "speaking") {
        onStopSpeakRef.current();
      }

      const turnId = ++turnIdRef.current;
      setLastHeard(trimmed);
      setPartial("");
      setCallStatus("thinking");

      try {
        const reply = await onUtteranceRef.current(trimmed);
        if (!activeRef.current || turnId !== turnIdRef.current) return;

        if (!reply?.trim()) {
          setCallStatus("listening");
          return;
        }

        setCallStatus("speaking");
        await onSpeakRef.current(reply);
        if (!activeRef.current || turnId !== turnIdRef.current) return;
        setCallStatus("listening");
      } catch (error) {
        if (!activeRef.current || turnId !== turnIdRef.current) return;
        toast.error("Live call turn failed.", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
        setCallStatus("listening");
      }
    },
    [setCallStatus],
  );

  const endCall = useCallback(async () => {
    activeRef.current = false;
    turnIdRef.current += 1;
    onStopSpeakRef.current();
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await session.stop();
    setPartial("");
    setActive(false);
    setCallStatus("idle");
  }, [setCallStatus]);

  const startCall = useCallback(async () => {
    if (activeRef.current) return;

    setCallStatus("connecting");
    setActive(true);
    activeRef.current = true;

    try {
      const tokenResponse = await fetch("/api/voice/rt-token", { method: "POST" });
      const tokenData = (await tokenResponse.json()) as {
        wsUrl?: string;
        error?: string;
      };

      if (!tokenResponse.ok || !tokenData.wsUrl) {
        throw new Error(tokenData.error || "Could not start live transcription.");
      }

      const session = new SpeechmaticsRealtimeSession({
        onPartial: (text) => {
          if (statusRef.current === "listening" || statusRef.current === "speaking") {
            setPartial(text);
          }
        },
        onEndOfUtterance: (utterance) => {
          void handleUtterance(utterance);
        },
        onError: (message) => {
          toast.error("Live call error", { description: message });
          void endCall();
        },
        onClosed: () => {
          if (activeRef.current) void endCall();
        },
      });

      sessionRef.current = session;
      await session.start(tokenData.wsUrl, language.startsWith("en") ? "en" : language);
      if (!activeRef.current) {
        await session.stop();
        return;
      }
      setCallStatus("listening");
    } catch (error) {
      activeRef.current = false;
      setActive(false);
      setCallStatus("idle");
      toast.error("Could not start live call.", {
        description: error instanceof Error ? error.message : "Check microphone and Speechmatics key.",
      });
    }
  }, [endCall, handleUtterance, language, setCallStatus]);

  const toggleCall = useCallback(() => {
    if (activeRef.current) void endCall();
    else void startCall();
  }, [endCall, startCall]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) void session.stop();
    };
  }, []);

  return {
    active,
    status,
    partial,
    lastHeard,
    startCall,
    endCall,
    toggleCall,
  };
}
