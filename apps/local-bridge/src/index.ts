import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import {
  BATTLE_PARROT_STATE,
  battleTriggerBodySchema,
  type BattleTriggerId,
  type NormalizedStreamEvent,
  RUST_PARROT_STATE,
  rustTriggerBodySchema,
  SOT_PARROT_STATE,
  sotTriggerBodySchema,
  type RustTriggerId,
  type SotTriggerId,
  tikfinityWebhookSchema,
  testChaosBodySchema,
  testCommentBodySchema,
  testFollowBodySchema,
  testSubscribeBodySchema,
  testGiftBodySchema,
  testLikeMilestoneBodySchema,
  testShareBodySchema,
  battleBoardScenePostBodySchema,
  type BattleBoardSceneSlug,
  WINDROSE_PARROT_STATE,
  windroseTriggerBodySchema,
  type WindroseTriggerId,
} from "@captain-squawks/shared";
import { loadConfig } from "./config.js";
import { BrainService } from "./brain/service.js";
import {
  extractActorFromTikfinityPayload,
  extractGiftFromTikfinityPayload,
  makeTestEvent,
  normalizeTikfinityPayload,
  normalizeWebhookAsKind,
} from "./normalize.js";
import { createVoiceProvider } from "./services/tts/index.js";
import { AudioFileStore } from "./services/audio/audio-file-store.js";
import { processParrotReaction } from "./services/parrot-reaction.js";
import { WsHub } from "./ws-hub.js";

const config = loadConfig();
const brain = new BrainService();
const voice = createVoiceProvider(config.ttsProvider);
const audioStore = new AudioFileStore(config.audioTempDir, config.publicBaseUrl);
const hub = new WsHub();

let lastBattleBoardScene: BattleBoardSceneSlug | null = null;

/** Ignore duplicate Stream Deck POSTs within this window (hardware often double-fires). */
const STREAM_DECK_ANIM_DEDUP_MS = 3500;
const lastStreamDeckAnimAt = { return: 0, exit: 0 };

function shouldSkipDuplicateStreamDeckAnim(
  kind: keyof typeof lastStreamDeckAnimAt
): boolean {
  const now = Date.now();
  if (now - lastStreamDeckAnimAt[kind] < STREAM_DECK_ANIM_DEDUP_MS) {
    return true;
  }
  lastStreamDeckAnimAt[kind] = now;
  return false;
}

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

await app.register(cors, { origin: true });
// TikFinity actions can post webhook data as text/plain or urlencoded.
app.addContentTypeParser(
  /^text\/plain(?:;.*)?$/i,
  { parseAs: "string" },
  (_req, body, done) => done(null, body)
);
app.addContentTypeParser(
  /^application\/x-www-form-urlencoded(?:;.*)?$/i,
  { parseAs: "string" },
  (_req, body, done) => done(null, body)
);

await audioStore.ensureDir();
await app.register(fastifyStatic, {
  root: config.audioTempDir,
  prefix: "/audio/",
  decorateReply: false,
  setHeaders: (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
});

await app.register(websocket);

async function handleNormalizedEvent(event: NormalizedStreamEvent) {
  return processParrotReaction({
    event,
    brain,
    voice,
    audioStore,
    hub,
    config,
    log: app.log,
  });
}

function coerceWebhookBody(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const s = raw.trim();
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    const params = new URLSearchParams(s);
    const out: Record<string, string> = {};
    for (const [k, v] of params.entries()) out[k] = v;
    return out;
  }
}

function pickWebhookString(
  obj: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function parseWindroseWebhookFields(
  raw: unknown
): { actorLabel?: string; giftName?: string } | null {
  const body =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const parsed = tikfinityWebhookSchema.safeParse(body);
  if (!parsed.success) return null;
  const payload = parsed.data;
  const rawObj = payload as unknown as Record<string, unknown>;
  const nestedData =
    rawObj.data && typeof rawObj.data === "object"
      ? (rawObj.data as Record<string, unknown>)
      : {};

  return {
    actorLabel:
      pickWebhookString(rawObj, ["crewMemberName", "displayName", "name"]) ??
      pickWebhookString(nestedData, ["crewMemberName", "displayName", "name"]) ??
      extractActorFromTikfinityPayload(payload),
    giftName:
      pickWebhookString(rawObj, ["giftName", "giftname", "gift", "gift_name"]) ??
      pickWebhookString(nestedData, [
        "giftName",
        "giftname",
        "gift",
        "gift_name",
      ]) ??
      extractGiftFromTikfinityPayload(payload),
  };
}

/** Public origin as seen by clients (Railway sets x-forwarded-*). */
function bridgePublicOrigin(req: FastifyRequest): string {
  const xfProto = req.headers["x-forwarded-proto"];
  const protoRaw =
    (typeof xfProto === "string" ? xfProto : "http").split(",")[0]?.trim() ||
    "http";
  const xfHost = req.headers["x-forwarded-host"];
  const host =
    (typeof xfHost === "string" ? xfHost : req.headers.host) || "localhost";
  return `${protoRaw}://${host}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

app.get("/", async (req, reply) => {
  const origin = bridgePublicOrigin(req);
  const wsBase = origin.startsWith("https")
    ? "wss" + origin.slice("https".length)
    : "ws" + origin.slice("http".length);
  const wsUrl = `${wsBase}/ws`;
  const overlayBase = process.env.OVERLAY_PUBLIC_URL?.trim().replace(/\/$/, "");
  const accept = req.headers.accept ?? "";
  const wantsJson =
    accept.includes("application/json") && !accept.includes("text/html");

  if (wantsJson) {
    return {
      ok: true,
      service: "captain-squawks-bridge",
      message:
        "This host is the API bridge (Stream Deck, webhooks, WebSocket). The Next.js overlay is a separate deployment.",
      health: `${origin}/health`,
      websocket: wsUrl,
      overlay: overlayBase ? `${overlayBase}/dev/parrot-test` : undefined,
    };
  }

  reply.type("text/html; charset=utf-8");
  const overlayBlock = overlayBase
    ? `<p><strong>Overlay test panel:</strong> <a href="${escapeHtml(overlayBase)}/dev/parrot-test">/dev/parrot-test</a> on your overlay deployment.</p>`
    : `<p>Optional: set Railway env <code>OVERLAY_PUBLIC_URL</code> to your <strong>Next.js overlay</strong> origin (e.g. <code>https://squawk-overlay.up.railway.app</code>) to show a link here.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Pirate Maxx — Squawk bridge</title>
<style>
body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#111}
code{background:#f4f4f5;padding:.12rem .35rem;border-radius:4px;font-size:88%}
a{color:#0b6}
h1{font-size:1.35rem;font-weight:600}
</style>
</head>
<body>
<h1>Pirate Maxx — Squawk bridge</h1>
<p>This URL is the <strong>Fastify API</strong> (Stream Deck routes, TikFinity webhook, TTS audio, WebSocket). It is <strong>not</strong> the Next.js overlay — opening the root in a browser used to show 404 because there was no page here.</p>
<p><strong>Health:</strong> <a href="/health"><code>/health</code></a></p>
<p><strong>WebSocket for overlays:</strong> <code>${escapeHtml(wsUrl)}</code></p>
${overlayBlock}
<p><strong>Stream Deck:</strong> <code>POST</code> to <code>${escapeHtml(origin)}/api/streamdeck/hello</code> (and other routes — see repo).</p>
<p><strong>Battle UI:</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/battle/trigger</code> with JSON <code>${escapeHtml(JSON.stringify({ triggerId: "battle_prepare_1", opponentName: "optional", crewMemberName: "optional" }))}</code> — <code>opponentName</code> / <code>crewMemberName</code> fill <code>{{OPPONENT}}</code> / <code>{{CREW}}</code> in lines (same auth as Stream Deck when a secret is set).</p>
<p><strong>Sea of Thieves board:</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/sot/trigger</code> with JSON <code>${escapeHtml(JSON.stringify({ triggerId: "sot_island_arrival_1" }))}</code> (same auth).</p>
<p><strong>Rust adventure board:</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/rust/trigger</code> with JSON <code>${escapeHtml(JSON.stringify({ triggerId: "rust_roam_1" }))}</code> (same auth).</p>
<p><strong>Windrose board:</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/windrose/trigger</code> with JSON <code>${escapeHtml(JSON.stringify({ triggerId: "windrose_game_hook_1", crewMemberName: "optional", giftName: "optional" }))}</code> (same auth).</p>
<p><strong>Battle title display:</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/battle-board/scene</code> with JSON <code>${escapeHtml(JSON.stringify({ slug: "prepare" }))}</code> — broadcasts <code>BATTLE_BOARD_SCENE</code> on <code>/ws</code> for the 9:16 overlay (same auth when secret is set).</p>
<p><strong>Webhooks (TikFinity-style body):</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/webhooks/tikfinity</code> (auto-detect), or <code>${escapeHtml(origin)}/api/webhooks/follow</code> / <code>${escapeHtml(origin)}/api/webhooks/subscribe</code> — JSON, <code>text/plain</code> JSON, or form fields; username fields: <code>username</code>, <code>user</code>, <code>nickname</code>, or nested under <code>data</code>. Optional <code>tier</code> / <code>level</code> on subscribe.</p>
<p><strong>Windrose TikFinity hooks:</strong> <code>POST</code> <code>${escapeHtml(origin)}/api/webhooks/windrose/gift-praise</code>, <code>${escapeHtml(origin)}/api/webhooks/windrose/crew-praise</code>, or <code>${escapeHtml(origin)}/api/webhooks/windrose/feed-squawk</code> — same flexible body formats; gift hook also reads <code>giftName</code> / <code>gift</code>.</p>
</body>
</html>`;
});

app.get("/health", async () => ({
  ok: true,
  service: "captain-squawks-bridge",
  tts: config.featureTts ? config.ttsProvider : "off",
}));

app.get("/ws", { websocket: true }, (socket) => {
  hub.add(socket);
  hub.broadcastJson({
    type: "server_hello",
    payload: { version: "0.2.0" },
  });
  if (lastBattleBoardScene) {
    hub.sendToSocket(socket, {
      type: "BATTLE_BOARD_SCENE",
      slug: lastBattleBoardScene,
    });
  }
  socket.on("message", (raw: Buffer) => {
    try {
      const text = raw.toString();
      if (text === "ping") {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    } catch {
      /* ignore */
    }
  });
});

app.post("/api/test/follow", async (req) => {
  const body = testFollowBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("follow", {
    actorLabel: body.username,
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/test/gift", async (req) => {
  const body = testGiftBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("gift", {
    actorLabel: body.username,
    detail: body.giftName,
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/test/like-milestone", async (req) => {
  const body = testLikeMilestoneBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("like_milestone", {
    detail:
      body.milestone !== undefined ? `likes:${body.milestone}` : undefined,
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/test/share", async (req) => {
  const body = testShareBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("share", { actorLabel: body.username });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/test/comment", async (req) => {
  const body = testCommentBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("comment", {
    actorLabel: body.username,
    detail: body.text,
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/test/chaos", async (req) => {
  const body = testChaosBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("chaos", { detail: body.note });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

const streamDeckPreHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const secret = config.streamDeckSecret;
  if (!secret) return;
  const headerKey = req.headers["x-stream-deck-key"];
  const key =
    typeof headerKey === "string" ? headerKey : Array.isArray(headerKey) ? headerKey[0] : undefined;
  const auth = req.headers.authorization;
  const bearer =
    typeof auth === "string" && auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : undefined;
  const ok = key === secret || bearer === secret;
  if (!ok) {
    return reply.code(401).send({ ok: false, error: "unauthorized" });
  }
};

const streamDeckOpts = { preHandler: streamDeckPreHandler };

app.post("/api/streamdeck/hello", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_hello",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/please-share", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_please_share",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/thanks-likes", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_thanks_likes",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/thanks-share", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_thanks_share",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/pirate-maxx", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_pirate_maxx",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/exit", streamDeckOpts, async () => {
  if (shouldSkipDuplicateStreamDeckAnim("exit")) {
    return { ok: true, deduped: true };
  }
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_exit",
    raw: { source: "stream_deck", parrotState: "exit" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/return", streamDeckOpts, async () => {
  if (shouldSkipDuplicateStreamDeckAnim("return")) {
    return { ok: true, deduped: true };
  }
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_return",
    raw: { source: "stream_deck", parrotState: "return" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/peck", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_peck",
    raw: { source: "stream_deck", parrotState: "peck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/victory-dance", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_victory_dance",
    raw: { source: "stream_deck", parrotState: "victory_dance" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/dancing-squawk", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_dancing_squawk",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/streamdeck/squawk-feeding-time", streamDeckOpts, async () => {
  const ev = makeTestEvent("custom", {
    detail: "streamdeck_feeding_time",
    raw: { source: "stream_deck" },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/battle/trigger", streamDeckOpts, async (req) => {
  const body = battleTriggerBodySchema.parse(req.body ?? {});
  const name = body.opponentName?.trim();
  const crew = body.crewMemberName?.trim();
  const triggerId = body.triggerId as BattleTriggerId;
  const parrotState = BATTLE_PARROT_STATE[triggerId];
  const ev = makeTestEvent("custom", {
    detail: body.triggerId,
    raw: {
      source: "battle_ui",
      parrotState,
      ...(name ? { opponentName: name } : {}),
      ...(crew ? { crewMemberName: crew } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/battle-board/scene", streamDeckOpts, async (req) => {
  const body = battleBoardScenePostBodySchema.parse(req.body ?? {});
  lastBattleBoardScene = body.slug;
  hub.broadcastJson({ type: "BATTLE_BOARD_SCENE", slug: body.slug });
  return { ok: true, slug: body.slug };
});

app.post("/api/sot/trigger", streamDeckOpts, async (req) => {
  const body = sotTriggerBodySchema.parse(req.body ?? {});
  const triggerId = body.triggerId as SotTriggerId;
  const parrotState = SOT_PARROT_STATE[triggerId];
  const crew = body.crewMemberName?.trim();
  const ev = makeTestEvent("custom", {
    detail: body.triggerId,
    raw: {
      source: "sot_board",
      parrotState,
      ...(crew ? { crewMemberName: crew } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/rust/trigger", streamDeckOpts, async (req) => {
  const body = rustTriggerBodySchema.parse(req.body ?? {});
  const triggerId = body.triggerId as RustTriggerId;
  const parrotState = RUST_PARROT_STATE[triggerId];
  const crew = body.crewMemberName?.trim();
  const ev = makeTestEvent("custom", {
    detail: body.triggerId,
    raw: {
      source: "rust_board",
      parrotState,
      ...(crew ? { crewMemberName: crew } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/windrose/trigger", streamDeckOpts, async (req) => {
  const body = windroseTriggerBodySchema.parse(req.body ?? {});
  const triggerId = body.triggerId as WindroseTriggerId;
  const parrotState = WINDROSE_PARROT_STATE[triggerId];
  const crew = body.crewMemberName?.trim();
  const gift = body.giftName?.trim();
  const ev = makeTestEvent("custom", {
    detail: body.triggerId,
    raw: {
      source: "windrose_board",
      parrotState,
      ...(crew ? { crewMemberName: crew } : {}),
      ...(gift ? { giftName: gift } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/webhooks/tikfinity", async (req, reply) => {
  const normalized = normalizeTikfinityPayload(coerceWebhookBody(req.body));
  if (!normalized) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const message = await handleNormalizedEvent(normalized);
  return { ok: true, message };
});

/** Point TikFinity (or any tool) at this URL for follow-only actions. */
app.post("/api/webhooks/follow", async (req, reply) => {
  const normalized = normalizeWebhookAsKind(
    coerceWebhookBody(req.body),
    "follow"
  );
  if (!normalized) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const message = await handleNormalizedEvent(normalized);
  return { ok: true, message };
});

/** Point TikFinity (or any tool) at this URL for subscribe / membership actions. */
app.post("/api/webhooks/subscribe", async (req, reply) => {
  const normalized = normalizeWebhookAsKind(
    coerceWebhookBody(req.body),
    "subscribe"
  );
  if (!normalized) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const message = await handleNormalizedEvent(normalized);
  return { ok: true, message };
});

app.post("/api/webhooks/windrose/gift-praise", async (req, reply) => {
  const fields = parseWindroseWebhookFields(coerceWebhookBody(req.body));
  if (!fields) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const ev = makeTestEvent("custom", {
    detail: "windrose_gift_praise",
    raw: {
      source: "windrose_webhook",
      ...(fields.actorLabel ? { crewMemberName: fields.actorLabel } : {}),
      ...(fields.giftName ? { giftName: fields.giftName } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/webhooks/windrose/crew-praise", async (req, reply) => {
  const fields = parseWindroseWebhookFields(coerceWebhookBody(req.body));
  if (!fields) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const ev = makeTestEvent("custom", {
    detail: "windrose_crew_praise",
    raw: {
      source: "windrose_webhook",
      ...(fields.actorLabel ? { crewMemberName: fields.actorLabel } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

app.post("/api/webhooks/windrose/feed-squawk", async (req) => {
  const fields = parseWindroseWebhookFields(coerceWebhookBody(req.body)) ?? {};
  const ev = makeTestEvent("custom", {
    detail: "windrose_feeding_time",
    raw: {
      source: "windrose_webhook",
      ...(fields.actorLabel ? { crewMemberName: fields.actorLabel } : {}),
    },
  });
  const message = await handleNormalizedEvent(ev);
  return { ok: true, message };
});

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `Squawk bridge listening on http://${config.host}:${config.port} (audio: ${config.publicBaseUrl}/audio/)`
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
