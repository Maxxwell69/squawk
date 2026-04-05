"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BattleTriggerId } from "@captain-squawks/shared";
import {
  DEFAULT_LOCAL_BRIDGE_HTTP,
  getClientBridgeHttp,
} from "@/lib/bridge-urls";
import {
  BATTLE_AUTO_MILESTONES,
  BATTLE_MINUTE_MARK_SECONDS,
} from "@/lib/battle-auto-milestones";
import { pickRandomSprinkleTrigger } from "@/lib/battle-sprinkle-pools";
import { SquawkVolumeSlider } from "@/components/SquawkVolumeSlider";
import {
  useBattleMusic,
  type BattleMatchStatus,
} from "@/hooks/useBattleMusic";
import {
  persistSquawkVolume01,
  readSquawkVolume01,
  SQUAWK_VOL_EVENT,
} from "@/lib/squawk-volume";
import {
  BATTLE_BOARD_DEFS,
  type BattleBoardSlug,
} from "@/lib/battle-board-slugs";
import { battleBoardSlugForTimer } from "@/lib/battle-board-timer-slug";
import { publishBattleBoardScene } from "@/lib/battle-board-sync";

const LS_BRIDGE = "squawk-battle-bridge";
const LS_DECK_KEY = "squawk-parrot-test-stream-deck-key";
const LS_OPPONENT = "squawk-battle-opponent";
const LS_MUSIC_VOL = "squawk-battle-music-vol";
const LS_MUSIC_MUTE = "squawk-battle-music-muted";

const BATTLE_PATH = "/api/battle/trigger";
/** One OBS browser source: banners + tips switch from buttons below. */
const BATTLE_BOARD_DISPLAY_PATH = "/overlay/battle-board/display";
const STREAM_DECK_VICTORY_DANCE = "/api/streamdeck/victory-dance";
const TOTAL_SEC = 5 * 60;
const VICTORY_PARTY_SEC = 120;

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
    buttons: (
      [
        "battle_phase1_1",
        "battle_phase1_2",
        "battle_phase1_3",
        "battle_phase1_4",
        "battle_phase1_5",
        "battle_phase1_6",
        "battle_phase1_7",
        "battle_phase1_8",
        "battle_phase1_9",
        "battle_phase1_10",
      ] as const
    ).map((id, i) => ({
      label: `Line ${i + 1}`,
      triggerId: id,
    })),
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
    hint: "After the clock — use Win / Lose above first. MVPs below.",
    buttons: [
      { label: "Repair & party", triggerId: "battle_phase5_repair_party" },
      { label: "Who were the MVPs?", triggerId: "battle_phase5_mvps_prompt" },
    ],
  },
];

const HAIL_NICE: { label: string; triggerId: BattleTriggerId }[] = [
  { label: "Respect 1", triggerId: "battle_hail_nice_1" },
  { label: "Respect 2", triggerId: "battle_hail_nice_2" },
  { label: "Respect 3", triggerId: "battle_hail_nice_3" },
];

const HAIL_ROAST: { label: string; triggerId: BattleTriggerId }[] = [
  { label: "Fun jab 1", triggerId: "battle_hail_roast_1" },
  { label: "Fun jab 2", triggerId: "battle_hail_roast_2" },
  { label: "Fun jab 3", triggerId: "battle_hail_roast_3" },
];

const PARTY_VICTORY: { label: string; triggerId: BattleTriggerId }[] = [
  { label: "Victory dance", triggerId: "battle_victory_dance" },
  { label: "Party line A", triggerId: "battle_party_victory_1" },
  { label: "Party line B", triggerId: "battle_party_victory_2" },
];

const PARTY_LOSS: { label: string; triggerId: BattleTriggerId }[] = [
  { label: "Salute A", triggerId: "battle_party_loss_1" },
  { label: "Salute B", triggerId: "battle_party_loss_2" },
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

async function postBattleTrigger(
  base: string,
  triggerId: BattleTriggerId,
  streamDeckKey: string,
  opponentName?: string
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
  const body: { triggerId: BattleTriggerId; opponentName?: string } = {
    triggerId,
  };
  const n = opponentName?.trim();
  if (n) body.opponentName = n;
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

async function postStreamDeckAction(
  base: string,
  path: string,
  streamDeckKey: string
): Promise<unknown> {
  const origin = normalizeBase(base);
  const url = new URL(path.replace(/^\//, ""), `${origin}/`);
  const headers: Record<string, string> = {};
  const key = streamDeckKey.trim();
  if (key && bridgeUsesSecret(path)) {
    headers["x-stream-deck-key"] = key;
  }
  const res = await fetch(url.toString(), { method: "POST", headers });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function BattleBoardPage() {
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_LOCAL_BRIDGE_HTTP);
  const [streamDeckKey, setStreamDeckKey] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [remainingSec, setRemainingSec] = useState(TOTAL_SEC);
  const [running, setRunning] = useState(false);
  const [matchStatus, setMatchStatus] = useState<BattleMatchStatus>("idle");
  const [partyRemainingSec, setPartyRemainingSec] = useState(0);
  const [musicVolume01, setMusicVolume01] = useState(0.75);
  const [musicMuted, setMusicMuted] = useState(false);
  const [squawkVoiceVol01, setSquawkVoiceVol01] = useState(0.9);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoFiredRef = useRef<Set<number>>(new Set());
  /** Seconds until next random sprinkle (board-style line); not used on minute marks. */
  const sprinkleSecsUntilRef = useRef<number | null>(null);
  /** After 0:30, first scheduled chip + sprinkles; reset each match. */
  const softLineGate30Ref = useRef(false);
  const lastAutoBoardSlugRef = useRef<BattleBoardSlug | null>(null);

  const elapsedSec =
    matchStatus === "running" ? TOTAL_SEC - remainingSec : 0;

  const { primePlayback } = useBattleMusic(matchStatus, elapsedSec, {
    volume01: musicVolume01,
    muted: musicMuted,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromLs = window.localStorage.getItem(LS_BRIDGE)?.trim();
    setBridgeUrl(fromLs || getClientBridgeHttp());
    const keyFromLs =
      window.localStorage.getItem(LS_DECK_KEY)?.trim() ??
      process.env.NEXT_PUBLIC_STREAM_DECK_TEST_KEY?.trim() ??
      "";
    setStreamDeckKey(keyFromLs);
    setOpponentName(window.localStorage.getItem(LS_OPPONENT)?.trim() ?? "");
    const volRaw = window.localStorage.getItem(LS_MUSIC_VOL);
    const v = volRaw != null ? Number.parseFloat(volRaw) : NaN;
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      setMusicVolume01(v);
    }
    setMusicMuted(window.localStorage.getItem(LS_MUSIC_MUTE) === "1");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_OPPONENT, opponentName);
  }, [opponentName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_MUSIC_VOL, String(musicVolume01));
  }, [musicVolume01]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_MUSIC_MUTE, musicMuted ? "1" : "0");
  }, [musicMuted]);

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

  useEffect(() => {
    if (matchStatus !== "running") return;
    if (remainingSec !== 0) return;
    setMatchStatus("awaiting_result");
  }, [matchStatus, remainingSec]);

  useEffect(() => {
    if (matchStatus !== "victory_party") return;
    const t = setInterval(() => {
      setPartyRemainingSec((s) => {
        if (s <= 1) {
          setMatchStatus("idle");
          setRemainingSec(TOTAL_SEC);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [matchStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const slug = battleBoardSlugForTimer(
      matchStatus,
      remainingSec,
      TOTAL_SEC
    );
    if (lastAutoBoardSlugRef.current === slug) return;
    lastAutoBoardSlugRef.current = slug;
    publishBattleBoardScene(slug);
  }, [matchStatus, remainingSec]);

  useEffect(() => {
    if (matchStatus !== "running") return;
    const elapsed = TOTAL_SEC - remainingSec;

    let firedMinuteCall = false;
    for (const m of BATTLE_AUTO_MILESTONES) {
      if (elapsed !== m.elapsed) continue;
      if (autoFiredRef.current.has(m.elapsed)) continue;
      autoFiredRef.current.add(m.elapsed);
      void postBattleTrigger(bridgeUrl, m.trigger, streamDeckKey, opponentName).catch(
        () => {
          /* ignore auto fail */
        }
      );
      sprinkleSecsUntilRef.current = randomInt(20, 42);
      firedMinuteCall = true;
      break;
    }
    if (firedMinuteCall) return;

    /* Opening: only the immediate POST from startMatch — silence until 0:30. */
    if (elapsed < 30) return;

    if (elapsed === 30 && !softLineGate30Ref.current) {
      softLineGate30Ref.current = true;
      void postBattleTrigger(
        bridgeUrl,
        "battle_banter_chip",
        streamDeckKey,
        opponentName
      ).catch(() => {
        /* ignore */
      });
      sprinkleSecsUntilRef.current = randomInt(14, 28);
      return;
    }

    if (BATTLE_MINUTE_MARK_SECONDS.has(elapsed)) {
      sprinkleSecsUntilRef.current = randomInt(18, 42);
      return;
    }

    if (sprinkleSecsUntilRef.current === null) {
      sprinkleSecsUntilRef.current = randomInt(22, 38);
    }
    sprinkleSecsUntilRef.current -= 1;
    if (sprinkleSecsUntilRef.current <= 0) {
      const id = pickRandomSprinkleTrigger(elapsed);
      void postBattleTrigger(bridgeUrl, id, streamDeckKey, opponentName).catch(
        () => {
          /* ignore */
        }
      );
      sprinkleSecsUntilRef.current = randomInt(28, 50);
    }
  }, [matchStatus, remainingSec, bridgeUrl, streamDeckKey, opponentName]);

  const fire = useCallback(
    async (triggerId: BattleTriggerId, label: string) => {
      setBusy(true);
      try {
        const data = await postBattleTrigger(
          bridgeUrl,
          triggerId,
          streamDeckKey,
          opponentName
        );
        setLog(`[${label}]\n${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        setLog(`[${label}]\n${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [bridgeUrl, streamDeckKey, opponentName]
  );

  const phaseHint = useMemo(() => {
    if (matchStatus !== "running") return "—";
    const t = elapsedSec;
    if (t < 60) return "Phase 1 — minute one";
    if (t < 120) return "Phase 2 — minute two";
    if (t < 180) return "Phase 3 — minute three";
    if (t < 240) return "Phase 4 — minute four";
    return "Phase 5 — final minute";
  }, [matchStatus, elapsedSec]);

  const startMatch = () => {
    autoFiredRef.current = new Set();
    softLineGate30Ref.current = false;
    sprinkleSecsUntilRef.current = null;
    setRemainingSec(TOTAL_SEC);
    setRunning(true);
    setMatchStatus("running");
    primePlayback();
    void postBattleTrigger(
      bridgeUrl,
      "battle_match_start",
      streamDeckKey,
      opponentName
    ).catch(() => {
      /* bridge offline — match still runs */
    });
  };

  const resetAll = () => {
    setRunning(false);
    setRemainingSec(TOTAL_SEC);
    setMatchStatus("idle");
    setPartyRemainingSec(0);
    autoFiredRef.current = new Set();
    softLineGate30Ref.current = false;
    sprinkleSecsUntilRef.current = null;
  };

  const btn =
    "rounded-lg border border-white/15 bg-black/35 px-2.5 py-2 font-body text-xs font-semibold text-parchment hover:bg-white/10 disabled:opacity-50 sm:text-sm";
  const btnCheer =
    "rounded-lg bg-squawk-gold/90 px-3 py-2 font-body text-sm font-bold text-squawk-ink hover:bg-squawk-gold disabled:opacity-50";
  const btnWin =
    "rounded-lg border border-emerald-500/60 bg-emerald-900/40 px-4 py-3 font-display text-sm font-bold text-emerald-100 hover:bg-emerald-800/50 disabled:opacity-50";
  const btnLose =
    "rounded-lg border border-amber-500/40 bg-amber-950/35 px-4 py-3 font-display text-sm font-bold text-amber-100 hover:bg-amber-900/40 disabled:opacity-50";

  const awaiting = matchStatus === "awaiting_result";
  const inVictoryParty = matchStatus === "victory_party";
  const inDefeat = matchStatus === "defeat";

  return (
    <main className="min-h-screen bg-squawk-ink p-4 pb-28 text-parchment sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-squawk-gold">
              Battle board
            </h1>
            <p className="mt-1 max-w-xl font-body text-sm text-parchment/75">
              Squawk opens the battle the moment you start (tap-it-out callout), stays
              quiet until 0:30, then short auto lines through the end of minute one;
              minute marks at 1–4 minutes and random sprinkles after that. The
              last-minute &quot;we&apos;re ahead&quot; / &quot;we&apos;re behind&quot;
              lines are never auto-fired — use those buttons only.
              Drop tracks in{" "}
              <code className="text-parchment/90">public/battle/music/</code>{" "}
              — see README there. Bridge secret optional.{" "}
              <Link
                className="text-squawk-gold underline decoration-amber-700/50 underline-offset-2"
                href={BATTLE_BOARD_DISPLAY_PATH}
              >
                9:16 title display
              </Link>{" "}
              (one URL for OBS; pick scenes below — same origin as this page; art in{" "}
              <code className="text-parchment/90">public/battle/board/</code>).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={BATTLE_BOARD_DISPLAY_PATH}
              className="rounded-lg border border-zinc-500/45 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-900/50"
            >
              OBS title display
            </Link>
            <Link
              href="/overlay/battle-board"
              className="rounded-lg border border-zinc-600/35 px-3 py-1.5 text-sm text-zinc-300/90 hover:bg-zinc-950/50"
            >
              Title board index
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
              className="rounded-lg border border-parchment/40 px-3 py-1.5 text-sm text-squawk-gold hover:bg-white/5"
            >
              Parrot + bubble
            </Link>
            <Link
              href="/dev/parrot-test"
              className="rounded-lg border border-parchment/40 px-3 py-1.5 text-sm text-squawk-gold hover:bg-white/5"
            >
              Parrot test
            </Link>
          </div>
        </div>

        <section className="rounded-xl border border-zinc-600/40 bg-zinc-950/25 p-4">
          <h2 className="font-display text-sm font-bold text-zinc-100">
            OBS — 9:16 title &amp; tips (single browser source)
          </h2>
          <p className="mt-1 font-body text-xs text-parchment/70">
            Add one Browser source pointing at{" "}
            <code className="break-all text-parchment/90">
              …your-overlay-origin…{BATTLE_BOARD_DISPLAY_PATH}
            </code>
            — add{" "}
            <code className="text-parchment/85">?transparent=1</code> (or{" "}
            <code className="text-parchment/85">?obs=1</code>) for a clear
            background in OBS (also tick{" "}
            <strong className="text-parchment/85">Transparent</strong> on the
            Browser Source). Open this battle page on the{" "}
            <strong className="text-parchment/85">same overlay host</strong>{" "}
            (e.g. your Railway URL — see repo{" "}
            <code className="text-parchment/85">RAILWAY.md</code>
            ). While this tab is open, the match clock{" "}
            <strong className="text-parchment/85">auto-switches</strong> banner
            and tips by phase (win / lose boards after the result). Manual scene
            buttons below still POST immediately. Bridge{" "}
            <code className="text-parchment/85">/ws</code> updates OBS;
            BroadcastChannel only helps extra tabs on the same machine.
          </p>
          <div className="mt-3">
            <p className="font-display text-[11px] font-bold uppercase tracking-widest text-cyan-400/90">
              Battle levels
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BATTLE_BOARD_DEFS.filter((d) => d.kind === "level").map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  className="rounded-lg border border-cyan-700/40 bg-black/40 px-2.5 py-1.5 font-body text-xs font-semibold text-cyan-100/95 hover:bg-cyan-950/40"
                  onClick={() => publishBattleBoardScene(d.slug)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display text-[11px] font-bold uppercase tracking-widest text-violet-400/90">
              Banners
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BATTLE_BOARD_DEFS.filter((d) => d.kind === "banner").map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  className="rounded-lg border border-violet-600/40 bg-black/40 px-2.5 py-1.5 font-body text-xs font-semibold text-violet-100/95 hover:bg-violet-950/35"
                  onClick={() => publishBattleBoardScene(d.slug)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-emerald-600/35 bg-black/30 p-4">
          <h2 className="font-display text-sm font-bold text-emerald-200">
            First Mate Squawks — victory dance (anytime)
          </h2>
          <p className="mt-1 font-body text-xs text-parchment/70">
            Same as Stream Deck{" "}
            <code className="text-parchment/85">POST …/victory-dance</code> — fires
            the victory dance emote + line on the parrot overlay whenever you need
            it (match or not).
          </p>
          <button
            type="button"
            disabled={busy}
            className={`${btnCheer} mt-3`}
            onClick={() => {
              void (async () => {
                setBusy(true);
                try {
                  const data = await postStreamDeckAction(
                    bridgeUrl,
                    STREAM_DECK_VICTORY_DANCE,
                    streamDeckKey
                  );
                  setLog(
                    `[Victory dance (Stream Deck)]\n${JSON.stringify(data, null, 2)}`
                  );
                } catch (e) {
                  setLog(`[Victory dance (Stream Deck)]\n${String(e)}`);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Victory dance (overlay)
          </button>
        </section>

        <section className="rounded-xl border border-squawk-gold/35 bg-black/30 p-4">
          <label className="block font-body text-xs font-medium text-parchment/80">
            Opponent / rival crew name (used in hail lines — optional)
            <input
              type="text"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="e.g. Captain Rex"
              className="mt-1 w-full max-w-md rounded-lg border border-white/20 bg-black/40 px-3 py-2 font-body text-sm text-parchment outline-none focus:border-squawk-gold/60"
            />
          </label>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/25 p-4">
          <h2 className="font-display text-sm font-bold text-squawk-gold">
            Battle music
          </h2>
          <p className="mt-1 font-body text-xs text-parchment/65">
            Master level for phase / victory / defeat tracks. Mute keeps your slider
            value for when you unmute.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex min-w-[min(100%,280px)] flex-1 flex-col gap-1 sm:flex-row sm:items-center">
              <span className="shrink-0 font-body text-xs text-parchment/80">
                Volume
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(musicVolume01 * 100)}
                onChange={(e) =>
                  setMusicVolume01(
                    Math.min(1, Math.max(0, Number(e.target.value) / 100))
                  )
                }
                className="h-2 min-w-0 flex-1 cursor-pointer accent-squawk-gold"
                aria-label="Battle music volume"
              />
              <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-parchment/75">
                {Math.round(musicVolume01 * 100)}%
              </span>
            </label>
            <button
              type="button"
              className={
                musicMuted
                  ? "rounded-lg border border-squawk-gold/50 bg-squawk-gold/20 px-3 py-1.5 font-body text-xs font-semibold text-squawk-gold hover:bg-squawk-gold/30"
                  : "rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 font-body text-xs font-semibold text-parchment hover:bg-white/10"
              }
              onClick={() => setMusicMuted((m) => !m)}
            >
              {musicMuted ? "Unmute music" : "Mute music"}
            </button>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <h3 className="font-display text-xs font-bold text-parchment/90">
              Squawk voice (parrot overlay)
            </h3>
            <p className="mt-1 font-body text-xs text-parchment/60">
              TTS and browser speech on the parrot browser source. Same setting as
              the overlay&apos;s corner slider — saved in this browser (
              <code className="text-parchment/75">squawk-overlay-tts-vol</code>
              ). Refresh the OBS source if it was open before you changed this.
            </p>
            <div className="mt-3">
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

        <section className="rounded-xl border border-squawk-gold/35 bg-black/30 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-mono text-4xl font-bold tabular-nums text-squawk-gold">
              {inVictoryParty
                ? formatClock(partyRemainingSec)
                : formatClock(remainingSec)}
            </div>
            <div className="font-body text-sm text-parchment/70">
              {inVictoryParty
                ? "Victory party"
                : inDefeat
                  ? "Post-match — lighter track"
                  : awaiting
                    ? "Match over — pick result"
                    : phaseHint}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              disabled={matchStatus !== "idle"}
              onClick={startMatch}
            >
              Start match (5:00)
            </button>
            <button
              type="button"
              className={btn}
              disabled={matchStatus !== "running"}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Pause" : "Resume"}
            </button>
            <button type="button" className={btn} onClick={resetAll}>
              Reset all
            </button>
          </div>

          {awaiting ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-black/40 p-4">
              <p className="font-display text-base font-bold text-squawk-gold">
                Clock&apos;s at zero — who took the round?
              </p>
              <p className="mt-1 font-body text-xs text-parchment/70">
                Squawk waits for you. Win starts ~2 minutes of victory music + party
                timer; loss plays a softer track until you continue.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={btnWin}
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      try {
                        await postBattleTrigger(
                          bridgeUrl,
                          "battle_phase5_we_won",
                          streamDeckKey,
                          opponentName
                        );
                        setPartyRemainingSec(VICTORY_PARTY_SEC);
                        setMatchStatus("victory_party");
                        setLog((prev) => `${prev}\n[We won → party started]`);
                      } catch (e) {
                        setLog(String(e));
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  We won
                </button>
                <button
                  type="button"
                  className={btnLose}
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      try {
                        await postBattleTrigger(
                          bridgeUrl,
                          "battle_phase5_we_lost",
                          streamDeckKey,
                          opponentName
                        );
                        setMatchStatus("defeat");
                        setLog((prev) => `${prev}\n[We lost → softer track]`);
                      } catch (e) {
                        setLog(String(e));
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  We lost
                </button>
              </div>
            </div>
          ) : null}

          {inVictoryParty ? (
            <div className="mt-4 rounded-xl border border-emerald-600/40 bg-emerald-950/20 p-4">
              <p className="font-body text-sm text-parchment">
                Victory party — spam the party lines or cheer. Music loops until the
                timer ends.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
                {PARTY_VICTORY.map((b) => (
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
            </div>
          ) : null}

          {inDefeat ? (
            <div className="mt-4 rounded-xl border border-amber-600/30 bg-amber-950/15 p-4">
              <p className="font-body text-sm text-parchment/90">
                Take a breath — hail the other crew in chat. Tap below when
                you&apos;re ready to reset the board.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
                {PARTY_LOSS.map((b) => (
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
              <button
                type="button"
                className={`${btn} mt-3`}
                onClick={resetAll}
              >
                Continue — back to setup
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-white/10 bg-black/25 p-4">
          <h2 className="font-display text-lg font-bold text-squawk-gold">
            Hail the other crew
          </h2>
          <p className="mt-1 font-body text-xs text-parchment/65">
            Uses opponent name above in the lines. Works anytime — best during the
            fight.
          </p>
          <p className="mt-2 font-body text-[11px] font-semibold text-parchment/80">
            Respect & sportsmanship
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {HAIL_NICE.map((b) => (
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
          <p className="mt-4 font-body text-[11px] font-semibold text-parchment/80">
            Fun insults (keep it playful)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {HAIL_ROAST.map((b) => (
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
                  disabled={
                    busy || awaiting || inVictoryParty || inDefeat
                  }
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
            Squawk cheer — hype the troops
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
