import type { ReactNode } from "react";

/** Matches `PARROT_SCENE_CLASS` max width so the bubble stays ~parrot-wide, not full row. */
const BUBBLE_MAX = "max-w-[min(90vw,280px)]";

type Props = {
  /** Line shown inside the bubble (subtitle from bridge) */
  children: ReactNode;
  className?: string;
};

/**
 * Speech bubble to the right of the parrot — white fill, black text, width ~bird size.
 */
export function ParrotSpeechBubble({ children, className = "" }: Props) {
  return (
    <div
      className={`relative flex w-fit ${BUBBLE_MAX} min-h-[3.25rem] items-center ${className}`.trim()}
    >
      <div
        className="absolute -left-1.5 top-[38%] z-0 h-3.5 w-3.5 -translate-y-1/2 rotate-45 rounded-[2px] border-b border-l border-black/20 bg-white"
        aria-hidden
      />
      <div className="relative z-10 w-full min-w-0 rounded-2xl border border-black/15 bg-white px-3.5 py-2.5 shadow-sm">
        <p className="break-words font-body text-[13px] leading-snug text-black">
          {children}
        </p>
      </div>
    </div>
  );
}
