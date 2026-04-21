"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CrewRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/crew/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      hint?: string;
    };
    setBusy(false);
    if (!res.ok) {
      if (data.error === "not_invited") {
        setError(
          "This email is not on the crew list, or you are the first captain and ADMIN_EMAIL in Railway does not match this address. Check the server has ADMIN_EMAIL set to this exact email, or ask the captain to add you as a moderator first."
        );
      } else if (data.error === "already_registered") {
        setError("That email already has an account — sign in instead.");
      } else if (data.error === "database_error" && data.hint) {
        setError(
          `Server database issue: ${data.hint} (if you just deployed, run migrations: add "passwordHash" to the users table).`
        );
      } else if (data.hint) {
        setError(data.hint);
      } else {
        setError("Could not register. Check deploy logs or try again.");
      }
      return;
    }
    router.push("/crew/login?registered=1");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block text-sm text-parchment/80">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-parchment/25 bg-black/25 px-4 py-3 text-parchment outline-none ring-squawk-gold/40 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-parchment/80">
          Password (min 8 characters)
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {busy ? "Saving…" : "Create password"}
      </button>
      <p className="text-center text-sm text-parchment/70">
        Already set a password?{" "}
        <Link
          href="/crew/login"
          className="text-squawk-gold underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
