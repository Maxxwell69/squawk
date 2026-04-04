"use client";

import { useEffect, useState } from "react";
import type { BattleBoardDef } from "@/lib/battle-board-slugs";

type Props = {
  def: BattleBoardDef;
};

export function BattleBoardFrame({ def }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [tipsUrl, setTipsUrl] = useState<string | null>(null);
  const [graphicReady, setGraphicReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBannerUrl(null);
    setTipsUrl(null);
    setGraphicReady(false);
    const q = new URLSearchParams({ slug: def.slug });
    fetch(`/api/battle-board-graphic?${q}`)
      .then(
        (r) =>
          r.json() as Promise<{
            banner?: string | null;
            tips?: string | null;
          }>
      )
      .then((d) => {
        if (cancelled) return;
        if (d.banner) setBannerUrl(d.banner);
        if (d.tips) setTipsUrl(d.tips);
      })
      .catch(() => {
        /* folder missing etc. */
      })
      .finally(() => {
        if (!cancelled) setGraphicReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [def.slug]);

  const frameStyle = {
    width: "min(100vw, calc(100dvh * 9 / 16))",
    height: "min(100dvh, calc(100vw * 16 / 9))",
  } as const;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black">
      <div
        className="relative overflow-hidden bg-black text-parchment shadow-none"
        style={frameStyle}
      >
        {/* Banner: full 9:16 canvas — image scales to fill width & height (letterbox if needed) */}
        <div className="absolute inset-0 flex items-start justify-center">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- /public via API
            <img
              src={bannerUrl}
              alt=""
              className="h-full w-full object-contain object-top"
            />
          ) : graphicReady ? (
            <p className="px-3 pt-[12%] text-center font-display text-xs font-bold uppercase tracking-[0.14em] text-white/45 sm:text-sm">
              {def.label}
            </p>
          ) : (
            <span className="sr-only">Loading…</span>
          )}
        </div>

        {/* Tips: left rail, high on the frame (over main banner lower area is OK) */}
        <div className="pointer-events-none absolute left-0 top-[6%] z-10 w-[min(54%,18rem)] max-h-[min(52dvh,56%)] px-2">
          <div className="pointer-events-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
            {tipsUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tipsUrl}
                alt=""
                className="max-h-[min(50dvh,54%)] w-full object-contain object-left-top"
              />
            ) : graphicReady ? (
              <>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90 drop-shadow-md">
                  Tips
                </p>
                <ul className="mt-1.5 space-y-1.5 font-body text-[11px] leading-snug text-white/90 sm:text-xs">
                  {def.instructions.map((line) => (
                    <li
                      key={line}
                      className="border-l-2 border-amber-500/50 bg-black/35 pl-2 backdrop-blur-[2px]"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
