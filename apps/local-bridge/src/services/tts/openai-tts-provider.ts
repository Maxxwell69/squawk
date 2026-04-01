import type { SpeakResult, VoiceProvider } from "./voice-provider.js";

/**
 * Stub for OpenAI TTS (or compatible API).
 * TODO: set OPENAI_API_KEY, choose model + voice, stream or buffer response,
 * map response to SpeakResult { audioBuffer, mimeType: 'audio/mpeg', extension: 'mp3' }.
 */
export function createOpenAiVoiceProvider(): VoiceProvider {
  return {
    async speak(): Promise<SpeakResult> {
      throw new Error(
        "OpenAI TTS not implemented — use TTS_PROVIDER=mock or implement createOpenAiVoiceProvider"
      );
    },
  };
}
