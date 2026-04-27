import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";

type FeatureCard = {
  title: string;
  detail: string;
};

type RouteCard = {
  href: string;
  title: string;
  detail: string;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: "Overlay system",
    detail:
      "Run the Squawks parrot, subtitles, and browser-source widgets directly in OBS with hosted URLs.",
  },
  {
    title: "Boards and battle tools",
    detail:
      "Use themed boards for battles, Windrose banter, Sea of Thieves, and Rust without juggling separate tools.",
  },
  {
    title: "Crew access control",
    detail:
      "Admins manage who gets in, moderators get a working dashboard, and everyone signs in with email and password.",
  },
];

const OVERLAY_ROUTES: RouteCard[] = [
  {
    href: "/overlay/parrot",
    title: "Parrot overlay",
    detail: "Main OBS browser source with the Squawks character, status, and subtitles.",
  },
  {
    href: "/overlay/battle",
    title: "Battle controls",
    detail: "Drive the battle scene flow and keep the broadcast layout in sync.",
  },
  {
    href: "/overlay/battle-board/display",
    title: "Battle board display",
    detail: "Dedicated 9:16 title board output for stream scenes.",
  },
  {
    href: "/overlay/windrose",
    title: "Windrose board",
    detail: "On-stream banter board for the crew and audience interaction moments.",
  },
];

const ACCESS_ROUTES: RouteCard[] = [
  {
    href: "/crew/login",
    title: "Log in",
    detail: "Crew members, moderators, and admins sign in here.",
  },
  {
    href: "/crew/register",
    title: "Create password",
    detail: "Finish account setup after approval or moderator assignment.",
  },
  {
    href: "/admin/login",
    title: "Admin shortcut",
    detail: "Send admins directly toward the admin controls after sign-in.",
  },
];

const ROLE_CARDS: FeatureCard[] = [
  {
    title: "Admins",
    detail:
      "Get the full dashboard, approve crew access, and add or remove moderators from the admin tools.",
  },
  {
    title: "Moderators",
    detail:
      "Get a clean dashboard with quick links to the boards and overlays needed during the show.",
  },
  {
    title: "Crew members",
    detail:
      "Can sign in securely and use the shared crew workspace without needing admin-only controls.",
  },
];

function CardGrid({
  cards,
  className = "sm:grid-cols-2",
}: {
  cards: FeatureCard[];
  className?: string;
}) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-2xl border border-parchment/15 bg-black/25 p-6 shadow-panel backdrop-blur"
        >
          <h3 className="font-display text-xl text-squawk-gold">{card.title}</h3>
          <p className="mt-3 text-sm leading-6 text-parchment/80">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

function LinkGrid({
  cards,
  className = "sm:grid-cols-2",
}: {
  cards: RouteCard[];
  className?: string;
}) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group rounded-2xl border border-parchment/15 bg-black/25 p-6 shadow-panel backdrop-blur transition hover:border-squawk-gold/35 hover:bg-white/[0.04]"
        >
          <h3 className="font-display text-xl text-parchment group-hover:text-squawk-gold">
            {card.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-parchment/75">{card.detail}</p>
          <p className="mt-4 font-mono text-xs text-parchment/40">{card.href}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-squawk-ink via-[#151020] to-squawk-ink pb-16 text-parchment">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-parchment/15 bg-black/25 px-6 py-5 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-squawk-gold/80">
                Pirate Maxx
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-squawk-gold sm:text-4xl">
                Captain Squawks
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-parchment/80 sm:text-base">
                A website-style home for the Squawk stream system: overlays,
                battle boards, crew access, and role-based dashboard tools.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {session?.user ? (
                <>
                  <span className="rounded-full border border-squawk-gold/35 bg-black/30 px-4 py-2 text-sm">
                    {session.user.email}
                    <span className="ml-2 rounded bg-squawk-sea/50 px-2 py-0.5 text-xs uppercase text-parchment/90">
                      {session.user.role}
                    </span>
                  </span>
                  <Link
                    href="/crew"
                    className="rounded-full bg-squawk-gold px-4 py-2 text-sm font-medium text-squawk-ink transition hover:bg-parchment"
                  >
                    Open dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/crew/login"
                    className="rounded-full bg-squawk-gold px-4 py-2 text-sm font-medium text-squawk-ink transition hover:bg-parchment"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/crew/register"
                    className="rounded-full border border-parchment/30 px-4 py-2 text-sm text-parchment transition hover:bg-white/5"
                  >
                    Create password
                  </Link>
                </>
              )}
            </div>
          </div>

          <nav
            aria-label="Home menu"
            className="mt-5 flex flex-wrap gap-3 text-sm text-parchment/75"
          >
            <a href="#features" className="rounded-full border border-parchment/15 px-3 py-1.5 hover:text-squawk-gold">
              Features
            </a>
            <a href="#workspace" className="rounded-full border border-parchment/15 px-3 py-1.5 hover:text-squawk-gold">
              Workspace
            </a>
            <a href="#roles" className="rounded-full border border-parchment/15 px-3 py-1.5 hover:text-squawk-gold">
              Roles
            </a>
            <a href="#access" className="rounded-full border border-parchment/15 px-3 py-1.5 hover:text-squawk-gold">
              Login
            </a>
          </nav>
        </header>

        <section className="grid gap-6 pb-12 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-squawk-gold/75">
              Stream companion website
            </p>
            <h2 className="mt-3 font-display text-4xl text-parchment sm:text-5xl">
              Squawk keeps the show tools, crew access, and overlays in one place.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-parchment/80">
              Use the public home page to explain the system, then let moderators
              and admins sign in to a dashboard built for operating the boards and
              overlays during the stream.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={session?.user ? "/crew" : "/crew/login"}
                className="rounded-full bg-squawk-gold px-5 py-3 text-sm font-medium text-squawk-ink transition hover:bg-parchment"
              >
                {session?.user ? "Go to dashboard" : "Log in to the dashboard"}
              </Link>
              <a
                href="#workspace"
                className="rounded-full border border-parchment/30 px-5 py-3 text-sm text-parchment transition hover:bg-white/5"
              >
                View feature menu
              </a>
            </div>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-squawk-gold/20 bg-black/25 shadow-panel backdrop-blur">
              <Image
                src="/home/pirate-maxx-hero.png"
                alt="Pirate Maxx and First Mate Squawk artwork on stormy seas."
                width={1024}
                height={768}
                priority
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr] lg:grid-cols-[0.8fr_1.2fr]">
              <div className="flex items-center justify-center rounded-3xl border border-squawk-gold/20 bg-black/25 p-5 shadow-panel backdrop-blur">
                <Image
                  src="/home/squawk-logo.png"
                  alt="Captain Squawks logo."
                  width={600}
                  height={600}
                  className="h-auto w-full max-w-[240px]"
                />
              </div>

              <div className="rounded-3xl border border-squawk-gold/20 bg-black/25 p-6 shadow-panel backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-squawk-gold/75">
                  What this site does
                </p>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-parchment/80">
                  <li className="rounded-2xl border border-parchment/10 bg-white/[0.03] p-4">
                    Uses your Pirate Maxx and Squawk artwork as the main website branding.
                  </li>
                  <li className="rounded-2xl border border-parchment/10 bg-white/[0.03] p-4">
                    Gives moderators and admins a clear sign-in path and dashboard entry.
                  </li>
                  <li className="rounded-2xl border border-parchment/10 bg-white/[0.03] p-4">
                    Keeps overlays, boards, and moderator tools together in one place.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="pt-4">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-squawk-gold/75">
              Feature system
            </p>
            <h2 className="mt-2 font-display text-3xl text-squawk-gold">
              What Squawk is built around
            </h2>
          </div>
          <CardGrid cards={FEATURE_CARDS} className="lg:grid-cols-3" />
        </section>

        <section id="workspace" className="pt-14">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-squawk-gold/75">
              Menu
            </p>
            <h2 className="mt-2 font-display text-3xl text-squawk-gold">
              Main Squawk workspace
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-parchment/75">
              These are the primary feature areas inside Squawk, covering the
              broadcast overlays and on-stream board tools.
            </p>
          </div>
          <LinkGrid cards={OVERLAY_ROUTES} />
        </section>

        <section id="roles" className="pt-14">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-squawk-gold/75">
              Dashboard roles
            </p>
            <h2 className="mt-2 font-display text-3xl text-squawk-gold">
              Access is organized by role
            </h2>
          </div>
          <CardGrid cards={ROLE_CARDS} className="lg:grid-cols-3" />
        </section>

        <section id="access" className="pt-14">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-squawk-gold/75">
              Login system
            </p>
            <h2 className="mt-2 font-display text-3xl text-squawk-gold">
              Secure crew access
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-parchment/75">
              Crew members sign in with email and password. Admins control access,
              moderators can be added or removed by admins, and approved users can
              finish setup by creating a password.
            </p>
          </div>
          <LinkGrid cards={ACCESS_ROUTES} className="lg:grid-cols-3" />
        </section>

        <footer className="mt-16 border-t border-parchment/10 pt-8 text-center text-xs text-parchment/45">
          Captain Squawks · Pirate Maxx stream companion website
        </footer>
      </div>
    </main>
  );
}
