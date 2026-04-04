import Link from "next/link";
import {
  BATTLE_BOARD_DEFS,
  type BattleBoardSlug,
} from "@/lib/battle-board-slugs";

const DISPLAY = "/overlay/battle-board/display";

function legacyHref(slug: BattleBoardSlug): string {
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
            Use <strong className="text-white/90">one</strong> browser source:{" "}
            <code className="break-all text-amber-200/90">{DISPLAY}</code>
            . On the{" "}
            <Link className="text-squawk-gold underline" href="/overlay/battle">
              TikTok battle board
            </Link>
            , tap level / banner buttons — the OBS view updates (same site,
            another tab). Optional <code className="text-amber-200/90">?scene=</code>{" "}
            on the display URL for a default (e.g.{" "}
            <code className="text-amber-200/90">{DISPLAY}?scene=prepare</code>).
          </p>
          <p className="mt-2 font-body text-sm text-white/55">
            Art: <code className="text-amber-200/90">public/battle/board/</code>{" "}
            — each scene uses <code className="text-amber-200/90">banner/</code>{" "}
            (top, full width) and <code className="text-amber-200/90">tips/</code>{" "}
            (left, under banner). First image A→Z per folder. See{" "}
            <code className="text-amber-200/90">README.md</code> there.
          </p>
        </div>

        <section>
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cyan-300/90">
            Scene slugs (for ?scene=)
          </h2>
          <ul className="mt-3 space-y-2 font-body text-sm">
            {levels.map((d) => (
              <li key={d.slug}>
                <span className="text-white/90">{d.label}</span>
                <span className="ml-2 font-mono text-[11px] text-white/40">
                  {d.slug}
                </span>
                <span className="ml-2 font-mono text-[10px] text-white/30">
                  ({legacyHref(d.slug)} → display)
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
                <span className="text-white/90">{d.label}</span>
                <span className="ml-2 font-mono text-[11px] text-white/40">
                  {d.slug}
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
