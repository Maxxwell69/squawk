export const PARROT_STATES = [
  "idle",
  "talking",
  "hype",
  "chaos",
  "exit",
  "away",
  "return",
  "peck",
  /** Stream Deck hello — waving emote while line + TTS play */
  "hello_wave",
  /** Stream Deck — dance emote + line */
  "dancing_squawk",
  /** Victory celebration clip (battle party / Stream Deck) */
  "victory_dance",
  /** Stream Deck — feeding animation + line */
  "feeding_time",
] as const;
export type ParrotState = (typeof PARROT_STATES)[number];

export function isParrotState(v: string): v is ParrotState {
  return (PARROT_STATES as readonly string[]).includes(v);
}
