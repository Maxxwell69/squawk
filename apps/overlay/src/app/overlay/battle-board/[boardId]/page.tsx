import { notFound, redirect } from "next/navigation";
import { isBattleBoardSlug } from "@/lib/battle-board-slugs";

type Props = { params: Promise<{ boardId: string }> };

/** Legacy per-slug URLs → single display page with ?scene= */
export default async function BattleBoardByIdPage({ params }: Props) {
  const { boardId } = await params;
  if (!isBattleBoardSlug(boardId)) notFound();
  redirect(
    `/overlay/battle-board/display?scene=${encodeURIComponent(boardId)}`
  );
}
