# Squawk — Pirate Maxx & First Mate Squawks

Local-first MVP for **Pirate Maxx** TikTok livestreams: **First Mate Squawks** (the parrot) in a browser overlay, reacting to events from a small Fastify **local bridge** (TikFinity-style webhooks + WebSocket to the overlay).

## Monorepo layout

| Path | Role |
|------|------|
| `apps/overlay` | Next.js App Router — transparent OBS browser source |
| `apps/local-bridge` | Fastify — webhooks, TTS → `/audio/*`, WebSocket `PARROT_SPEAK` |
| `packages/shared` | Zod schemas, types, rule-based state mapping, **First Mate Squawks** line pools |

## Prerequisites

- Node **20+**
- [pnpm](https://pnpm.io/) 9 (`corepack enable pnpm`)

## Install

```bash
cd squawk
pnpm install
```

## Build order (recommended)

Implement and verify in this order: **`packages/shared` → `apps/local-bridge` → `apps/overlay`**. Each layer should compile before you move on.

From the repo root, a **sequential** build runs the same order:

```bash
pnpm build
```

Individual steps:

```bash
pnpm build:shared    # tsc → packages/shared/dist
pnpm build:bridge    # tsc → apps/local-bridge/dist
pnpm build:overlay   # next build
```

If `next build` fails with errors about `/_document` or `/404` after running `pnpm dev`, delete the overlay cache and rebuild:

```bash
rm -rf apps/overlay/.next   # PowerShell: Remove-Item -Recurse apps/overlay/.next
pnpm build:overlay
```

### Dev server issues (hot reload / 500 / `SegmentViewNode` / missing `.js` chunks)

1. **Stop** `pnpm dev` completely (Ctrl+C).
2. **Delete** the overlay dev cache: `Remove-Item -Recurse -Force apps/overlay/.next` (PowerShell).
3. **Port 8787 already in use** (`EADDRINUSE`): another bridge is still running — close that terminal or end the process, then start `pnpm dev` again.
4. Restart: `pnpm dev`.

The overlay applies transparent `html`/`body` classes from the `ParrotOverlay` client component (no extra `app/overlay/layout.tsx`), which avoids a known Next.js 15 dev bundler issue with nested layouts + devtools.

## Run locally (overlay + bridge)

From the repo root:

```bash
pnpm dev
```

This starts:

- **Overlay:** [http://localhost:3000](http://localhost:3000)
- **Bridge:** [http://127.0.0.1:8787](http://127.0.0.1:8787) — WebSocket at `ws://127.0.0.1:8787/ws`

### URLs you care about

| Page | URL |
|------|-----|
| **OBS browser source (full widget)** | `http://localhost:3000/overlay/parrot` |
| **OBS — parrot only (no box)** | `http://localhost:3000/overlay/parrot-only` |
| **Dev test buttons** | `http://localhost:3000/dev/parrot-test` |
| **Bridge health** | `http://127.0.0.1:8787/health` |

Copy `apps/overlay/.env.example` to `apps/overlay/.env.local` if you need to change WebSocket URL (e.g. tunnel or remote bridge).

Copy `apps/local-bridge/.env.example` to `apps/local-bridge/.env` for TTS and public audio URL settings.

## Voice pipeline (TTS + browser playback)

1. **Bridge** builds a line with the rule-based brain, runs the configured **voice provider** (default: mock WAV), caches clips by text+voice settings (so repeats are reused), writes files under `apps/local-bridge/tmp/audio/`, and serves them at **`GET /audio/<file>`**.
2. **WebSocket** sends **`PARROT_SPEAK`** with `text`, `state`, optional `audioUrl` (absolute URL), `durationMs`, `holdMs`, `eventType`.
3. **Overlay** queues messages (FIFO, one line at a time), shows subtitles, drives parrot state, and plays `audioUrl` after you click **Enable audio** (browser autoplay policy).
4. If TTS fails or `FEATURE_TTS=false`, the same message is sent **without** `audioUrl`; the UI uses `holdMs` / `durationMs` / estimated read time, then returns to idle.

| Env (bridge) | Meaning |
|--------------|---------|
| `FEATURE_TTS` | `true` (default) — generate audio files |
| `TTS_PROVIDER` | `mock` (default), `elevenlabs` ([env below](#elevenlabs-tts)), or `openai` (stub) |
| `AUDIO_PUBLIC_BASE_URL` | Origin for audio URLs, e.g. `http://127.0.0.1:8787` or your public bridge HTTPS URL |
| `AUDIO_TEMP_DIR` | Optional override for generated files |

### ElevenLabs TTS

On the **bridge** only, set:

| Variable | Required | Notes |
|----------|----------|--------|
| `TTS_PROVIDER` | yes | `elevenlabs` |
| `ELEVENLABS_API_KEY` | yes | [API keys](https://elevenlabs.io/app/settings/api-keys) |
| `ELEVENLABS_VOICE_ID` | yes | **Voice ID** string from ElevenLabs (not the display name). In the app: **Voices** → select your voice → **Voice ID** / “Copy ID”. Wrong or missing ID → bridge omits `audioUrl` and the overlay falls back to **browser** speech (robotic), not your ElevenLabs voice. |
| `ELEVENLABS_MODEL_ID` | no | Default `eleven_multilingual_v2` |
| `ELEVENLABS_OUTPUT_FORMAT` | no | Default `mp3_44100_128` ([formats](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)) |
| `ELEVENLABS_BASE_URL` | no | Default `https://api.elevenlabs.io`. For residency/org-hosted keys, set matching host (e.g. `https://api.us.elevenlabs.io` or `https://api.eu.residency.elevenlabs.io`). |
| `ELEVENLABS_VOICE_SETTINGS` | no | JSON object, e.g. `{"stability":0.5,"similarity_boost":0.75}` |

Audio is returned as **MP3** and served under `/audio/*.mp3` like the mock WAV path.

**OpenAI TTS:** implement `apps/local-bridge/src/services/tts/openai-tts-provider.ts`, set `TTS_PROVIDER=openai`, and return `SpeakResult` with `audioBuffer` + extension.

**Hosted bridge (Railway):** set `AUDIO_PUBLIC_BASE_URL` to your bridge’s public origin (no trailing slash) so `audioUrl` in WebSocket is reachable from the browser.

## Parrot media (WEBM + GIFs per state)

Place assets under **`apps/overlay/public/parrot/`**. The overlay picks a file per **`ParrotState`** (`idle`, `talking`, `hype`, `chaos`) — see `PARROT_ASSETS` in:

`apps/overlay/src/lib/parrot-media.ts`

- **`pirate_parrot.webm`** — default loop (all states point here until you override).
- Add e.g. **`idle.gif`**, **`talking.gif`**, **`hype.gif`**, **`chaos.gif`** (or `.webm`), then set each entry in `PARROT_ASSETS` to `/parrot/your-file.gif`. Paths ending in `.gif` render as `<img>`; otherwise `<video loop>`.

Rendering is in `apps/overlay/src/components/ParrotMedia.tsx`.

## Trigger test events

### From the dev page

Open `/dev/parrot-test` and click the buttons (bridge must be running).

### With curl (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/test/follow" -Method POST -ContentType "application/json" -Body "{}"
```

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/test/chaos" -Method POST -ContentType "application/json" -Body '{"note":"raid"}'
```

## OBS: add browser source

1. **Sources** → **+** → **Browser**.
2. **URL:** `http://localhost:3000/overlay/parrot` (or your deployed Railway URL + `/overlay/parrot`).
3. Set width/height to match your layout (e.g. **400×500**); check **Shutdown source when not visible** if you want.
4. The `/overlay/parrot` route forces a **fully transparent** page background (no frosted backdrop on the outer canvas). Only the parrot card is opaque. If OBS still shows a solid color behind the source, add **Custom CSS** on the browser source: `body, html { background: transparent !important; }`

**Important:** The overlay’s WebSocket points at `NEXT_PUBLIC_WS_URL` (default `ws://127.0.0.1:8787/ws`). On the same PC, that works. If the overlay is **hosted** (e.g. Railway) but the bridge stays **local**, browsers cannot connect to `127.0.0.1` on your machine from the internet — use a tunnel (ngrok, Cloudflare Tunnel) to expose `8787`, then set `NEXT_PUBLIC_WS_URL` to that `wss://` URL when building the overlay.

## Customize first

| What | File |
|------|------|
| **Parrot lines & pools** | `packages/shared/src/personality/captain-squawks.ts` |
| **State rules & timeouts** | `packages/shared/src/rules.ts` |
| **Event → line logic (future LLM)** | `apps/local-bridge/src/brain/service.ts` |
| **Voice / TTS** | `apps/local-bridge/src/services/tts/` — providers + `openai-tts-provider.ts` stub |
| **Audio files** | `apps/local-bridge/src/services/audio/audio-file-store.ts` |
| **Overlay look (Tailwind)** | `apps/overlay/src/components/ParrotOverlay.tsx`, `tailwind.config.ts` |
| **Parrot visuals per state** | `apps/overlay/src/lib/parrot-media.ts` + `ParrotMedia.tsx` |

## Production build

```bash
pnpm build
```

Run overlay alone:

```bash
pnpm --filter @captain-squawks/overlay start
```

On **Windows**, `output: "standalone"` is only used when `DOCKER_BUILD=1` (Linux/Docker), because Next’s standalone trace step creates symlinks that can fail with `EPERM` locally. Production overlay on your PC uses `next start` without standalone.

Run bridge alone:

```bash
pnpm --filter @captain-squawks/local-bridge build
pnpm --filter @captain-squawks/local-bridge start
```

## Railway (hosted overlay only)

A root `Dockerfile` builds the **Next.js standalone** overlay. Deploy the repo; set environment variables in Railway for `NEXT_PUBLIC_WS_URL` / `NEXT_PUBLIC_BRIDGE_HTTP` to match how browsers will reach your bridge (usually via a tunnel). The **local-bridge** is intended to run on your stream PC for TikFinity — you do not have to deploy it.

## API (local bridge)

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/ws` (WebSocket — messages include `PARROT_SPEAK`) |
| GET | `/audio/<filename>` (generated TTS files) |
| POST | `/api/test/follow`, `/api/test/gift`, `/api/test/like-milestone`, `/api/test/share`, `/api/test/comment`, `/api/test/chaos` |
| POST | `/api/webhooks/tikfinity` — JSON body; normalized heuristically |

### Test voice end-to-end

1. `pnpm dev`
2. Open **`/overlay/parrot`** (or **`/overlay/parrot-only`**) and click **Enable audio** once.
3. Open **`/dev/parrot-test`** and trigger an event (e.g. Follow). You should hear a short mock WAV and see the subtitle; state returns to idle after playback.
4. Set **`FEATURE_TTS=false`** on the bridge (env) and restart to verify **subtitle-only** fallback (no `audioUrl` in the JSON response).

## License

Private project for Pirate Maxx (captain) and First Mate Squawks (parrot).
