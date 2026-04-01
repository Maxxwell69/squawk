import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";

export type SavedAudio = {
  filename: string;
  absolutePath: string;
  /** URL path only, e.g. /audio/<filename> */
  urlPath: string;
  /** Full URL for browsers (PUBLIC_BASE_URL + urlPath) */
  publicUrl: string;
};

type CacheEntry = {
  filename: string;
  durationMs?: number;
};

export class AudioFileStore {
  private readonly cacheIndexPath: string;
  private cacheIndex: Record<string, CacheEntry> = {};
  private cacheIndexLoaded = false;

  constructor(
    private readonly dir: string,
    private readonly publicBaseUrl: string
  ) {
    this.cacheIndexPath = join(this.dir, "_cache-index.json");
  }

  async ensureDir(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  private savedFromFilename(filename: string): SavedAudio {
    const absolutePath = join(this.dir, filename);
    const urlPath = `/audio/${filename}`;
    const base = this.publicBaseUrl.replace(/\/$/, "");
    return {
      filename,
      absolutePath,
      urlPath,
      publicUrl: `${base}${urlPath}`,
    };
  }

  private static keyToFilename(cacheKeyRaw: string, extension: string): string {
    const safeExt = extension.replace(/^\./, "").replace(/[^a-z0-9]/gi, "") || "bin";
    const digest = createHash("sha256").update(cacheKeyRaw).digest("hex");
    return `${digest}.${safeExt}`;
  }

  private async ensureCacheIndexLoaded(): Promise<void> {
    if (this.cacheIndexLoaded) return;
    await this.ensureDir();
    try {
      const raw = await readFile(this.cacheIndexPath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
      if (parsed && typeof parsed === "object") {
        this.cacheIndex = parsed;
      }
    } catch {
      this.cacheIndex = {};
    }
    this.cacheIndexLoaded = true;
  }

  private async persistCacheIndex(): Promise<void> {
    await writeFile(this.cacheIndexPath, JSON.stringify(this.cacheIndex), "utf8");
  }

  async getCachedAudio(cacheKeyRaw: string): Promise<{
    saved: SavedAudio;
    durationMs?: number;
  } | null> {
    await this.ensureCacheIndexLoaded();
    const entry = this.cacheIndex[cacheKeyRaw];
    if (!entry) return null;
    const saved = this.savedFromFilename(entry.filename);
    try {
      await access(saved.absolutePath);
      return { saved, durationMs: entry.durationMs };
    } catch {
      delete this.cacheIndex[cacheKeyRaw];
      await this.persistCacheIndex();
      return null;
    }
  }

  async saveAudioCached(
    cacheKeyRaw: string,
    buffer: Buffer,
    extension: string,
    durationMs?: number
  ): Promise<{
    saved: SavedAudio;
    durationMs?: number;
    cacheHit: boolean;
  }> {
    await this.ensureCacheIndexLoaded();

    const existing = await this.getCachedAudio(cacheKeyRaw);
    if (existing) {
      return {
        saved: existing.saved,
        durationMs: existing.durationMs,
        cacheHit: true,
      };
    }

    const filename = AudioFileStore.keyToFilename(cacheKeyRaw, extension);
    const saved = this.savedFromFilename(filename);
    await writeFile(saved.absolutePath, buffer);
    this.cacheIndex[cacheKeyRaw] = { filename, durationMs };
    await this.persistCacheIndex();
    return { saved, durationMs, cacheHit: false };
  }

  /** Write buffer; returns paths for static serving + absolute URL */
  async saveAudio(buffer: Buffer, extension: string): Promise<SavedAudio> {
    await this.ensureDir();
    const safeExt = extension.replace(/^\./, "").replace(/[^a-z0-9]/gi, "") || "bin";
    const filename = `${randomUUID()}.${safeExt}`;
    const absolutePath = join(this.dir, filename);
    await writeFile(absolutePath, buffer);
    const urlPath = `/audio/${filename}`;
    const base = this.publicBaseUrl.replace(/\/$/, "");
    return {
      filename,
      absolutePath,
      urlPath,
      publicUrl: `${base}${urlPath}`,
    };
  }

  /** Optional: delete old files — MVP no-op; cron or periodic job can call later */
  async cleanupOlderThan(_maxAgeMs: number): Promise<void> {
    /* TODO: readdir + stat + unlink */
  }
}
