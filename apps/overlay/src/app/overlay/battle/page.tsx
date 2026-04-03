"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BattleTriggerId } from "@captain-squawks/shared";
import {
  DEFAULT_LOCAL_BRIDGE_HTTP,
  getClientBridgeHttp,
} from "@/lib/bridge-urls";

const LS_BRIDGE = "squawk-battle-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";

const BATTLE_PATH = "/api/battle/trigger";

type BattleSection = {
  title: string;
  hint?: string;
  buttons: { label: string; triggerId: BattleTriggerId }[];
};

const BATTLE_SECTIONS: BattleSection[] = [
  {
    title: "Prepare for battle",
    hint: "Taps and small gifts first — pace the fodder.",
    buttons: [
      { label: "Warm the deck", triggerId: "battle_prepare_1" },
      { label: "Pace the fodder", triggerId: "battle_prepare_2" },
      { label: "Light taps first", triggerId: "battle_prepare_3" },
      { label: "Save big gifts", triggerId: "battle_prepare_4" },
      { label: "Marathon, not sprint", triggerId: "battle_prepare_5" },
      { label: "Eyes up — rhythm", triggerId: "battle_prepare_6" },
      { label: "Breathe & warm up", triggerId: "battle_prepare_7" },
      { label: "Light gifts now", triggerId: "battle_prepare_8" },
    ],
  },
  {
    title: "Battle — minute one",
    hint: "Nice and easy, fun first — watch for extra on first gift.",
    buttons: [
      { label: "Line 1", triggerId: "battle_phase1_1" },
      { label: "Line 2", triggerId: "battle_phase1_2" },
      { label: "Line 3", triggerId: "battle_phase1_3" },
      { label: "Line 4", triggerId: "battle_phase1_4" },
      { label: "Line 5", triggerId: "battle_phase1_5" },
      { label: "Line 6", triggerId: "battle_phase1_6" },
      { label: "Line 7", triggerId: "battle_phase1_7" },
      { label: "Line 8", triggerId: "battle_phase1_8" },
      { label: "Line 9", triggerId: "battle_phase1_9" },
      { label: "Line 10", triggerId: "battle_phase1_10" },
    ],
  },
  {
    title: "Battle — phase two",
    hint: "3× gifting, cannons, fun.",
    buttons: [
      { label: "Watch 3× gifting", triggerId: "battle_phase2_watch_3x" },
      { label: "Cannons ready", triggerId: "battle_phase2_cannons" },
      { label: "Time for fun", triggerId: "battle_phase2_fun" },
      { label: "Battle two live", triggerId: "battle_phase2_battle_on" },
    ],
  },
  {
    title: "Battle — phase three",
    hint: "Chain shot, halfway, push.",
    buttons: [
      { label: "Chain shot", triggerId: "battle_phase3_chain_shot" },
      { label: "More than halfway", triggerId: "battle_phase3_halfway" },
      { label: "Stack with purpose", triggerId: "battle_phase3_push" },
    ],
  },
  {
    title: "Battle — last minute",
    hint: "Snipers, board, ahead vs behind.",
    buttons: [
      { label: "Watch snipers", triggerId: "battle_phase4_snipers" },
      { label: "Prepare to board", triggerId: "battle_phase4_board" },
      { label: "We're ahead", triggerId: "battle_phase4_ahead" },
      { label: "We're behind", triggerId: "battle_phase4_behind" },
    ],
  },
  {
    title: "Repair & party",
    hint: "Congrats, MVPs — Squawk will ask chat for names.",
    buttons: [
      { label: "Repair & party", triggerId: "battle_phase5_repair_party" },
      { label: "We won", triggerId: "battle_phase5_we_won" },
      { label: "We lost", triggerId: "battle_phase5_we_lost" },
      { label: "Who were the MVPs?", triggerId: "battle_phase5_mvps_prompt" },
    ],
  },
];

function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return DEFAULT_LOCAL_BRIDGE_HTTP;
  if (t.startsWith("//")) return `https:${t}`;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

function bridgeUsesSecret(path: string): boolean {
  return (
    path.includes("/api/streamdeck/") ||
    path.includes("/api/battle/")
  );
}

async function postBattleTrigger(
  base: string,
  triggerId: BattleTriggerId,
  streamDeckKey: string
): Promise<unknown> {
  const origin = normalizeBase(base);
  const url = new URL(BATTLE_PATH, `${origin}/`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = streamDeckKey.trim();
  if (key && bridgeUsesSecret(BATTLE_PATH)) {
    headers["x-stream-deck-key"] = key;
  }
  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify({ triggerId }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

const TOTAL_SEC = 5 * 60;

function formatClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function BattleBoardPage() {
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_LOCAL_BRIDGE_HTTP);
  const [streamDeckKey, setStreamDeckKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [remainingSec, setRemainingSec] = useState(TOTAL_SEC);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromLs = window.localStorage.getItem(LS_BRIDGE)?.trim();
    setBridgeUrl(fromLs || getClientBridgeHttp());
    const keyFromLs =
      window.localStorage.getItem(LS_DECK_KEY)?.trim() ??
      process.env.NEXT_PUBLIC_STREAM_DECK_TEST_KEY?.trim() ??
      "";
    setStreamDeckKey(keyFromLs);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_BRIDGE, bridgeUrl);
  }, [bridgeUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_DECK_KEY, streamDeckKey);
  }, [streamDeckKey]);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  const fire = useCallback(
    async (triggerId: BattleTriggerId, label: string) => {
      setBusy(true);
      try {
        const data = await postBattleTrigger(bridgeUrl, triggerId, streamDeckKey);
        setLog(`[${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[${label}]\n${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [bridgeUrl, streamDeckKey]
  );

  const phaseHint = useMemo(() => {
    const t = TOTAL_SEC - remainingSec;
    if (t < 60) return "Phase: Prepare / minute one";
    if (t < 120) return "Phase: ~Minute two";
    if (t < 180) return "Phase: ~Minute three";
    if (t < 240) return "Phase: ~Last minute soon";
    return "Phase: ~Final stretch / party";
  }, [remainingSec]);

  const btn =
    "rounded-lg border border-white/15 bg-black/35 px-2.5 py-2 font-body text-xs font-semibold text-parchment hover:bg-white/10 disabled:opacity-50 sm:text-sm";
  const btnCheer =
    "rounded-lg bg-squawk-gold/90 px-3 py-2 font-body text-sm font-bold text-squawk-ink hover:bg-squawk-gold disabled:opacity-50";

  return (
    <main className="min-h-screen bg-squawk-ink p-4 pb-28 text-parchment sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-squawk-gold">
              Battle board
            </h1>
            <p className="mt-1 max-w-xl font-body text-sm text-parchment/75">
              Five-minute match timer (reference only). Buttons send lines through
              the bridge — same secret as Stream Deck when{" "}
              <code className="text-parchment/90">STREAM_DECK_SECRET</code> is set.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/overlay/parrot"
              className="rounded-lg border border-parchment/40 px-3 py-1.5 text-sm text-squawk-gold hover:bg-white/5"
            >
              Overlay
            </Link>
            <Link
              href="/dev/parrot-test"
              className="rounded-lg border border-parchment/40 px-3 py-1.5 text-sm text-squawk-gold hover:bg-white/5"
            >
              Parrot test
            </Link>
          </div>
        </div>

        <section className="rounded-xl border border-squawk-gold/35 bg-black/30 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-mono text-4xl font-bold tabular-nums text-squawk-gold">
              {formatClock(remainingSec)}
            </div>
            <div className="font-body text-sm text-parchment/70">{phaseHint}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              disabled={running && remainingSec === 0}
              onClick={() => {
                setRemainingSec(TOTAL_SEC);
                setRunning(true);
              }}
            >
              Start / restart 5:00
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                setRunning(false);
                setRemainingSec(TOTAL_SEC);
              }}
            >
              Reset clock
            </button>
          </div>
        </section>

        <label className="block rounded-xl border border-white/10 bg-black/25 p-4">
          <span className="font-body text-xs font-medium text-parchment/80">
            Bridge base URL
          </span>
          <input
            type="text"
            value={bridgeUrl}
            onChange={(e) => setBridgeUrl(e.target.value)}
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-squawk-sea/50 bg-black/40 px-3 py-2 font-mono text-xs text-parchment outline-none focus:border-squawk-gold/60"
          />
        </label>

        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="font-body text-xs font-semibold text-squawk-gold">
            Stream Deck secret (optional)
          </p>
          <input
            type="password"
            autoComplete="off"
            value={streamDeckKey}
            onChange={(e) => setStreamDeckKey(e.target.value)}
            placeholder="Same as STREAM_DECK_SECRET on the bridge…"
            className="mt-2 w-full max-w-md rounded-lg border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs text-parchment outline-none focus:border-squawk-gold/60"
          />
        </div>

        {BATTLE_SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <h2 className="font-display text-lg font-bold text-squawk-gold">
              {section.title}
            </h2>
            {section.hint ? (
              <p className="mt-1 font-body text-xs text-parchment/65">
                {section.hint}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {section.buttons.map((b) => (
                <button
                  key={b.triggerId}
                  type="button"
                  disabled={busy}
                  className={btn}
                  onClick={() => void fire(b.triggerId, b.label)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </section>
        ))}

        {log ? (
          <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-parchment/90">
            {log}
          </pre>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-squawk-gold/30 bg-squawk-ink/95 p-3 backdrop-blur sm:p-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="font-body text-xs text-parchment/70">
            Squawk cheer — hype the troops (random line each tap)
          </p>
          <button
            type="button"
            disabled={busy}
            className={btnCheer}
            onClick={() => void fire("battle_cheer", "Squawk cheer")}
          >
            Squawk cheer
          </button>
        </div>
      </div>
    </main>
  );
}
