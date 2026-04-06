import type { StreamEventKind } from "./event-kinds";
import type { ParrotState } from "./parrot-state";

/** Rule-based visual state for MVP; swap for LLM-driven state later */
export function parrotStateForEventKind(kind: StreamEventKind): ParrotState {
  switch (kind) {
    case "follow":
    case "comment":
      return "talking";
    case "subscribe":
    case "gift":
    case "like_milestone":
    case "share":
      return "hype";
    case "chaos":
      return "chaos";
    case "custom":
    default:
      return "talking";
  }
}

export function holdMsForState(state: ParrotState): number {
  switch (state) {
    case "talking":
      return 3800;
    case "hype":
      return 4200;
    case "chaos":
      return 5200;
    case "exit":
      return 2600;
    case "return":
      // Hold matches trimmed return clip (~5s) before switching back to idle.
      return 5000;
    case "away":
      return 2000;
    case "peck":
      // squawkhoppeck.webm is ~10s; buffer so one-shot video is not cut to idle early.
      return 11_200;
    case "hello_wave":
      return 4200;
    case "dancing_squawk":
      return 4200;
    case "victory_dance":
      // victorydance.webm — one-shot clip; hold covers full play + line read.
      return 16_000;
    case "feeding_time":
      // squawkfeedingtime.webm ~10s — keep state until clip can finish.
      return 10_000;
    case "idle":
    default:
      return 2000;
  }
}

/** When no TTS audio: approximate time to read subtitle on screen */
export function estimateHoldMsFromText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 2000;
  return Math.min(12000, Math.max(2000, trimmed.length * 55));
}
