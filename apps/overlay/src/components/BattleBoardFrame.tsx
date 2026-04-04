"use client";

import { useEffect, useState } from "react";
import type { BattleBoardDef } from "@/lib/battle-board-slugs";

type Props = {
  def: BattleBoardDef;
};

export function BattleBoardFrame({ def }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [graphicReady, setGraphicReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImgSrc(null);
    setGraphicReady(false);
    const q = new URLSearchParams({ slug: def.slug });
    fetch(`/api/battle-board-graphic?${q}`)
      .then((r) => r.json() as Promise<{ url?: string | null }>)
      .then((d) => {
        if (!cancelled && d.url) setImgSrc(d.url);
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
        <header className="flex shrink-0 flex-col items-center justify-start px-3 pt-4 pb-2">
          <div className="flex min-h-[4rem] max-h-[min(42dvh,38%)] w-full items-center justify-center">
            {imgSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- resolved from /public via API
              <img
                src={imgSrc}
                alt=""
                className="max-h-[min(42dvh,38%)] w-auto max-w-[92%] object-contain object-top"
              />
            ) : graphicReady ? (
              <p className="px-2 text-center font-display text-sm font-bold uppercase tracking-[0.18em] text-white/50">
                {def.label}
              </p>
            ) : (
              <span className="sr-only">Loading…</span>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-row gap-2 px-3 pb-6 pt-1">
          <aside className="w-[min(42%,11rem)] shrink-0 text-left">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90">
              On stream
            </p>
            <ul className="mt-2 space-y-2 font-body text-[11px] leading-snug text-white/80 sm:text-xs">
              {def.instructions.map((line) => (
                <li key={line} className="border-l border-amber-600/40 pl-2">
                  {line}
                </li>
              ))}
            </ul>
          </aside>
          <div className="min-w-0 flex-1 bg-transparent" aria-hidden />
        </div>
      </div>
    </div>
  );
}
