"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bridgeWsMessageSchema,
  estimateHoldMsFromText,
  type ParrotSpeakMessage,
  type ParrotState,
} from "@captain-squawks/shared";
import { playUrlOnce } from "@/lib/audio-player";
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
    setState(next.state);
    setLastSpeak(next);

    const fallbackMs =
      next.holdMs ??
      next.durationMs ??
      estimateHoldMsFromText(next.text);

    try {
      if (next.audioUrl && audioUnlocked) {
        const audio = audioRef.current;
        if (audio) {
          await playUrlOnce(audio, next.audioUrl);
        } else {
          await new Promise((r) => setTimeout(r, fallbackMs));
        }
      } else {
        await new Promise((r) => setTimeout(r, fallbackMs));
      }
    } catch {
      await new Promise((r) => setTimeout(r, fallbackMs));
    }

    finishLine();
    drainingRef.current = false;

    if (queueRef.current.length > 0) {
      void drainQueue();
    }
  }, [audioUnlocked, finishLine]);

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
