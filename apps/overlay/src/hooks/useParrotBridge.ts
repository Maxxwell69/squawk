"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bridgeWsMessageSchema,
  type ParrotOverlayPayload,
  type ParrotState,
} from "@captain-squawks/shared";

/**
 * Local dev: ws://127.0.0.1:8787/ws
 * Hosted (Railway, etc.): set NEXT_PUBLIC_WS_URL at **build** time to the bridge
 * public URL, e.g. wss://your-bridge.up.railway.app/ws (overlay and bridge are
 * usually different hostnames).
 */
function getWsUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return "ws://127.0.0.1:8787/ws";
    }
  }
  return "ws://127.0.0.1:8787/ws";
}

export function useParrotBridge() {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ParrotState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [lastPayload, setLastPayload] = useState<ParrotOverlayPayload | null>(
    null
  );
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const scheduleIdle = useCallback(
    (holdMs: number) => {
      clearIdleTimer();
      idleTimer.current = setTimeout(() => {
        setState("idle");
        setSubtitle("");
        idleTimer.current = null;
      }, holdMs);
    },
    [clearIdleTimer]
  );

  useEffect(() => {
    const url = getWsUrl();
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
        if (parsed.data.type === "parrot_update") {
          const p = parsed.data.payload;
          setLastPayload(p);
          setState(p.state);
          setSubtitle(p.subtitle);
          scheduleIdle(p.holdMs);
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      clearIdleTimer();
      ws.close();
    };
  }, [clearIdleTimer, scheduleIdle]);

  return {
    connected,
    state,
    subtitle,
    lastPayload,
  };
}
