import { z } from "zod";
import { STREAM_EVENT_KINDS } from "../event-kinds";

export const streamEventKindSchema = z.enum(STREAM_EVENT_KINDS);

/** Raw TikFinity-style webhook — flexible for future mapping */
export const tikfinityWebhookSchema = z
  .object({
    event: z.string().optional(),
    type: z.string().optional(),
    user: z.string().optional(),
    username: z.string().optional(),
    giftName: z.string().optional(),
    giftId: z.union([z.string(), z.number()]).optional(),
    amount: z.number().optional(),
    count: z.number().optional(),
    comment: z.string().optional(),
    text: z.string().optional(),
    milestone: z.number().optional(),
    likes: z.number().optional(),
    data: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type TikFinityWebhookPayload = z.infer<typeof tikfinityWebhookSchema>;

/** Normalized event the bridge broadcasts to the overlay */
export const normalizedStreamEventSchema = z.object({
  id: z.string().uuid(),
  kind: streamEventKindSchema,
  receivedAt: z.number().int(),
  /** Optional display context from source system */
  actorLabel: z.string().optional(),
  detail: z.string().optional(),
  raw: z.record(z.unknown()).optional(),
});

export type NormalizedStreamEvent = z.infer<typeof normalizedStreamEventSchema>;

/** Test endpoint bodies (minimal) */
export const testFollowBodySchema = z.object({
  username: z.string().optional(),
});

export const testSubscribeBodySchema = z.object({
  username: z.string().optional(),
});

export const testGiftBodySchema = z.object({
  giftName: z.string().optional(),
  username: z.string().optional(),
});

export const testLikeMilestoneBodySchema = z.object({
  milestone: z.number().optional(),
});

export const testShareBodySchema = z.object({
  username: z.string().optional(),
});

export const testCommentBodySchema = z.object({
  username: z.string().optional(),
  text: z.string().optional(),
});

export const testChaosBodySchema = z.object({
  note: z.string().optional(),
});
