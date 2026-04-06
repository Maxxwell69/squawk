export const STREAM_EVENT_KINDS = [
  "follow",
  "subscribe",
  "gift",
  "like_milestone",
  "share",
  "comment",
  "chaos",
  "custom",
] as const;

export type StreamEventKind = (typeof STREAM_EVENT_KINDS)[number];
