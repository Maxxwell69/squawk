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
    case "idle":
    default:
      return 2000;
  }
}
