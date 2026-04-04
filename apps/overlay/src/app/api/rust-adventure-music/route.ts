import { readdir } from "fs/promises";
import path from "path";

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i;

export type RustAdventureMusicTrack = {
  name: string;
  url: string;
};

/** Lists `public/rust/adventure-music/` — same rules as SoT adventure music. */
export async function GET(): Promise<Response> {
  const dir = path.join(process.cwd(), "public", "rust", "adventure-music");
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return Response.json({ tracks: [] as RustAdventureMusicTrack[] });
  }

  const audio = names
    .filter((n) => AUDIO_EXT.test(n) && !n.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const tracks: RustAdventureMusicTrack[] = audio.map((name) => ({
    name,
    url: `/rust/adventure-music/${encodeURIComponent(name)}`,
  }));

  return Response.json({ tracks });
}
