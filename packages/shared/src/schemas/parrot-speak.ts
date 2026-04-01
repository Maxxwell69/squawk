import { z } from "zod";
import { PARROT_STATES } from "../parrot-state";

const parrotStateSchema = z.enum(PARROT_STATES);

/**
 * WebSocket message: parrot line + optional TTS audio URL for the overlay.
 */
export const parrotSpeakMessageSchema = z.object({
  type: z.literal("PARROT_SPEAK"),
  text: z.string(),
  state: parrotStateSchema,
  /** Absolute URL to audio (e.g. http://127.0.0.1:8787/audio/xxx.wav) */
  audioUrl: z.string().optional(),
  durationMs: z.number().positive().optional(),
  eventType: z.string().optional(),
  /** Fallback display duration when audio is missing or fails */
  holdMs: z.number().int().positive().optional(),
  lineId: z.string().optional(),
  ts: z.number(),
});

export type ParrotSpeakMessage = z.infer<typeof parrotSpeakMessageSchema>;
