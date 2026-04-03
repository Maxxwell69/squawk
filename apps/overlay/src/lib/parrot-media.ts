import type { ParrotState } from "@captain-squawks/shared";

/**
 * Default loop used until you add per-state files under `apps/overlay/public/parrot/`.
 *
 * Suggested assets (drop in public folder, then update paths below):
 * - `idle` — still or very subtle loop (GIF/WEBM)
 * - `talking` — beak/movement while speaking
 * - `hype` — gift/likes energy
 * - `chaos` — raid/storm energy
 */
export const PARROT_DEFAULT_PATH = "/parrot/pirate_parrot.webm";

/** Per-state media URLs. Same default = one file until you replace each entry. */
export const PARROT_ASSETS: Record<ParrotState, string> = {
  idle: "/parrot/emotes/squawkidlereg.webm",
  talking: PARROT_DEFAULT_PATH,
  hype: PARROT_DEFAULT_PATH,
  chaos: PARROT_DEFAULT_PATH,
  exit: "/parrot/emotes/squawkgifstageleft.webm",
  // Return is its own animation (left -> right), so we don't mirror it.
  return: "/parrot/emotes/squawkstagereturn.webm",
  // `away` is rendered as hidden in `ParrotMedia` (no video).
  away: PARROT_DEFAULT_PATH,
  // One-shot animation driven by Stream Deck / voice command.
  peck: "/parrot/emotes/squawkhoppeck.webm",
  hello_wave: "/parrot/emotes/squawkwavinghello.webm",
  dancing_squawk: "/parrot/emotes/dancingsquawk.webm",
  feeding_time: "/parrot/emotes/squawkfeedingtime.webm",
};

export function parrotMediaUrl(state: ParrotState): string {
  return PARROT_ASSETS[state] ?? PARROT_DEFAULT_PATH;
}

export function isGifPath(url: string): boolean {
  // We treat animated `.webp` the same way as gifs (render as an `<img>`).
  // For anything else, we use `<video>`.
  return /\.(gif|webp)(\?|$)/i.test(url);
}
