import type { BattleTriggerId } from "@captain-squawks/shared";

/**
 * Random board-style lines between minute announcements. Weighted toward easy hype in
 * minute one and respectful opponent lines (hail nice) throughout.
 */
const SPRINKLE_MINUTE_1: BattleTriggerId[] = [
  "battle_phase1_1",
  "battle_phase1_2",
  "battle_phase1_3",
  "battle_phase1_4",
  "battle_phase1_5",
  "battle_phase1_6",
  "battle_phase1_7",
  "battle_phase1_8",
  "battle_phase1_9",
  "battle_phase1_10",
  "battle_prepare_1",
  "battle_prepare_2",
  "battle_prepare_3",
  "battle_prepare_4",
  "battle_prepare_5",
  "battle_prepare_6",
  "battle_prepare_7",
  "battle_prepare_8",
  "battle_cheer",
  "battle_hail_nice_1",
  "battle_hail_nice_2",
  "battle_hail_nice_3",
];

const SPRINKLE_MINUTE_2: BattleTriggerId[] = [
  "battle_phase2_watch_3x",
  "battle_phase2_cannons",
  "battle_phase2_fun",
  "battle_phase2_battle_on",
  "battle_phase1_4",
  "battle_phase1_5",
  "battle_cheer",
  "battle_hail_nice_1",
  "battle_hail_nice_2",
  "battle_hail_nice_3",
];

const SPRINKLE_MINUTE_3: BattleTriggerId[] = [
  "battle_phase3_chain_shot",
  "battle_phase3_halfway",
  "battle_phase3_push",
  "battle_phase2_fun",
  "battle_cheer",
  "battle_hail_nice_1",
  "battle_hail_nice_2",
  "battle_hail_nice_3",
];

const SPRINKLE_MINUTE_4: BattleTriggerId[] = [
  "battle_phase4_snipers",
  "battle_phase4_board",
  "battle_phase4_ahead",
  "battle_phase4_behind",
  "battle_phase3_push",
  "battle_cheer",
  "battle_hail_nice_1",
  "battle_hail_nice_2",
  "battle_hail_nice_3",
];

const SPRINKLE_MINUTE_5: BattleTriggerId[] = [
  "battle_phase4_snipers",
  "battle_phase4_board",
  "battle_phase4_ahead",
  "battle_phase4_behind",
  "battle_phase5_repair_party",
  "battle_cheer",
  "battle_hail_nice_1",
  "battle_hail_nice_2",
  "battle_hail_nice_3",
];

export function battleSprinklePool(elapsedSec: number): readonly BattleTriggerId[] {
  if (elapsedSec < 60) return SPRINKLE_MINUTE_1;
  if (elapsedSec < 120) return SPRINKLE_MINUTE_2;
  if (elapsedSec < 180) return SPRINKLE_MINUTE_3;
  if (elapsedSec < 240) return SPRINKLE_MINUTE_4;
  return SPRINKLE_MINUTE_5;
}

export function pickRandomSprinkleTrigger(
  elapsedSec: number
): BattleTriggerId {
  const pool = battleSprinklePool(elapsedSec);
  return pool[Math.floor(Math.random() * pool.length)]!;
}
