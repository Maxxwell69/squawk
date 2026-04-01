import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type SavedAudio = {
  filename: string;
  absolutePath: string;
  /** URL path only, e.g. /audio/<filename> */
  urlPath: string;
  /** Full URL for browsers (PUBLIC_BASE_URL + urlPath) */
  publicUrl: string;
};

export class AudioFileStore {
  constructor(
    private readonly dir: string,
    private readonly publicBaseUrl: string
  ) {}

  async ensureDir(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
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
