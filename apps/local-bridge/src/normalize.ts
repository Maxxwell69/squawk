import {
  newEventId,
  tikfinityWebhookSchema,
  type NormalizedStreamEvent,
  type StreamEventKind,
  type TikFinityWebhookPayload,
} from "@captain-squawks/shared";

function guessKindFromStrings(
  event?: string,
  type?: string
): StreamEventKind | null {
  const s = `${event ?? ""} ${type ?? ""}`.toLowerCase();
  if (s.includes("follow")) return "follow";
  if (s.includes("gift")) return "gift";
  if (s.includes("like") || s.includes("milestone")) return "like_milestone";
  if (s.includes("share")) return "share";
  if (s.includes("comment") || s.includes("chat")) return "comment";
  return null;
}

/** Map arbitrary TikFinity-style payload to a normalized event (best-effort). */
export function normalizeTikfinityPayload(
  raw: unknown
): NormalizedStreamEvent | null {
  const parsed = tikfinityWebhookSchema.safeParse(raw);
  if (!parsed.success) return null;
  const p: TikFinityWebhookPayload = parsed.data;
  const kind =
    guessKindFromStrings(p.event, p.type) ?? ("comment" as StreamEventKind);
  const actorLabel = p.username ?? p.user;
  const detail =
    p.comment ??
    p.text ??
    (p.giftName ? String(p.giftName) : undefined) ??
    (p.milestone !== undefined ? `milestone:${p.milestone}` : undefined);
  return {
    id: newEventId(),
    kind,
    receivedAt: Date.now(),
    actorLabel,
    detail,
    raw: p as Record<string, unknown>,
  };
}

export function makeTestEvent(
  kind: StreamEventKind,
  extra?: Partial<Pick<NormalizedStreamEvent, "actorLabel" | "detail">>
): NormalizedStreamEvent {
  return {
    id: newEventId(),
    kind,
    receivedAt: Date.now(),
    actorLabel: extra?.actorLabel,
    detail: extra?.detail,
  };
}
