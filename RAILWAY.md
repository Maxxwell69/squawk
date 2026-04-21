# Squawk (Pirate Maxx / First Mate Squawks) on Railway + GitHub

TikTok and other tools need a **public HTTPS URL** for the overlay — `localhost` will not work. Use Railway (or similar) to host the Next.js overlay, and optionally the bridge.

## 0. Quick checklist (code already on GitHub)

Your repo **Maxxwell69/squawk** is the source of truth. To **deploy on Railway**:

1. Log in at [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → authorize and select **`squawk`**.
2. Add services from the same repo: **bridge** (§2), **overlay** (§3), or start with one. Crew login lives on the **overlay** URL (`/crew`) — no third app.
3. Set **environment variables** as below; **redeploy** the overlay after the bridge has a public URL (so `NEXT_PUBLIC_WS_URL` and `AUDIO_PUBLIC_BASE_URL` are correct).

Railway redeploys on every **push to `main`** once the project is linked.

---

## 1. Push this repo to GitHub

1. Create a **new empty repository** on GitHub (no README, no `.gitignore`), e.g. `captain-squawks` or `squawk`.

2. In a terminal (PowerShell), from **this folder only**:

```powershell
cd C:\Users\maxxf\OneDrive\Desktop\squawk
git init
git branch -M main
git add .
git commit -m "Add Squawk monorepo (overlay, bridge, shared)"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub details. Use SSH if you prefer: `git@github.com:YOUR_USERNAME/YOUR_REPO.git`.

If Git was accidentally using your **user home** as the repo root, run `git init` in `squawk` so it has its **own** `.git` folder (this project ships with that layout).

## 2. Railway — deploy the **bridge** first (recommended)

The repo root [`railway.toml`](./railway.toml) builds the **Next.js overlay** (`Dockerfile`). If your bridge service uses that file unchanged, you get the **wrong image** and routes like `/api/test/follow` return **404**.

**Pick one approach for the bridge service:**

**A (recommended):** **Settings** → **Config-as-code** (or **Build** → config file / “Railway config”) → set the config file to **`railway.bridge.toml`** in the repo. That file points the build at [`apps/local-bridge/Dockerfile`](./apps/local-bridge/Dockerfile).

**B:** **Settings** → **Build** → override **Dockerfile path** to **`apps/local-bridge/Dockerfile`** (and do **not** rely on the overlay-only `railway.toml` for this service), if your UI offers an override next to “set in railway.toml”.

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select the repo.
2. **Add service** → **Empty service** or duplicate from repo, then apply **A** or **B** above.
   - **Root directory**: leave empty — repository root (folder that contains `pnpm-workspace.yaml`).
3. **Settings** → **Networking** → **Generate domain** (public HTTPS URL).
4. Railway injects **`PORT`**. The bridge already reads `process.env.PORT` — no extra env var for port.
5. **Variables** (bridge service) — set after you have a public domain:

| Variable | Value |
|----------|--------|
| `AUDIO_PUBLIC_BASE_URL` | `https://YOUR-BRIDGE-SERVICE.up.railway.app` (no trailing slash) |

Without this, WebSocket `audioUrl` may still point at `http://127.0.0.1:8787` and **audio will not play** from the hosted overlay.

**ElevenLabs (optional):** on the same bridge service add `TTS_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_VOICE_ID` (see repo `README.md` → ElevenLabs TTS). Mark the API key as a **secret** in Railway.

6. Deploy and note the public URL, e.g. `https://captain-squawks-bridge-production.up.railway.app`.

**WebSocket URL for the overlay** (use `wss://` in production):

```text
wss://YOUR-BRIDGE-UP-RAILWAY-APP.up.railway.app/ws
```

(Test with `wscat` or browser devtools: `new WebSocket('wss://…/ws')`.)

## 3. Railway — deploy the **overlay** (Next.js)

1. **New service** (same project) → **Dockerfile** from repo.
2. **Dockerfile path**: `Dockerfile` (the one in the repo root).
3. **Build** → **Docker Build Arguments** (or Variables used at build time):

| Name | Example value |
|------|----------------|
| `NEXT_PUBLIC_WS_URL` | `wss://YOUR-BRIDGE-UP-RAILWAY-APP.up.railway.app/ws` |
| `NEXT_PUBLIC_BRIDGE_HTTP` | `https://YOUR-BRIDGE-UP-RAILWAY-APP.up.railway.app` |

`NEXT_PUBLIC_*` values are baked in at **build** time — trigger a **redeploy** after changing them.

4. **Generate domain** for the overlay service. Your public overlay URL:

```text
https://YOUR-OVERLAY-UP-RAILWAY-APP.up.railway.app/overlay/parrot
```

Use that in **OBS** and anywhere you need a **public** link (not TikTok’s localhost).

### Crew portal — same overlay service (`/crew`)

Email login and moderators are built into the **overlay** app (no separate Railway service).

1. Add **PostgreSQL** to the project and link **`DATABASE_URL`** to the **overlay** service (same service as `squawk.piratemaxx.com`).
2. On that **overlay** service, set:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | From Postgres (usually auto-injected when linked) |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Same email you use for the **first** captain account at **`/crew/register`** (must match exactly) |

Crew auth uses **email + password** (bcrypt hashes in Postgres). No SMTP variables.

3. Redeploy. Open **`https://YOUR-OVERLAY-DOMAIN/crew/register`** to set the captain password, then **`/crew/login`**. Admin UI: **`/crew/admin/moderators`**.

Template: [`apps/overlay/.env.example`](./apps/overlay/.env.example).

### How Cursor / AI can help (Railway cannot be logged in via chat)

Railway deployment still requires **your** clicks: connect GitHub, create services, paste secrets, attach Postgres. Neither Cursor nor another agent can authenticate to your Railway account or run those steps for you.

What you **can** ask here in this repo:

- Paste **deploy logs**, **build errors**, or variable names Railway shows → we fix **Dockerfiles**, **`railway.*.toml`**, env expectations, or Next/Prisma errors in code.
- Say **“here’s my bridge URL”** so we spell out exact `NEXT_PUBLIC_*` strings.
- Ask for a **sanity check** before you click Deploy.

Workflow: push to **`main`** → Railway builds → if it fails, copy the error into chat.

---

## 5. TikTok / browser source

- Paste the **overlay** HTTPS URL above (path `/overlay/parrot`).
- The **bridge** must be **reachable** from the browser at the `wss://` URL you set in `NEXT_PUBLIC_WS_URL`.

### Battle title board (9:16) — why Railway matters here

The **TikTok battle board** (`/overlay/battle`) and the **title display** (`/overlay/battle-board/display`) are usually **two different browser contexts** (your control tab vs OBS). They do **not** share `localStorage`, so scene changes are relayed through the **same Railway bridge** you already use for Squawk:

1. **Overlay** build args: same `NEXT_PUBLIC_BRIDGE_HTTP` and `NEXT_PUBLIC_WS_URL` as the parrot overlay (§3).
2. **OBS** browser source URL: `https://YOUR-OVERLAY…/overlay/battle-board/display` (optional `?scene=prepare` for the first paint).
3. **You** open the battle board on the **hosted** overlay too (`https://YOUR-OVERLAY…/overlay/battle`) so `fetch` + WebSocket hit the **public** bridge, not `127.0.0.1`.

When you tap a level or banner, the page **POSTs** `https://YOUR-BRIDGE…/api/battle-board/scene` with `{ "slug": "win" }` (same `x-stream-deck-key` as other bridge routes when `STREAM_DECK_SECRET` is set). The bridge **broadcasts** `BATTLE_BOARD_SCENE` on `/ws`, and the OBS display updates.

## 6. Troubleshooting

| Issue | What to check |
|-------|----------------|
| Overlay shows OFFLINE | `NEXT_PUBLIC_WS_URL` must match the bridge’s **public** `wss://…/ws` URL; redeploy overlay after changing it. |
| Title display never changes from battle buttons | Control the battle board from the **same deployed overlay URL** (not localhost) so POSTs go to your Railway bridge; OBS source must use the same overlay + `NEXT_PUBLIC_*` bridge vars. |
| **404** on `/api/test/follow` | The hostname in `NEXT_PUBLIC_BRIDGE_HTTP` is **not** running the bridge. Root `railway.toml` builds the **Next.js overlay** only. The **bridge** service must use Dockerfile path **`apps/local-bridge/Dockerfile`**. Open `https://YOUR-BRIDGE/health` — expect JSON with `"service":"captain-squawks-bridge"`. |
| Bridge 502 | Check Railway logs; ensure `PORT` is used (already wired). |
| CORS | Bridge allows `origin: true` for MVP. |

## 7. Costs

- One Railway project can host **two** services (bridge + overlay). Crew login uses the overlay. Free tier limits change; check Railway’s pricing.
