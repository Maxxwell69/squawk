import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BattleBoardFrame } from "@/components/BattleBoardFrame";
import {
  BATTLE_BOARD_SLUGS,
  getBattleBoardDef,
  type BattleBoardSlug,
} from "@/lib/battle-board-slugs";

type Props = { params: Promise<{ boardId: string }> };

export function generateStaticParams(): { boardId: BattleBoardSlug }[] {
  return BATTLE_BOARD_SLUGS.map((boardId) => ({ boardId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boardId } = await params;
  const def = getBattleBoardDef(boardId);
  if (!def) return { title: "Battle board" };
  return {
    title: `${def.label} — Battle board`,
    description: "9:16 TikTok battle title overlay",
  };
}

export default async function BattleBoardByIdPage({ params }: Props) {
  const { boardId } = await params;
  const def = getBattleBoardDef(boardId);
  if (!def) notFound();

  return <BattleBoardFrame def={def} />;
}
