import { prisma } from "@/lib/prisma";
import { ApprovalsTools } from "./_components/ApprovalsTools";

export default async function CrewAdminApprovalsPage() {
  const invites = await prisma.crewInvite.findMany({
    orderBy: { createdAt: "desc" },
  });

  const initial = invites.map((i) => ({
    id: i.id,
    email: i.email,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-squawk-gold">Approvals</h1>
      <p className="mt-2 text-parchment/80">
        Add emails here first, approve them, then the person can complete{" "}
        <strong>Join the crew</strong> with their password. Moderators can
        still be added on the Moderators page (separate shortcut).
      </p>
      <div className="mt-10">
        <ApprovalsTools initial={initial} />
      </div>
    </div>
  );
}
