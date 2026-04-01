# Captain Squawks

Local-first MVP for **Pirate Maxx** TikTok livestreams: a pirate parrot browser overlay that reacts to events from a small Fastify **local bridge** (TikFinity-style webhooks + WebSocket to the overlay).

## Monorepo layout

| Path | Role |
|------|------|
| `apps/overlay` | Next.js App Router — transparent OBS browser source |
| `apps/local-bridge` | Fastify — webhooks, test endpoints, WebSocket broadcast, mock TTS queue |
| `packages/shared` | Zod schemas, types, rule-based state mapping, **Captain Squawks** line pools |

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
| **OBS browser source (transparent overlay)** | `http://localhost:3000/overlay/parrot` |
| **Dev test buttons** | `http://localhost:3000/dev/parrot-test` |
| **Bridge health** | `http://127.0.0.1:8787/health` |

Copy `apps/overlay/.env.example` to `apps/overlay/.env.local` if you need to change WebSocket URL (e.g. tunnel or remote bridge).

## Parrot media (WEBM + GIFs)

Place assets under **`apps/overlay/public/parrot/`**:

- **`pirate_parrot.webm`** — main looping overlay (required for the default route).
- Optional GIFs for future alerts: e.g. `emotes/pirate_parrot_56px.gif`.

The repo includes a working WEBM copied from `public/parrot/` at the workspace root; you can replace it anytime. To change the filename, edit:

`apps/overlay/src/lib/parrot-media.ts`

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
| **TTS implementation** | `apps/local-bridge/src/tts/` — swap `createMockTts()` for a real provider |
| **Overlay look (Tailwind)** | `apps/overlay/src/components/ParrotOverlay.tsx`, `tailwind.config.ts` |
| **WEBM path** | `apps/overlay/src/lib/parrot-media.ts` |

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
| GET | `/ws` (WebSocket) |
| POST | `/api/test/follow`, `/api/test/gift`, `/api/test/like-milestone`, `/api/test/share`, `/api/test/comment`, `/api/test/chaos` |
| POST | `/api/webhooks/tikfinity` — JSON body; normalized heuristically |

## License

Private project for Pirate Maxx / Captain Squawks.
