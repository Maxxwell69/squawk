import type { SpeakResult, SpeakOptions, VoiceProvider } from "./voice-provider.js";

const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";

export type ElevenLabsTtsConfig = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
};

export function loadElevenLabsConfigFromEnv(): ElevenLabsTtsConfig {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? "";
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() ?? "";
  const modelId =
    process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL;
  const outputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || DEFAULT_OUTPUT_FORMAT;
  return { apiKey, voiceId, modelId, outputFormat };
}

/**
 * [ElevenLabs text-to-speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
 * — set `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, and `TTS_PROVIDER=elevenlabs`.
 */
export function createElevenLabsVoiceProvider(
  cfg: ElevenLabsTtsConfig
): VoiceProvider {
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

      const url = new URL(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`
      );
      url.searchParams.set("output_format", cfg.outputFormat);

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

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": cfg.apiKey,
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

      const audioBuffer = Buffer.from(await res.arrayBuffer());
      return {
        audioBuffer,
        mimeType: "audio/mpeg",
        extension: "mp3",
      };
    },
  };
}
