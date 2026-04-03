import {
  isParrotState,
  parrotSpeakMessageSchema,
  type NormalizedStreamEvent,
  type ParrotSpeakMessage,
} from "@captain-squawks/shared";
import type { FastifyBaseLogger } from "fastify";
import { BrainService } from "../brain/service.js";
import type { VoiceProvider } from "./tts/voice-provider.js";
import { AudioFileStore } from "./audio/audio-file-store.js";
import type { BridgeConfig } from "../config.js";
import type { WsHub } from "../ws-hub.js";

export async function processParrotReaction(params: {
  event: NormalizedStreamEvent;
  brain: BrainService;
  voice: VoiceProvider;
  audioStore: AudioFileStore;
  hub: WsHub;
  config: BridgeConfig;
  log: FastifyBaseLogger;
}): Promise<ParrotSpeakMessage> {
  const { event, brain, voice, audioStore, hub, config, log } = params;
  const base = brain.buildOverlayPayload(event);
  const subtitleTrimmed = base.subtitle.trim();

  let audioUrl: string | undefined;
  let durationMs: number | undefined;

  if (config.featureTts && subtitleTrimmed) {
    try {
      const cacheKey = JSON.stringify({
        text: subtitleTrimmed,
        provider: config.ttsProvider,
        elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
        elevenlabsModelId: process.env.ELEVENLABS_MODEL_ID ?? "",
        elevenlabsOutputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT ?? "",
        elevenlabsBaseUrl: process.env.ELEVENLABS_BASE_URL ?? "",
        elevenlabsVoiceSettings: process.env.ELEVENLABS_VOICE_SETTINGS ?? "",
      });

      const cached = await audioStore.getCachedAudio(cacheKey);
      if (cached) {
        audioUrl = cached.saved.publicUrl;
        durationMs = cached.durationMs;
      } else {
        const spoken = await voice.speak(subtitleTrimmed);
        const stored = await audioStore.saveAudioCached(
          cacheKey,
          spoken.audioBuffer,
          spoken.extension,
          spoken.durationMs
        );
        audioUrl = stored.saved.publicUrl;
        durationMs = stored.durationMs;
        if (process.env.NODE_ENV !== "production") {
          log.info(
            { cacheHit: stored.cacheHit, lineId: base.lineId },
            "TTS cache write"
          );
        }
      }
    } catch (err) {
      log.warn({ err }, "TTS or audio save failed; sending text-only PARROT_SPEAK");
    }
  }

  const payload = {
    type: "PARROT_SPEAK" as const,
    text: base.subtitle,
    state: base.state,
    audioUrl,
    durationMs,
    eventType: event.kind,
    holdMs: base.holdMs,
    lineId: base.lineId,
    ts: Date.now(),
  };

  let msg: ParrotSpeakMessage;
  try {
    msg = parrotSpeakMessageSchema.parse(payload);
  } catch (err) {
    log.error(
      { err, state: base.state, lineId: base.lineId },
      "PARROT_SPEAK schema parse failed; broadcasting minimal message"
    );
    msg = {
      type: "PARROT_SPEAK",
      text: base.subtitle,
      state: isParrotState(base.state) ? base.state : "talking",
      audioUrl,
      durationMs,
      eventType: event.kind,
      holdMs: base.holdMs,
      lineId: base.lineId,
      ts: Date.now(),
    };
  }

  hub.broadcastParrotSpeak(msg);
  return msg;
}
