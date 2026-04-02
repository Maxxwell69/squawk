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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const finishLine = useCallback(() => {
    setState("idle");
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

    const fallbackMs =
      next.holdMs ??
      next.durationMs ??
      estimateHoldMsFromText(next.text);

    const sleep = (ms: number) =>
      new Promise<void>((r) => setTimeout(r, ms));
    let voiceStarted = false;

    try {
      if (!audioUnlockedRef.current) {
        await sleep(fallbackMs);
      } else if (next.audioUrl) {
        const audio = audioRef.current;
        try {
          setState(next.state);
          voiceStarted = true;
          if (audio) {
            try {
              await playUrlOnce(audio, next.audioUrl);
            } catch (e1) {
              console.warn("[parrot] HTMLAudio failed, trying Web Audio", e1);
              await playUrlViaWebAudio(next.audioUrl);
            }
          } else {
            await playUrlViaWebAudio(next.audioUrl);
          }
        } catch (e2) {
          console.warn(
            "[parrot] TTS file playback failed (not using browser voice). Check message.audioUrl in /dev/parrot-test and bridge ElevenLabs env.",
            e2
          );
          await sleep(fallbackMs);
        }
      } else {
        // Bridge sent no audio file — browser speech so stream still has voice
        setState(next.state);
        voiceStarted = true;
        await speakWithBrowserTts(next.text);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[parrot] playback fallback to timer", err);
      }
      if (!voiceStarted) {
        setState("idle");
      }
      await sleep(fallbackMs);
    }

    finishLine();
    drainingRef.current = false;

    if (queueRef.current.length > 0) {
      void drainQueue();
    }
  }, [finishLine]);

  const enqueueSpeak = useCallback(
    (msg: ParrotSpeakMessage) => {
      queueRef.current.push(msg);
      void drainQueue();
    },
    [drainQueue]
  );

  useEffect(() => {
    const url = getClientWsUrl();
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setConnected(false);
      return;
    }

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      try {
        const raw = JSON.parse(String(ev.data));
        const parsed = bridgeWsMessageSchema.safeParse(raw);
        if (!parsed.success) return;

        if (parsed.data.type === "PARROT_SPEAK") {
          enqueueSpeak(parsed.data);
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
    };
  }, [enqueueSpeak]);

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
