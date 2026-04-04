# Battle title boards (9:16 OBS)

## Single browser source

1. In OBS add one **Browser** source:  
   **`https://<your-overlay-host>/overlay/battle-board/display`**  
   (local dev: `http://127.0.0.1:3000/overlay/battle-board/display`)

2. Open the **TikTok battle board** (`/overlay/battle`) on the **same overlay host** you deployed (e.g. Railway). Scene buttons **POST** to your **bridge** (`/api/battle-board/scene`); the bridge pushes **`BATTLE_BOARD_SCENE`** over **`/ws`** so OBS updates even though OBS and Chrome do not share `localStorage`.

3. **Railway:** set `NEXT_PUBLIC_BRIDGE_HTTP` + `NEXT_PUBLIC_WS_URL` on the overlay build (see repo **`RAILWAY.md`**). Use the **hosted** `/overlay/battle` URL to control the board — not `localhost` — unless your bridge is also local.

4. Same-tab extras: `BroadcastChannel` + `localStorage` still help if two tabs share one browser profile.

5. Optional default when the source loads:  
   **`/overlay/battle-board/display?scene=prepare`** (or any slug below).

Legacy paths like `/overlay/battle-board/prepare` **redirect** to `display?scene=prepare`.

## Layout

- **Black** frame, **9:16** (TikTok vertical).
- **Graphic**: centered **top** — first image file in the folder (sorted A→Z by filename).
- **Tips**: **left** — text from `apps/overlay/src/lib/battle-board-slugs.ts`.

Supported extensions: `.webp`, `.png`, `.jpg`, `.jpeg`, `.gif`.

## Folders → scene slugs (`?scene=`)

| Folder | `scene` value |
|--------|----------------|
| `levels/prepare/` | `prepare` |
| `levels/minute-one/` | `minute-one` |
| `levels/phase-two/` | `phase-two` |
| `levels/phase-three/` | `phase-three` |
| `levels/last-minute/` | `last-minute` |
| `levels/repair-party/` | `repair-party` |
| `banners/win/` | `win` |
| `banners/lose/` | `lose` |
| `banners/repair/` | `repair` |
| `banners/party/` | `party` |

## OBS sizing

**1080×1920** or full-screen; the page letterboxes to 9:16 with black bars on wide monitors.
