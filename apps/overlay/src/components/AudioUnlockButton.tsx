"use client";

type Props = {
  visible: boolean;
  onUnlock: () => void | Promise<void>;
};

/** Small control for OBS setup — hide after unlock via `visible` */
export function AudioUnlockButton({ visible, onUnlock }: Props) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => void onUnlock()}
      className="pointer-events-auto fixed bottom-3 left-3 z-[100] rounded-lg border border-white/30 bg-black/55 px-3 py-1.5 font-body text-xs font-medium text-parchment shadow-lg backdrop-blur-sm transition hover:bg-black/70"
    >
      Enable audio
    </button>
  );
}
