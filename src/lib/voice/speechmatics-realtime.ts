export type RealtimeTranscriptHandlers = {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onEndOfUtterance?: (utterance: string) => void;
  onError?: (message: string) => void;
  onReady?: () => void;
  onClosed?: () => void;
};

type ServerMessage = {
  message?: string;
  reason?: string;
  type?: string;
  metadata?: { transcript?: string };
  seq_no?: number;
};

const VOCAB = [
  { content: "SANTRA" },
  { content: "NeuroX" },
  { content: "GTM" },
  { content: "Bright Data" },
  { content: "Exa" },
];

function floatToPcm16(input: Float32Array) {
  const pcm = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm;
}

export class SpeechmaticsRealtimeSession {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private lastSeqNo = 0;
  private ready = false;
  private closed = false;
  private sending = true;
  private utteranceParts: string[] = [];
  private handlers: RealtimeTranscriptHandlers;

  constructor(handlers: RealtimeTranscriptHandlers = {}) {
    this.handlers = handlers;
  }

  get isReady() {
    return this.ready && !this.closed;
  }

  setSending(enabled: boolean) {
    this.sending = enabled;
  }

  async start(wsUrl: string, language = "en") {
    if (this.ws) throw new Error("Realtime session already started.");

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    this.audioContext = new AudioContext();
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const sampleRate = this.audioContext.sampleRate;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      const fail = (message: string) => {
        this.handlers.onError?.(message);
        reject(new Error(message));
      };

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            message: "StartRecognition",
            audio_format: {
              type: "raw",
              encoding: "pcm_s16le",
              sample_rate: sampleRate,
            },
            transcription_config: {
              language,
              enable_partials: true,
              max_delay: 0.8,
              model: "enhanced",
              additional_vocab: VOCAB,
              conversation_config: {
                end_of_utterance_silence_trigger: 0.7,
              },
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        let payload: ServerMessage;
        try {
          payload = JSON.parse(event.data) as ServerMessage;
        } catch {
          return;
        }

        const kind = payload.message;
        if (kind === "RecognitionStarted") {
          this.ready = true;
          this.handlers.onReady?.();
          resolve();
          return;
        }

        if (kind === "AudioAdded" && typeof payload.seq_no === "number") {
          this.lastSeqNo = payload.seq_no;
          return;
        }

        if (kind === "AddPartialTranscript") {
          const text = payload.metadata?.transcript?.trim() ?? "";
          this.handlers.onPartial?.(text);
          return;
        }

        if (kind === "AddTranscript") {
          const text = payload.metadata?.transcript?.trim() ?? "";
          if (text) {
            this.utteranceParts.push(text);
            this.handlers.onFinal?.(text);
          }
          return;
        }

        if (kind === "EndOfUtterance") {
          const utterance = this.utteranceParts.join(" ").replace(/\s+/g, " ").trim();
          this.utteranceParts = [];
          this.handlers.onPartial?.("");
          if (utterance) this.handlers.onEndOfUtterance?.(utterance);
          return;
        }

        if (kind === "Error") {
          fail(payload.reason || payload.type || "Speechmatics realtime error.");
          return;
        }

        if (kind === "EndOfTranscript") {
          this.teardownMedia();
          if (!this.closed) this.handlers.onClosed?.();
        }
      };

      ws.onerror = () => fail("Realtime transcription connection failed.");
      ws.onclose = () => {
        this.ready = false;
        if (!this.closed) this.handlers.onClosed?.();
      };
    });

    this.bindMicrophone(sampleRate);
  }

  private bindMicrophone(_sampleRate: number) {
    if (!this.audioContext || !this.mediaStream || !this.ws) return;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.silentGain = this.audioContext.createGain();
    this.silentGain.gain.value = 0;

    this.processor.onaudioprocess = (event) => {
      if (!this.sending || !this.ready || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const input = event.inputBuffer.getChannelData(0);
      const pcm = floatToPcm16(input);
      this.ws.send(pcm.buffer);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.audioContext.destination);
  }

  async stop() {
    this.closed = true;
    this.ready = false;

    const ws = this.ws;
    this.ws = null;

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ message: "EndOfStream", last_seq_no: this.lastSeqNo }));
      } catch {
        // ignore
      }
      try {
        ws.close();
      } catch {
        // ignore
      }
    }

    this.teardownMedia();
  }

  private teardownMedia() {
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.silentGain?.disconnect();
    } catch {
      // ignore
    }
    this.processor = null;
    this.source = null;
    this.silentGain = null;

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;

    if (this.audioContext) {
      void this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
  }
}
