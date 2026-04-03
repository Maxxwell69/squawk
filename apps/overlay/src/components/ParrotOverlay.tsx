"use client";

import { useEffect, useState } from "react";
import type { ParrotState } from "@captain-squawks/shared";
import { getClientWsUrl } from "@/lib/bridge-urls";
import { useParrotBridge } from "@/hooks/useParrotBridge";
import { AudioUnlockButton } from "@/components/AudioUnlockButton";
import { ParrotMedia } from "@/components/ParrotMedia";
import { ParrotSpeechBubble } from "@/components/ParrotSpeechBubble";

const PARROT_SCENE_CLASS =
  "h-auto max-h-[min(85vh,520px)] w-[min(90vw,280px)] max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

const BADGE: Record<ParrotState, string> = {
  idle: "IDLE",
  talking: "TALKING",
  hype: "HYPE",
  chaos: "CHAOS",
  exit: "EXIT",
  away: "AWAY",
  return: "RETURN",
  peck: "PECK",
  hello_wave: "HELLO",
  dancing_squawk: "DANCE",
  feeding_time: "FEED",
};

function stateClasses(state: ParrotState): string {
  switch (state) {
    case "talking":
    case "hello_wave":
    case "feeding_time":
    case "dancing_squawk":
      return "animate-squawk-bob";
    case "hype":
      return "animate-hype-pulse";
    case "chaos":
      return "animate-chaos-shake";
    case "idle":
    default:
      return "";
  }
}

/** No panel / rings — subtle motion only for stream compositing */
function parrotOnlyStateClasses(state: ParrotState): string {
  switch (state) {
    case "talking":
    case "hello_wave":
    case "feeding_time":
    case "dancing_squawk":
      return "animate-squawk-bob";
    case "hype":
      return "animate-hype-pulse";
    case "chaos":
      return "animate-chaos-shake";
    case "idle":
    default:
      return "";
  }
}

export type ParrotOverlayVariant =
  | "widget"
  /** Parrot + comic bubble to the right of the head (transparent canvas). */
  | "parrot-with-bubble"
  /** Parrot only; subtitle as plain text under the bird (no bubble). */
  | "parrot-only";

type Props = {
  variant?: ParrotOverlayVariant;
};

export function ParrotOverlay({ variant = "widget" }: Props) {
  const {
    connected,
    state,
    subtitle,
    requestAudioUnlock,
    showAudioUnlockButton,
  } = useParrotBridge();
  const parrotOnly = variant === "parrot-only";
  const parrotWithBubble = variant === "parrot-with-bubble";

  const [wsUrlHint, setWsUrlHint] = useState("");
  useEffect(() => {
    setWsUrlHint(getClientWsUrl());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("overlay-transparent");
    document.body.classList.add("overlay-transparent");
    return () => {
      root.classList.remove("overlay-transparent");
      document.body.classList.remove("overlay-transparent");
    };
  }, []);

  if (parrotWithBubble) {
    return (
      <div
        className="relative flex min-h-0 w-full flex-col items-stretch justify-center bg-transparent p-2"
        data-state={state}
        data-variant="parrot-with-bubble"
        data-connected={connected ? "1" : "0"}
      >
        <div
          className="pointer-events-none absolute right-3 top-1 z-20"
          title={wsUrlHint || "WebSocket URL (bridge)"}
        >
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
        <AudioUnlockButton
          visible={showAudioUnlockButton}
          onUnlock={requestAudioUnlock}
        />
        <div className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-start gap-2 pl-1 pr-2">
          <div
            className={`relative shrink-0 transition-all duration-300 ${parrotOnlyStateClasses(state)}`}
          >
            <ParrotMedia state={state} className={PARROT_SCENE_CLASS} />
          </div>
          <div className="flex max-w-[min(90vw,280px)] shrink-0 flex-col items-stretch self-center">
            {subtitle ? (
              <ParrotSpeechBubble>{subtitle}</ParrotSpeechBubble>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (parrotOnly) {
    return (
      <div
        className="relative flex min-h-0 w-full flex-col items-center justify-center bg-transparent p-2"
        data-state={state}
        data-variant="parrot-only"
        data-connected={connected ? "1" : "0"}
      >
        <div
          className="pointer-events-none absolute right-3 top-1 z-20"
          title={wsUrlHint || "WebSocket URL (bridge)"}
        >
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
        <AudioUnlockButton
          visible={showAudioUnlockButton}
          onUnlock={requestAudioUnlock}
        />
        <div
          className={`relative inline-block transition-all duration-300 ${parrotOnlyStateClasses(state)}`}
        >
          <ParrotMedia state={state} className={PARROT_SCENE_CLASS} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-0 w-full bg-transparent p-4 text-squawk-ink"
      data-state={state}
      data-connected={connected ? "1" : "0"}
    >
      <AudioUnlockButton
        visible={showAudioUnlockButton}
        onUnlock={requestAudioUnlock}
      />
      <div className="mx-auto flex max-w-[320px] flex-col gap-3">
        <div
          className={`relative overflow-hidden rounded-2xl border border-parchment-dark/50 bg-gradient-to-b from-parchment/95 to-parchment/85 transition-all duration-500 ${stateClasses(state)}`}
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
            <div className="speech-bubble relative inline-block rounded-2xl border border-black/10 bg-white/30 px-3 py-1 text-center font-display text-[11px] font-semibold uppercase tracking-wide text-squawk-ink/80">
              Captain Squawks
            </div>
          </div>

          <div className="flex justify-center px-4 pb-2 pt-1">
            <div className="relative aspect-square w-[200px] max-w-full">
              <ParrotMedia
                state={state}
                className="h-full w-full object-contain drop-shadow-lg"
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
            <p className="min-h-[3rem] rounded-lg border border-black/10 bg-white/40 px-3 py-2 font-body text-sm leading-snug text-squawk-ink">
              {subtitle ? subtitle : state === "idle" ? "…" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
