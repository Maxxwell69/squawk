import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-squawk-ink p-8 text-parchment">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="font-display text-3xl font-bold">Pirate Maxx</h1>
        <p className="font-body text-parchment/90">
          First Mate Squawks — local-first stream companion. Use the overlay as an
          OBS browser source, and run the local bridge for TikFinity-style
          events.
        </p>
        <ul className="list-inside list-disc space-y-2 font-body text-sm">
          <li>
            <Link className="text-squawk-gold underline" href="/overlay/parrot">
              Overlay — full widget (browser source)
            </Link>
          </li>
          <li>
            <Link
              className="text-squawk-gold underline"
              href="/overlay/parrot-only"
            >
              Overlay — parrot only (no box)
            </Link>
          </li>
          <li>
            <Link className="text-squawk-gold underline" href="/dev/parrot-test">
              Dev test panel
            </Link>
          </li>
          <li>
            <Link
              className="text-squawk-gold underline"
              href="/overlay/battle"
            >
              TikTok battle board
            </Link>
          </li>
          <li>
            <Link
              className="text-squawk-gold underline"
              href="/overlay/sea-of-thieves"
            >
              Sea of Thieves voyages board
            </Link>
          </li>
          <li>
            <Link className="text-squawk-gold underline" href="/overlay/rust">
              Rust adventure board
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
