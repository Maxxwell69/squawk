"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EmailSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn("email", {
      email: email.trim(),
      redirect: false,
      callbackUrl: "/",
    });
    setBusy(false);
    if (result?.error) {
      setError(
        "Could not start sign-in. If you are not on the crew list yet, ask the captain to add your email as a moderator. If you were invited, check EMAIL_SERVER and EMAIL_FROM."
      );
      return;
    }
    router.push("/login/verify");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block text-sm text-parchment/80">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-parchment/25 bg-black/25 px-4 py-3 text-parchment outline-none ring-squawk-gold/40 placeholder:text-parchment/40 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      {error ? (
        <p className="text-sm text-squawk-rust">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-squawk-gold px-4 py-3 font-medium text-squawk-ink transition hover:bg-parchment disabled:opacity-60"
      >
        {busy ? "Sending…" : "Email me a login link"}
      </button>
    </form>
  );
}
