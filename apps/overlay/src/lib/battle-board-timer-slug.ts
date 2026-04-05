import type { BattleMatchStatus } from "@/hooks/useBattleMusic";
import type { BattleBoardSlug } from "@/lib/battle-board-slugs";

/**
 * Drives the OBS 9:16 title board from the battle page clock (same boundaries as music phases).
 */
export function battleBoardSlugForTimer(
  matchStatus: BattleMatchStatus,
  remainingSec: number,
  totalSec: number
): BattleBoardSlug {
  switch (matchStatus) {
    case "idle":
      return "prepare";
    case "running": {
      const elapsed = Math.max(0, totalSec - remainingSec);
      if (elapsed < 60) return "minute-one";
      if (elapsed < 120) return "minute-two";
      if (elapsed < 180) return "minute-three";
      if (elapsed < 240) return "minute-four";
      return "last-minute";
    }
    case "awaiting_result":
      return "repair-party";
    case "victory_party":
      /** Win art lives under `banners/win/`; use Party banner button for `party` when you want that asset. */
      return "win";
    case "defeat":
      return "lose";
    default:
      return "prepare";
  }
}
