import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import {
  type NormalizedStreamEvent,
  testChaosBodySchema,
  testCommentBodySchema,
  testFollowBodySchema,
  testGiftBodySchema,
  testLikeMilestoneBodySchema,
  testShareBodySchema,
} from "@captain-squawks/shared";
import { loadConfig } from "./config.js";
import { BrainService } from "./brain/service.js";
import { makeTestEvent, normalizeTikfinityPayload } from "./normalize.js";
import { createVoiceProvider } from "./services/tts/index.js";
import { AudioFileStore } from "./services/audio/audio-file-store.js";
import { processParrotReaction } from "./services/parrot-reaction.js";
import { WsHub } from "./ws-hub.js";

const config = loadConfig();
const brain = new BrainService();
const voice = createVoiceProvider(config.ttsProvider);
const audioStore = new AudioFileStore(config.audioTempDir, config.publicBaseUrl);
const hub = new WsHub();

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

app.post("/api/webhooks/tikfinity", async (req, reply) => {
  const normalized = normalizeTikfinityPayload(coerceWebhookBody(req.body));
  if (!normalized) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const message = await handleNormalizedEvent(normalized);
  return { ok: true, message };
});

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `Captain Squawks bridge listening on http://${config.host}:${config.port} (audio: ${config.publicBaseUrl}/audio/)`
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
