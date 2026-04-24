import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function CrewAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/crew/login?callbackUrl=%2Fcrew%2Fadmin");
  }
  if (session.user.role !== "ADMIN") redirect("/crew");

  return (
    <div className="min-h-screen bg-squawk-ink">
      <header className="border-b border-parchment/15 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <span className="font-display text-lg text-squawk-gold">
            Admin — Captain Squawks
          </span>
          <nav className="flex gap-6 text-sm">
            <Link href="/crew/admin" className="text-parchment hover:text-squawk-gold">
              Overview
            </Link>
            <Link
              href="/crew/admin/approvals"
              className="text-parchment hover:text-squawk-gold"
            >
              Approvals
            </Link>
            <Link
              href="/crew/admin/moderators"
              className="text-parchment hover:text-squawk-gold"
            >
              Moderators
            </Link>
            <Link href="/crew" className="text-parchment/70 hover:text-parchment">
              Crew portal
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10 text-parchment">{children}</div>
    </div>
  );
}
