"use client";

type Props = {
  volume01: number;
  onVolumeChange: (volume01: number) => void;
};

/** TTS / Squawk voice level — persists via parent (localStorage in useParrotBridge). */
export function SquawkVolumeSlider({ volume01, onVolumeChange }: Props) {
  const pct = Math.round(volume01 * 100);
  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-[100] max-w-[min(92vw,220px)]">
      <label className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/55 px-2.5 py-2 shadow-lg backdrop-blur-sm">
        <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-wide text-parchment">
          Squawk
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) =>
            onVolumeChange(Math.min(1, Math.max(0, Number(e.target.value) / 100)))
          }
          className="h-2 min-w-0 flex-1 cursor-pointer accent-squawk-gold"
          aria-label="Squawk voice volume"
        />
        <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-parchment/85">
          {pct}%
        </span>
      </label>
    </div>
  );
}
