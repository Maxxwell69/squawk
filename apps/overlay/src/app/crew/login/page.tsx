import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import { CrewLoginForm } from "./_components/CrewLoginForm";

export default async function CrewLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const afterLoginPath = safeCallbackUrl(sp.callbackUrl, "/crew");

  const session = await auth();
  if (session?.user) redirect(afterLoginPath);

  const showRegistered = sp.registered === "1";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-squawk-gold/30 bg-squawk-ink/60 p-8 shadow-panel backdrop-blur">
        <h1 className="font-display text-2xl text-squawk-gold">Crew sign in</h1>
        <p className="mt-2 text-sm text-parchment/75">
          Sign in with the email and password you set when you joined the crew.
        </p>
        {showRegistered ? (
          <p className="mt-6 rounded-lg bg-squawk-sea/25 px-4 py-3 text-sm text-parchment">
            Password saved — you can sign in below.
          </p>
        ) : null}
        <div className="mt-8">
          <CrewLoginForm afterLoginPath={afterLoginPath} />
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
