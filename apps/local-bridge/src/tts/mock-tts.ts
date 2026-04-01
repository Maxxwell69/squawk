import type { TtsProvider } from "./types.js";

/** No audio — logs and short delay so queue behavior is visible */
export function createMockTts(): TtsProvider {
  return {
    async speak(text: string) {
      const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
      // eslint-disable-next-line no-console
      console.log(`[mock-tts] ${preview}`);
      await new Promise((r) => setTimeout(r, 120));
    },
  };
}
