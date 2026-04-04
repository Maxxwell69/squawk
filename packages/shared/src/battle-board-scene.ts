import { z } from "zod";

/** Slugs for 9:16 battle title display — shared by overlay + bridge. */
export const BATTLE_BOARD_SCENE_SLUGS = [
  "prepare",
  "minute-one",
  "minute-two",
  "minute-three",
  "minute-four",
  "last-minute",
  "repair-party",
  "win",
  "lose",
  "repair",
  "party",
] as const;

export type BattleBoardSceneSlug = (typeof BATTLE_BOARD_SCENE_SLUGS)[number];

export const battleBoardSceneSlugSchema = z.enum(BATTLE_BOARD_SCENE_SLUGS);

export const battleBoardScenePostBodySchema = z.object({
  slug: battleBoardSceneSlugSchema,
});

export type BattleBoardScenePostBody = z.infer<
  typeof battleBoardScenePostBodySchema
>;

export const battleBoardSceneWsSchema = z.object({
  type: z.literal("BATTLE_BOARD_SCENE"),
  slug: battleBoardSceneSlugSchema,
});

export type BattleBoardSceneWsMessage = z.infer<
  typeof battleBoardSceneWsSchema
>;

export function isBattleBoardSceneSlug(v: string): v is BattleBoardSceneSlug {
  return (BATTLE_BOARD_SCENE_SLUGS as readonly string[]).includes(v);
}

/** Old URLs → current slug (display redirect). */
export const BATTLE_BOARD_LEGACY_SLUGS: Record<string, BattleBoardSceneSlug> =
  {
    "phase-two": "minute-two",
    "phase-three": "minute-three",
  };
