function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Play a remote URL on a shared HTMLAudioElement; resolves on `ended` or rejects on error.
 * Queue strategy: one element per overlay instance (see useParrotBridge).
 */
export function playUrlOnce(
  audio: HTMLAudioElement,
  url: string,
  volume01 = 1
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
    audio.volume = clamp01(volume01);
    audio.src = url;
    audio.load();
    void audio.play().catch((e) => {
      cleanup();
      reject(e instanceof Error ? e : new Error(String(e)));
    });
  });
}

/**
 * Decode and play remote audio via Web Audio API (fallback when HTMLAudio fails).
 * Requires prior user gesture (Enable audio) for AudioContext.resume().
 */
export async function playUrlViaWebAudio(
  url: string,
  volume01 = 1
): Promise<void> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`audio fetch ${res.status}`);
  const buf = await res.arrayBuffer();
  const ctx = new AudioContext();
  await ctx.resume();
  try {
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    await new Promise<void>((resolve, reject) => {
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      const gain = ctx.createGain();
      gain.gain.value = clamp01(volume01);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.onended = () => resolve();
      src.start();
    });
  } finally {
    await ctx.close();
  }
}

/** Browser speech synthesis — works when bridge sends no audioUrl or file play fails. */
export function speakWithBrowserTts(
  text: string,
  volume01 = 1
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const s = window.speechSynthesis;
    if (!s) {
      resolve();
      return;
    }
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.volume = clamp01(volume01);
    u.onend = () => resolve();
    u.onerror = () => resolve();
    s.speak(u);
  });
}
