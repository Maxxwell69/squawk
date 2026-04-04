"use client";

type Props = {
  volume01: number;
  onVolumeChange: (volume01: number) => void;
  /** `fixed` = overlay corner; `inline` = battle board / forms */
  variant?: "fixed" | "inline";
};

/** TTS / Squawk voice level — parent persists via `persistSquawkVolume01` / hook. */
export function SquawkVolumeSlider({
  volume01,
  onVolumeChange,
  variant = "fixed",
}: Props) {
  const pct = Math.round(volume01 * 100);
  const label = (
    <label
      className={
        variant === "fixed"
          ? "flex items-center gap-2 rounded-lg border border-white/30 bg-black/55 px-2.5 py-2 shadow-lg backdrop-blur-sm"
          : "flex min-w-[min(100%,320px)] max-w-md flex-col gap-1 sm:flex-row sm:items-center"
      }
    >
      <span
        className={
          variant === "fixed"
            ? "shrink-0 font-body text-[10px] font-semibold uppercase tracking-wide text-parchment"
            : "shrink-0 font-body text-xs text-parchment/80"
        }
      >
        Squawk voice
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
      <span
        className={
          variant === "fixed"
            ? "w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-parchment/85"
            : "w-10 shrink-0 font-mono text-xs tabular-nums text-parchment/75"
        }
      >
        {pct}%
      </span>
    </label>
  );

  if (variant === "inline") {
    return <div className="pointer-events-auto w-full">{label}</div>;
  }

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-[100] max-w-[min(92vw,220px)]">
      {label}
    </div>
  );
}
