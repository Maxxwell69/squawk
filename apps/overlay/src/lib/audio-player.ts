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
      reject(new Error("audio playback error"));
    };
    const cleanup = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onErr);
    };
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onErr);
    audio.src = url;
    void audio.play().catch((e) => {
      cleanup();
      reject(e instanceof Error ? e : new Error(String(e)));
    });
  });
}
