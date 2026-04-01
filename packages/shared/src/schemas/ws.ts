import { z } from "zod";
import { PARROT_STATES } from "../parrot-state";
import { parrotSpeakMessageSchema } from "./parrot-speak";

const parrotStateSchema = z.enum(PARROT_STATES);

export const parrotOverlayPayloadSchema = z.object({
  state: parrotStateSchema,
  subtitle: z.string(),
  lineId: z.string().optional(),
  eventKind: z.string().optional(),
  /** When the UI should snap back to idle if nothing else arrives */
  holdMs: z.number().int().positive(),
  ts: z.number(),
});

export type ParrotOverlayPayload = z.infer<typeof parrotOverlayPayloadSchema>;

export const bridgeWsMessageSchema = z.discriminatedUnion("type", [
  parrotSpeakMessageSchema,
  z.object({
    type: z.literal("parrot_update"),
    payload: parrotOverlayPayloadSchema,
  }),
  z.object({
    type: z.literal("server_hello"),
    payload: z.object({ version: z.string() }),
  }),
  z.object({
    type: z.literal("ping"),
  }),
]);

export type BridgeWsMessage = z.infer<typeof bridgeWsMessageSchema>;
