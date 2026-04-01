"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const v = videoRef.current;
    if (!v || isGifPath(src)) return;
    void v.play().catch(() => {
      /* autoplay policies */
    });
  }, [src]);

  if (isGifPath(src)) {
    return (
      <img
        key={src}
        src={src}
        alt=""
        className={className}
        draggable={false}
      />
    );
  }

  return (
    <video
      key={src}
      ref={videoRef}
      className={className}
      src={src}
      autoPlay
      loop
      muted
      playsInline
    />
  );
}
