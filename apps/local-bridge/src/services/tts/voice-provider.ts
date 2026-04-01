export type SpeakResult = {
  audioBuffer: Buffer;
  mimeType: string;
  extension: string;
  /** Playback length hint for the client when known */
  durationMs?: number;
};

export type SpeakOptions = {
  voice?: string;
};

/**
 * Pluggable TTS — swap mock / OpenAI / ElevenLabs without changing the pipeline.
 */
export interface VoiceProvider {
  speak(text: string, options?: SpeakOptions): Promise<SpeakResult>;
}
