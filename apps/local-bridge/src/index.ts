import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
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
import { createMockTts } from "./tts/mock-tts.js";
import { TtsQueue } from "./tts/queue.js";
import { WsHub } from "./ws-hub.js";

const config = loadConfig();
const brain = new BrainService();
const tts = createMockTts();
const ttsQueue = new TtsQueue(tts);
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

await app.register(cors, {
  origin: true,
});

await app.register(websocket);

function handleNormalizedEvent(event: NormalizedStreamEvent) {
  const payload = brain.buildOverlayPayload(event);
  ttsQueue.enqueue(payload.subtitle);
  hub.broadcastParrotUpdate(payload);
  return payload;
}

app.get("/health", async () => ({ ok: true, service: "captain-squawks-bridge" }));

app.get("/ws", { websocket: true }, (socket) => {
  hub.add(socket);
  hub.broadcastJson({
    type: "server_hello",
    payload: { version: "0.1.0" },
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
  const payload = handleNormalizedEvent(ev);
  return { ok: true, payload };
});

app.post("/api/test/gift", async (req) => {
  const body = testGiftBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("gift", {
    actorLabel: body.username,
    detail: body.giftName,
  });
  const payload = handleNormalizedEvent(ev);
  return { ok: true, payload };
});

app.post("/api/test/like-milestone", async (req) => {
  const body = testLikeMilestoneBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("like_milestone", {
    detail:
      body.milestone !== undefined ? `likes:${body.milestone}` : undefined,
  });
  const payload = handleNormalizedEvent(ev);
  return { ok: true, payload };
});

app.post("/api/test/share", async (req) => {
  const body = testShareBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("share", { actorLabel: body.username });
  const payload = handleNormalizedEvent(ev);
  return { ok: true, payload };
});

app.post("/api/test/comment", async (req) => {
  const body = testCommentBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("comment", {
    actorLabel: body.username,
    detail: body.text,
  });
  const payload = handleNormalizedEvent(ev);
  return { ok: true, payload };
});

app.post("/api/test/chaos", async (req) => {
  const body = testChaosBodySchema.parse(req.body ?? {});
  const ev = makeTestEvent("chaos", { detail: body.note });
  const payload = handleNormalizedEvent(ev);
  return { ok: true, payload };
});

app.post("/api/webhooks/tikfinity", async (req, reply) => {
  const normalized = normalizeTikfinityPayload(req.body);
  if (!normalized) {
    return reply.code(400).send({ ok: false, error: "invalid_payload" });
  }
  const payload = handleNormalizedEvent(normalized);
  return { ok: true, payload };
});

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(
    `Captain Squawks bridge listening on http://${config.host}:${config.port}`
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
