"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bridgeWsMessageSchema,
  estimateHoldMsFromText,
  type ParrotSpeakMessage,
  type ParrotState,
} from "@captain-squawks/shared";
import {
  playUrlOnce,
  playUrlViaWebAudio,
  speakWithBrowserTts,
} from "@/lib/audio-player";
import { getClientWsUrl } from "@/lib/bridge-urls";
import { getSilentWavDataUri } from "@/lib/silent-wav-data-uri";
import { useAudioUnlock } from "./useAudioUnlock";

/**
 * FIFO queue: one PARROT_SPEAK at a time; new lines wait until the current line
 * finishes (audio end or fallback timer). Documented MVP — swap for interrupt later.
 */
export function useParrotBridge() {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ParrotState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [lastSpeak, setLastSpeak] = useState<ParrotSpeakMessage | null>(null);

  const { audioUnlocked, requestAudioUnlock: unlockBase } = useAudioUnlock();
  /** Ref avoids recreating drainQueue when unlock flips — stable WS + correct post-unlock playback */
  const audioUnlockedRef = useRef(false);
  audioUnlockedRef.current = audioUnlocked;

  const queueRef = useRef<ParrotSpeakMessage[]>([]);
  const drainingRef = useRef(false);
  /** While exit/return webm is playing — blocks duplicate Stream Deck double-fires */
  const activeExitAnimationRef = useRef<ParrotState | null>(null);
  /** Last accepted enqueue time for burst double-fires (Stream Deck / double WS) */
  const lastExitBurstRef = useRef<{ state: ParrotState; at: number } | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function isExitAnimationDupState(s: ParrotState): boolean {
    return s === "return" || s === "exit";
  }

  useEffect(() => {
    const el = new Audio();
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
    };
  }, []);

  const requestAudioUnlock = useCallback(async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.volume = 0.001;
        audio.src = getSilentWavDataUri();
        await audio.play();
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        audio.volume = 1;
      } catch {
        /* still try remote TTS after context unlock */
      }
    }
    await unlockBase();
  }, [unlockBase]);

  const finishLine = useCallback((endedState: ParrotState) => {
    const nextState: ParrotState =
      endedState === "exit" ? "away" : "idle";

    setState(nextState);
    setSubtitle("");
    setLastSpeak(null);
  }, []);

  const drainQueue = useCallback(async () => {
    if (drainingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    drainingRef.current = true;

    setSubtitle(next.text);
    setLastSpeak(next);

    const animationOnly =
      next.state === "exit" || next.state === "return" || next.state === "peck";
    const shouldSpeak = next.text.trim().length > 0;

    const fallbackMs =
      next.holdMs ??
      next.durationMs ??
      estimateHoldMsFromText(next.text);

    const sleep = (ms: number) =>
      new Promise<void>((r) => setTimeout(r, ms));

    try {
      if (animationOnly) {
        // Exit/return are visual-only (webm one-shots); don't attempt TTS/audio.
        if (isExitAnimationDupState(next.state)) {
          activeExitAnimationRef.current = next.state;
        }
        setState(next.state);
        await sleep(fallbackMs);
      } else if (!audioUnlockedRef.current) {
        // Still show the line's parrot clip (e.g. hello_wave) for the hold timer, then idle.
        setState(next.state);
        await sleep(fallbackMs);
      } else if (next.audioUrl) {
        // TTS often ends before holdMs (e.g. 5s audio vs 10s feeding clip) — wait both.
        setState(next.state);
        const playRemoteTts = async () => {
          const audio = audioRef.current;
          try {
            if (audio) {
              try {
                await playUrlOnce(audio, next.audioUrl!);
              } catch (e1) {
                console.warn("[parrot] HTMLAudio failed, trying Web Audio", e1);
                await playUrlViaWebAudio(next.audioUrl!);
              }
            } else {
              await playUrlViaWebAudio(next.audioUrl!);
            }
          } catch (e2) {
            console.warn(
              "[parrot] TTS file playback failed (not using browser voice). Check message.audioUrl in /dev/parrot-test and bridge ElevenLabs env.",
              e2
            );
            await sleep(fallbackMs);
          }
        };
        await Promise.all([playRemoteTts(), sleep(fallbackMs)]);
      } else {
        // Bridge sent no audio file — browser speech so stream still has voice
        setState(next.state);
        if (shouldSpeak) {
          // Some environments never fire speech `onend` — cap wait so we still return to idle.
          const ttsCapMs = Math.min(120_000, Math.max(fallbackMs + 1500, 8000));
          await Promise.race([
            speakWithBrowserTts(next.text),
            sleep(ttsCapMs),
          ]);
        } else {
          // Silent line (e.g. exit/away): just wait the visual timer.
          await sleep(fallbackMs);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[parrot] playback fallback to timer", err);
      }
      await sleep(fallbackMs);
    }

    finishLine(next.state);
    if (animationOnly && isExitAnimationDupState(next.state)) {
      activeExitAnimationRef.current = null;
    }
    drainingRef.current = false;

    if (queueRef.current.length > 0) {
      void drainQueue();
    }
  }, [finishLine]);

  const enqueueSpeak = useCallback(
    (msg: ParrotSpeakMessage) => {
      const emptyText = msg.text.trim().length === 0;
      if (emptyText && isExitAnimationDupState(msg.state)) {
        const now = Date.now();
        const burstMs = msg.state === "return" ? 3500 : 1500;
        const prev = lastExitBurstRef.current;
        if (prev?.state === msg.state && now - prev.at < burstMs) {
          return;
        }
        if (activeExitAnimationRef.current === msg.state) {
          return;
        }
        const dupQueued = queueRef.current.some(
          (m) =>
            m.text.trim() === "" &&
            m.state === msg.state &&
            isExitAnimationDupState(m.state)
        );
        if (dupQueued) {
          return;
        }
        lastExitBurstRef.current = { state: msg.state, at: now };
      }
      queueRef.current.push(msg);
      void drainQueue();
    },
    [drainQueue]
  );

  const enqueueSpeakRef = useRef(enqueueSpeak);
  enqueueSpeakRef.current = enqueueSpeak;

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearRetry = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const scheduleRetry = () => {
      if (cancelled) return;
      const delay = Math.min(30_000, 1000 * Math.pow(2, Math.min(attempt, 5)));
      attempt += 1;
      clearRetry();
      retryTimer = setTimeout(connect, delay);
    };

    function connect() {
      if (cancelled) return;
      clearRetry();
      const url = getClientWsUrl();
      try {
        ws = new WebSocket(url);
      } catch {
        setConnected(false);
        scheduleRetry();
        return;
      }

      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        ws = null;
        if (!cancelled) scheduleRetry();
      };
      ws.onerror = () => {
        setConnected(false);
      };
      ws.onmessage = (ev) => {
        try {
          const raw = JSON.parse(String(ev.data));
          const parsed = bridgeWsMessageSchema.safeParse(raw);
          if (!parsed.success) return;

          if (parsed.data.type === "PARROT_SPEAK") {
            enqueueSpeakRef.current(parsed.data);
          }
        } catch {
          /* ignore */
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearRetry();
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  return {
    connected,
    state,
    subtitle,
    lastSpeak,
    audioUnlocked,
    requestAudioUnlock,
    showAudioUnlockButton: !audioUnlocked,
  };
}
