import { readdir } from "fs/promises";
import path from "path";

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i;

export type SotAdventureMusicTrack = {
  name: string;
  url: string;
};

/**
 * Lists audio files in public/sea-of-thieves/adventure-music (any filenames).
 * Sorted lexicographically — playlist order after a random start index.
 */
export async function GET(): Promise<Response> {
  const dir = path.join(
    process.cwd(),
    "public",
    "sea-of-thieves",
    "adventure-music"
  );
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return Response.json({ tracks: [] as SotAdventureMusicTrack[] });
  }

  const audio = names
    .filter((n) => AUDIO_EXT.test(n) && !n.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const tracks: SotAdventureMusicTrack[] = audio.map((name) => ({
    name,
    url: `/sea-of-thieves/adventure-music/${encodeURIComponent(name)}`,
  }));

  return Response.json({ tracks });
}
