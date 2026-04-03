/**
 * Normalize bridge HTTP origin for fetch() (Railway env sometimes omits the scheme).
 * Strips any accidental path so API calls always hit the bridge root.
 */
export function normalizeHttpOrigin(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return "http://127.0.0.1:8787";
  let withScheme = t;
  if (t.startsWith("//")) withScheme = `https:${t}`;
  else if (!/^https?:\/\//i.test(t)) withScheme = `https://${t}`;
  try {
    const u = new URL(withScheme);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://127.0.0.1:8787";
  }
}

export function wsUrlFromHttpOrigin(httpOrigin: string): string {
  const u = new URL(httpOrigin);
  const scheme = u.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${u.host}/ws`;
}

/** Ensure explicit `wss://` / `ws://` URLs end with `/ws`. */
function normalizeExplicitWsUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (!/^wss?:\/\//i.test(t)) return t;
  const base = t.replace(/\/+$/, "");
  if (/\/ws$/i.test(base)) return base;
  return `${base}/ws`;
}

/**
 * Read optional URL overrides from the page query string (OBS / TikTok Live Studio /
 * deployed overlay without rebuilding). Examples:
 * - `?squawk_bridge=https://your-bridge.up.railway.app` → `wss://…/ws`
 * - `?squawk_ws=wss://your-bridge.up.railway.app/ws`
 */
function wsUrlFromQueryString(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const qs = new URLSearchParams(window.location.search);
    const direct = qs.get("squawk_ws")?.trim();
    if (direct) return normalizeExplicitWsUrl(direct);
    const bridge = qs.get("squawk_bridge")?.trim();
    if (bridge) return wsUrlFromHttpOrigin(normalizeHttpOrigin(bridge));
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Default local Fastify bridge (Stream Deck + test routes). */
export const DEFAULT_LOCAL_BRIDGE_HTTP = "http://127.0.0.1:8787";

/** Browser overlay: public bridge API origin (NEXT_PUBLIC_BRIDGE_HTTP). */
export function getClientBridgeHttp(): string {
  const env = process.env.NEXT_PUBLIC_BRIDGE_HTTP?.trim();
  if (env) return normalizeHttpOrigin(env);
  return DEFAULT_LOCAL_BRIDGE_HTTP;
}

/**
 * Optional second bridge URL for /dev/parrot-test (Railway deploy).
 * Empty if unset — the test page falls back to a manual input.
 */
export function getClientRailwayBridgeHttp(): string {
  const env = process.env.NEXT_PUBLIC_RAILWAY_BRIDGE_HTTP?.trim();
  if (!env) return "";
  return normalizeHttpOrigin(env);
}

/**
 * WebSocket URL for the bridge. Uses NEXT_PUBLIC_WS_URL when set; otherwise
 * derives wss/ws from NEXT_PUBLIC_BRIDGE_HTTP so one var is enough on Railway.
 *
 * In the browser, query overrides win (see `wsUrlFromQueryString`).
 * If the page is **https** and the resolved URL is **ws://127.0.0.1**, the browser
 * may block it (mixed content) — set `NEXT_PUBLIC_WS_URL` to `wss://…` or add
 * `?squawk_bridge=https://…` to the overlay URL.
 */
export function getClientWsUrl(): string {
  if (typeof window !== "undefined") {
    const fromQs = wsUrlFromQueryString();
    if (fromQs) return fromQs;
  }

  const wsEnv = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (wsEnv) {
    if (/^wss?:\/\//i.test(wsEnv)) return wsEnv.endsWith("/ws") ? wsEnv : normalizeExplicitWsUrl(wsEnv);
    return wsUrlFromHttpOrigin(normalizeHttpOrigin(wsEnv));
  }
  const httpEnv = process.env.NEXT_PUBLIC_BRIDGE_HTTP?.trim();
  if (httpEnv) return wsUrlFromHttpOrigin(normalizeHttpOrigin(httpEnv));
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") {
      return "ws://127.0.0.1:8787/ws";
    }
  }
  const fallback = "ws://127.0.0.1:8787/ws";
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    fallback.startsWith("ws://127.")
  ) {
    console.warn(
      "[squawk] Overlay is HTTPS but WebSocket defaults to ws://127.0.0.1 — browsers often block this. Set NEXT_PUBLIC_WS_URL to your bridge wss:// URL, or add ?squawk_bridge=https://your-bridge-host to the overlay URL."
    );
  }
  return fallback;
}
