"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ParrotState } from "@captain-squawks/shared";
import { isGifPath, parrotMediaUrl } from "@/lib/parrot-media";

type Props = {
  state: ParrotState;
  className?: string;
};

/**
 * One looping visual per state — WEBM (`<video>`) or GIF (`<img>`).
 * Swap files in `public/parrot/` and edit `PARROT_ASSETS` in `parrot-media.ts`.
 */
export function ParrotMedia({ state, className }: Props) {
  const src = parrotMediaUrl(state);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldLoop =
    state === "idle" ||
    state === "talking" ||
    state === "hype" ||
    state === "chaos" ||
    state === "hello_wave" ||
    state === "dancing_squawk" ||
    state === "feeding_time";
  const shouldMirror = false;
  const mirrorStyle: CSSProperties | undefined = shouldMirror
    ? { transform: "scaleX(-1)" }
    : undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || isGifPath(src)) return;
    v.muted = true;
    v.defaultMuted = true;
    try {
      v.load();
    } catch {
      /* ignore */
    }
    const tryPlay = () => {
      void v.play().catch(() => {
        /* autoplay policies */
      });
    };
    tryPlay();
    const raf = requestAnimationFrame(() => tryPlay());
    const onReady = () => tryPlay();
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("canplay", onReady);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("canplay", onReady);
    };
  }, [src, state]);

  if (state === "away") return null;

  if (isGifPath(src)) {
    return (
      <img
        key={src}
        src={src}
        alt=""
        className={className}
        style={mirrorStyle}
        draggable={false}
      />
    );
  }

  return (
    <video
      key={`${state}:${src}`}
      ref={videoRef}
      className={className}
      src={src}
      autoPlay
      loop={shouldLoop}
      style={mirrorStyle}
      muted
      playsInline
      preload="auto"
    />
  );
}
