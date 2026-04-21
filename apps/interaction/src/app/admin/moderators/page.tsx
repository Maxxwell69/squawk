import { prisma } from "@/lib/prisma";
import { ModeratorTools } from "./_components/ModeratorTools";

export default async function ModeratorsAdminPage() {
  const moderators = await prisma.user.findMany({
    where: { role: "MODERATOR" },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-squawk-gold">Moderators</h1>
      <p className="mt-2 text-parchment/80">
        Admins can promote members to moderator. Removing a moderator returns
        them to member access.
      </p>
      <div className="mt-10">
        <ModeratorTools
          initial={moderators.map((m) => ({ id: m.id, email: m.email }))}
        />
      </div>
    </div>
  );
}
