import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TtsProviderName } from "./services/tts/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type BridgeConfig = {
  host: string;
  port: number;
  /** Generate TTS audio + static URL when true */
  featureTts: boolean;
  ttsProvider: TtsProviderName;
  /** Absolute path for generated audio files */
  audioTempDir: string;
  /** Public origin for audio URLs (no trailing slash), e.g. http://127.0.0.1:8787 */
  publicBaseUrl: string;
};

function parseTtsProvider(v: string | undefined): TtsProviderName {
  if (v === "openai") return "openai";
  if (v === "elevenlabs") return "elevenlabs";
  return "mock";
}

export function loadConfig(): BridgeConfig {
  const rawPort =
    process.env.PORT ?? process.env.LOCAL_BRIDGE_PORT ?? "8787";
  const port = Number(rawPort);
  const host = process.env.LOCAL_BRIDGE_HOST ?? "0.0.0.0";
  const featureTts = process.env.FEATURE_TTS !== "false";

  const defaultTmp = path.join(__dirname, "..", "tmp", "audio");
  const audioTempDir = process.env.AUDIO_TEMP_DIR
    ? path.resolve(process.env.AUDIO_TEMP_DIR)
    : defaultTmp;

  const publicBaseUrl =
    process.env.AUDIO_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    `http://127.0.0.1:${Number.isFinite(port) ? port : 8787}`;

  return {
    host,
    port: Number.isFinite(port) ? port : 8787,
    featureTts,
    ttsProvider: parseTtsProvider(process.env.TTS_PROVIDER),
    audioTempDir,
    publicBaseUrl,
  };
}
