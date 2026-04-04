import { BATTLE_BOARD_LEGACY_SLUGS } from "@captain-squawks/shared";
import { notFound, redirect } from "next/navigation";
import { isBattleBoardSlug } from "@/lib/battle-board-slugs";

type Props = { params: Promise<{ boardId: string }> };

/** Legacy per-slug URLs → single display page with ?scene= */
export default async function BattleBoardByIdPage({ params }: Props) {
  const { boardId } = await params;
  const mapped =
    BATTLE_BOARD_LEGACY_SLUGS[
      boardId as keyof typeof BATTLE_BOARD_LEGACY_SLUGS
    ] ?? boardId;
  if (!isBattleBoardSlug(mapped)) notFound();
  redirect(
    `/overlay/battle-board/display?scene=${encodeURIComponent(mapped)}`
  );
}
