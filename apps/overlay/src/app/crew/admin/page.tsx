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
    </div>
  );
}
