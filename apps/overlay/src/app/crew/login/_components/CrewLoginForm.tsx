"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CrewLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl: "/crew",
    });
    setBusy(false);
    if (result?.error) {
      setError("Wrong email or password.");
      return;
    }
    router.push("/crew");
    router.refresh();
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
      <label className="block">
        <span className="mb-1 block text-sm text-parchment/80">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-parchment/25 bg-black/25 px-4 py-3 text-parchment outline-none ring-squawk-gold/40 focus:ring-2"
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
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-parchment/70">
        First time?{" "}
        <Link
          href="/crew/register"
          className="text-squawk-gold underline-offset-4 hover:underline"
        >
          Create your password
        </Link>
      </p>
    </form>
  );
}
