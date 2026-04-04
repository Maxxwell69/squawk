import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  getBattleBoardDef,
  isBattleBoardSlug,
} from "@/lib/battle-board-slugs";

const IMAGE_EXT = /\.(webp|png|jpe?g|gif)$/i;

async function firstImagePublicUrl(
  segments: string[]
): Promise<string | null> {
  const dir = path.join(process.cwd(), "public", ...segments);
  const entries = await readdir(dir).catch(() => [] as string[]);
  const images = entries.filter(
    (f) =>
      IMAGE_EXT.test(f) &&
      !f.startsWith(".") &&
      f !== ".gitkeep"
  );
  images.sort((a, b) => a.localeCompare(b));
  const pick = images[0];
  if (!pick) return null;
  return `/${[...segments, encodeURIComponent(pick)].join("/")}`;
}

export async function GET(req: Request) {
  const slug =
    new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  if (!isBattleBoardSlug(slug)) {
    return Response.json(
      { banner: null, tips: null, error: "invalid slug" },
      { status: 400 }
    );
  }
  const def = getBattleBoardDef(slug);
  if (!def) {
    return Response.json({ banner: null, tips: null }, { status: 404 });
  }
  const rootSeg =
    def.kind === "level"
      ? (["battle", "board", "levels", slug] as const)
      : (["battle", "board", "banners", slug] as const);

  const inBanner = await firstImagePublicUrl([...rootSeg, "banner"]);
  const inTips = await firstImagePublicUrl([...rootSeg, "tips"]);
  /** Loose files in scene root (old layout) — use as banner only */
  const inRoot = await firstImagePublicUrl([...rootSeg]);

  const banner = inBanner ?? inRoot ?? null;
  const tips = inTips ?? null;

  return Response.json({ banner, tips });
}
