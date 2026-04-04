"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { bridgeWsMessageSchema } from "@captain-squawks/shared";
import { BattleBoardFrame } from "@/components/BattleBoardFrame";
import { getClientWsUrl } from "@/lib/bridge-urls";
import {
  BATTLE_BOARD_CHANNEL,
  LS_BATTLE_BOARD_SCENE,
  parseSceneMessage,
} from "@/lib/battle-board-sync";
import {
  getBattleBoardDef,
  isBattleBoardSlug,
  type BattleBoardSlug,
} from "@/lib/battle-board-slugs";

export function BattleBoardDisplayClient() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<BattleBoardSlug>("prepare");

  useEffect(() => {
    const q = searchParams.get("scene")?.trim() ?? "";
    if (isBattleBoardSlug(q)) {
      setSlug(q);
      return;
    }
    try {
      const ls = localStorage.getItem(LS_BATTLE_BOARD_SCENE);
      if (ls && isBattleBoardSlug(ls)) setSlug(ls);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    const bc = new BroadcastChannel(BATTLE_BOARD_CHANNEL);
    bc.onmessage = (ev: MessageEvent) => {
      const next = parseSceneMessage(ev.data);
      if (next) setSlug(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === LS_BATTLE_BOARD_SCENE &&
        e.newValue &&
        isBattleBoardSlug(e.newValue)
      ) {
        setSlug(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      bc.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearRetry = () => {
      if (retry) {
        clearTimeout(retry);
        retry = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(30_000, 1000 * Math.pow(2, Math.min(attempt, 5)));
      attempt += 1;
      clearRetry();
      retry = setTimeout(connect, delay);
    };

    function connect() {
      if (cancelled) return;
      clearRetry();
      const url = getClientWsUrl();
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        attempt = 0;
      };
      ws.onclose = () => {
        ws = null;
        if (!cancelled) scheduleReconnect();
      };
      ws.onerror = () => {
        ws?.close();
      };
      ws.onmessage = (ev) => {
        try {
          const raw: unknown = JSON.parse(String(ev.data));
          const parsed = bridgeWsMessageSchema.safeParse(raw);
          if (
            parsed.success &&
            parsed.data.type === "BATTLE_BOARD_SCENE"
          ) {
            setSlug(parsed.data.slug);
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
      ws?.close();
    };
  }, []);

  const def = getBattleBoardDef(slug);
  if (!def) return null;

  return <BattleBoardFrame def={def} />;
}
