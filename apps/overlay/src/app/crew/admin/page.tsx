import { prisma } from "@/lib/prisma";

export default async function CrewAdminOverviewPage() {
  const [mods, members] = await Promise.all([
    prisma.user.count({ where: { role: "MODERATOR" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-squawk-gold">Overview</h1>
      <p className="mt-2 text-parchment/80">
        Manage who can moderate community interactions.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
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
