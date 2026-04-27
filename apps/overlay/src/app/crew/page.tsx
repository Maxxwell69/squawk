import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/app/_components/SignOutButton";

type DashboardLink = {
  href: string;
  title: string;
  detail: string;
};

const WORKSPACE_LINKS: DashboardLink[] = [
  {
    href: "/overlay/parrot-with-bubble",
    title: "Parrot overlay",
    detail: "Squawks overlay with the speech bubble used on stream.",
  },
  {
    href: "/overlay/battle",
    title: "Battle controls",
    detail: "Run the battle scene flow and titles.",
  },
  {
    href: "/overlay/battle-board/display",
    title: "Battle board display",
    detail: "Dedicated display output for OBS scenes.",
  },
  {
    href: "/overlay/sea-of-thieves",
    title: "Sea of Thieves board",
    detail: "Voyage and adventure presentation board.",
  },
  {
    href: "/overlay/rust",
    title: "Rust board",
    detail: "Rust-themed on-stream board view.",
  },
  {
    href: "/overlay/windrose",
    title: "Windrose board",
    detail: "Banter board for live crew moments.",
  },
];

const ADMIN_LINKS: DashboardLink[] = [
  {
    href: "/crew/admin",
    title: "Admin overview",
    detail: "Role counts and admin summary.",
  },
  {
    href: "/crew/admin/approvals",
    title: "Approvals queue",
    detail: "Approve new crew members before they register.",
  },
  {
    href: "/crew/admin/moderators",
    title: "Moderator manager",
    detail: "Add and remove moderators.",
  },
];

function DashboardGrid({ links }: { links: DashboardLink[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group rounded-2xl border border-parchment/15 bg-black/20 p-5 transition hover:border-squawk-gold/35 hover:bg-white/[0.04]"
        >
          <h2 className="font-display text-xl text-parchment group-hover:text-squawk-gold">
            {link.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-parchment/75">{link.detail}</p>
          <p className="mt-4 font-mono text-xs text-parchment/40">{link.href}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function CrewHomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/crew/login?callbackUrl=%2Fcrew");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isModerator = session.user.role === "MODERATOR";
  const dashboardTitle = isAdmin
    ? "Admin dashboard"
    : isModerator
      ? "Moderator dashboard"
      : "Crew dashboard";

  return (
    <main className="min-h-screen bg-gradient-to-b from-squawk-ink via-[#151020] to-squawk-ink px-6 py-10 text-parchment">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-squawk-gold/25 bg-black/25 p-8 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-squawk-gold/75">
                Protected workspace
              </p>
              <h1 className="mt-2 font-display text-4xl text-squawk-gold">
                {dashboardTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-parchment/80">
                Use this dashboard to open the Squawk boards and overlays you need
                during the show. Admins also get access to moderator management and
                approvals.
              </p>
            </div>

            <div className="space-y-3 lg:min-w-72">
              <div className="rounded-2xl border border-parchment/15 bg-white/[0.03] px-4 py-3 text-sm">
                <p className="text-parchment/60">Signed in as</p>
                <p className="mt-1 text-parchment">{session.user.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-squawk-sea/50 px-3 py-1 text-xs uppercase tracking-[0.15em] text-parchment">
                  {session.user.role}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  href="/"
                  className="inline-flex justify-center rounded-lg border border-parchment/25 px-4 py-3 text-sm text-parchment transition hover:bg-white/5"
                >
                  Site home
                </Link>
                <SignOutButton />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-parchment/15 bg-black/25 p-8 shadow-panel backdrop-blur">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-squawk-gold/75">
              Boards and overlays
            </p>
            <h2 className="mt-2 font-display text-3xl text-squawk-gold">
              Working tools
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-parchment/75">
              Quick access to the main Squawk pages used for stream operation.
            </p>
          </div>
          <DashboardGrid links={WORKSPACE_LINKS} />
        </section>

        {isAdmin ? (
          <section className="rounded-3xl border border-parchment/15 bg-black/25 p-8 shadow-panel backdrop-blur">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-squawk-gold/75">
                Admin tools
              </p>
              <h2 className="mt-2 font-display text-3xl text-squawk-gold">
                Manage the team
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-parchment/75">
                Add or remove moderators, review approvals, and monitor the crew
                setup from one place.
              </p>
            </div>
            <DashboardGrid links={ADMIN_LINKS} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
