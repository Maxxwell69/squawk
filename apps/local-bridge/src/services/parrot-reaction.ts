import {
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

  let audioUrl: string | undefined;
  let durationMs: number | undefined;

  if (config.featureTts) {
    try {
      const spoken = await voice.speak(base.subtitle);
      const saved = await audioStore.saveAudio(
        spoken.audioBuffer,
        spoken.extension
      );
      audioUrl = saved.publicUrl;
      durationMs = spoken.durationMs;
    } catch (err) {
      log.warn({ err }, "TTS or audio save failed; sending text-only PARROT_SPEAK");
    }
  }

  const msg = parrotSpeakMessageSchema.parse({
    type: "PARROT_SPEAK" as const,
    text: base.subtitle,
    state: base.state,
    audioUrl,
    durationMs,
    eventType: event.kind,
    holdMs: base.holdMs,
    lineId: base.lineId,
    ts: Date.now(),
  });

  hub.broadcastParrotSpeak(msg);
  return msg;
}
