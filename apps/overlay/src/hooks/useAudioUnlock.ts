"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "captain-squawks-audio-unlocked";

/**
 * Browsers block audio until a user gesture. Call `requestAudioUnlock` from a button click.
 */
export function useAudioUnlock() {
  const requestAudioUnlock = useCallback(async () => {
    try {
      const ctx = new AudioContext();
      await ctx.resume();
      await ctx.close();
    } catch {
      /* still mark unlocked so we try <audio> playback */
    }
    setAudioUnlocked(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const [audioUnlocked, setAudioUnlocked] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const autoUnlock = async () => {
      try {
        if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
          if (!cancelled) setAudioUnlocked(true);
          return;
        }
      } catch {
        /* private mode */
      }

      try {
        await requestAudioUnlock();
        if (!cancelled) setAudioUnlocked(true);
      } catch {
        if (!cancelled) setAudioUnlocked(false);
      }
    };
    void autoUnlock();

    const onFirstGesture = () => {
      void requestAudioUnlock();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    window.addEventListener("touchstart", onFirstGesture, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };
  }, [requestAudioUnlock]);

  return { audioUnlocked, requestAudioUnlock };
}
