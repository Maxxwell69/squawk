export const STREAM_EVENT_KINDS = [
  "follow",
  "gift",
  "like_milestone",
  "share",
  "comment",
  "chaos",
  "custom",
] as const;

export type StreamEventKind = (typeof STREAM_EVENT_KINDS)[number];
