import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

type MenuItem = {
  href: string;
  title: string;
  detail: string;
};

type MenuSection = {
  id: string;
  heading: string;
  subheading?: string;
  items: MenuItem[];
};

const SECTIONS: MenuSection[] = [
  {
    id: "crew",
    heading: "Crew & admin",
    subheading:
      "Email + password accounts. New members need an approved invite; moderators can be pre-added.",
    items: [
      {
        href: "/crew",
        title: "Crew portal",
        detail: "Home after sign-in — role and shortcuts.",
      },
      {
        href: "/crew/register",
        title: "Register / set password",
        detail: "After captain approval, moderator invite, or ADMIN_EMAIL captain bootstrap.",
      },
      {
        href: "/crew/login",
        title: "Sign in",
        detail: "Returning crew members.",
      },
      {
        href: "/crew/admin",
        title: "Admin overview",
        detail: "Counts — requires ADMIN role.",
      },
      {
        href: "/crew/admin/approvals",
        title: "Approvals queue",
        detail: "Add emails, approve, then they can register — ADMIN only.",
      },
      {
        href: "/crew/admin/moderators",
        title: "Manage moderators",
        detail: "Add or remove moderator emails — requires ADMIN.",
      },
      {
        href: "/admin/login",
        title: "Admin login",
        detail: "Shortcut to sign in and land in the admin area if you are ADMIN.",
      },
    ],
  },
  {
    id: "parrot",
    heading: "Parrot overlay (OBS browser source)",
    subheading:
      "Transparent backgrounds — size the browser source in OBS to fit your layout.",
    items: [
      {
        href: "/overlay/parrot",
        title: "Full widget",
        detail: "Parrot, subtitles, status — main browser source.",
      },
      {
        href: "/overlay/parrot-with-bubble",
        title: "Parrot + speech bubble",
        detail: "Bubble variant for dialogue-style lines.",
      },
      {
        href: "/overlay/parrot-only",
        title: "Parrot only",
        detail: "Bird only — no panel chrome.",
      },
    ],
  },
  {
    id: "battle",
    heading: "TikTok battle & title board",
    items: [
      {
        href: "/overlay/battle",
        title: "Battle control board",
        detail: "Drive scenes and levels — use the hosted URL so OBS stays in sync.",
      },
      {
        href: "/overlay/battle-board/display",
        title: "Title display (9:16)",
        detail: "OBS single source for on-stream titles.",
      },
      {
        href: "/overlay/battle-board",
        title: "Battle board notes",
        detail: "Reference / notes page linked from battle flows.",
      },
      {
        href: "/overlay/battle-board/prepare",
        title: "Battle board — scene shortcut",
        detail: "Legacy path per scene (redirects to title display with that scene).",
      },
    ],
  },
  {
    id: "games",
    heading: "Game boards",
    items: [
      {
        href: "/overlay/sea-of-thieves",
        title: "Sea of Thieves",
        detail: "Voyages / adventure board styling.",
      },
      {
        href: "/overlay/rust",
        title: "Rust",
        detail: "Rust adventure board.",
      },
      {
        href: "/overlay/windrose",
        title: "Windrose",
        detail: "Windrose banter board with crew praise and TikFinity hooks.",
      },
    ],
  },
  {
    id: "dev",
    heading: "Developer",
    items: [
      {
        href: "/dev/parrot-test",
        title: "Parrot test panel",
        detail: "Trigger mock events against your bridge — local or tunneled.",
      },
    ],
  },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/crew/login?callbackUrl=%2F");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-squawk-ink via-[#151020] to-squawk-ink pb-16 pt-10 text-parchment">
      <div className="mx-auto max-w-3xl px-5">
        <header className="mb-10 border-b border-parchment/15 pb-8">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-squawk-gold/80">
            Pirate Maxx
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-squawk-gold md:text-5xl">
            Captain Squawks
          </h1>
          <p className="mt-3 max-w-2xl font-body text-lg text-parchment/90">
            First Mate Squawks — stream overlays, battle boards, and crew tools.
            Use hosted URLs in OBS; connect the local bridge on your stream PC for
            TikFinity-style events.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-squawk-gold/35 bg-black/30 px-4 py-2 text-sm text-parchment">
              Crew:{" "}
              <span className="text-squawk-gold">{session.user.email}</span>
              <span className="ml-2 rounded bg-squawk-sea/50 px-2 py-0.5 text-xs uppercase text-parchment/90">
                {session.user.role}
              </span>
            </span>
            <Link
              href="/crew"
              className="rounded-full bg-squawk-gold px-4 py-2 text-sm font-medium text-squawk-ink transition hover:bg-parchment"
            >
              Crew portal
            </Link>
            {session.user.role === "ADMIN" && (
              <Link
                href="/crew/admin/moderators"
                className="rounded-full border border-parchment/30 px-4 py-2 text-sm text-parchment transition hover:bg-white/5"
              >
                Admin — moderators
              </Link>
            )}
          </div>
        </header>

        <nav className="space-y-10" aria-label="Squawk site menu">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-parchment/15 bg-black/25 p-6 shadow-panel backdrop-blur sm:p-8"
            >
              <h2 className="font-display text-xl text-squawk-gold md:text-2xl">
                {section.heading}
              </h2>
              {section.subheading ? (
                <p className="mt-2 text-sm text-parchment/70">
                  {section.subheading}
                </p>
              ) : null}
              <ul className="mt-6 space-y-4">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group block rounded-xl border border-transparent px-3 py-3 transition hover:border-squawk-gold/25 hover:bg-white/[0.04]"
                    >
                      <span className="font-medium text-parchment group-hover:text-squawk-gold">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-sm text-parchment/65">
                        {item.detail}
                      </span>
                      <span className="mt-2 font-mono text-xs text-parchment/40">
                        {item.href}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <footer className="mt-12 border-t border-parchment/10 pt-8 text-center text-xs text-parchment/45">
          Captain Squawks · Pirate Maxx stream companion
        </footer>
      </div>
    </main>
  );
}
