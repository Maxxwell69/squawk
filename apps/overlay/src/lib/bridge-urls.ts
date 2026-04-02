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
 */
export function getClientWsUrl(): string {
  const wsEnv = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (wsEnv) {
    if (/^wss?:\/\//i.test(wsEnv)) return wsEnv;
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
  return "ws://127.0.0.1:8787/ws";
}
