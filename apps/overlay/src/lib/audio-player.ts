/**
 * Play a remote URL on a shared HTMLAudioElement; resolves on `ended` or rejects on error.
 * Queue strategy: one element per overlay instance (see useParrotBridge).
 */
export function playUrlOnce(
  audio: HTMLAudioElement,
  url: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEnded = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(
        new Error(
          audio.error
            ? `audio error code ${audio.error.code}`
            : "audio playback error"
        )
      );
    };
    const cleanup = () => {
      clearTimeout(timeoutId);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onErr);
    };
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("audio load/play timeout"));
    }, 45_000);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onErr);
    audio.volume = 1;
    audio.src = url;
    audio.load();
    void audio.play().catch((e) => {
      cleanup();
      reject(e instanceof Error ? e : new Error(String(e)));
    });
  });
}
