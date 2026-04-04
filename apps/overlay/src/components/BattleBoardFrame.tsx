"use client";

import { useEffect, useMemo, useState } from "react";
import type { BattleBoardDef } from "@/lib/battle-board-slugs";
import { assetBasePath } from "@/lib/battle-board-slugs";

const IMAGE_CANDIDATES = [
  "title.webp",
  "title.png",
  "banner.webp",
  "banner.png",
] as const;

type Props = {
  def: BattleBoardDef;
};

export function BattleBoardFrame({ def }: Props) {
  const base = useMemo(() => assetBasePath(def), [def]);
  const [imageIndex, setImageIndex] = useState(0);
  const exhausted = imageIndex >= IMAGE_CANDIDATES.length;
  const src = exhausted ? null : `${base}/${IMAGE_CANDIDATES[imageIndex]}`;

  useEffect(() => {
    setImageIndex(0);
  }, [base]);

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
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element -- user assets from /public
              <img
                src={src}
                alt=""
                className="max-h-[min(42dvh,38%)] w-auto max-w-[92%] object-contain object-top"
                onError={() => setImageIndex((i) => i + 1)}
              />
            ) : (
              <p className="px-2 text-center font-display text-sm font-bold uppercase tracking-[0.18em] text-white/50">
                {def.label}
              </p>
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
