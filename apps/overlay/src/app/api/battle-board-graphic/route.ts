import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  getBattleBoardDef,
  isBattleBoardSlug,
} from "@/lib/battle-board-slugs";

const IMAGE_EXT = /\.(webp|png|jpe?g|gif)$/i;

export async function GET(req: Request) {
  const slug =
    new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  if (!isBattleBoardSlug(slug)) {
    return Response.json(
      { url: null, error: "invalid slug" },
      { status: 400 }
    );
  }
  const def = getBattleBoardDef(slug);
  if (!def) {
    return Response.json({ url: null }, { status: 404 });
  }
  const baseSeg =
    def.kind === "level"
      ? (["battle", "board", "levels", slug] as const)
      : (["battle", "board", "banners", slug] as const);
  const dir = path.join(process.cwd(), "public", ...baseSeg);
  const entries = await readdir(dir).catch(() => [] as string[]);
  const images = entries.filter(
    (f) =>
      IMAGE_EXT.test(f) &&
      !f.startsWith(".") &&
      f !== ".gitkeep"
  );
  images.sort((a, b) => a.localeCompare(b));
  const pick = images[0];
  const url = pick
    ? `/${[...baseSeg, encodeURIComponent(pick)].join("/")}`
    : null;
  return Response.json({ url });
}
