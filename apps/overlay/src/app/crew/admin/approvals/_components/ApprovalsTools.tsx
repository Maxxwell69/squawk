"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REVOKED" | "REGISTERED";
  createdAt: string;
};

function statusLabel(s: Row["status"]) {
  switch (s) {
    case "PENDING":
      return "Waiting for you";
    case "APPROVED":
      return "Approved — they can register";
    case "REVOKED":
      return "Revoked";
    case "REGISTERED":
      return "Registered";
    default:
      return s;
  }
}

export function ApprovalsTools({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPending(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      if (data.error === "already_pending") {
        setError("That email is already waiting for approval.");
      } else if (data.error === "already_approved") {
        setError("That email is already approved — they can register.");
      } else if (data.error === "already_registered") {
        setError("That email already has an account.");
      } else if (data.error === "use_captain_bootstrap") {
        setError("Captain account uses ADMIN_EMAIL on the server, not this list.");
      } else {
        setError(data.error ?? "Request failed");
      }
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function patchInvite(targetEmail: string, action: "approve" | "revoke") {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, action }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    router.refresh();
  }

  const pending = initial.filter((r) => r.status === "PENDING");
  const other = initial.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl text-parchment">Add someone</h2>
        <p className="mt-1 text-sm text-parchment/65">
          They appear below as <strong>Waiting for you</strong>. After you
          approve, they can use Join the crew to set a password.
        </p>
        <form onSubmit={addPending} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newperson@example.com"
            className="flex-1 rounded-lg border border-parchment/25 bg-black/25 px-4 py-3 text-parchment outline-none focus:ring-2 focus:ring-squawk-gold/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-5 py-3 font-medium text-parchment transition hover:bg-squawk-sea/90 disabled:opacity-60"
          >
            Add to queue
          </button>
        </form>
      </section>

      {error ? (
        <p className="text-sm text-squawk-rust" role="alert">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="font-display text-xl text-parchment">Needs approval</h2>
        <ul className="mt-4 divide-y divide-parchment/15 rounded-xl border border-parchment/15 bg-black/20">
          {pending.length === 0 ? (
            <li className="px-4 py-6 text-sm text-parchment/55">
              No pending requests — add an email above.
            </li>
          ) : (
            pending.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <span className="text-parchment">{row.email}</span>
                  <span className="ml-2 text-xs text-parchment/50">
                    {statusLabel(row.status)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patchInvite(row.email, "approve")}
                    className="rounded-lg bg-squawk-gold px-3 py-1.5 text-sm font-medium text-squawk-ink hover:bg-parchment disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patchInvite(row.email, "revoke")}
                    className="text-sm text-squawk-rust underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {other.length > 0 ? (
        <section>
          <h2 className="font-display text-xl text-parchment">Recent</h2>
          <ul className="mt-4 divide-y divide-parchment/15 rounded-xl border border-parchment/15 bg-black/20">
            {other.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm text-parchment/80">
                <span>{row.email}</span>
                <span className="ml-2 text-parchment/50">
                  — {statusLabel(row.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
