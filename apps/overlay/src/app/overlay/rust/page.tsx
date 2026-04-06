"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RUST_AFK_BANTER_TRIGGER_IDS,
  RUST_AFK_CAPTAIN_BANTER_TRIGGER_IDS,
  RUST_STREAM_IDLE_TRIGGER_IDS,
  type RustTriggerId,
} from "@captain-squawks/shared";
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
import {
  useAdventureMusicPlaylist,
  type AdventureMusicTrack,
} from "@/hooks/useAdventureMusicPlaylist";
import { parseCrewNameLines } from "@/lib/crew-name-lines";

const LS_BRIDGE = "squawk-battle-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";
const LS_RUST_ADV_VOL = "squawk-rust-adventure-music-vol";
const LS_RUST_ADV_MUTE = "squawk-rust-adventure-music-muted";
const LS_RUST_CREW = "squawk-rust-crew-names";
const RUST_PATH = "/api/rust/trigger";

const STREAMING_SQUAWK_IDLE_MS = 60_000;
const STREAMING_IDLE_POLL_MS = 4_000;
const AFK_BANTER_MS = 40_000;

type AfkVariant = "general" | "captain";

type RustSection = {
  title: string;
  panel: string;
  buttons: { label: string; triggerId: RustTriggerId }[];
};

const RUST_SECTIONS: RustSection[] = [
  {
    title: "Roaming",
    panel: "border-amber-600/35 bg-amber-950/15",
    buttons: [
      { label: "Roam A", triggerId: "rust_roam_1" },
      { label: "Roam B", triggerId: "rust_roam_2" },
      { label: "Roam C", triggerId: "rust_roam_3" },
    ],
  },
  {
    title: "Building a boat",
    panel: "border-sky-500/35 bg-sky-950/15",
    buttons: [
      { label: "Boat A", triggerId: "rust_boat_1" },
      { label: "Boat B", triggerId: "rust_boat_2" },
      { label: "Boat C", triggerId: "rust_boat_3" },
    ],
  },
  {
    title: "Building a base",
    panel: "border-stone-400/35 bg-stone-950/20",
    buttons: [
      { label: "Base build A", triggerId: "rust_base_build_1" },
      { label: "Base build B", triggerId: "rust_base_build_2" },
      { label: "Base build C", triggerId: "rust_base_build_3" },
    ],
  },
  {
    title: "Raiding a base",
    panel: "border-orange-500/45 bg-orange-950/15",
    buttons: [
      { label: "Raid A", triggerId: "rust_raid_1" },
      { label: "Raid B", triggerId: "rust_raid_2" },
      { label: "Raid C", triggerId: "rust_raid_3" },
    ],
  },
  {
    title: "Being raided",
    panel: "border-red-600/45 bg-red-950/20",
    buttons: [
      { label: "Raided A", triggerId: "rust_raided_1" },
      { label: "Raided B", triggerId: "rust_raided_2" },
      { label: "Raided C", triggerId: "rust_raided_3" },
    ],
  },
  {
    title: "Monuments",
    panel: "border-lime-500/30 bg-lime-950/10",
    buttons: [
      { label: "Enter monument A", triggerId: "rust_monument_enter_1" },
      { label: "Enter monument B", triggerId: "rust_monument_enter_2" },
      { label: "Small Oil Rig", triggerId: "rust_mon_small_oil" },
      { label: "Large Oil Rig", triggerId: "rust_mon_large_oil" },
      { label: "Water treatment", triggerId: "rust_mon_water_treat" },
      { label: "Airfield", triggerId: "rust_mon_airfield" },
      { label: "More monuments (soon)", triggerId: "rust_monuments_more" },
    ],
  },
  {
    title: "Farming",
    panel: "border-emerald-600/35 bg-emerald-950/15",
    buttons: [
      { label: "Ore A", triggerId: "rust_farm_ore_1" },
      { label: "Ore B", triggerId: "rust_farm_ore_2" },
      { label: "Trees A", triggerId: "rust_farm_tree_1" },
      { label: "Trees B", triggerId: "rust_farm_tree_2" },
    ],
  },
];

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

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
    path.includes("/api/rust/")
  );
}

async function postRustTrigger(
  base: string,
  triggerId: RustTriggerId,
  streamDeckKey: string,
  crewMemberName?: string
): Promise<unknown> {
  const origin = normalizeBase(base);
  const url = new URL(RUST_PATH, `${origin}/`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = streamDeckKey.trim();
  if (key && bridgeUsesSecret(RUST_PATH)) {
    headers["x-stream-deck-key"] = key;
  }
  const body: { triggerId: RustTriggerId; crewMemberName?: string } = {
    triggerId,
  };
  const c = crewMemberName?.trim();
  if (c) body.crewMemberName = c;
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

export default function RustAdventureBoardPage() {
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_LOCAL_BRIDGE_HTTP);
  const [streamDeckKey, setStreamDeckKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [squawkVoiceVol01, setSquawkVoiceVol01] = useState(0.9);
  const [streamingAssist, setStreamingAssist] = useState(false);
  const [afkVariant, setAfkVariant] = useState<AfkVariant | null>(null);
  const [rustTracks, setRustTracks] = useState<AdventureMusicTrack[]>([]);
  const [rustTracksError, setRustTracksError] = useState<string | null>(null);
  const [rustMusicVol01, setRustMusicVol01] = useState(0.75);
  const [rustMusicMuted, setRustMusicMuted] = useState(false);
  const [crewListText, setCrewListText] = useState("");

  const {
    nowPlaying,
    playlistRunning,
    startPlaylistFromRandom,
    stopPlaylist,
  } = useAdventureMusicPlaylist({
    volume01: rustMusicVol01,
    muted: rustMusicMuted,
    tracks: rustTracks,
  });

  const lastSquawkAtRef = useRef<number>(Date.now());
  const afkIntervalRef = useRef<number | null>(null);

  const clearAfkInterval = useCallback(() => {
    if (afkIntervalRef.current !== null) {
      window.clearInterval(afkIntervalRef.current);
      afkIntervalRef.current = null;
    }
  }, []);

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
    const advVol = window.localStorage.getItem(LS_RUST_ADV_VOL);
    if (advVol != null) {
      const n = Number(advVol);
      if (Number.isFinite(n)) {
        setRustMusicVol01(Math.min(1, Math.max(0, n)));
      }
    }
    if (window.localStorage.getItem(LS_RUST_ADV_MUTE) === "1") {
      setRustMusicMuted(true);
    }
    setCrewListText(window.localStorage.getItem(LS_RUST_CREW) ?? "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_RUST_CREW, crewListText);
  }, [crewListText]);

  useEffect(() => {
    void fetch("/api/rust-adventure-music")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<{ tracks?: AdventureMusicTrack[] }>;
      })
      .then((d) => {
        setRustTracks(Array.isArray(d.tracks) ? d.tracks : []);
        setRustTracksError(null);
      })
      .catch(() => {
        setRustTracksError("Could not load Rust track list.");
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_RUST_ADV_VOL, String(rustMusicVol01));
  }, [rustMusicVol01]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_RUST_ADV_MUTE, rustMusicMuted ? "1" : "0");
  }, [rustMusicMuted]);

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

  useEffect(
    () => () => {
      clearAfkInterval();
    },
    [clearAfkInterval]
  );

  const postTracked = useCallback(
    async (
      triggerId: RustTriggerId,
      crewMemberName?: string
    ): Promise<unknown> => {
      const data = await postRustTrigger(
        bridgeUrl,
        triggerId,
        streamDeckKey,
        crewMemberName
      );
      lastSquawkAtRef.current = Date.now();
      return data;
    },
    [bridgeUrl, streamDeckKey]
  );

  const fire = useCallback(
    async (
      triggerId: RustTriggerId,
      label: string,
      crewMemberName?: string
    ) => {
      setBusy(true);
      try {
        const data = await postTracked(triggerId, crewMemberName);
        setLog(`[${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[${label}]\n${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [postTracked]
  );

  const fireQuiet = useCallback(
    async (
      triggerId: RustTriggerId,
      label: string,
      crewMemberName?: string
    ) => {
      try {
        const data = await postTracked(triggerId, crewMemberName);
        setLog(`[auto: ${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[auto: ${label}]\n${String(e)}`);
      }
    },
    [postTracked]
  );

  const crewNames = parseCrewNameLines(crewListText);

  useEffect(() => {
    if (!streamingAssist) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastSquawkAtRef.current < STREAMING_SQUAWK_IDLE_MS) {
        return;
      }
      const pool = RUST_STREAM_IDLE_TRIGGER_IDS;
      const pick = pool[randomInt(0, pool.length - 1)]!;
      void (async () => {
        try {
          const data = await postTracked(pick);
          setLog(
            `[streaming assist]\n${JSON.stringify(data, null, 2)}`
          );
        } catch (e) {
          setLog(`[streaming assist]\n${String(e)}`);
        }
      })();
    }, STREAMING_IDLE_POLL_MS);
    return () => window.clearInterval(id);
  }, [streamingAssist, postTracked]);

  const onStreamingAssistToggle = useCallback(() => {
    if (streamingAssist) {
      setStreamingAssist(false);
      void fireQuiet("rust_stream_mode_outro", "Streaming assist — off");
      return;
    }
    lastSquawkAtRef.current = Date.now();
    setStreamingAssist(true);
    void fireQuiet("rust_stream_mode_intro", "Streaming assist — on");
  }, [fireQuiet, streamingAssist]);

  const startAfkInterval = useCallback(
    (kind: AfkVariant) => {
      const pool =
        kind === "general"
          ? RUST_AFK_BANTER_TRIGGER_IDS
          : RUST_AFK_CAPTAIN_BANTER_TRIGGER_IDS;
      afkIntervalRef.current = window.setInterval(() => {
        const pick = pool[randomInt(0, pool.length - 1)]!;
        void (async () => {
          try {
            const data = await postTracked(pick);
            setLog(`[AFK banter]\n${JSON.stringify(data, null, 2)}`);
          } catch (e) {
            setLog(`[AFK banter]\n${String(e)}`);
          }
        })();
      }, AFK_BANTER_MS);
    },
    [postTracked]
  );

  const onAfkToggle = useCallback(
    (kind: AfkVariant) => {
      if (afkVariant === kind) {
        clearAfkInterval();
        setAfkVariant(null);
        stopPlaylist();
        void fireQuiet(
          kind === "general" ? "rust_afk_outro" : "rust_afk_captain_outro",
          kind === "general" ? "AFK — off" : "AFK Cap'n — off"
        );
        return;
      }
      if (afkVariant !== null) {
        clearAfkInterval();
        void fireQuiet(
          afkVariant === "general"
            ? "rust_afk_outro"
            : "rust_afk_captain_outro",
          afkVariant === "general" ? "AFK — switch" : "AFK Cap'n — switch"
        );
      } else {
        clearAfkInterval();
        startPlaylistFromRandom();
      }
      lastSquawkAtRef.current = Date.now();
      setAfkVariant(kind);
      void fireQuiet(
        kind === "general" ? "rust_afk_intro" : "rust_afk_captain_intro",
        kind === "general" ? "AFK — on" : "AFK Cap'n — on"
      );
      startAfkInterval(kind);
    },
    [
      afkVariant,
      clearAfkInterval,
      fireQuiet,
      startAfkInterval,
      startPlaylistFromRandom,
      stopPlaylist,
    ]
  );

  const btn =
    "rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 font-body text-xs font-semibold text-parchment transition hover:bg-white/10 hover:border-white/25 disabled:opacity-45 sm:text-sm";

  return (
    <main className="min-h-screen bg-[#120c08] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(180,90,30,0.2),transparent)] p-4 pb-32 text-parchment sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-amber-800/40 pb-6">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-500/90">
              Rust
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-parchment md:text-4xl">
              Adventure board
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
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
              href="/overlay/parrot-with-bubble"
              className="rounded-lg border border-amber-600/40 px-3 py-1.5 text-sm text-amber-200/90 hover:bg-amber-950/30"
            >
              Parrot overlay
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-amber-700/35 bg-amber-950/15 p-4">
          <h2 className="font-display text-sm font-bold text-amber-100">
            Team names &amp; Squawk
          </h2>
          <p className="mt-1 font-body text-xs text-parchment/70">
            One teammate per line (saved in this browser). Squawk shouts them out;
            Intro when Cap&apos;n tells him to introduce himself.
          </p>
          <textarea
            value={crewListText}
            onChange={(e) => setCrewListText(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={"Roof camper Rex\nFarmer Jo"}
            className="mt-3 w-full max-w-lg rounded-lg border border-amber-800/40 bg-black/50 px-3 py-2 font-body text-sm text-parchment outline-none focus:border-amber-500/60"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={() => void fire("rust_squawk_intro", "Introduce Squawk")}
            >
              Introduce Squawk
            </button>
            <button
              type="button"
              disabled={busy || crewNames.length === 0}
              className={btn}
              onClick={() => {
                const pick =
                  crewNames[Math.floor(Math.random() * crewNames.length)]!;
                void fire("rust_crew_praise", `Praise team — ${pick}`, pick);
              }}
            >
              Praise random teammate
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
                    void fire("rust_crew_praise", `Praise — ${name}`, name)
                  }
                >
                  Praise {name}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="font-display text-sm font-bold text-amber-200/95">
            Voice &amp; music
          </h2>
          <div className="mt-3">
            <h3 className="font-display text-xs font-bold text-parchment/90">
              Squawk voice
            </h3>
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

          <div className="mt-4 border-t border-white/10 pt-4">
            <h3 className="font-display text-xs font-bold text-amber-200/95">
              Rust background music
            </h3>
            {rustTracksError ? (
              <p className="mt-2 font-body text-xs text-rose-300/95">{rustTracksError}</p>
            ) : (
              <p className="mt-2 font-body text-xs text-parchment/55">
                Tracks loaded:{" "}
                <span className="tabular-nums font-semibold text-parchment/85">
                  {rustTracks.length}
                </span>
                {rustTracks.length === 0 ? (
                  <span className="text-parchment/45"> — add files to server folder, refresh.</span>
                ) : null}
              </p>
            )}
            {(playlistRunning || nowPlaying) && (
              <p className="mt-1 truncate font-body text-[11px] text-amber-200/85">
                {nowPlaying ? `Now playing: ${nowPlaying}` : "Loading…"}
              </p>
            )}
            <div className="mt-3 flex max-w-xl flex-wrap items-center gap-4">
              <label className="flex min-w-[min(100%,320px)] flex-1 flex-col gap-1 sm:flex-row sm:items-center">
                <span className="shrink-0 font-body text-xs font-semibold text-parchment/85">
                  Music volume
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(rustMusicVol01 * 100)}
                  onChange={(e) =>
                    setRustMusicVol01(
                      Math.min(1, Math.max(0, Number(e.target.value) / 100))
                    )
                  }
                  className="h-2 min-w-0 flex-1 cursor-pointer accent-amber-500"
                  aria-label="Rust background music volume"
                />
                <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-parchment/75">
                  {Math.round(rustMusicVol01 * 100)}%
                </span>
              </label>
              <button
                type="button"
                className={
                  rustMusicMuted
                    ? "rounded-lg border border-amber-500/50 bg-amber-600/20 px-3 py-1.5 font-body text-xs font-semibold text-amber-100 hover:bg-amber-600/30"
                    : "rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 font-body text-xs font-semibold text-parchment hover:bg-white/10"
                }
                onClick={() => setRustMusicMuted((m) => !m)}
              >
                {rustMusicMuted ? "Unmute music" : "Mute music"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/20 p-4">
          <h2 className="font-display text-sm font-bold text-fuchsia-200/95">
            Streaming assist
          </h2>
          <button
            type="button"
            className={
              streamingAssist
                ? "mt-3 rounded-lg border border-rose-500/55 bg-rose-950/40 px-4 py-2.5 font-body text-sm font-bold text-rose-100 transition hover:bg-rose-900/45"
                : "mt-3 rounded-lg border border-fuchsia-500/50 bg-fuchsia-950/35 px-4 py-2.5 font-body text-sm font-bold text-fuchsia-100 transition hover:bg-fuchsia-900/35"
            }
            onClick={() => onStreamingAssistToggle()}
          >
            {streamingAssist
              ? "Finish — streaming assist"
              : "Start — streaming assist"}
          </button>
        </section>

        <section className="rounded-xl border border-amber-600/45 bg-amber-950/15 p-4">
          <h2 className="font-display text-sm font-bold text-amber-200/95">
            AFK mode
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={
                afkVariant === "general"
                  ? "rounded-lg border border-rose-500/55 bg-rose-950/40 px-4 py-2.5 font-body text-sm font-bold text-rose-100 transition hover:bg-rose-900/45"
                  : "rounded-lg border border-amber-500/55 bg-amber-900/30 px-4 py-2.5 font-body text-sm font-bold text-amber-100 transition hover:bg-amber-900/45"
              }
              onClick={() => onAfkToggle("general")}
            >
              {afkVariant === "general"
                ? "Finish — general AFK"
                : "Start — general AFK"}
            </button>
            <button
              type="button"
              className={
                afkVariant === "captain"
                  ? "rounded-lg border border-rose-500/55 bg-rose-950/40 px-4 py-2.5 font-body text-sm font-bold text-rose-100 transition hover:bg-rose-900/45"
                  : "rounded-lg border border-violet-500/50 bg-violet-950/25 px-4 py-2.5 font-body text-sm font-bold text-violet-100 transition hover:bg-violet-900/35"
              }
              onClick={() => onAfkToggle("captain")}
            >
              {afkVariant === "captain"
                ? "Finish — Cap'n away"
                : "Start — Cap'n away"}
            </button>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {RUST_SECTIONS.map((sec) => (
            <section
              key={sec.title}
              className={`rounded-xl border p-4 shadow-panel ${sec.panel}`}
            >
              <h2 className="font-display text-lg font-bold text-parchment">
                {sec.title}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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

        {log ? (
          <pre className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] text-parchment/85">
            {log}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
