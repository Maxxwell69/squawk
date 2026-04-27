import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CrewAdminOverviewPage() {
  const [mods, members, pendingInvites] = await Promise.all([
    prisma.user.count({ where: { role: "MODERATOR" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.crewInvite.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-squawk-gold">Overview</h1>
      <p className="mt-2 text-parchment/80">
        Use <strong>Approvals</strong> to add crew by email, then approve before
        they can register. Use <strong>Moderators</strong> for mod-only access.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-parchment/20 bg-squawk-ink/50 p-6">
          <dt className="text-sm text-parchment/60">Pending approvals</dt>
          <dd className="mt-1 font-display text-3xl text-parchment">
            {pendingInvites}
          </dd>
        </div>
        <div className="rounded-xl border border-parchment/20 bg-squawk-ink/50 p-6">
          <dt className="text-sm text-parchment/60">Moderators</dt>
          <dd className="mt-1 font-display text-3xl text-parchment">{mods}</dd>
        </div>
        <div className="rounded-xl border border-parchment/20 bg-squawk-ink/50 p-6">
          <dt className="text-sm text-parchment/60">Members</dt>
          <dd className="mt-1 font-display text-3xl text-parchment">{members}</dd>
        </div>
      </dl>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link
          href="/crew/admin/approvals"
          className="rounded-xl border border-parchment/20 bg-squawk-ink/50 p-5 transition hover:border-squawk-gold/35 hover:bg-white/[0.04]"
        >
          <h2 className="font-display text-xl text-squawk-gold">Approvals</h2>
          <p className="mt-2 text-sm text-parchment/75">
            Review pending crew access and approve registrations.
          </p>
        </Link>

        <Link
          href="/crew/admin/moderators"
          className="rounded-xl border border-parchment/20 bg-squawk-ink/50 p-5 transition hover:border-squawk-gold/35 hover:bg-white/[0.04]"
        >
          <h2 className="font-display text-xl text-squawk-gold">Moderators</h2>
          <p className="mt-2 text-sm text-parchment/75">
            Add moderators for board access or remove them when needed.
          </p>
        </Link>

        <Link
          href="/crew"
          className="rounded-xl border border-parchment/20 bg-squawk-ink/50 p-5 transition hover:border-squawk-gold/35 hover:bg-white/[0.04]"
        >
          <h2 className="font-display text-xl text-squawk-gold">Dashboard</h2>
          <p className="mt-2 text-sm text-parchment/75">
            Return to the main working dashboard for overlays and boards.
          </p>
        </Link>
      </div>
    </div>
  );
}
