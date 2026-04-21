import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "./_components/SignOutButton";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <div className="rounded-2xl border border-squawk-gold/30 bg-squawk-ink/60 p-8 shadow-panel backdrop-blur">
        <h1 className="font-display text-3xl text-squawk-gold">
          Captain Squawks — crew portal
        </h1>
        <p className="mt-3 text-parchment/90">
          Sign in with email. The captain adds moderator emails from the admin
          dashboard; only invited addresses receive a login link.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {session?.user ? (
            <>
              <p className="text-sm text-parchment/70">
                Signed in as{" "}
                <span className="text-parchment">{session.user.email}</span>
                <span className="ml-2 rounded bg-squawk-sea/40 px-2 py-0.5 text-xs uppercase tracking-wide text-parchment">
                  {session.user.role}
                </span>
              </p>
              {session.user.role === "MODERATOR" && (
                <p className="text-sm text-parchment/75">
                  You are a moderator. More crew tools can plug into this role
                  later.
                </p>
              )}
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex justify-center rounded-lg bg-squawk-gold px-4 py-3 font-medium text-squawk-ink transition hover:bg-parchment"
                >
                  Admin — manage moderators
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex justify-center rounded-lg bg-squawk-gold px-4 py-3 font-medium text-squawk-ink transition hover:bg-parchment"
            >
              Sign in with email
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
