"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SOT_AFK_BANTER_TRIGGER_IDS,
  SOT_AFK_CAPTAIN_BANTER_TRIGGER_IDS,
  SOT_STREAM_IDLE_TRIGGER_IDS,
  type SotTriggerId,
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
const AFK_BANTER_MS = 40_000;

type AfkVariant = "general" | "captain";

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
    midMode: "skel_double",
    start: "sot_seq_skel_start",
    finish: "sot_seq_skel_finish",
    midFireMagic: "sot_seq_skel_fire_magic",
    midRepairPlayers: "sot_seq_skel_repair_players",
  },
  {
    id: "player_ship",
    title: "Player ship battle",
    midMode: "single_mid",
    start: "sot_seq_player_ship_start",
    finish: "sot_seq_player_ship_finish",
    midSingle: "sot_seq_player_ship_mid",
  },
  {
    id: "kraken",
    title: "Kraken battle",
    midMode: "single_mid",
    start: "sot_seq_kraken_start",
    finish: "sot_seq_kraken_finish",
    midSingle: "sot_seq_kraken_mid",
  },
  {
    id: "meg",
    title: "Megalodon battle",
    midMode: "single_mid",
    start: "sot_seq_meg_start",
    finish: "sot_seq_meg_finish",
    midSingle: "sot_seq_meg_mid",
  },
  {
    id: "island_run",
    title: "Going to an island",
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
  panel: string;
  buttons: { label: string; triggerId: SotTriggerId }[];
};

const SOT_SECTIONS: SotSection[] = [
  {
    title: "Island visit",
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
    panel: "border-orange-400/40 bg-orange-950/10",
    buttons: [{ label: "Feeding time", triggerId: "sot_feeding_time" }],
  },
  {
    title: "Drink time",
    panel: "border-indigo-400/35 bg-indigo-950/15",
    buttons: [
      { label: "Cheers", triggerId: "sot_drink_cheers_1" },
      { label: "Grog", triggerId: "sot_drink_grog_1" },
      { label: "Grab a drink (break)", triggerId: "sot_drink_break_1" },
    ],
  },
  {
    title: "Music & dance",
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
    path.includes("/api/sot/") ||
    path.includes("/api/rust/")
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
  const [afkVariant, setAfkVariant] = useState<AfkVariant | null>(null);
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

  const afkIntervalRef = useRef<number | null>(null);

  const clearAfkInterval = useCallback(() => {
    if (afkIntervalRef.current !== null) {
      window.clearInterval(afkIntervalRef.current);
      afkIntervalRef.current = null;
    }
  }, []);

  /** Clears pending automation tick timer; does not POST finish. */
  const stopAutomationTicksRef = useRef<(() => void) | null>(null);

  const stopAutomationTicks = useCallback(() => {
    stopAutomationTicksRef.current?.();
    stopAutomationTicksRef.current = null;
  }, []);

  useEffect(() => () => stopAutomationTicks(), [stopAutomationTicks]);

  useEffect(
    () => () => {
      clearAfkInterval();
    },
    [clearAfkInterval]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    /** Deployed overlay: env wins so Voyages board needs no bridge URL field or battle-page visit. */
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

  const startAfkInterval = useCallback(
    (kind: AfkVariant) => {
      const pool =
        kind === "general"
          ? SOT_AFK_BANTER_TRIGGER_IDS
          : SOT_AFK_CAPTAIN_BANTER_TRIGGER_IDS;
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
          kind === "general" ? "sot_afk_outro" : "sot_afk_captain_outro",
          kind === "general" ? "AFK — off" : "AFK Cap'n — off"
        );
        return;
      }
      if (afkVariant !== null) {
        clearAfkInterval();
        void fireQuiet(
          afkVariant === "general"
            ? "sot_afk_outro"
            : "sot_afk_captain_outro",
          afkVariant === "general" ? "AFK — switch" : "AFK Cap'n — switch"
        );
      } else {
        clearAfkInterval();
        startPlaylistFromRandom();
      }
      lastSquawkAtRef.current = Date.now();
      setAfkVariant(kind);
      void fireQuiet(
        kind === "general" ? "sot_afk_intro" : "sot_afk_captain_intro",
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
      if (afkVariant !== null) {
        clearAfkInterval();
        const v = afkVariant;
        setAfkVariant(null);
        stopPlaylist();
        void fireQuiet(
          v === "general" ? "sot_afk_outro" : "sot_afk_captain_outro",
          "AFK — off (automation)"
        );
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
      afkVariant,
      beginAutomation,
      clearAfkInterval,
      finishAutomation,
      fireQuiet,
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
            <Link
              href="/overlay/rust"
              className="rounded-lg border border-amber-600/40 px-3 py-1.5 text-sm text-amber-200/90 hover:bg-amber-950/30"
            >
              Rust board
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="font-display text-sm font-bold text-cyan-200/90">
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
            <h3 className="font-display text-xs font-bold text-sky-200/95">
              Background music
            </h3>
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
        </section>

        <section className="rounded-xl border border-amber-600/45 bg-amber-950/15 p-4">
          <h2 className="font-display text-sm font-bold text-amber-200/95">
            AFK mode
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={activeAutomation !== null}
              className={
                activeAutomation !== null
                  ? "cursor-not-allowed rounded-lg border border-white/10 bg-black/25 px-4 py-2.5 font-body text-sm font-bold text-parchment/40"
                  : afkVariant === "general"
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
              disabled={activeAutomation !== null}
              className={
                activeAutomation !== null
                  ? "cursor-not-allowed rounded-lg border border-white/10 bg-black/25 px-4 py-2.5 font-body text-sm font-bold text-parchment/40"
                  : afkVariant === "captain"
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

        <section className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-4">
          <h2 className="font-display text-lg font-bold text-teal-200/95">
            Action automations
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {log ? (
          <pre className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] text-parchment/85">
            {log}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
