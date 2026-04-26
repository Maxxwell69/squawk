"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type WindroseTriggerId } from "@captain-squawks/shared";
import { SquawkVolumeSlider } from "@/components/SquawkVolumeSlider";
import {
  DEFAULT_LOCAL_BRIDGE_HTTP,
  getClientBridgeHttp,
  normalizeHttpOrigin,
} from "@/lib/bridge-urls";
import {
  persistSquawkVolume01,
  readSquawkVolume01,
  SQUAWK_VOL_EVENT,
} from "@/lib/squawk-volume";
import { parseCrewNameLines } from "@/lib/crew-name-lines";

const LS_BRIDGE = "squawk-battle-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";
const LS_WINDROSE_CREW = "squawk-windrose-crew-names";
const WINDROSE_PATH = "/api/windrose/trigger";

type WindroseSection = {
  title: string;
  panel: string;
  buttons: { label: string; triggerId: WindroseTriggerId }[];
};

const WINDROSE_SECTIONS: WindroseSection[] = [
  {
    title: "Windrose facts",
    panel: "border-teal-500/40 bg-teal-950/20",
    buttons: [
      { label: "What is Windrose?", triggerId: "windrose_game_hook_1" },
      { label: "Procedural world", triggerId: "windrose_open_world_1" },
      { label: "Build & craft", triggerId: "windrose_build_craft_1" },
      { label: "Sailing", triggerId: "windrose_ship_sailing_1" },
      { label: "Combat & bosses", triggerId: "windrose_combat_boss_1" },
      { label: "Solo / co-op", triggerId: "windrose_solo_coop_1" },
      { label: "Why we're playing it", triggerId: "windrose_why_watch_1" },
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
    path.includes("/api/sot/") ||
    path.includes("/api/rust/") ||
    path.includes("/api/windrose/")
  );
}

async function postWindroseTrigger(
  base: string,
  triggerId: WindroseTriggerId,
  streamDeckKey: string,
  opts?: { crewMemberName?: string; giftName?: string }
): Promise<unknown> {
  const origin = normalizeBase(base);
  const url = new URL(WINDROSE_PATH, `${origin}/`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = streamDeckKey.trim();
  if (key && bridgeUsesSecret(WINDROSE_PATH)) {
    headers["x-stream-deck-key"] = key;
  }
  const body: {
    triggerId: WindroseTriggerId;
    crewMemberName?: string;
    giftName?: string;
  } = { triggerId };
  const crew = opts?.crewMemberName?.trim();
  const gift = opts?.giftName?.trim();
  if (crew) body.crewMemberName = crew;
  if (gift) body.giftName = gift;
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

export default function WindroseBoardPage() {
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_LOCAL_BRIDGE_HTTP);
  const [streamDeckKey, setStreamDeckKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [squawkVoiceVol01, setSquawkVoiceVol01] = useState(0.9);
  const [crewListText, setCrewListText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const envBridge =
      process.env.NEXT_PUBLIC_BRIDGE_HTTP?.trim() ||
      process.env.NEXT_PUBLIC_RAILWAY_BRIDGE_HTTP?.trim();
    const bridgeFromLs = window.localStorage.getItem(LS_BRIDGE)?.trim();
    setBridgeUrl(
      envBridge
        ? normalizeHttpOrigin(envBridge)
        : (bridgeFromLs || getClientBridgeHttp())
    );
    const keyEnv = process.env.NEXT_PUBLIC_STREAM_DECK_TEST_KEY?.trim() ?? "";
    const keyLs = window.localStorage.getItem(LS_DECK_KEY)?.trim() ?? "";
    setStreamDeckKey(keyEnv || keyLs);
    setSquawkVoiceVol01(readSquawkVolume01());
    setCrewListText(window.localStorage.getItem(LS_WINDROSE_CREW) ?? "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_WINDROSE_CREW, crewListText);
  }, [crewListText]);

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

  const crewNames = useMemo(() => parseCrewNameLines(crewListText), [crewListText]);

  const fire = useCallback(
    async (
      triggerId: WindroseTriggerId,
      label: string,
      opts?: { crewMemberName?: string; giftName?: string }
    ) => {
      setBusy(true);
      try {
        const data = await postWindroseTrigger(
          bridgeUrl,
          triggerId,
          streamDeckKey,
          opts
        );
        setLog(`[${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[${label}]\n${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [bridgeUrl, streamDeckKey]
  );

  const webhookBase = useMemo(() => normalizeBase(bridgeUrl), [bridgeUrl]);
  const windroseGiftWebhook = `${webhookBase}/api/webhooks/windrose/gift-praise`;
  const windroseCrewWebhook = `${webhookBase}/api/webhooks/windrose/crew-praise`;

  const btn =
    "rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 font-body text-xs font-semibold text-parchment transition hover:bg-white/10 hover:border-white/25 disabled:opacity-45 sm:text-sm";

  return (
    <main className="min-h-screen bg-[#081411] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(30,120,100,0.28),transparent)] p-4 pb-28 text-parchment sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-teal-700/30 pb-6">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-300/90">
              Windrose
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-parchment md:text-4xl">
              Banter board
            </h1>
            <p className="mt-3 max-w-3xl font-body text-sm text-parchment/75">
              Squawk talking points for Windrose: pirate survival adventure,
              procedural islands and dungeons, build-and-craft systems, soulslite
              combat, ship sailing, and solo/co-op play.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://playwindrose.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-teal-500/40 px-3 py-1.5 text-sm text-teal-100/95 hover:bg-teal-950/40"
            >
              Official site
            </a>
            <Link
              href="/overlay/battle"
              className="rounded-lg border border-parchment/30 px-3 py-1.5 text-sm text-squawk-gold hover:bg-white/5"
            >
              TikTok battle board
            </Link>
            <Link
              href="/overlay/sea-of-thieves"
              className="rounded-lg border border-cyan-600/40 px-3 py-1.5 text-sm text-cyan-200/90 hover:bg-cyan-950/40"
            >
              Sea of Thieves board
            </Link>
            <Link
              href="/overlay/rust"
              className="rounded-lg border border-amber-600/40 px-3 py-1.5 text-sm text-amber-200/90 hover:bg-amber-950/30"
            >
              Rust board
            </Link>
            <Link
              href="/overlay/parrot-with-bubble"
              className="rounded-lg border border-teal-500/40 px-3 py-1.5 text-sm text-teal-100/95 hover:bg-teal-950/40"
            >
              Parrot overlay
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-teal-500/35 bg-teal-950/20 p-4">
          <h2 className="font-display text-sm font-bold text-teal-100">
            Crew names &amp; Squawk
          </h2>
          <p className="mt-1 font-body text-xs text-parchment/70">
            One crew name per line, saved in this browser. Use these buttons when
            Squawk needs to introduce himself or praise a deckhand by name.
          </p>
          <textarea
            value={crewListText}
            onChange={(e) => setCrewListText(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={"Quartermaster Jade\nBosun Rico"}
            className="mt-3 w-full max-w-lg rounded-lg border border-teal-700/40 bg-black/50 px-3 py-2 font-body text-sm text-parchment outline-none focus:border-teal-500/60"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={() =>
                void fire("windrose_squawk_intro", "Introduce Squawk")
              }
            >
              Introduce Squawk
            </button>
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={() =>
                void fire("windrose_feeding_time", "Feed Squawk")
              }
            >
              Feed Squawk
            </button>
            <button
              type="button"
              disabled={busy || crewNames.length === 0}
              className={btn}
              onClick={() => {
                const pick =
                  crewNames[Math.floor(Math.random() * crewNames.length)]!;
                void fire("windrose_crew_praise", `Praise crew — ${pick}`, {
                  crewMemberName: pick,
                });
              }}
            >
              Praise random crew
            </button>
          </div>
          {crewNames.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {crewNames.map((name, i) => (
                <button
                  key={`${i}-${name}`}
                  type="button"
                  disabled={busy}
                  className={btn}
                  onClick={() =>
                    void fire("windrose_crew_praise", `Praise — ${name}`, {
                      crewMemberName: name,
                    })
                  }
                >
                  Praise {name}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="font-display text-sm font-bold text-teal-100/95">
            Squawk voice
          </h2>
          <div className="mt-3 max-w-md">
            <SquawkVolumeSlider
              variant="inline"
              volume01={squawkVoiceVol01}
              onVolumeChange={(v) => {
                setSquawkVoiceVol01(v);
                persistSquawkVolume01(v);
              }}
            />
          </div>
        </section>

        <section className="rounded-xl border border-fuchsia-500/35 bg-fuchsia-950/15 p-4">
          <h2 className="font-display text-sm font-bold text-fuchsia-100/95">
            TikFinity webhooks
          </h2>
          <p className="mt-1 max-w-3xl font-body text-xs text-parchment/70">
            Paste these into TikFinity actions. They accept JSON,
            <code className="px-1 text-parchment/90">text/plain</code> JSON, or form
            fields. Username can come from
            <code className="px-1 text-parchment/90">username</code>,
            <code className="px-1 text-parchment/90">user</code>,
            <code className="px-1 text-parchment/90">nickname</code>, or nested
            <code className="px-1 text-parchment/90">data</code>. Gift hook also reads
            <code className="px-1 text-parchment/90">giftName</code> /
            <code className="px-1 text-parchment/90">gift</code>.
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-fuchsia-500/25 bg-black/35 p-3">
              <h3 className="font-display text-sm font-bold text-parchment">
                Gift praise
              </h3>
              <p className="mt-1 break-all font-mono text-[11px] text-fuchsia-100/90">
                {windroseGiftWebhook}
              </p>
            </div>
            <div className="rounded-lg border border-fuchsia-500/25 bg-black/35 p-3">
              <h3 className="font-display text-sm font-bold text-parchment">
                Crew praise
              </h3>
              <p className="mt-1 break-all font-mono text-[11px] text-fuchsia-100/90">
                {windroseCrewWebhook}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {WINDROSE_SECTIONS.map((section) => (
            <section
              key={section.title}
              className={`rounded-xl border p-4 shadow-panel ${section.panel}`}
            >
              <h2 className="font-display text-lg font-bold text-parchment">
                {section.title}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.buttons.map((button) => (
                  <button
                    key={button.triggerId}
                    type="button"
                    disabled={busy}
                    className={btn}
                    onClick={() => void fire(button.triggerId, button.label)}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {log ? (
          <pre className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] text-parchment/85">
            {log}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
