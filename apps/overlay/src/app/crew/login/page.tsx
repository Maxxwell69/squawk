import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmailSignInForm } from "./_components/EmailSignInForm";

export default async function CrewLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/crew");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-squawk-gold/30 bg-squawk-ink/60 p-8 shadow-panel backdrop-blur">
        <h1 className="font-display text-2xl text-squawk-gold">Crew sign in</h1>
        <p className="mt-2 text-sm text-parchment/75">
          We&apos;ll email you a one-time link. Only emails the captain has
          added can receive a link.
        </p>
        <div className="mt-8">
          <EmailSignInForm />
        </div>
        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-squawk-gold underline-offset-4 hover:underline">
            ← Site home
          </Link>
        </p>
      </div>
    </main>
  );
}
