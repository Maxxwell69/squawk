"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { id: string; email: string };

export function ModeratorTools({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addModerator(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function removeModerator(targetEmail: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/moderators", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl text-parchment">Add moderator</h2>
        <p className="mt-1 text-sm text-parchment/65">
          Enter their email. When they sign in with that address, they&apos;ll have
          moderator access.
        </p>
        <form onSubmit={addModerator} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="moderator@example.com"
            className="flex-1 rounded-lg border border-parchment/25 bg-black/25 px-4 py-3 text-parchment outline-none focus:ring-2 focus:ring-squawk-gold/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-5 py-3 font-medium text-parchment transition hover:bg-squawk-sea/90 disabled:opacity-60"
          >
            Add
          </button>
        </form>
      </section>

      {error ? (
        <p className="text-sm text-squawk-rust" role="alert">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="font-display text-xl text-parchment">Current moderators</h2>
        <ul className="mt-4 divide-y divide-parchment/15 rounded-xl border border-parchment/15 bg-black/20">
          {initial.length === 0 ? (
            <li className="px-4 py-6 text-sm text-parchment/55">
              No moderators yet — add one above.
            </li>
          ) : (
            initial.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-parchment">{row.email}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeModerator(row.email)}
                  className="text-sm text-squawk-rust underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
