"use client";

import { useEffect, useRef } from "react";
import type { ParrotState } from "@captain-squawks/shared";
import { PARROT_WEBM_PATH } from "@/lib/parrot-media";
import { useParrotBridge } from "@/hooks/useParrotBridge";

const BADGE: Record<ParrotState, string> = {
  idle: "IDLE",
  talking: "TALKING",
  hype: "HYPE",
  chaos: "CHAOS",
};

function stateClasses(state: ParrotState): string {
  switch (state) {
    case "talking":
      return "animate-squawk-bob ring-2 ring-squawk-gold/50";
    case "hype":
      return "animate-hype-pulse ring-2 ring-squawk-gold/70";
    case "chaos":
      return "animate-chaos-shake ring-2 ring-squawk-rust/80";
    case "idle":
    default:
      return "";
  }
}

export function ParrotOverlay() {
  const { connected, state, subtitle } = useParrotBridge();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      /* autoplay policies */
    });
  }, []);

  /** OBS: pin transparent html/body without a separate route layout (avoids Next 15 dev RSC/devtools bugs). */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("overlay-transparent");
    document.body.classList.add("overlay-transparent");
    return () => {
      root.classList.remove("overlay-transparent");
      document.body.classList.remove("overlay-transparent");
    };
  }, []);

  return (
    <div
      className="min-h-0 w-full bg-transparent p-4 text-squawk-ink"
      data-state={state}
      data-connected={connected ? "1" : "0"}
    >
      <div className="mx-auto flex max-w-[320px] flex-col gap-3">
        <div
          className={`relative overflow-hidden rounded-2xl border-2 border-parchment-dark/80 bg-gradient-to-b from-parchment/95 to-parchment/85 shadow-panel transition-all duration-500 ${stateClasses(state)}`}
        >
          <div className="absolute right-2 top-2 z-10">
            <span
              className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold tracking-widest ${
                connected
                  ? "bg-emerald-700/90 text-emerald-100"
                  : "bg-red-900/80 text-red-100"
              }`}
            >
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          <div className="relative flex justify-center bg-gradient-to-b from-squawk-sea/25 to-transparent px-3 pt-4">
            <div className="speech-bubble relative inline-block rounded-2xl border border-black/10 bg-white/30 px-3 py-1 text-center font-display text-[11px] font-semibold uppercase tracking-wide text-squawk-ink/80 shadow-inner">
              Captain Squawks
            </div>
          </div>

          <div className="flex justify-center px-4 pb-2 pt-1">
            <div className="relative aspect-square w-[200px] max-w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-contain drop-shadow-lg"
                src={PARROT_WEBM_PATH}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>

          <div className="border-t border-black/10 bg-black/5 px-3 py-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <span className="font-display text-[10px] font-bold tracking-[0.2em] text-squawk-sea/90">
                STATUS
              </span>
              <span className="rounded-md bg-squawk-ink/90 px-2 py-0.5 font-display text-[10px] font-bold tracking-widest text-parchment">
                {BADGE[state]}
              </span>
            </div>
            <p className="min-h-[3rem] rounded-lg border border-black/10 bg-white/40 px-3 py-2 font-body text-sm leading-snug text-squawk-ink shadow-inner">
              {subtitle || "…"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
