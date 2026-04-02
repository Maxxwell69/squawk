import type { StreamEventKind } from "./event-kinds";
import type { ParrotState } from "./parrot-state";

/** Rule-based visual state for MVP; swap for LLM-driven state later */
export function parrotStateForEventKind(kind: StreamEventKind): ParrotState {
  switch (kind) {
    case "follow":
    case "comment":
      return "talking";
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
      // Return clip is ~9s; add a small buffer so it can finish before we
      // transition back to `idle` (which unmounts the one-shot video).
      return 9800;
    case "away":
      return 2000;
    case "peck":
      // squawkhoppeck.webm is ~10s; buffer so one-shot video is not cut to idle early.
      return 11_200;
    case "hello_wave":
      return 4200;
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
