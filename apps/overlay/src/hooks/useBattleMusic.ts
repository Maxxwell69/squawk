"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";
import {
  BATTLE_DEFEAT_TRACKS,
  BATTLE_PHASE_TRACKS,
  BATTLE_VICTORY_TRACKS,
  phaseIndexFromElapsed,
} from "@/lib/battle-music-tracks";

export type BattleMatchStatus =
  | "idle"
  | "running"
  | "awaiting_result"
  | "victory_party"
  | "defeat";

export type BattleMusicOptions = {
  volume01?: number;
  muted?: boolean;
};

type Ctx = {
  matchStatus: BattleMatchStatus;
  elapsedSec: number;
  volume01: number;
  muted: boolean;
};

const FADE_OUT_MS = 750;
const FADE_IN_MS = 900;

function tracksForContext(ctx: Ctx): readonly string[] {
  if (ctx.matchStatus === "running") {
    const phase = phaseIndexFromElapsed(ctx.elapsedSec);
    return BATTLE_PHASE_TRACKS[phase] ?? BATTLE_PHASE_TRACKS[1]!;
  }
  if (ctx.matchStatus === "victory_party") return BATTLE_VICTORY_TRACKS;
  if (ctx.matchStatus === "defeat") return BATTLE_DEFEAT_TRACKS;
  return [];
}

function baseGainForContext(ctx: Ctx): number {
  if (ctx.matchStatus === "running") return 0.42;
  if (ctx.matchStatus === "victory_party") return 0.48;
  if (ctx.matchStatus === "defeat") return 0.28;
  return 0;
}

function targetLinearVolume(ctx: Ctx): number {
  if (ctx.muted) return 0;
  const b = baseGainForContext(ctx);
  if (b <= 0) return 0;
  return Math.min(1, b * ctx.volume01);
}

function ctxKey(ctx: Ctx): string {
  if (ctx.matchStatus === "running") {
    return `running:${phaseIndexFromElapsed(ctx.elapsedSec)}`;
  }
  return ctx.matchStatus;
}

function rampVolume(
  a: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  gen: number,
  genRef: MutableRefObject<number>,
  onDone: () => void
) {
  const t0 = performance.now();
  const step = (now: number) => {
    if (gen !== genRef.current) return;
    const u = Math.min(1, (now - t0) / durationMs);
    a.volume = from + (to - from) * u;
    if (u < 1) requestAnimationFrame(step);
    else onDone();
  };
  requestAnimationFrame(step);
}

function loadAndPlayFromUrls(
  a: HTMLAudioElement,
  urls: readonly string[],
  startVolume: number,
  onPlaying: () => void
): void {
  const tryAt = (index: number) => {
    if (index >= urls.length) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[battle-music] No file loaded. Add MP3s under public/battle/music/ (see README)."
        );
      }
      return;
    }
    const url = urls[index]!;
    a.onerror = () => tryAt(index + 1);
    a.pause();
    a.src = url;
    a.loop = true;
    a.currentTime = 0;
    a.muted = false;
    a.volume = startVolume;
    void a
      .play()
      .then(() => onPlaying())
      .catch(() => tryAt(index + 1));
  };
  tryAt(0);
}

/**
 * Battle background music. Uses `<audio playsinline>` for mobile Safari.
 * Call `primePlayback()` synchronously in the **Start match** click handler (same
 * stack as the gesture) so autoplay is allowed.
 */
export function useBattleMusic(
  matchStatus: BattleMatchStatus,
  elapsedSec: number,
  opts?: BattleMusicOptions
): { primePlayback: () => void } {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKeyRef = useRef<string>("");
  const fadeGenRef = useRef(0);
  const transitioningRef = useRef(false);
  const prevMatchStatusRef = useRef<BattleMatchStatus | null>(null);
  const volume01 = Math.min(1, Math.max(0, opts?.volume01 ?? 0.75));
  const muted = opts?.muted ?? false;

  const bumpFadeGen = useCallback(() => {
    fadeGenRef.current += 1;
    return fadeGenRef.current;
  }, []);

  const stopAfterFade = useCallback(
    (a: HTMLAudioElement) => {
      if (!a.currentSrc) {
        lastKeyRef.current = "";
        transitioningRef.current = false;
        return;
      }
      const gen = bumpFadeGen();
      transitioningRef.current = true;
      const from = a.volume;
      rampVolume(a, from, 0, FADE_OUT_MS, gen, fadeGenRef, () => {
        if (gen !== fadeGenRef.current) return;
        a.pause();
        a.removeAttribute("src");
        a.load();
        transitioningRef.current = false;
        lastKeyRef.current = "";
      });
    },
    [bumpFadeGen]
  );

  const crossfadeToKey = useCallback(
    (ctx: Ctx, key: string, urls: readonly string[]) => {
      const a = audioRef.current;
      if (!a || urls.length === 0) return;

      const gen = bumpFadeGen();
      transitioningRef.current = true;
      const targetVol = targetLinearVolume(ctx);
      const fromVol = a.volume;

      const afterOut = () => {
        if (gen !== fadeGenRef.current) return;
        loadAndPlayFromUrls(a, urls, 0, () => {
          if (gen !== fadeGenRef.current) return;
          lastKeyRef.current = key;
          rampVolume(
            a,
            0,
            targetVol,
            FADE_IN_MS,
            gen,
            fadeGenRef,
            () => {
              if (gen !== fadeGenRef.current) return;
              transitioningRef.current = false;
            }
          );
        });
      };

      const hasTrack = Boolean(a.currentSrc);
      if (fromVol <= 0.02 && !hasTrack) {
        afterOut();
        return;
      }

      rampVolume(a, fromVol, 0, FADE_OUT_MS, gen, fadeGenRef, afterOut);
    },
    [bumpFadeGen]
  );

  const primePlayback = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const ctx: Ctx = {
      matchStatus: "running",
      elapsedSec: 0,
      volume01,
      muted,
    };
    const urls = tracksForContext(ctx);
    if (urls.length === 0) return;
    const key = ctxKey(ctx);
    const gen = bumpFadeGen();
    transitioningRef.current = true;
    lastKeyRef.current = "";
    const tv = targetLinearVolume(ctx);
    loadAndPlayFromUrls(a, urls, 0, () => {
      rampVolume(a, 0, tv, FADE_IN_MS, gen, fadeGenRef, () => {
        if (gen !== fadeGenRef.current) return;
        transitioningRef.current = false;
        lastKeyRef.current = key;
      });
    });
  }, [volume01, muted, bumpFadeGen]);

  useEffect(() => {
    const a = document.createElement("audio");
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
    a.preload = "auto";
    a.loop = true;
    a.style.position = "fixed";
    a.style.left = "-9999px";
    a.style.width = "1px";
    a.style.height = "1px";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    audioRef.current = a;
    return () => {
      bumpFadeGen();
      a.pause();
      a.removeAttribute("src");
      a.load();
      a.remove();
      audioRef.current = null;
      lastKeyRef.current = "";
      transitioningRef.current = false;
    };
  }, [bumpFadeGen]);

  useEffect(() => {
    const ctx: Ctx = {
      matchStatus,
      elapsedSec,
      volume01,
      muted,
    };

    const a = audioRef.current;
    if (!a) return;

    const prevStatus = prevMatchStatusRef.current;
    prevMatchStatusRef.current = matchStatus;

    const wasAudible =
      prevStatus === "running" ||
      prevStatus === "victory_party" ||
      prevStatus === "defeat";
    const nowSilent =
      matchStatus === "idle" || matchStatus === "awaiting_result";
    const enteredSilence = wasAudible && nowSilent;

    if (ctx.matchStatus === "idle" || ctx.matchStatus === "awaiting_result") {
      if (!a.currentSrc && lastKeyRef.current === "") return;
      if (enteredSilence) stopAfterFade(a);
      return;
    }

    if (ctx.matchStatus === "running" && ctx.elapsedSec === 0) {
      return;
    }

    const key = ctxKey(ctx);
    const urls = tracksForContext(ctx);
    if (urls.length === 0) return;

    if (key === lastKeyRef.current) {
      a.volume = targetLinearVolume(ctx);
      a.muted = false;
      return;
    }

    crossfadeToKey(ctx, key, urls);
  }, [matchStatus, elapsedSec, volume01, muted, crossfadeToKey, stopAfterFade]);

  return { primePlayback };
}
