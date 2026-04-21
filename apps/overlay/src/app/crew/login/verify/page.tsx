import Link from "next/link";

export default function CrewVerifyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-squawk-gold/30 bg-squawk-ink/60 p-8 shadow-panel backdrop-blur text-center">
        <h1 className="font-display text-2xl text-squawk-gold">Check your email</h1>
        <p className="mt-4 text-parchment/85">
          Open the message we sent and tap the link to finish signing in.
        </p>
        <p className="mt-8">
          <Link
            href="/crew/login"
            className="text-squawk-gold underline-offset-4 hover:underline"
          >
            Use a different email
          </Link>
        </p>
      </div>
    </main>
  );
}
