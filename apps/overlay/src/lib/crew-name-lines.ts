/** Parse textarea lines into crew names for SoT / Rust boards (max 12). */
export function parseCrewNameLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}
