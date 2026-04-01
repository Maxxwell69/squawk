export type BridgeConfig = {
  host: string;
  port: number;
  mockTts: boolean;
};

export function loadConfig(): BridgeConfig {
  /** Railway and other hosts set `PORT`; local dev uses `LOCAL_BRIDGE_PORT` or 8787 */
  const rawPort =
    process.env.PORT ?? process.env.LOCAL_BRIDGE_PORT ?? "8787";
  const port = Number(rawPort);
  return {
    host: process.env.LOCAL_BRIDGE_HOST ?? "0.0.0.0",
    port: Number.isFinite(port) ? port : 8787,
    mockTts: process.env.FEATURE_MOCK_TTS !== "false",
  };
}
