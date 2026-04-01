import type { SpeakResult, VoiceProvider } from "./voice-provider.js";

/** ~0.35s of silence — valid WAV for browsers; replace with real TTS later */
function minimalSilentWav(durationMs = 350): Buffer {
  const sampleRate = 22050;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  // PCM silence = zeros (already Buffer.alloc)

  return buf;
}

export function createMockVoiceProvider(): VoiceProvider {
  return {
    async speak(text: string): Promise<SpeakResult> {
      const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
      console.log(`[mock-voice] ${preview}`);
      const durationMs = Math.min(4000, Math.max(350, 80 + text.length * 40));
      const buf = minimalSilentWav(durationMs);
      return {
        audioBuffer: buf,
        mimeType: "audio/wav",
        extension: "wav",
        durationMs,
      };
    },
  };
}
