"use client";

import { useEffect, useRef } from "react";

export type BattleMatchStatus =
  | "idle"
  | "running"
  | "awaiting_result"
  | "victory_party"
  | "defeat";

export type BattleMusicOptions = {
  /** User master level 0–1 (multiplied per track). Default 0.75 */
  volume01?: number;
  /** Mutes output but keeps the volume slider value for when you unmute */
  muted?: boolean;
};

/**
 * Background music for the battle board. Expects files under `/battle/music/` (see public README).
 * Missing files fail silently (onerror).
 */
export function useBattleMusic(
  matchStatus: BattleMatchStatus,
  elapsedSec: number,
  opts?: BattleMusicOptions
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volume01 = Math.min(1, Math.max(0, opts?.volume01 ?? 0.75));
  const muted = opts?.muted ?? false;

  useEffect(() => {
    const a = new Audio();
    a.loop = true;
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      a.pause();
      a.removeAttribute("src");
      a.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const applyLevels = (baseGain: number) => {
      a.volume = Math.min(1, baseGain * volume01);
      a.muted = muted;
    };

    const playUrl = (path: string, baseGain: number) => {
      try {
        const abs = new URL(path, window.location.origin).href;
        if (a.src === abs) {
          applyLevels(baseGain);
          if (a.paused) void a.play().catch(() => {});
          return;
        }
        a.pause();
        a.src = path;
        a.currentTime = 0;
        applyLevels(baseGain);
        a.onerror = () => {
          a.pause();
          a.removeAttribute("src");
          a.load();
        };
        void a.play().catch(() => {});
      } catch {
        /* ignore */
      }
    };

    const stop = () => {
      a.pause();
      a.removeAttribute("src");
      a.load();
    };

    if (matchStatus === "running") {
      const phase = Math.min(5, Math.floor(elapsedSec / 60) + 1);
      playUrl(`/battle/music/phase${phase}.mp3`, 0.42);
      return;
    }
    if (matchStatus === "victory_party") {
      playUrl("/battle/music/victory.mp3", 0.48);
      return;
    }
    if (matchStatus === "defeat") {
      playUrl("/battle/music/defeat.mp3", 0.28);
      return;
    }
    stop();
  }, [matchStatus, elapsedSec, volume01, muted]);
}
