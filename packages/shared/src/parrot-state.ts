export const PARROT_STATES = [
  "idle",
  "talking",
  "hype",
  "chaos",
  "exit",
  "away",
  "return",
  "peck",
] as const;
export type ParrotState = (typeof PARROT_STATES)[number];

export function isParrotState(v: string): v is ParrotState {
  return (PARROT_STATES as readonly string[]).includes(v);
}
