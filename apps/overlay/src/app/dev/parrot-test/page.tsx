"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_LOCAL_BRIDGE_HTTP,
  getClientBridgeHttp,
  getClientRailwayBridgeHttp,
} from "@/lib/bridge-urls";

const LS_LOCAL = "squawk-parrot-test-local-bridge";
const LS_RAILWAY = "squawk-parrot-test-railway-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";

type StreamDeckAction = { label: string; path: string };

const STREAM_DECK_ACTIONS: StreamDeckAction[] = [
  { label: "Hello", path: "/api/streamdeck/hello" },
  { label: "Please share", path: "/api/streamdeck/please-share" },
  { label: "Thanks likes", path: "/api/streamdeck/thanks-likes" },
  { label: "Thanks share", path: "/api/streamdeck/thanks-share" },
  { label: "Pirate Maxx", path: "/api/streamdeck/pirate-maxx" },
  { label: "Exit (stage left)", path: "/api/streamdeck/exit" },
  { label: "Return", path: "/api/streamdeck/return" },
  { label: "Peck", path: "/api/streamdeck/peck" },
  { label: "Dancing Squawk", path: "/api/streamdeck/dancing-squawk" },
  { label: "Feeding time", path: "/api/streamdeck/squawk-feeding-time" },
];

type SimAction = { label: string; path: string; body: object };

const SIMULATE_ACTIONS: SimAction[] = [
  { label: "Follow", path: "/api/test/follow", body: { username: "TestMate" } },
  {
    label: "Gift",
    path: "/api/test/gift",
    body: { giftName: "Cannonball", username: "Scallywag42" },
  },
  {
    label: "Like milestone",
    path: "/api/test/like-milestone",
    body: { milestone: 5000 },
  },
  { label: "Share", path: "/api/test/share", body: { username: "Matey" } },
  {
    label: "Comment",
    path: "/api/test/comment",
    body: { username: "Crew", text: "Rust never sleeps!" },
  },
  { label: "Chaos", path: "/api/test/chaos", body: { note: "Full raid!" } },
];

function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return DEFAULT_LOCAL_BRIDGE_HTTP;
  if (t.startsWith("//")) return `https:${t}`;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

function isStreamDeckPath(path: string): boolean {
  return path.includes("/api/streamdeck/");
}

async function postBridge(
  base: string,
  path: string,
  body: object,
  streamDeckKey: string
): Promise<unknown> {
  const origin = normalizeBase(base);
  const url = new URL(path, `${origin}/`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = streamDeckKey.trim();
  if (key && isStreamDeckPath(path)) {
    headers["x-stream-deck-key"] = key;
  }
  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function curlSnippet(
  base: string,
  path: string,
  body: object,
  streamDeckKey: string
): string {
  const origin = normalizeBase(base);
  const url = new URL(path, `${origin}/`).toString();
  const key = streamDeckKey.trim();
  const deckHeader =
    key && isStreamDeckPath(path)
      ? ` \\\n  -H "x-stream-deck-key: ${key.replace(/"/g, '\\"')}"`
      : "";
  const bodyJson = JSON.stringify(body).replace(/'/g, "'\\''");
  return `curl -sS -X POST${deckHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyJson}' \\\n  "${url}"`;
}

function isLocalBridge(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

type ColumnProps = {
  title: string;
  description: string;
  bridgeUrl: string;
  onBridgeUrlChange: (v: string) => void;
  accent: "sea" | "gold";
  streamDeckKey: string;
  busy: boolean;
  onFire: (
    column: string,
    label: string,
    path: string,
    body: object
  ) => Promise<void>;
  columnId: string;
};

function BridgeColumn({
  title,
  description,
  bridgeUrl,
  onBridgeUrlChange,
  accent,
  streamDeckKey,
  busy,
  onFire,
  columnId,
}: ColumnProps) {
  const ring =
    accent === "gold"
      ? "border-squawk-gold/50 focus:border-squawk-gold"
      : "border-squawk-sea/50 focus:border-squawk-sea";

  const allCurls = useMemo(() => {
    const lines: string[] = [];
    lines.push(`# ${title} — Stream Deck routes`);
    for (const a of STREAM_DECK_ACTIONS) {
      lines.push(curlSnippet(bridgeUrl, a.path, {}, streamDeckKey));
      lines.push("");
    }
    lines.push(`# ${title} — Simulate events`);
    for (const a of SIMULATE_ACTIONS) {
      lines.push(curlSnippet(bridgeUrl, a.path, a.body, streamDeckKey));
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [title, bridgeUrl, streamDeckKey]);

  const btnSea =
    "rounded-lg bg-squawk-sea px-2.5 py-2 font-body text-xs font-semibold hover:bg-squawk-sea/80 disabled:opacity-50 sm:text-sm";
  const btnGold =
    "rounded-lg bg-squawk-gold/90 px-2.5 py-2 font-body text-xs font-semibold text-squawk-ink hover:bg-squawk-gold disabled:opacity-50 sm:text-sm";
  const btnRust =
    "rounded-lg bg-squawk-rust px-2.5 py-2 font-body text-xs font-semibold text-parchment hover:bg-squawk-rust/90 disabled:opacity-50 sm:text-sm";

  return (
    <section
      className={`rounded-xl border border-white/10 bg-black/25 p-4 ${accent === "gold" ? "ring-1 ring-squawk-gold/20" : "ring-1 ring-squawk-sea/20"}`}
    >
      <h2 className="font-display text-lg font-bold text-squawk-gold">{title}</h2>
      <p className="mt-1 font-body text-xs text-parchment/70">{description}</p>
      <label className="mt-3 block font-body text-xs font-medium text-parchment/80">
        Bridge base URL
        <input
          type="text"
          value={bridgeUrl}
          onChange={(e) => onBridgeUrlChange(e.target.value)}
          spellCheck={false}
          className={`mt-1 w-full rounded-lg border bg-black/40 px-3 py-2 font-mono text-xs text-parchment outline-none ${ring}`}
        />
      </label>
      <p className="mt-1 font-mono text-[10px] text-parchment/50">
        <a
          href={`${normalizeBase(bridgeUrl)}/health`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-squawk-gold underline"
        >
          /health
        </a>
      </p>

      <h3 className="mt-4 font-display text-sm font-semibold text-parchment">
        Stream Deck (POST)
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STREAM_DECK_ACTIONS.map((a) => (
          <button
            key={a.path}
            type="button"
            disabled={busy}
            className={a.label.includes("Exit") ? btnRust : btnGold}
            onClick={() => void onFire(columnId, a.label, a.path, {})}
          >
            {a.label}
          </button>
        ))}
      </div>

      <h3 className="mt-5 font-display text-sm font-semibold text-parchment">
        Simulate events (POST)
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SIMULATE_ACTIONS.map((a) => (
          <button
            key={a.path}
            type="button"
            disabled={busy}
            className={a.label === "Chaos" ? btnRust : btnSea}
            onClick={() => void onFire(columnId, a.label, a.path, a.body)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <details className="mt-4 rounded-lg border border-white/10 bg-black/30">
        <summary className="cursor-pointer select-none px-3 py-2 font-body text-xs font-semibold text-squawk-gold">
          Copy cURL (all routes on this bridge)
        </summary>
        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            className="mb-2 rounded border border-parchment/30 px-2 py-1 font-body text-xs text-parchment hover:bg-white/5"
            onClick={() => void navigator.clipboard.writeText(allCurls)}
          >
            Copy to clipboard
          </button>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-parchment/85">
            {allCurls}
          </pre>
        </div>
      </details>
    </section>
  );
}

export default function ParrotTestPage() {
  const [localBase, setLocalBase] = useState(DEFAULT_LOCAL_BRIDGE_HTTP);
  const [railwayBase, setRailwayBase] = useState("");
  const [streamDeckKey, setStreamDeckKey] = useState("");
  const [log, setLog] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [hostedButLocalBridge, setHostedButLocalBridge] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromLs = (k: string, fallback: string) =>
      window.localStorage.getItem(k)?.trim() || fallback;
    setLocalBase(fromLs(LS_LOCAL, DEFAULT_LOCAL_BRIDGE_HTTP));
    const envRailway = getClientRailwayBridgeHttp();
    setRailwayBase(fromLs(LS_RAILWAY, envRailway));
    const envKey =
      process.env.NEXT_PUBLIC_STREAM_DECK_TEST_KEY?.trim() ??
      fromLs(LS_DECK_KEY, "");
    setStreamDeckKey(envKey);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_LOCAL, localBase);
  }, [localBase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (railwayBase.trim()) window.localStorage.setItem(LS_RAILWAY, railwayBase);
  }, [railwayBase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_DECK_KEY, streamDeckKey);
  }, [streamDeckKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hostname;
    const onDevice =
      h === "localhost" || h === "127.0.0.1" || h === "[::1]";
    const bridge = getClientBridgeHttp();
    setHostedButLocalBridge(!onDevice && isLocalBridge(bridge));
  }, []);

  const onFire = useCallback(
    async (column: string, label: string, path: string, body: object) => {
      const base = column === "railway" ? railwayBase : localBase;
      if (column === "railway" && !railwayBase.trim()) {
        setLog(
          `[railway] Set the Railway bridge URL in the right column (or NEXT_PUBLIC_RAILWAY_BRIDGE_HTTP in .env).`
        );
        return;
      }
      setBusy(true);
      try {
        const data = await postBridge(base, path, body, streamDeckKey);
        setLog(`[${column}] ${label}\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[${column}] ${label}\n${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [localBase, railwayBase, streamDeckKey]
  );

  return (
    <main className="min-h-screen bg-squawk-ink p-4 text-parchment sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
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
            This page is hosted remotely but{" "}
            <code className="text-squawk-gold">NEXT_PUBLIC_BRIDGE_HTTP</code>{" "}
            still points at{" "}
            <code className="text-squawk-gold">127.0.0.1</code>. Set{" "}
            <code className="text-parchment">NEXT_PUBLIC_BRIDGE_HTTP</code> and{" "}
            <code className="text-parchment">NEXT_PUBLIC_WS_URL</code> (or{" "}
            <code className="text-parchment">NEXT_PUBLIC_RAILWAY_BRIDGE_HTTP</code>{" "}
            for the Railway column) on the deployed overlay, or use this page from
            localhost.
          </p>
        ) : null}

        <div className="rounded-lg border border-squawk-gold/40 bg-black/30 px-3 py-3 font-body text-sm text-parchment">
          <p className="font-semibold text-squawk-gold">Stream Deck secret (optional)</p>
          <p className="mt-1 text-xs text-parchment/80">
            If the bridge has <code className="text-parchment/90">STREAM_DECK_SECRET</code>{" "}
            set, paste the same value here (or set{" "}
            <code className="text-parchment/90">NEXT_PUBLIC_STREAM_DECK_TEST_KEY</code>{" "}
            for local builds — never commit real secrets). Sent as{" "}
            <code className="text-parchment/90">x-stream-deck-key</code>. Leave empty
            when the bridge has no secret.
          </p>
          <input
            type="password"
            autoComplete="off"
            value={streamDeckKey}
            onChange={(e) => setStreamDeckKey(e.target.value)}
            placeholder="Stream Deck key…"
            className="mt-2 w-full max-w-md rounded-lg border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs text-parchment outline-none focus:border-squawk-gold/60"
          />
        </div>

        <div className="rounded-lg border border-squawk-gold/40 bg-black/30 px-3 py-3 font-body text-sm text-parchment">
          <p className="font-semibold text-squawk-gold">Why there is no sound</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-parchment/90">
            <li>
              Audio plays on the <strong>overlay</strong> tab — keep it open and{" "}
              <strong>ONLINE</strong>.
            </li>
            <li>
              Click <strong>Enable audio</strong> once on the overlay.
            </li>
            <li>
              TTS needs <code className="text-squawk-gold">message.audioUrl</code> in
              the JSON when the bridge has TTS enabled.
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
          <Link className="text-squawk-gold underline" href="/overlay/parrot">
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
          <Link className="text-squawk-gold underline" href="/overlay/parrot-only">
            Parrot only
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <BridgeColumn
            title="Local bridge"
            description="Usually http://127.0.0.1:8787 while pnpm dev runs the Fastify app."
            bridgeUrl={localBase}
            onBridgeUrlChange={setLocalBase}
            accent="sea"
            streamDeckKey={streamDeckKey}
            busy={busy}
            onFire={onFire}
            columnId="local"
          />
          <BridgeColumn
            title="Railway bridge"
            description="Paste your deployed bridge origin (no path). Prefills from NEXT_PUBLIC_RAILWAY_BRIDGE_HTTP when set."
            bridgeUrl={railwayBase}
            onBridgeUrlChange={setRailwayBase}
            accent="gold"
            streamDeckKey={streamDeckKey}
            busy={busy}
            onFire={onFire}
            columnId="railway"
          />
        </div>

        {log ? (
          <pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-parchment/90">
            {log}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
