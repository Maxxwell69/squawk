"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "captain-squawks-audio-unlocked";

/**
 * Browsers block audio until a user gesture. Call `requestAudioUnlock` from a button click.
 */
export function useAudioUnlock() {
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        setAudioUnlocked(localStorage.getItem(STORAGE_KEY) === "1");
      }
    } catch {
      /* private mode */
    }
  }, []);

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

  return { audioUnlocked, requestAudioUnlock };
}
