import { ParrotOverlay } from "@/components/ParrotOverlay";

/** Parrot + speech bubble to the right (transparent — OBS / compositing). */
export default function ParrotWithBubblePage() {
  return (
    <main className="m-0 min-h-0 bg-transparent p-0">
      <ParrotOverlay variant="parrot-with-bubble" />
    </main>
  );
}
