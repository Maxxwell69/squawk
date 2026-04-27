import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/app/_components/SignOutButton";

export default async function CrewAccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/crew/login?callbackUrl=%2Fcrew%2Faccount");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-squawk-ink via-[#151020] to-squawk-ink px-6 py-10 text-parchment">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-3xl border border-squawk-gold/25 bg-black/25 p-8 shadow-panel backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-squawk-gold/75">
            Private account
          </p>
          <h1 className="mt-2 font-display text-4xl text-squawk-gold">
            Account
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-parchment/80">
            Your email address is only shown here inside the protected account
            page.
          </p>
        </section>

        <section className="rounded-3xl border border-parchment/15 bg-black/25 p-8 shadow-panel backdrop-blur">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-parchment/15 bg-white/[0.03] p-5">
              <p className="text-sm text-parchment/60">Email</p>
              <p className="mt-2 break-all text-parchment">{session.user.email}</p>
            </div>
            <div className="rounded-2xl border border-parchment/15 bg-white/[0.03] p-5">
              <p className="text-sm text-parchment/60">Role</p>
              <p className="mt-2">
                <span className="inline-flex rounded-full bg-squawk-sea/50 px-3 py-1 text-xs uppercase tracking-[0.15em] text-parchment">
                  {session.user.role}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Link
              href="/crew"
              className="inline-flex justify-center rounded-lg bg-squawk-gold px-4 py-3 text-sm font-medium text-squawk-ink transition hover:bg-parchment"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center rounded-lg border border-parchment/25 px-4 py-3 text-sm text-parchment transition hover:bg-white/5"
            >
              Site home
            </Link>
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
