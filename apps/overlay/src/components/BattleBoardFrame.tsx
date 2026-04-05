"use client";

import { useEffect, useState } from "react";
import { BATTLE_BOARD_LAYOUT } from "@/lib/battle-board-layout";
import type { BattleBoardDef } from "@/lib/battle-board-slugs";

type Props = {
  def: BattleBoardDef;
  /**
   * No black matte behind the 9:16 frame; sets `overlay-transparent` on
   * `html`/`body` for OBS. Use URL `?transparent=1` on the display page.
   */
  transparentChrome?: boolean;
};

export function BattleBoardFrame({
  def,
  transparentChrome = false,
}: Props) {
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

  useEffect(() => {
    if (!transparentChrome || typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("overlay-transparent");
    document.body.classList.add("overlay-transparent");
    return () => {
      root.classList.remove("overlay-transparent");
      document.body.classList.remove("overlay-transparent");
    };
  }, [transparentChrome]);

  const frameStyle = {
    width: "min(100vw, calc(100dvh * 9 / 16))",
    height: "min(100dvh, calc(100vw * 16 / 9))",
  } as const;

  const matte = transparentChrome ? "bg-transparent" : "bg-black";

  return (
    <div
      className={`flex min-h-dvh w-full items-center justify-center ${matte}`}
    >
      <div
        className={`relative overflow-hidden text-parchment shadow-none ${matte}`}
        style={frameStyle}
      >
        {/*
          Two slots (match guides in your art): top banner strip = full width;
          tips = lower-left rectangle (e.g. red outline in mockups).
          Edit `battle-board-layout.ts` to nudge positions per scene pack.
        */}
        <div
          className="absolute inset-x-0 top-0 flex items-start justify-center"
          style={{
            height: BATTLE_BOARD_LAYOUT.bannerSlotHeight,
            minHeight: BATTLE_BOARD_LAYOUT.bannerMinHeight,
          }}
        >
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- /public via API
            <img
              src={bannerUrl}
              alt=""
              className="h-full w-full object-contain object-top"
            />
          ) : graphicReady ? (
            <p className="px-3 pt-4 text-center font-display text-xs font-bold uppercase tracking-[0.14em] text-white/45 sm:text-sm">
              {def.label}
            </p>
          ) : (
            <span className="sr-only">Loading…</span>
          )}
        </div>

        <div
          className="pointer-events-none absolute z-10 px-1"
          style={{
            left: BATTLE_BOARD_LAYOUT.tipsLeft,
            top: BATTLE_BOARD_LAYOUT.tipsTop,
            width: BATTLE_BOARD_LAYOUT.tipsWidth,
            maxHeight: BATTLE_BOARD_LAYOUT.tipsMaxHeight,
          }}
        >
          <div className="pointer-events-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
            {tipsUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tipsUrl}
                alt=""
                className="w-full object-contain object-left-top"
                style={{
                  maxHeight: BATTLE_BOARD_LAYOUT.tipsMaxHeight,
                }}
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
