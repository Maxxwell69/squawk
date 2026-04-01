# Captain Squawks on Railway + GitHub

TikTok and other tools need a **public HTTPS URL** for the overlay — `localhost` will not work. Use Railway (or similar) to host the Next.js overlay, and optionally the bridge.

## 0. Quick checklist (code already on GitHub)

Your repo **Maxxwell69/squawk** is the source of truth. To **deploy on Railway**:

1. Log in at [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → authorize and select **`squawk`**.
2. Add **two services** from the same repo (see §2 bridge, §3 overlay), or start with one.
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
git commit -m "Add Captain Squawks monorepo (overlay, bridge, shared)"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub details. Use SSH if you prefer: `git@github.com:YOUR_USERNAME/YOUR_REPO.git`.

If Git was accidentally using your **user home** as the repo root, run `git init` in `squawk` so it has its **own** `.git` folder (this project ships with that layout).

## 2. Railway — deploy the **bridge** first (recommended)

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select the repo.
2. **Add service** → **Empty service** or duplicate from repo, then:
   - **Settings** → **Build** → **Dockerfile path**: `apps/local-bridge/Dockerfile`
   - **Root directory**: leave empty or set to repository root (the folder that contains `pnpm-workspace.yaml`).
3. **Settings** → **Networking** → **Generate domain** (public HTTPS URL).
4. Railway injects **`PORT`**. The bridge already reads `process.env.PORT` — no extra env var for port.
5. **Variables** (bridge service) — set after you have a public domain:

| Variable | Value |
|----------|--------|
| `AUDIO_PUBLIC_BASE_URL` | `https://YOUR-BRIDGE-SERVICE.up.railway.app` (no trailing slash) |

Without this, WebSocket `audioUrl` may still point at `http://127.0.0.1:8787` and **audio will not play** from the hosted overlay.

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

## 4. TikTok / browser source

- Paste the **overlay** HTTPS URL above (path `/overlay/parrot`).
- The **bridge** must be **reachable** from the browser at the `wss://` URL you set in `NEXT_PUBLIC_WS_URL`.

## 5. Troubleshooting

| Issue | What to check |
|-------|----------------|
| Overlay shows OFFLINE | `NEXT_PUBLIC_WS_URL` must match the bridge’s **public** `wss://…/ws` URL; redeploy overlay after changing it. |
| Bridge 502 | Check Railway logs; ensure `PORT` is used (already wired). |
| CORS | Bridge allows `origin: true` for MVP. |

## 6. Costs

- One Railway project can host **two** services (bridge + overlay). Free tier limits change; check Railway’s pricing.
