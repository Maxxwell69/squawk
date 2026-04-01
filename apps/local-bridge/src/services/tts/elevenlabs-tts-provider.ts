import type { SpeakResult, SpeakOptions, VoiceProvider } from "./voice-provider.js";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";
const DEFAULT_BASE_URL = "https://api.elevenlabs.io";

async function toNodeBuffer(audio: unknown): Promise<Buffer> {
  if (audio instanceof Uint8Array) return Buffer.from(audio);
  if (audio instanceof ArrayBuffer) return Buffer.from(audio);
  if (audio && typeof (audio as Blob).arrayBuffer === "function") {
    return Buffer.from(await (audio as Blob).arrayBuffer());
  }
  if (audio && typeof (audio as ReadableStream<Uint8Array>).getReader === "function") {
    const reader = (audio as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }
  throw new Error("ElevenLabs SDK returned unsupported audio type");
}

export type ElevenLabsTtsConfig = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
  baseUrl: string;
};

export function loadElevenLabsConfigFromEnv(): ElevenLabsTtsConfig {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? "";
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() ?? "";
  const modelId =
    process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL;
  const outputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || DEFAULT_OUTPUT_FORMAT;
  const baseUrlRaw = process.env.ELEVENLABS_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const baseUrl = baseUrlRaw.replace(/\/$/, "");
  return { apiKey, voiceId, modelId, outputFormat, baseUrl };
}

/**
 * [ElevenLabs text-to-speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
 * — set `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, and `TTS_PROVIDER=elevenlabs`.
 */
export function createElevenLabsVoiceProvider(
  cfg: ElevenLabsTtsConfig
): VoiceProvider {
  const client = new ElevenLabsClient({
    apiKey: cfg.apiKey,
  });

  return {
    async speak(text: string, options?: SpeakOptions): Promise<SpeakResult> {
      if (!cfg.apiKey) {
        throw new Error(
          "ElevenLabs: set ELEVENLABS_API_KEY (and ELEVENLABS_VOICE_ID)"
        );
      }
      const voiceId = (options?.voice?.trim() || cfg.voiceId).trim();
      if (!voiceId) {
        throw new Error(
          "ElevenLabs: set ELEVENLABS_VOICE_ID or pass options.voice"
        );
      }

      const body: Record<string, unknown> = {
        text,
        model_id: cfg.modelId,
      };

      const settingsJson = process.env.ELEVENLABS_VOICE_SETTINGS?.trim();
      if (settingsJson) {
        try {
          const parsed = JSON.parse(settingsJson) as Record<string, unknown>;
          if (parsed && typeof parsed === "object") {
            body.voice_settings = parsed;
          }
        } catch {
          throw new Error(
            "ElevenLabs: ELEVENLABS_VOICE_SETTINGS must be valid JSON"
          );
        }
      }

      let audioBuffer: Buffer;
      if (cfg.baseUrl === DEFAULT_BASE_URL) {
        const audio = await client.textToSpeech.convert(voiceId, {
          text: String(body.text ?? text),
          modelId: cfg.modelId,
          outputFormat: cfg.outputFormat as any,
          voiceSettings: (body.voice_settings ?? undefined) as
            | {
                stability?: number;
                similarityBoost?: number;
                style?: number;
                speed?: number;
                useSpeakerBoost?: boolean;
              }
            | undefined,
        });
        audioBuffer = await toNodeBuffer(audio);
      } else {
        // SDK client currently targets the default host. For regional hosts, use fetch.
        const url = new URL(
          `${cfg.baseUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}`
        );
        url.searchParams.set("output_format", cfg.outputFormat);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "xi-api-key": cfg.apiKey,
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const detail = await res.text();
          throw new Error(
            `ElevenLabs TTS HTTP ${res.status}: ${detail.slice(0, 500)}`
          );
        }
        audioBuffer = Buffer.from(await res.arrayBuffer());
      }

      return {
        audioBuffer,
        mimeType: "audio/mpeg",
        extension: "mp3",
      };
    },
  };
}
