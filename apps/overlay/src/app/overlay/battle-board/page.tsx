import Link from "next/link";
import {
  BATTLE_BOARD_DEFS,
  type BattleBoardSlug,
} from "@/lib/battle-board-slugs";

function boardHref(slug: BattleBoardSlug): string {
  return `/overlay/battle-board/${slug}`;
}

export default function BattleBoardIndexPage() {
  const levels = BATTLE_BOARD_DEFS.filter((d) => d.kind === "level");
  const banners = BATTLE_BOARD_DEFS.filter((d) => d.kind === "banner");

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-parchment sm:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-500/90">
            OBS — 9:16
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            Battle title boards
          </h1>
          <p className="mt-2 font-body text-sm text-white/65">
            Separate from the parrot overlay. Black frame, main art centered top,
            instructions on the left. Add images under{" "}
            <code className="text-amber-200/90">public/battle/board/</code> — see{" "}
            <code className="text-amber-200/90">README.md</code> there.
          </p>
        </div>

        <section>
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cyan-300/90">
            Battle levels
          </h2>
          <ul className="mt-3 space-y-2 font-body text-sm">
            {levels.map((d) => (
              <li key={d.slug}>
                <Link
                  className="text-squawk-gold underline decoration-amber-600/50 underline-offset-2 hover:text-amber-200"
                  href={boardHref(d.slug)}
                >
                  {d.label}
                </Link>
                <span className="ml-2 font-mono text-[11px] text-white/40">
                  {boardHref(d.slug)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-violet-300/90">
            Banners
          </h2>
          <ul className="mt-3 space-y-2 font-body text-sm">
            {banners.map((d) => (
              <li key={d.slug}>
                <Link
                  className="text-squawk-gold underline decoration-amber-600/50 underline-offset-2 hover:text-amber-200"
                  href={boardHref(d.slug)}
                >
                  {d.label}
                </Link>
                <span className="ml-2 font-mono text-[11px] text-white/40">
                  {boardHref(d.slug)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="font-body text-xs text-white/45">
          <Link className="text-cyan-400/90 underline" href="/overlay/battle">
            ← TikTok battle board
          </Link>
        </p>
      </div>
    </main>
  );
}
