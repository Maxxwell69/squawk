"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

const bridge =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_BRIDGE_HTTP
    ? process.env.NEXT_PUBLIC_BRIDGE_HTTP
    : "http://127.0.0.1:8787";

async function post(path: string, body?: object) {
  const res = await fetch(`${bridge}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function ParrotTestPage() {
  const [log, setLog] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (label: string, path: string, body?: object) => {
    setBusy(true);
    setLog("");
    try {
      const data = await post(path, body);
      setLog(JSON.stringify(data, null, 2));
    } catch (e) {
      setLog(String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-squawk-ink p-6 text-parchment">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold">Parrot test panel</h1>
          <Link
            href="/overlay/parrot"
            className="rounded-lg border border-parchment/40 px-3 py-1 text-sm text-squawk-gold hover:bg-white/5"
          >
            Open overlay
          </Link>
        </div>
        <p className="font-body text-sm text-parchment/80">
          Bridge: <code className="text-squawk-gold">{bridge}</code> — start{" "}
          <code className="text-parchment">pnpm dev:bridge</code> first. Open the
          overlay and click <strong>Enable audio</strong> once, then trigger
          events below (response includes <code className="text-squawk-gold">message.audioUrl</code>
          when TTS is on).
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            className="text-squawk-gold underline"
            href="/overlay/parrot"
          >
            Full widget
          </Link>
          <span className="text-parchment/50">|</span>
          <Link
            className="text-squawk-gold underline"
            href="/overlay/parrot-only"
          >
            Parrot only
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-3 py-2 font-body text-sm font-semibold hover:bg-squawk-sea/80 disabled:opacity-50"
            onClick={() => run("follow", "/api/test/follow", { username: "TestMate" })}
          >
            Follow
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-3 py-2 font-body text-sm font-semibold hover:bg-squawk-sea/80 disabled:opacity-50"
            onClick={() =>
              run("gift", "/api/test/gift", {
                giftName: "Cannonball",
                username: "Scallywag42",
              })
            }
          >
            Gift
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-3 py-2 font-body text-sm font-semibold hover:bg-squawk-sea/80 disabled:opacity-50"
            onClick={() =>
              run("like", "/api/test/like-milestone", { milestone: 5000 })
            }
          >
            Like milestone
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-3 py-2 font-body text-sm font-semibold hover:bg-squawk-sea/80 disabled:opacity-50"
            onClick={() => run("share", "/api/test/share", { username: "Matey" })}
          >
            Share
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-squawk-sea px-3 py-2 font-body text-sm font-semibold hover:bg-squawk-sea/80 disabled:opacity-50"
            onClick={() =>
              run("comment", "/api/test/comment", {
                username: "Crew",
                text: "Rust never sleeps!",
              })
            }
          >
            Comment
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-squawk-rust px-3 py-2 font-body text-sm font-semibold text-parchment hover:bg-squawk-rust/90 disabled:opacity-50"
            onClick={() =>
              run("chaos", "/api/test/chaos", { note: "Full raid!" })
            }
          >
            Chaos
          </button>
        </div>
        {log ? (
          <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-parchment/90">
            {log}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
