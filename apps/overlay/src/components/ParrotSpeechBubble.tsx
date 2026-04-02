import type { ReactNode } from "react";

type Props = {
  /** Line shown inside the bubble (subtitle from bridge) */
  children: ReactNode;
  className?: string;
};

/**
 * Comic-style speech bubble to the right of the parrot, tail points left toward the bird.
 */
export function ParrotSpeechBubble({ children, className = "" }: Props) {
  return (
    <div
      className={`relative flex min-h-[3.25rem] items-center ${className}`.trim()}
    >
      {/* Tail — diamond overlapping parrot side */}
      <div
        className="absolute -left-1.5 top-[38%] z-0 h-3.5 w-3.5 -translate-y-1/2 rotate-45 rounded-[2px] border-b-2 border-l-2 border-parchment-dark/80 bg-gradient-to-br from-parchment to-parchment-dark/25 shadow-[-2px_2px_6px_rgba(0,0,0,0.12)]"
        aria-hidden
      />
      <div className="relative z-10 w-full rounded-2xl border-2 border-parchment-dark/80 bg-gradient-to-br from-parchment/98 via-parchment/95 to-parchment-dark/20 px-3.5 py-2.5 shadow-[0_10px_32px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.35)]">
        <p className="font-body text-[13px] leading-snug text-squawk-ink [text-shadow:0_1px_0_rgba(255,255,255,0.4)]">
          {children}
        </p>
      </div>
    </div>
  );
}
