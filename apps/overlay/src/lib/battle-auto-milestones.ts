import type { BattleTriggerId } from "@captain-squawks/shared";

/**
 * Elapsed seconds when Squawk announces the next battle *mode* (1–4 min marks only).
 * At 5:00 the clock ends — no auto line here (you pick win/lose after).
 */
export const BATTLE_AUTO_MILESTONES: {
  elapsed: number;
  trigger: BattleTriggerId;
}[] = [
  { elapsed: 60, trigger: "battle_auto_phase2" },
  { elapsed: 120, trigger: "battle_auto_phase3" },
  { elapsed: 180, trigger: "battle_auto_phase4" },
  { elapsed: 240, trigger: "battle_auto_phase5" },
];

/** Same seconds — skip random sprinkles on these ticks (minute call handles the moment). */
export const BATTLE_MINUTE_MARK_SECONDS = new Set([60, 120, 180, 240]);
