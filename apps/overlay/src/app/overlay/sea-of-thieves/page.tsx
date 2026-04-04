"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SotTriggerId } from "@captain-squawks/shared";
import { SquawkVolumeSlider } from "@/components/SquawkVolumeSlider";
import {
  DEFAULT_LOCAL_BRIDGE_HTTP,
  getClientBridgeHttp,
} from "@/lib/bridge-urls";
import {
  persistSquawkVolume01,
  readSquawkVolume01,
  SQUAWK_VOL_EVENT,
} from "@/lib/squawk-volume";

/** Same keys as battle board — one bridge setup for both UIs. */
const LS_BRIDGE = "squawk-battle-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";
const SOT_PATH = "/api/sot/trigger";

type SotSection = {
  title: string;
  hint: string;
  panel: string;
  buttons: { label: string; triggerId: SotTriggerId }[];
};

const SOT_SECTIONS: SotSection[] = [
  {
    title: "Island visit",
    hint: "Drop anchor, explore, rumors.",
    panel: "border-cyan-500/35 bg-cyan-950/15",
    buttons: [
      { label: "Arrival A", triggerId: "sot_island_arrival_1" },
      { label: "Arrival B", triggerId: "sot_island_arrival_2" },
      { label: "Explore", triggerId: "sot_island_explore_1" },
      { label: "Rumor / lead", triggerId: "sot_island_rumor_1" },
    ],
  },
  {
    title: "Fight other crews",
    hint: "Spot, engage, sink, respawn.",
    panel: "border-rose-500/40 bg-rose-950/10",
    buttons: [
      { label: "Spotted players", triggerId: "sot_pvp_spot_1" },
      { label: "Engaged", triggerId: "sot_pvp_engaged_1" },
      { label: "They sank", triggerId: "sot_pvp_sink_1" },
      { label: "We respawned", triggerId: "sot_pvp_respawn_1" },
    ],
  },
  {
    title: "Reaper chase",
    hint: "Spotted, chase, danger, escape.",
    panel: "border-red-600/45 bg-red-950/15",
    buttons: [
      { label: "Reaper spotted", triggerId: "sot_reaper_spotted_1" },
      { label: "Being chased", triggerId: "sot_reaper_chase_1" },
      { label: "Too close", triggerId: "sot_reaper_close_1" },
      { label: "Escaped", triggerId: "sot_reaper_escape_1" },
    ],
  },
  {
    title: "Treasure & digging",
    hint: "Map, X marks, chest, sell.",
    panel: "border-amber-400/35 bg-amber-950/10",
    buttons: [
      { label: "Reading map", triggerId: "sot_dig_map_1" },
      { label: "Digging X", triggerId: "sot_dig_x_marks_1" },
      { label: "Chest up", triggerId: "sot_chest_up_1" },
      { label: "Turn in gold", triggerId: "sot_turn_in_1" },
    ],
  },
  {
    title: "Thanks viewers",
    hint: "Gifts, raids, hype, MVPs.",
    panel: "border-emerald-500/35 bg-emerald-950/15",
    buttons: [
      { label: "Thanks gifts", triggerId: "sot_thanks_gifts_1" },
      { label: "Thanks raid", triggerId: "sot_thanks_raiders_1" },
      { label: "Thanks hype", triggerId: "sot_thanks_hype_1" },
      { label: "MVP chat", triggerId: "sot_thanks_mvp_chat_1" },
    ],
  },
  {
    title: "Feeding time — Squawk",
    hint: "Plays feeding emote + line (same clip as Stream Deck feeding).",
    panel: "border-orange-400/40 bg-orange-950/10",
    buttons: [{ label: "Feeding time", triggerId: "sot_feeding_time" }],
  },
  {
    title: "Drink time",
    hint: "Cheers, grog, IRL break.",
    panel: "border-indigo-400/35 bg-indigo-950/15",
    buttons: [
      { label: "Cheers", triggerId: "sot_drink_cheers_1" },
      { label: "Grog", triggerId: "sot_drink_grog_1" },
      { label: "Grab a drink (break)", triggerId: "sot_drink_break_1" },
    ],
  },
  {
    title: "Music & dance",
    hint: "Shanty dance emote + victory dance clip.",
    panel: "border-violet-500/40 bg-violet-950/15",
    buttons: [
      { label: "Shanty / dancing", triggerId: "sot_dance_shanty_1" },
      { label: "Big sea victory dance", triggerId: "sot_dance_victory_sea_1" },
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
    path.includes("/api/battle/") ||
    path.includes("/api/sot/")
  );
}

async function postSotTrigger(
  base: string,
  triggerId: SotTriggerId,
  streamDeckKey: string
): Promise<unknown> {
  const origin = normalizeBase(base);
  const url = new URL(SOT_PATH, `${origin}/`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = streamDeckKey.trim();
  if (key && bridgeUsesSecret(SOT_PATH)) {
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

export default function SeaOfThievesBoardPage() {
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_LOCAL_BRIDGE_HTTP);
  const [streamDeckKey, setStreamDeckKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [squawkVoiceVol01, setSquawkVoiceVol01] = useState(0.9);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromLs = window.localStorage.getItem(LS_BRIDGE)?.trim();
    setBridgeUrl(fromLs || getClientBridgeHttp());
    const keyFromLs =
      window.localStorage.getItem(LS_DECK_KEY)?.trim() ??
      process.env.NEXT_PUBLIC_STREAM_DECK_TEST_KEY?.trim() ??
      "";
    setStreamDeckKey(keyFromLs);
    setSquawkVoiceVol01(readSquawkVolume01());
  }, []);

  useEffect(() => {
    const onVol = (e: Event) => {
      const d = (e as CustomEvent<number>).detail;
      if (typeof d === "number" && Number.isFinite(d)) {
        setSquawkVoiceVol01(Math.min(1, Math.max(0, d)));
      }
    };
    window.addEventListener(SQUAWK_VOL_EVENT, onVol);
    return () => window.removeEventListener(SQUAWK_VOL_EVENT, onVol);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_BRIDGE, bridgeUrl);
  }, [bridgeUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_DECK_KEY, streamDeckKey);
  }, [streamDeckKey]);

  const fire = useCallback(
    async (triggerId: SotTriggerId, label: string) => {
      setBusy(true);
      try {
        const data = await postSotTrigger(bridgeUrl, triggerId, streamDeckKey);
        setLog(`[${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[${label}]\n${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [bridgeUrl, streamDeckKey]
  );

  const btn =
    "rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 font-body text-xs font-semibold text-parchment transition hover:bg-white/10 hover:border-white/25 disabled:opacity-45 sm:text-sm";

  return (
    <main className="min-h-screen bg-[#070d14] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(30,90,120,0.35),transparent)] p-4 pb-32 text-parchment sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-cyan-700/30 pb-6">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/90">
              Sea of Thieves
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-parchment md:text-4xl">
              Voyages board
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-parchment/70">
              First Mate Squawks voice-overs for Pirate Maxx&apos;s SoT sessions.
              Each button picks a random line from that moment and sends it to
              the bridge → parrot overlay (TTS when enabled). Separate from the
              TikTok battle timer board.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/overlay/battle"
              className="rounded-lg border border-parchment/30 px-3 py-1.5 text-sm text-squawk-gold hover:bg-white/5"
            >
              TikTok battle board
            </Link>
            <Link
              href="/overlay/parrot-with-bubble"
              className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-sm text-cyan-200/90 hover:bg-cyan-950/40"
            >
              Parrot overlay
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="font-display text-sm font-bold text-cyan-200/90">
            Bridge &amp; voice
          </h2>
          <label className="mt-3 block font-body text-xs text-parchment/75">
            Bridge base URL
            <input
              type="text"
              value={bridgeUrl}
              onChange={(e) => setBridgeUrl(e.target.value)}
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-parchment outline-none focus:border-cyan-500/50"
            />
          </label>
          <label className="mt-3 block font-body text-xs text-parchment/75">
            Stream Deck secret (optional — same as{" "}
            <code className="text-parchment/85">STREAM_DECK_SECRET</code>)
            <input
              type="password"
              autoComplete="off"
              value={streamDeckKey}
              onChange={(e) => setStreamDeckKey(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-parchment outline-none focus:border-cyan-500/50"
            />
          </label>
          <div className="mt-4 border-t border-white/10 pt-4">
            <h3 className="font-display text-xs font-bold text-parchment/90">
              Squawk voice (parrot overlay)
            </h3>
            <p className="mt-1 font-body text-xs text-parchment/55">
              Same slider as the battle board — TTS / browser speech level.
            </p>
            <div className="mt-2 max-w-md">
              <SquawkVolumeSlider
                variant="inline"
                volume01={squawkVoiceVol01}
                onVolumeChange={(v) => {
                  setSquawkVoiceVol01(v);
                  persistSquawkVolume01(v);
                }}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {SOT_SECTIONS.map((sec) => (
            <section
              key={sec.title}
              className={`rounded-xl border p-4 shadow-panel ${sec.panel}`}
            >
              <h2 className="font-display text-lg font-bold text-parchment">
                {sec.title}
              </h2>
              <p className="mt-1 font-body text-xs text-parchment/60">{sec.hint}</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sec.buttons.map((b) => (
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
        </div>

        <p className="font-body text-center text-[11px] text-parchment/45">
          API: <code className="text-parchment/60">POST /api/sot/trigger</code>{" "}
          JSON <code className="text-parchment/60">{`{ "triggerId": "…" }`}</code>{" "}
          — see <code className="text-parchment/60">STREAM_COMMANDS.md</code>
        </p>

        {log ? (
          <pre className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] text-parchment/85">
            {log}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
