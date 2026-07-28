import type { VoiceMode } from "@/settings/settings-context";
import { isAbortError, VOICE_ABORT_REASON } from "@/lib/voice/abort";
import { speakWithBrowser } from "@/lib/voice/browser-tts";
import { supportsSpeechmaticsTts } from "@/lib/voice/languages";
import { splitSpeechChunks } from "@/lib/voice/speech-chunks";

export type VoicePlaybackSettings = {
  volume: number;
  speed: number;
  voiceMode: VoiceMode;
  language: string;
};

export type PipelinedVoiceStatus = "idle" | "loading" | "playing";

type FetchVoiceResult =
  | { kind: "audio"; blob: Blob }
  | { kind: "browser" }
  | { kind: "demo" }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

async function fetchVoiceChunk(
  text: string,
  signal: AbortSignal,
  settings: VoicePlaybackSettings,
): Promise<FetchVoiceResult> {
  if (signal.aborted) return { kind: "cancelled" };

  if (!supportsSpeechmaticsTts(settings.language)) {
    return { kind: "browser" };
  }

  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceMode: settings.voiceMode, language: settings.language }),
      signal,
    });

    if (signal.aborted) return { kind: "cancelled" };

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      return { kind: "error", message: data?.error ?? "Voice synthesis failed." };
    }

    if (response.headers.get("content-type")?.includes("audio")) {
      const blob = await response.blob();
      if (signal.aborted) return { kind: "cancelled" };
      return { kind: "audio", blob };
    }

    const payload = (await response.json().catch(() => null)) as { browserTts?: boolean } | null;
    if (payload?.browserTts) return { kind: "browser" };

    return { kind: "demo" };
  } catch (error) {
    // Intentional stop (new utterance, unmount, toggle off) — never surface as a runtime error.
    if (isAbortError(error) || signal.aborted) return { kind: "cancelled" };
    throw error;
  }
}

function playBlob(blob: Blob, settings: VoicePlaybackSettings, signal: AbortSignal) {
  return new Promise<"played" | "cancelled">((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    const cleanup = () => {
      audio.pause();
      audio.src = "";
      URL.revokeObjectURL(url);
    };

    const onAbort = () => {
      cleanup();
      resolve("cancelled");
    };

    if (signal.aborted) {
      cleanup();
      resolve("cancelled");
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    audio.volume = settings.volume;
    audio.playbackRate = Math.min(2, Math.max(0.5, settings.speed));
    audio.onended = () => {
      signal.removeEventListener("abort", onAbort);
      cleanup();
      resolve("played");
    };
    audio.onerror = () => {
      signal.removeEventListener("abort", onAbort);
      cleanup();
      if (signal.aborted) {
        resolve("cancelled");
        return;
      }
      reject(new Error("Audio playback failed."));
    };

    void audio.play().catch((error) => {
      signal.removeEventListener("abort", onAbort);
      cleanup();
      if (isAbortError(error) || signal.aborted) {
        resolve("cancelled");
        return;
      }
      reject(error);
    });
  });
}

export type PipelinedVoiceCallbacks = {
  onStatus?: (status: PipelinedVoiceStatus, detail?: string) => void;
  onChunkStart?: (index: number, total: number) => void;
};

/** Synthesize and play sentence-by-sentence; prefetch the next chunk while the current one plays. */
export async function playPipelinedVoice(
  text: string,
  settings: VoicePlaybackSettings,
  signal: AbortSignal,
  callbacks?: PipelinedVoiceCallbacks,
) {
  const chunks = splitSpeechChunks(text);
  if (!chunks.length) {
    callbacks?.onStatus?.("idle");
    return "empty" as const;
  }

  callbacks?.onStatus?.("loading", "Preparing first phrase…");

  const prefetch = new Map<number, Promise<FetchVoiceResult>>();
  const queueFetch = (index: number) => {
    if (index >= chunks.length || prefetch.has(index)) return;
    // Always attach a handler so aborted prefetches never become unhandled rejections.
    prefetch.set(
      index,
      fetchVoiceChunk(chunks[index]!, signal, settings).catch((error): FetchVoiceResult => {
        if (isAbortError(error) || signal.aborted) return { kind: "cancelled" };
        return { kind: "error", message: error instanceof Error ? error.message : "Voice synthesis failed." };
      }),
    );
  };

  queueFetch(0);
  queueFetch(1);

  try {
    for (let index = 0; index < chunks.length; index += 1) {
      if (signal.aborted) {
        callbacks?.onStatus?.("idle");
        return "cancelled" as const;
      }

      queueFetch(index + 2);

      const current = await prefetch.get(index)!;
      prefetch.delete(index);

      if (current.kind === "cancelled" || signal.aborted) {
        callbacks?.onStatus?.("idle");
        return "cancelled" as const;
      }

      if (current.kind === "error") {
        throw new Error(current.message);
      }

      if (current.kind === "demo") {
        try {
          await speakWithBrowser(chunks[index]!, settings, signal);
          continue;
        } catch (error) {
          if (isAbortError(error) || signal.aborted) {
            callbacks?.onStatus?.("idle");
            return "cancelled" as const;
          }
          callbacks?.onStatus?.("idle");
          return "demo" as const;
        }
      }

      callbacks?.onStatus?.("playing", `Speaking ${index + 1} of ${chunks.length}`);
      callbacks?.onChunkStart?.(index + 1, chunks.length);

      try {
        if (current.kind === "browser") {
          await speakWithBrowser(chunks[index]!, settings, signal);
        } else {
          const played = await playBlob(current.blob, settings, signal);
          if (played === "cancelled") {
            callbacks?.onStatus?.("idle");
            return "cancelled" as const;
          }
        }
      } catch (error) {
        if (isAbortError(error) || signal.aborted) {
          callbacks?.onStatus?.("idle");
          return "cancelled" as const;
        }
        throw error;
      }
    }
  } finally {
    // Drain remaining prefetches so abort never shows in the Next.js overlay.
    await Promise.allSettled(Array.from(prefetch.values()));
    prefetch.clear();
  }

  callbacks?.onStatus?.("idle");
  return "completed" as const;
}

/** @deprecated kept for any callers that referenced the abort reason string */
export { VOICE_ABORT_REASON };
