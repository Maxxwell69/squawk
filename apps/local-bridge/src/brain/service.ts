import {
  estimateHoldMsFromText,
  holdMsForState,
  isParrotState,
  isStreamDeckTriggerId,
  lineForStreamDeckTrigger,
  parrotStateForEventKind,
  pickRandomLine,
  PARROT_LINES,
  STREAM_DECK_PARROT_STATE,
  type NormalizedStreamEvent,
  type ParrotOverlayPayload,
  type ParrotState,
} from "@captain-squawks/shared";

/**
 * Rule-based "brain" — swap implementation later for LLM + tools.
 */
export class BrainService {
  private buildSubtitle(event: NormalizedStreamEvent): string {
    const user = event.actorLabel?.trim() || "A matey";
    const detail = event.detail?.trim();

    switch (event.kind) {
      case "gift": {
        const gift = detail || "treasure";
        const thanks = [
          "Yer generosity keeps the cannons roaring!",
          "May yer sails stay full and yer aim true!",
          "The whole crew salutes ye, ye glorious scallywag!",
          "Ye just filled the treasure hold, matey!",
          "That bounty could buy a fleet of parrots!",
          "By the black flag, that gift be legendary!",
          "The Captain tips his tricorne to ye!",
          "Deckhands cheer yer name across the sea!",
          "That tribute hits harder than a broadside!",
          "Ye keep this ship sailing through any storm!",
          "We mark yer name in gold on the captain's log!",
        ] as const;
        return `${user} just gifted a ${gift}! ${pickRandomLine(thanks)}`;
      }
      case "follow": {
        const welcomes = [
          "Welcome aboard, ye legend!",
          "Grab a rope and join the raid, matey!",
          "Yer now part of the fiercest crew on these seas!",
        ] as const;
        return `${user} just joined the crew! ${pickRandomLine(welcomes)}`;
      }
      case "comment": {
        const line = detail || pickRandomLine(PARROT_LINES.comment);
        return `${user} says: ${line}`;
      }
      case "share":
        return `${user} shared the stream! ${pickRandomLine(PARROT_LINES.share)}`;
      case "like_milestone":
        return detail
          ? `Likes milestone ${detail.replace(/^likes:/, "")} reached! ${pickRandomLine(PARROT_LINES.like_milestone)}`
          : pickRandomLine(PARROT_LINES.like_milestone);
      case "chaos":
        return `${pickRandomLine(PARROT_LINES.chaos)} ${user} kicked up a storm!`;
      case "custom":
      default: {
        if (event.detail && isStreamDeckTriggerId(event.detail)) {
          return (
            lineForStreamDeckTrigger(event.detail) ??
            pickRandomLine(PARROT_LINES.idle)
          );
        }
        if (detail) return detail;
        return pickRandomLine(PARROT_LINES.idle);
      }
    }
  }

  private parrotStateFor(event: NormalizedStreamEvent): ParrotState {
    const raw = event.raw;
    if (
      raw &&
      typeof raw.parrotState === "string" &&
      isParrotState(raw.parrotState)
    ) {
      return raw.parrotState;
    }
    if (event.kind === "custom" && event.detail && isStreamDeckTriggerId(event.detail)) {
      return STREAM_DECK_PARROT_STATE[event.detail];
    }
    return parrotStateForEventKind(event.kind);
  }

  buildOverlayPayload(event: NormalizedStreamEvent): ParrotOverlayPayload {
    const state = this.parrotStateFor(event);
    const subtitle = this.buildSubtitle(event);
    const baseHoldMs = holdMsForState(state);
    let holdMs = baseHoldMs;
    if (event.kind === "custom" && event.detail && isStreamDeckTriggerId(event.detail)) {
      if (subtitle.trim()) {
        // Don't let subtitle-based estimates undercut clip/TTS floors from holdMsForState.
        holdMs = Math.max(baseHoldMs, estimateHoldMsFromText(subtitle));
      }
    }
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
