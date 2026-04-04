import {
  getClientBridgeHttp,
  normalizeHttpOrigin,
} from "@/lib/bridge-urls";
import {
  type BattleBoardSlug,
  isBattleBoardSlug,
} from "@/lib/battle-board-slugs";

export const BATTLE_BOARD_CHANNEL = "squawk-battle-board";

/** Same-tab / same-browser profile (not OBS) — optional extra. */
export const LS_BATTLE_BOARD_SCENE = "squawk-battle-board-scene";

type SceneMessage = { t: "scene"; slug: BattleBoardSlug };

function bridgeOriginForScenePost(): string {
  if (typeof window === "undefined") return "";
  try {
    const ls = window.localStorage.getItem("squawk-battle-bridge")?.trim();
    if (ls) return normalizeHttpOrigin(ls);
  } catch {
    /* ignore */
  }
  return getClientBridgeHttp();
}

function streamDeckKeyForScenePost(): string {
  if (typeof window === "undefined") return "";
  try {
    const ls =
      window.localStorage.getItem("squawk-parrot-test-stream-deck-key")?.trim() ??
      "";
    if (ls) return ls;
  } catch {
    /* ignore */
  }
  return process.env.NEXT_PUBLIC_STREAM_DECK_TEST_KEY?.trim() ?? "";
}

/**
 * Updates the 9:16 title display everywhere:
 * - POSTs to the bridge (OBS + any WS client, including different browsers)
 * - BroadcastChannel + localStorage for a second tab on the same browser profile
 */
export function publishBattleBoardScene(slug: BattleBoardSlug): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_BATTLE_BOARD_SCENE, slug);
  } catch {
    /* private mode */
  }
  try {
    const bc = new BroadcastChannel(BATTLE_BOARD_CHANNEL);
    bc.postMessage({ t: "scene", slug } satisfies SceneMessage);
    bc.close();
  } catch {
    /* very old browsers */
  }

  const origin = bridgeOriginForScenePost().replace(/\/+$/, "");
  const key = streamDeckKeyForScenePost();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key) headers["x-stream-deck-key"] = key;

  void fetch(`${origin}/api/battle-board/scene`, {
    method: "POST",
    headers,
    body: JSON.stringify({ slug }),
  }).catch(() => {
    /* bridge down — BC / LS still help same-browser tabs */
  });
}

export function parseSceneMessage(data: unknown): BattleBoardSlug | null {
  if (!data || typeof data !== "object") return null;
  const o = data as { t?: unknown; slug?: unknown };
  if (o.t !== "scene" || typeof o.slug !== "string") return null;
  return isBattleBoardSlug(o.slug) ? o.slug : null;
}
