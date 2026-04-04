/**
 * Panel slots for the 9:16 battle board — align with the guides in your source art
 * (top “banner” band + lower-left tips rectangle, e.g. red outline in mockups).
 * Adjust values here if you change template size or safe zones.
 */
export const BATTLE_BOARD_LAYOUT = {
  /** Top region: main banner graphic uses full frame width inside this height. */
  bannerSlotHeight: "min(50dvh, 48%)",
  bannerMinHeight: "min(36dvh, 38%)",
  /** Lower-left tips card — align with the “tips” rectangle in your PNG guides. */
  tipsLeft: "4%",
  tipsTop: "47%",
  tipsWidth: "min(44%, 17rem)",
  tipsMaxHeight: "min(34dvh, 38%)",
} as const;
