import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b border-parchment/15 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <span className="font-display text-lg text-squawk-gold">
            Admin — Captain Squawks
          </span>
          <nav className="flex gap-6 text-sm">
            <Link href="/admin" className="text-parchment hover:text-squawk-gold">
              Overview
            </Link>
            <Link
              href="/admin/moderators"
              className="text-parchment hover:text-squawk-gold"
            >
              Moderators
            </Link>
            <Link href="/" className="text-parchment/70 hover:text-parchment">
              Site home
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">{children}</div>
    </div>
  );
}
