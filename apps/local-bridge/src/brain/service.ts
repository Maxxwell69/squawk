import {
  holdMsForState,
  lineForEventKind,
  parrotStateForEventKind,
  type NormalizedStreamEvent,
  type ParrotOverlayPayload,
} from "@captain-squawks/shared";

/**
 * Rule-based "brain" — swap implementation later for LLM + tools.
 */
export class BrainService {
  buildOverlayPayload(event: NormalizedStreamEvent): ParrotOverlayPayload {
    const state = parrotStateForEventKind(event.kind);
    const subtitle = lineForEventKind(event.kind);
    const holdMs = holdMsForState(state);
    return {
      state,
      subtitle,
      lineId: event.id,
      eventKind: event.kind,
      holdMs,
      ts: Date.now(),
    };
  }
}
