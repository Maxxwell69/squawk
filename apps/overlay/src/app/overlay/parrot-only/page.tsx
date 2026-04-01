import { ParrotOverlay } from "@/components/ParrotOverlay";

/** Parrot WEBM only — no parchment panel (OBS / TikTok friendly). */
export default function ParrotOnlyOverlayPage() {
  return (
    <main className="m-0 min-h-0 bg-transparent p-0">
      <ParrotOverlay variant="parrot-only" />
    </main>
  );
}
