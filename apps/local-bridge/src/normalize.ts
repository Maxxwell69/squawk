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

function pickString(
  obj: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

/** Map arbitrary TikFinity-style payload to a normalized event (best-effort). */
export function normalizeTikfinityPayload(
  raw: unknown
): NormalizedStreamEvent | null {
  const parsed = tikfinityWebhookSchema.safeParse(raw);
  if (!parsed.success) return null;
  const p: TikFinityWebhookPayload = parsed.data;
  const rawObj = p as unknown as Record<string, unknown>;
  const nestedData =
    rawObj.data && typeof rawObj.data === "object"
      ? (rawObj.data as Record<string, unknown>)
      : {};

  const actorLabel =
    pickString(rawObj, ["username", "user", "nickname", "uniqueId"]) ??
    pickString(nestedData, ["username", "user", "nickname", "uniqueId"]);
  const gift =
    pickString(rawObj, ["giftName", "giftname", "gift", "gift_name"]) ??
    pickString(nestedData, ["giftName", "giftname", "gift", "gift_name"]);
  const commentText =
    pickString(rawObj, ["comment", "text", "message", "chat"]) ??
    pickString(nestedData, ["comment", "text", "message", "chat"]);
  const milestoneRaw =
    rawObj.milestone ??
    rawObj.likes ??
    nestedData.milestone ??
    nestedData.likes;
  const milestone =
    typeof milestoneRaw === "number"
      ? milestoneRaw
      : typeof milestoneRaw === "string" && milestoneRaw.trim()
        ? Number(milestoneRaw)
        : undefined;

  let kind = guessKindFromStrings(p.event, p.type);
  if (!kind) {
    if (gift) kind = "gift";
    else if (Number.isFinite(milestone)) kind = "like_milestone";
    else if (commentText) kind = "comment";
    else kind = "custom";
  }

  const detail =
    (kind === "gift" ? gift : undefined) ??
    (kind === "comment" ? commentText : undefined) ??
    (kind === "like_milestone" && Number.isFinite(milestone)
      ? `milestone:${milestone}`
      : undefined);
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
