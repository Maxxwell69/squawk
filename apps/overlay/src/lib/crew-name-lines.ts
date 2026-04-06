/** Parse textarea lines into crew names for SoT / Rust boards (max 12). */
export function parseCrewNameLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * When names are set, sometimes return one so Squawk can shout out a deckhand
 * (battle board, SoT action automations, etc.).
 */
export function pickCrewForSquawkOccasionally(
  names: readonly string[],
  chance = 0.38
): string | undefined {
  if (names.length === 0 || Math.random() >= chance) return undefined;
  return names[Math.floor(Math.random() * names.length)]!;
}
