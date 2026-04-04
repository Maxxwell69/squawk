"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SOT_STREAM_IDLE_TRIGGER_IDS,
  type SotTriggerId,
} from "@captain-squawks/shared";
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
import {
  useSotAdventureMusic,
  type SotAdventureMusicTrack,
} from "@/hooks/useSotAdventureMusic";

/** Same keys as battle board — one bridge setup for both UIs. */
const LS_BRIDGE = "squawk-battle-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";
const LS_SOT_ADV_VOL = "squawk-sot-adventure-music-vol";
const LS_SOT_ADV_MUTE = "squawk-sot-adventure-music-muted";
const SOT_PATH = "/api/sot/trigger";

/** Any SoT board line to overlay resets this; streaming assist nudges chat if idle longer. */
const STREAMING_SQUAWK_IDLE_MS = 60_000;
const STREAMING_IDLE_POLL_MS = 4_000;

/** Start → periodic callouts → Finish (same button toggles). */
type SotAutomationId =
  | "skel"
  | "player_ship"
  | "kraken"
  | "meg"
  | "island_run";

type SotAutomationDef = {
  id: SotAutomationId;
  title: string;
  hint: string;
  /** Skeleton ship fires two mid lines per wave (fire/magic, then repair/players). */
  midMode: "skel_double" | "single_mid";
  start: SotTriggerId;
  finish: SotTriggerId;
  midSingle?: SotTriggerId;
  midFireMagic?: SotTriggerId;
  midRepairPlayers?: SotTriggerId;
};

const SOT_AUTOMATIONS: SotAutomationDef[] = [
  {
    id: "skel",
    title: "Skeleton ship battle",
    hint: "Start: skelly crew intro. Every ~30–45s: fire & cursed shots, then repairs & watch players. Finish wraps the fight.",
    midMode: "skel_double",
    start: "sot_seq_skel_start",
    finish: "sot_seq_skel_finish",
    midFireMagic: "sot_seq_skel_fire_magic",
    midRepairPlayers: "sot_seq_skel_repair_players",
  },
  {
    id: "player_ship",
    title: "Player ship battle",
    hint: "Start: ruthless pirates vs our humble chaos. Periodic banter while it lasts. Finish when the scrap ends.",
    midMode: "single_mid",
    start: "sot_seq_player_ship_start",
    finish: "sot_seq_player_ship_finish",
    midSingle: "sot_seq_player_ship_mid",
  },
  {
    id: "kraken",
    title: "Kraken battle",
    hint: "Beast-mode action. Mid lines: feast jokes, hope he chokes on us, stuck banter. Finish when you're clear.",
    midMode: "single_mid",
    start: "sot_seq_kraken_start",
    finish: "sot_seq_kraken_finish",
    midSingle: "sot_seq_kraken_mid",
  },
  {
    id: "meg",
    title: "Megalodon battle",
    hint: "Tales of greatness. Mid: feasting dreams, cooking meg jokes. Finish when the shark show ends.",
    midMode: "single_mid",
    start: "sot_seq_meg_start",
    finish: "sot_seq_meg_finish",
    midSingle: "sot_seq_meg_mid",
  },
  {
    id: "island_run",
    title: "Going to an island",
    hint: "Start: watch for players, grab loot. Periodic reminders while you're ashore. Finish when you're leaving.",
    midMode: "single_mid",
    start: "sot_seq_island_run_start",
    finish: "sot_seq_island_run_finish",
    midSingle: "sot_seq_island_run_mid",
  },
];

const AUTO_TICK_MIN_MS = 26_000;
const AUTO_TICK_MAX_MS = 44_000;
const SKEL_SECOND_LINE_DELAY_MS = 850;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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
  const [activeAutomation, setActiveAutomation] =
    useState<SotAutomationId | null>(null);
  const [streamingAssist, setStreamingAssist] = useState(false);
  const [adventureTracks, setAdventureTracks] = useState<SotAdventureMusicTrack[]>(
    []
  );
  const [adventureTracksError, setAdventureTracksError] = useState<string | null>(
    null
  );
  const [sotMusicVol01, setSotMusicVol01] = useState(0.75);
  const [sotMusicMuted, setSotMusicMuted] = useState(false);

  const {
    nowPlaying,
    playlistRunning,
    startPlaylistFromRandom,
    stopPlaylist,
  } = useSotAdventureMusic({
    volume01: sotMusicVol01,
    muted: sotMusicMuted,
    tracks: adventureTracks,
  });

  /** Last time this page successfully sent any line to the bridge (all buttons + automations). */
  const lastSquawkAtRef = useRef<number>(Date.now());

  /** Clears pending automation tick timer; does not POST finish. */
  const stopAutomationTicksRef = useRef<(() => void) | null>(null);

  const stopAutomationTicks = useCallback(() => {
    stopAutomationTicksRef.current?.();
    stopAutomationTicksRef.current = null;
  }, []);

  useEffect(() => () => stopAutomationTicks(), [stopAutomationTicks]);

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
    const advVol = window.localStorage.getItem(LS_SOT_ADV_VOL);
    if (advVol != null) {
      const n = Number(advVol);
      if (Number.isFinite(n)) {
        setSotMusicVol01(Math.min(1, Math.max(0, n)));
      }
    }
    if (window.localStorage.getItem(LS_SOT_ADV_MUTE) === "1") {
      setSotMusicMuted(true);
    }
  }, []);

  useEffect(() => {
    void fetch("/api/sot-adventure-music")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<{ tracks?: SotAdventureMusicTrack[] }>;
      })
      .then((d) => {
        setAdventureTracks(Array.isArray(d.tracks) ? d.tracks : []);
        setAdventureTracksError(null);
      })
      .catch(() => {
        setAdventureTracksError("Could not load adventure track list.");
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_SOT_ADV_VOL, String(sotMusicVol01));
  }, [sotMusicVol01]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_SOT_ADV_MUTE, sotMusicMuted ? "1" : "0");
  }, [sotMusicMuted]);

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

  const postTracked = useCallback(
    async (triggerId: SotTriggerId): Promise<unknown> => {
      const data = await postSotTrigger(bridgeUrl, triggerId, streamDeckKey);
      lastSquawkAtRef.current = Date.now();
      return data;
    },
    [bridgeUrl, streamDeckKey]
  );

  const fire = useCallback(
    async (triggerId: SotTriggerId, label: string) => {
      setBusy(true);
      try {
        const data = await postTracked(triggerId);
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
    async (triggerId: SotTriggerId, label: string) => {
      try {
        const data = await postTracked(triggerId);
        setLog(`[auto: ${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[auto: ${label}]\n${String(e)}`);
      }
    },
    [postTracked]
  );

  useEffect(() => {
    if (!streamingAssist) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastSquawkAtRef.current < STREAMING_SQUAWK_IDLE_MS) {
        return;
      }
      const pool = SOT_STREAM_IDLE_TRIGGER_IDS;
      const pick = pool[randomInt(0, pool.length - 1)]!;
      void (async () => {
        try {
          const data = await postTracked(pick);
          setLog(
            `[streaming assist — idle ${STREAMING_SQUAWK_IDLE_MS / 1000}s]\n${JSON.stringify(data, null, 2)}`
          );
        } catch (e) {
          setLog(`[streaming assist — idle nudge]\n${String(e)}`);
        }
      })();
    }, STREAMING_IDLE_POLL_MS);
    return () => window.clearInterval(id);
  }, [streamingAssist, postTracked]);

  const onStreamingAssistToggle = useCallback(() => {
    if (streamingAssist) {
      setStreamingAssist(false);
      void fireQuiet("sot_stream_mode_outro", "Streaming assist — off");
      return;
    }
    lastSquawkAtRef.current = Date.now();
    setStreamingAssist(true);
    void fireQuiet("sot_stream_mode_intro", "Streaming assist — on");
  }, [fireQuiet, streamingAssist]);

  const beginAutomation = useCallback(
    (def: SotAutomationDef) => {
      stopAutomationTicks();
      setActiveAutomation(def.id);

      void (async () => {
        await fireQuiet(def.start, `${def.title} — start`);
      })();

      let cancelled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const clearTimer = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      stopAutomationTicksRef.current = () => {
        cancelled = true;
        clearTimer();
      };

      const scheduleNext = () => {
        if (cancelled) return;
        clearTimer();
        const waitMs = randomInt(AUTO_TICK_MIN_MS, AUTO_TICK_MAX_MS);
        timeoutId = setTimeout(() => {
          timeoutId = null;
          if (cancelled) return;
          void (async () => {
            try {
              if (
                def.midMode === "skel_double" &&
                def.midFireMagic &&
                def.midRepairPlayers
              ) {
                const d1 = await postTracked(def.midFireMagic);
                await sleep(SKEL_SECOND_LINE_DELAY_MS);
                if (cancelled) return;
                const d2 = await postTracked(def.midRepairPlayers);
                setLog(
                  `[auto: ${def.title} — mid wave ×2]\n${JSON.stringify(
                    { fireMagic: d1, repairPlayers: d2 },
                    null,
                    2
                  )}`
                );
              } else if (def.midSingle) {
                const data = await postTracked(def.midSingle);
                setLog(
                  `[auto: ${def.title} — mid]\n${JSON.stringify(data, null, 2)}`
                );
              }
            } catch (e) {
              setLog(`[auto: ${def.title} — mid]\n${String(e)}`);
            }
            scheduleNext();
          })();
        }, waitMs);
      };

      scheduleNext();
    },
    [fireQuiet, postTracked, stopAutomationTicks]
  );

  const finishAutomation = useCallback(
    (def: SotAutomationDef) => {
      stopPlaylist();
      stopAutomationTicks();
      setActiveAutomation(null);
      void fireQuiet(def.finish, `${def.title} — finish`);
    },
    [fireQuiet, stopAutomationTicks, stopPlaylist]
  );

  const onAutomationButton = useCallback(
    (def: SotAutomationDef) => {
      if (activeAutomation === def.id) {
        finishAutomation(def);
        return;
      }
      if (activeAutomation !== null) {
        stopAutomationTicks();
        stopPlaylist();
        setActiveAutomation(null);
      }
      beginAutomation(def);
      startPlaylistFromRandom();
    },
    [
      activeAutomation,
      beginAutomation,
      finishAutomation,
      startPlaylistFromRandom,
      stopAutomationTicks,
      stopPlaylist,
    ]
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
              Quick buttons fire one line; <strong className="text-cyan-200/90">action</strong>{" "}
              buttons start timed callouts and <strong className="text-sky-200/90">adventure music</strong>{" "}
              (random start, then the rest of the playlist) until Finish. Separate from the
              TikTok battle timer board. <strong className="text-fuchsia-200/85">Streaming assist</strong>{" "}
              nudges likes / shares / reposts if this page goes quiet a minute.
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
            Bridge, voice &amp; music
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

          <div className="mt-4 border-t border-white/10 pt-4">
            <h3 className="font-display text-xs font-bold text-sky-200/95">
              Sea of Thieves background music
            </h3>
            <p className="mt-1 font-body text-xs text-parchment/55">
              Adventure playlist in{" "}
              <code className="text-parchment/75">public/sea-of-thieves/adventure-music/</code>{" "}
              (any filenames; A→Z order). Action <span className="text-sky-200/85">Start</span>{" "}
              picks a random first track, then plays through the rest until{" "}
              <span className="text-rose-300/85">Finish</span> or the list ends.
            </p>
            {adventureTracksError ? (
              <p className="mt-2 font-body text-xs text-rose-300/95">{adventureTracksError}</p>
            ) : (
              <p className="mt-2 font-body text-xs text-parchment/55">
                Tracks loaded:{" "}
                <span className="tabular-nums font-semibold text-parchment/85">
                  {adventureTracks.length}
                </span>
                {adventureTracks.length === 0 ? (
                  <span className="text-parchment/45"> — add files and refresh this page.</span>
                ) : null}
              </p>
            )}
            {(playlistRunning || nowPlaying) && (
              <p className="mt-1 truncate font-body text-[11px] text-sky-200/85">
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
                  value={Math.round(sotMusicVol01 * 100)}
                  onChange={(e) =>
                    setSotMusicVol01(
                      Math.min(1, Math.max(0, Number(e.target.value) / 100))
                    )
                  }
                  className="h-2 min-w-0 flex-1 cursor-pointer accent-sky-400"
                  aria-label="Sea of Thieves background music volume"
                />
                <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-parchment/75">
                  {Math.round(sotMusicVol01 * 100)}%
                </span>
              </label>
              <button
                type="button"
                className={
                  sotMusicMuted
                    ? "rounded-lg border border-sky-400/50 bg-sky-500/20 px-3 py-1.5 font-body text-xs font-semibold text-sky-100 hover:bg-sky-500/30"
                    : "rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 font-body text-xs font-semibold text-parchment hover:bg-white/10"
                }
                onClick={() => setSotMusicMuted((m) => !m)}
              >
                {sotMusicMuted ? "Unmute music" : "Mute music"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/20 p-4">
          <h2 className="font-display text-sm font-bold text-fuchsia-200/95">
            Streaming assist
          </h2>
          <p className="mt-1 max-w-3xl font-body text-xs text-parchment/65">
            <span className="text-fuchsia-200/90">Start</span> arms Squawk to hype chat for likes,
            shares, and reposts. Any line sent from <strong className="font-normal text-parchment/75">this</strong>{" "}
            page (quick buttons or action automations) resets the clock. If nobody&apos;s squawked
            for <strong className="font-normal text-parchment/80">one full minute</strong>, a random
            chat nudge fires automatically. <span className="text-rose-300/90">Finish</span> stops
            the timer and sends a short sign-off line.
          </p>
          <button
            type="button"
            className={
              streamingAssist
                ? "mt-3 rounded-lg border border-rose-500/55 bg-rose-950/40 px-4 py-2.5 font-body text-sm font-bold text-rose-100 transition hover:bg-rose-900/45"
                : `mt-3 rounded-lg border border-fuchsia-500/50 bg-fuchsia-950/35 px-4 py-2.5 font-body text-sm font-bold text-fuchsia-100 transition hover:bg-fuchsia-900/35`
            }
            onClick={() => onStreamingAssistToggle()}
          >
            {streamingAssist
              ? "Finish — streaming assist"
              : "Start — streaming assist"}
          </button>
          {streamingAssist ? (
            <p className="mt-2 font-body text-[11px] text-fuchsia-200/70">
              Active — idle nudge every ~{STREAMING_IDLE_POLL_MS / 1000}s check after{" "}
              {STREAMING_SQUAWK_IDLE_MS / 1000}s quiet on this board.
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-4">
          <h2 className="font-display text-lg font-bold text-teal-200/95">
            Action automations
          </h2>
          <p className="mt-1 max-w-3xl font-body text-xs text-parchment/65">
            Tap <span className="text-teal-200/90">Start</span> to send the opening line, begin
            adventure music (if tracks are loaded), and run random mid callouts every ~26–44s
            (skeleton fights send <em>two</em> lines per wave: fire / cursed shots, then repairs /
            watch players). Tap again — <span className="text-rose-300/90">Finish</span> — to
            stop music and timers and send the closing line. Starting another action stops the
            previous one without a finish line.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOT_AUTOMATIONS.map((def) => {
              const running = activeAutomation === def.id;
              return (
                <div
                  key={def.id}
                  className="rounded-lg border border-teal-600/30 bg-black/35 p-3"
                >
                  <h3 className="font-display text-sm font-bold text-parchment">
                    {def.title}
                  </h3>
                  <p className="mt-1 font-body text-[11px] leading-snug text-parchment/55">
                    {def.hint}
                  </p>
                  <button
                    type="button"
                    className={
                      running
                        ? "mt-3 w-full rounded-lg border border-rose-500/55 bg-rose-950/40 px-3 py-2.5 font-body text-xs font-bold text-rose-100 transition hover:bg-rose-900/45 sm:text-sm"
                        : `mt-3 w-full ${btn}`
                    }
                    onClick={() => onAutomationButton(def)}
                  >
                    {running ? `Finish — ${def.title}` : `Start — ${def.title}`}
                  </button>
                </div>
              );
            })}
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
