/**
 * Tried in order until one loads (onerror advances).
 * Files live under `public/battle/music/` — add `phase5.mp3` when you have a fifth track.
 */

const enc = (path: string) => {
  const i = path.lastIndexOf("/");
  if (i < 0) return encodeURI(path);
  return path.slice(0, i + 1) + encodeURIComponent(path.slice(i + 1));
};

/** Phase background (minute 1–5). */
export const BATTLE_PHASE_TRACKS: Record<number, readonly string[]> = {
  1: [enc("/battle/music/phase1.mp3")],
  2: [enc("/battle/music/phase2.mp3"), enc("/battle/music/phase1.mp3")],
  3: [enc("/battle/music/phase3.mp3"), enc("/battle/music/phase2.mp3")],
  4: [enc("/battle/music/phase4.mp3"), enc("/battle/music/phase3.mp3")],
  5: [
    enc("/battle/music/phase5.mp3"),
    enc("/battle/music/phase4.mp3"),
    enc("/battle/music/phase3.mp3"),
  ],
};

export const BATTLE_VICTORY_TRACKS: readonly string[] = [
  enc("/battle/music/victory.mp3"),
  enc("/battle/music/phase4.mp3"),
];

export const BATTLE_DEFEAT_TRACKS: readonly string[] = [
  enc("/battle/music/defeat.mp3"),
  enc("/battle/music/phase2.mp3"),
];

export function phaseIndexFromElapsed(elapsedSec: number): number {
  return Math.min(5, Math.floor(elapsedSec / 60) + 1);
}
