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

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black">
      <div
        className="flex flex-col bg-black text-parchment shadow-none"
        style={{
          width: "min(100vw, calc(100dvh * 9 / 16))",
          height: "min(100dvh, calc(100vw * 16 / 9))",
        }}
      >
        {/* Banner: full width, top, as large as fits */}
        <div className="flex w-full shrink-0 justify-center px-1 pt-2 pb-1">
          <div className="flex w-full max-h-[min(52dvh,55%)] min-h-[3rem] items-start justify-center">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- /public via API
              <img
                src={bannerUrl}
                alt=""
                className="h-auto w-full max-h-[min(52dvh,55%)] object-contain object-top"
              />
            ) : graphicReady ? (
              <p className="px-2 pt-2 text-center font-display text-xs font-bold uppercase tracking-[0.14em] text-white/45 sm:text-sm">
                {def.label}
              </p>
            ) : (
              <span className="sr-only">Loading…</span>
            )}
          </div>
        </div>

        {/* Tips graphic: left, slightly below banner; text fallback if no tips image */}
        <div className="flex min-h-0 flex-1 flex-row items-start gap-3 px-3 pb-5 pt-2">
          <div className="w-[min(46%,14rem)] shrink-0">
            {tipsUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tipsUrl}
                alt=""
                className="w-full max-h-[min(38dvh,42%)] object-contain object-left-top"
              />
            ) : graphicReady ? (
              <>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90">
                  Tips
                </p>
                <ul className="mt-2 space-y-2 font-body text-[11px] leading-snug text-white/80 sm:text-xs">
                  {def.instructions.map((line) => (
                    <li key={line} className="border-l border-amber-600/40 pl-2">
                      {line}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 bg-transparent" aria-hidden />
        </div>
      </div>
    </div>
  );
}
