import {
  holdMsForState,
  parrotStateForEventKind,
  pickRandomLine,
  PARROT_LINES,
  type NormalizedStreamEvent,
  type ParrotOverlayPayload,
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
      default:
        return pickRandomLine(PARROT_LINES.idle);
    }
  }

  buildOverlayPayload(event: NormalizedStreamEvent): ParrotOverlayPayload {
    const state = parrotStateForEventKind(event.kind);
    const subtitle = this.buildSubtitle(event);
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
