export interface TtsProvider {
  /** Speak text; resolve when playback would start / queue accepts */
  speak(text: string): Promise<void>;
}
