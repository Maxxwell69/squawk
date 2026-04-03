import type { BattleTriggerId } from "@captain-squawks/shared";

/** Elapsed seconds from match start → auto Squawk line (entry + mid-minute nudge). */
export const BATTLE_AUTO_MILESTONES: {
  elapsed: number;
  trigger: BattleTriggerId;
}[] = [
  { elapsed: 60, trigger: "battle_auto_phase2" },
  { elapsed: 90, trigger: "battle_auto_phase2" },
  { elapsed: 120, trigger: "battle_auto_phase3" },
  { elapsed: 150, trigger: "battle_auto_phase3" },
  { elapsed: 180, trigger: "battle_auto_phase4" },
  { elapsed: 210, trigger: "battle_auto_phase4" },
  { elapsed: 240, trigger: "battle_auto_phase5" },
  { elapsed: 270, trigger: "battle_auto_phase5" },
];
