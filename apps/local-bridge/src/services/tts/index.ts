import type { VoiceProvider } from "./voice-provider.js";
import {
  createElevenLabsVoiceProvider,
  loadElevenLabsConfigFromEnv,
} from "./elevenlabs-tts-provider.js";
import { createMockVoiceProvider } from "./mock-tts-provider.js";
import { createOpenAiVoiceProvider } from "./openai-tts-provider.js";

export type TtsProviderName = "mock" | "openai" | "elevenlabs";

export function createVoiceProvider(name: TtsProviderName): VoiceProvider {
  switch (name) {
    case "elevenlabs":
      return createElevenLabsVoiceProvider(loadElevenLabsConfigFromEnv());
    case "openai":
      return createOpenAiVoiceProvider();
    case "mock":
    default:
      return createMockVoiceProvider();
  }
}

export type { VoiceProvider, SpeakResult, SpeakOptions } from "./voice-provider.js";
