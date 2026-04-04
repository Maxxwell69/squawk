import {
  BATTLE_BOARD_SCENE_SLUGS,
  type BattleBoardSceneSlug,
  isBattleBoardSceneSlug,
} from "@captain-squawks/shared";

export type BattleBoardSlug = BattleBoardSceneSlug;

export type BattleBoardKind = "level" | "banner";

export type BattleBoardDef = {
  slug: BattleBoardSlug;
  kind: BattleBoardKind;
  /** Short label for hub + battle page links */
  label: string;
  /** Fallback text tips if `tips/` folder has no image */
  instructions: string[];
};

const LEVEL = (slug: BattleBoardSlug, label: string, instructions: string[]) =>
  ({ slug, kind: "level" as const, label, instructions });

const BANNER = (slug: BattleBoardSlug, label: string, instructions: string[]) =>
  ({ slug, kind: "banner" as const, label, instructions });

export const BATTLE_BOARD_DEFS: BattleBoardDef[] = [
  LEVEL("prepare", "Prepare (default before battle)", [
    "Warm the deck: taps and small gifts first.",
    "Pace the fodder — save your biggest swings for later calls.",
    "Tap Minute one when the match clock starts.",
  ]),
  LEVEL("minute-one", "Minute one", [
    "Nice and easy — fun first.",
    "Watch for extras on early gifts.",
    "Build tempo; the storm comes later.",
  ]),
  LEVEL("minute-two", "Minute two", [
    "3× gifting can flip a fight — read the board.",
    "Cannons ready: steady stacks, call your shots.",
    "Stay loud in chat.",
  ]),
  LEVEL("minute-three", "Minute three", [
    "Chain-shot energy — break their rhythm.",
    "More than halfway — positive push only.",
    "Stack with purpose; every gift counts.",
  ]),
  LEVEL("minute-four", "Minute four", [
    "Fourth quarter — steady pressure, no panic.",
    "Read snipers early; protect your stacks.",
    "One clean plan before the final push.",
  ]),
  LEVEL("last-minute", "Last minute", [
    "Watch for snipers — big gifts at the wire.",
    "Prepare to board: final coordinated push.",
    "Ahead: hold the line. Behind: one clean swing.",
  ]),
  LEVEL("repair-party", "Repair & party", [
    "Clock stopped — breathe and thank the room.",
    "Good fight either way; hype your MVPs next.",
    "Use Win / Lose banners when you call the result.",
  ]),
  BANNER("win", "Win banner", [
    "Victory — thank your crew loud.",
    "Congratulate the other side; they brought the fight.",
  ]),
  BANNER("lose", "Lose banner", [
    "Tough seas — we sailed hard anyway.",
    "Salute opponents and your MVPs in chat.",
  ]),
  BANNER("repair", "Repair banner", [
    "Repair mood: reset, hydrate, thank chat.",
    "Keep vibes up before the next round.",
  ]),
  BANNER("party", "Party banner", [
    "Party energy — dance, cheers, victory lap.",
    "Let the room celebrate with you.",
  ]),
];

export const BATTLE_BOARD_SLUGS: BattleBoardSlug[] = [
  ...BATTLE_BOARD_SCENE_SLUGS,
];

export function isBattleBoardSlug(v: string): v is BattleBoardSlug {
  return isBattleBoardSceneSlug(v);
}

export function getBattleBoardDef(slug: string): BattleBoardDef | undefined {
  return BATTLE_BOARD_DEFS.find((d) => d.slug === slug);
}
