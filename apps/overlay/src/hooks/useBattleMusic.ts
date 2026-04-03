"use client";

import { useCallback, useEffect, useRef } from "react";
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

function tracksForContext(ctx: Ctx): readonly string[] {
  if (ctx.matchStatus === "running") {
    const phase = phaseIndexFromElapsed(ctx.elapsedSec);
    return BATTLE_PHASE_TRACKS[phase] ?? BATTLE_PHASE_TRACKS[1]!;
  }
  if (ctx.matchStatus === "victory_party") return BATTLE_VICTORY_TRACKS;
  if (ctx.matchStatus === "defeat") return BATTLE_DEFEAT_TRACKS;
  return [];
}

function applyLevels(
  a: HTMLAudioElement,
  baseGain: number,
  volume01: number,
  muted: boolean
) {
  a.volume = Math.min(1, baseGain * volume01);
  a.muted = muted;
}

function baseGainForContext(ctx: Ctx): number {
  if (ctx.matchStatus === "running") return 0.42;
  if (ctx.matchStatus === "victory_party") return 0.48;
  if (ctx.matchStatus === "defeat") return 0.28;
  return 0;
}

function loadAndPlay(
  a: HTMLAudioElement,
  urls: readonly string[],
  ctx: Ctx,
  base: number
) {
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
    applyLevels(a, base, ctx.volume01, ctx.muted);
    void a.play().catch(() => tryAt(index + 1));
  };
  tryAt(0);
}

function ctxKey(ctx: Ctx): string {
  if (ctx.matchStatus === "running") {
    return `running:${phaseIndexFromElapsed(ctx.elapsedSec)}`;
  }
  return ctx.matchStatus;
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
  const volume01 = Math.min(1, Math.max(0, opts?.volume01 ?? 0.75));
  const muted = opts?.muted ?? false;

  const primePlayback = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const ctx: Ctx = {
      matchStatus: "running",
      elapsedSec: 0,
      volume01,
      muted,
    };
    lastKeyRef.current = "";
    const urls = tracksForContext(ctx);
    if (urls.length === 0) return;
    loadAndPlay(a, urls, ctx, baseGainForContext(ctx));
    lastKeyRef.current = ctxKey(ctx);
  }, [volume01, muted]);

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
      a.pause();
      a.removeAttribute("src");
      a.load();
      a.remove();
      audioRef.current = null;
      lastKeyRef.current = "";
    };
  }, []);

  useEffect(() => {
    const ctx: Ctx = {
      matchStatus,
      elapsedSec,
      volume01,
      muted,
    };

    if (ctx.matchStatus === "idle" || ctx.matchStatus === "awaiting_result") {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.removeAttribute("src");
        a.load();
      }
      lastKeyRef.current = "";
      return;
    }

    if (ctx.matchStatus === "running" && ctx.elapsedSec === 0) {
      return;
    }

    const key = ctxKey(ctx);
    const a = audioRef.current;
    if (!a) return;

    if (key === lastKeyRef.current) {
      applyLevels(a, baseGainForContext(ctx), ctx.volume01, ctx.muted);
      return;
    }

    lastKeyRef.current = key;
    const urls = tracksForContext(ctx);
    if (urls.length === 0) return;
    loadAndPlay(a, urls, ctx, baseGainForContext(ctx));
  }, [matchStatus, elapsedSec, volume01, muted]);

  return { primePlayback };
}
