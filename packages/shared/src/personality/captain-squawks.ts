import type { StreamEventKind } from "../event-kinds";

/**
 * First Mate Squawks — the parrot. Captain of the stream is Pirate Maxx.
 * Edit this file to tune voice lines and idle/hype pools.
 */
export const captainSquawksPersonality = {
  name: "First Mate Squawks",
  callsStreamer: "Pirate Maxx",
  audienceTerms: {
    neutral: ["crew", "mates"],
    playful: ["scallywags", "deckhands"],
  },
} as const;

export type LinePools = {
  follow: readonly string[];
  gift: readonly string[];
  like_milestone: readonly string[];
  share: readonly string[];
  comment: readonly string[];
  chaos: readonly string[];
  idle: readonly string[];
  warning: readonly string[];
  hype: readonly string[];
};

export const PARROT_LINES: LinePools = {
  follow: [
    "Squawk! New crew aboard, Cap'n Maxx!",
    "Another soul signs the roster — welcome, mate!",
    "The ship gains a sailor! Huzzah!",
  ],
  gift: [
    "A gift hits the deck! Thank ye, crew!",
    "Treasure from the chat! Cap'n Maxx sees it!",
    "Gold on the wind! Ye spoil us!",
  ],
  like_milestone: [
    "The likes be stacking like cannonballs!",
    "Milestone cracked! The crew roars!",
    "Hearts for Cap'n Maxx — keep 'em coming!",
  ],
  share: [
    "They spread the word! More scallywags inbound!",
    "The map spreads — new eyes on the voyage!",
    "Share the raid! Bring the fleet!",
  ],
  comment: [
    "Word from the galley — the crew speaks!",
    "Message in a bottle from the chat!",
    "The crew has thoughts — hear 'em out, Cap'n Maxx!",
  ],
  chaos: [
    "Chaos off the starboard bow!",
    "Rust in the rigging — all hands!",
    "Storm warning! Batten down!",
    "Something wicked squawks from the crow's nest!",
  ],
  idle: [
    "All quiet — steady as she goes, Cap'n Maxx.",
    "Squawk… maps, rust, and glory tonight.",
    "The crew watches. Cap'n Maxx leads.",
  ],
  warning: [
    "Eyes up — trouble on the horizon.",
    "Steady hands, Cap'n Maxx. Something's off.",
  ],
  hype: [
    "The crew be roaring tonight!",
    "Raise the colors — this ship don't sleep!",
    "Battle tempo! Keep the powder dry!",
  ],
};

export function pickRandomLine(lines: readonly string[]): string {
  const i = Math.floor(Math.random() * lines.length);
  return lines[i] ?? "";
}

export function lineForEventKind(kind: StreamEventKind): string {
  switch (kind) {
    case "follow":
      return pickRandomLine(PARROT_LINES.follow);
    case "gift":
      return pickRandomLine(PARROT_LINES.gift);
    case "like_milestone":
      return pickRandomLine(PARROT_LINES.like_milestone);
    case "share":
      return pickRandomLine(PARROT_LINES.share);
    case "comment":
      return pickRandomLine(PARROT_LINES.comment);
    case "chaos":
      return pickRandomLine(PARROT_LINES.chaos);
    case "custom":
    default:
      return pickRandomLine(PARROT_LINES.idle);
  }
}
