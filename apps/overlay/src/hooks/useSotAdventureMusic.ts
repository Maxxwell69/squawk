"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BASE_GAIN = 0.46;

function randomStartIndex(len: number): number {
  if (len <= 0) return 0;
  return Math.floor(Math.random() * len);
}

export type SotAdventureMusicTrack = {
  name: string;
  url: string;
};

export type UseSotAdventureMusicOpts = {
  volume01: number;
  muted: boolean;
  tracks: readonly SotAdventureMusicTrack[];
};

/**
 * Sequential playlist: random starting track, then plays through the sorted list
 * until the end. No loop. Call `startPlaylistFromRandom` from a click (automation
 * Start) for autoplay policy; call `stopPlaylist` on Finish or when switching.
 */
export function useSotAdventureMusic(opts: UseSotAdventureMusicOpts): {
  nowPlaying: string | null;
  playlistRunning: boolean;
  startPlaylistFromRandom: () => void;
  stopPlaylist: () => void;
} {
  const { volume01, muted, tracks } = opts;
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stoppedRef = useRef(true);
  const targetVolumeRef = useRef(0);

  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [playlistRunning, setPlaylistRunning] = useState(false);

  const targetVolume = muted ? 0 : Math.min(1, BASE_GAIN * volume01);
  targetVolumeRef.current = targetVolume;

  const stopPlaylist = useCallback(() => {
    stoppedRef.current = true;
    const a = audioRef.current;
    if (!a) {
      setNowPlaying(null);
      setPlaylistRunning(false);
      return;
    }
    a.onended = null;
    a.onerror = null;
    a.pause();
    a.removeAttribute("src");
    a.load();
    setNowPlaying(null);
    setPlaylistRunning(false);
  }, []);

  useEffect(() => {
    const a = document.createElement("audio");
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
    a.preload = "auto";
    a.loop = false;
    a.style.position = "fixed";
    a.style.left = "-9999px";
    a.style.width = "1px";
    a.style.height = "1px";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    audioRef.current = a;
    return () => {
      stopPlaylist();
      a.remove();
      audioRef.current = null;
    };
  }, [stopPlaylist]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || stoppedRef.current) return;
    a.volume = targetVolume;
  }, [targetVolume]);

  const startPlaylistFromRandom = useCallback(() => {
    const list = tracksRef.current;
    if (list.length === 0) return;

    const a = audioRef.current;
    if (!a) return;

    stopPlaylist();
    stoppedRef.current = false;
    setPlaylistRunning(true);

    const n = list.length;
    const start = randomStartIndex(n);
    let idx = start;

    const playOne = () => {
      if (stoppedRef.current) return;
      if (idx >= n) {
        stoppedRef.current = true;
        setNowPlaying(null);
        setPlaylistRunning(false);
        return;
      }
      const t = list[idx]!;
      idx += 1;
      a.onerror = () => {
        if (stoppedRef.current) return;
        playOne();
      };
      a.onended = () => {
        if (stoppedRef.current) return;
        playOne();
      };
      a.pause();
      a.src = t.url;
      a.volume = targetVolumeRef.current;
      setNowPlaying(t.name);
      void a.play().catch(() => {
        if (stoppedRef.current) return;
        playOne();
      });
    };

    playOne();
  }, [stopPlaylist]);

  return {
    nowPlaying,
    playlistRunning,
    startPlaylistFromRandom,
    stopPlaylist,
  };
}
