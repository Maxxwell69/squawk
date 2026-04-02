"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientBridgeHttp } from "@/lib/bridge-urls";

const bridge = getClientBridgeHttp();

async function post(path: string, body?: object) {
  const url = new URL(path, `${bridge}/`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function isLocalBridge(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

export default function ParrotTestPage() {
  const [log, setLog] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [hostedButLocalBridge, setHostedButLocalBridge] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hostname;
    const onDevice =
      h === "localhost" || h === "127.0.0.1" || h === "[::1]";
    setHostedButLocalBridge(!onDevice && isLocalBridge(bridge));
  }, []);

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
        {hostedButLocalBridge ? (
          <p className="rounded-lg border border-squawk-rust/60 bg-squawk-rust/15 px-3 py-2 font-body text-sm text-parchment">
            This page is not on your machine, but the bridge URL is still{" "}
            <code className="text-squawk-gold">127.0.0.1</code>. Rebuild the
            overlay with{" "}
            <code className="text-parchment">NEXT_PUBLIC_BRIDGE_HTTP</code> (and
            WebSocket URL) pointing at your deployed bridge, or open this page
            from localhost while running the bridge locally.
          </p>
        ) : null}
        <div className="rounded-lg border border-squawk-gold/40 bg-black/30 px-3 py-3 font-body text-sm text-parchment">
          <p className="font-semibold text-squawk-gold">Why there is no sound</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-parchment/90">
            <li>
              Sound plays on the <strong>overlay</strong> tab (
              <code className="text-parchment/80">/overlay/parrot</code>), not on
              this test page. Keep that tab open while you click Follow.
            </li>
            <li>
              On the overlay, wait until it says <strong>ONLINE</strong> (not{" "}
              <strong>OFFLINE</strong>). OFFLINE means the browser cannot reach
              the WebSocket — fix <code className="text-parchment/80">
                NEXT_PUBLIC_WS_URL
              </code>{" "}
              and redeploy the overlay.
            </li>
            <li>
              On the overlay, click <strong>Enable audio</strong> once. Without
              that, TTS is skipped and you only get a silent timer.
            </li>
            <li>
              After Follow, check the JSON: <code className="text-squawk-gold">
                message.audioUrl
              </code>{" "}
              must be present for real speech. If it is missing, fix the bridge (
              <code className="text-parchment/80">FEATURE_TTS</code>,{" "}
              <code className="text-parchment/80">AUDIO_PUBLIC_BASE_URL</code>
              ).
            </li>
          </ol>
        </div>
        <p className="font-body text-sm text-parchment/80">
          Bridge: <code className="text-squawk-gold">{bridge}</code> —{" "}
          <a
            href={`${bridge}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-squawk-gold underline"
          >
            Open /health
          </a>{" "}
          (should show{" "}
          <code className="text-parchment/80">captain-squawks-bridge</code>). If
          Follow returns <strong>404</strong>, this URL is not the Fastify bridge
          (wrong Railway Dockerfile — use{" "}
          <code className="text-parchment/80">apps/local-bridge/Dockerfile</code>
          ). Voice
          plays in the overlay via WebSocket (<code className="text-squawk-gold">
            PARROT_SPEAK
          </code>
          ); open the overlay and click <strong>Enable audio</strong> once.
          When TTS runs, the JSON below includes{" "}
          <code className="text-squawk-gold">message.audioUrl</code>. If you see{" "}
          <code className="text-parchment">payload</code> instead of{" "}
          <code className="text-parchment">message</code>, the bridge answering
          the request is an older build.
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
          <Link
            className="text-squawk-gold underline"
            href="/overlay/parrot"
          >
            Full widget
          </Link>
          <span className="text-parchment/50">|</span>
          <Link
            className="text-squawk-gold underline"
            href="/overlay/parrot-with-bubble"
          >
            Parrot + bubble
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
