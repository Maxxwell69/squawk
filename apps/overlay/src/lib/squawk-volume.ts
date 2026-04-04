/** Same key as `useParrotBridge` — battle UI and overlay stay aligned. */
export const LS_SQUAWK_VOL = "squawk-overlay-tts-vol";

/** Same-tab / cross-component sync (battle page ↔ parrot overlay). */
export const SQUAWK_VOL_EVENT = "squawk-tts-volume";

export function readSquawkVolume01(): number {
  if (typeof window === "undefined") return 0.9;
  try {
    const raw = window.localStorage.getItem(LS_SQUAWK_VOL);
    if (raw == null) return 0.9;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.9;
  } catch {
    return 0.9;
  }
}

export function persistSquawkVolume01(volume01: number): void {
  const c = Math.min(1, Math.max(0, volume01));
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_SQUAWK_VOL, String(c));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(SQUAWK_VOL_EVENT, { detail: c }));
}
