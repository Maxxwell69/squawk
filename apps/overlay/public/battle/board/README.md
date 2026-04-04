# Battle title boards (9:16 OBS sources)

Use **`/overlay/battle-board`** for the index of links, or open a board directly (see below).

## Layout

- **Black** frame, **9:16** (TikTok vertical).
- **Main graphic**: centered **top** — drop an image in the matching folder.
- **Instructions**: **left** side (below the graphic area) — copy is built into the page; edit `battle-board-slugs.ts` if you want different text.

## Filenames (any one that exists is used; first match wins)

1. `title.webp`
2. `title.png`
3. `banner.webp`
4. `banner.png`

## Level folders → URLs

| Folder | Overlay URL |
|--------|-------------|
| `levels/prepare/` | `/overlay/battle-board/prepare` |
| `levels/minute-one/` | `/overlay/battle-board/minute-one` |
| `levels/phase-two/` | `/overlay/battle-board/phase-two` |
| `levels/phase-three/` | `/overlay/battle-board/phase-three` |
| `levels/last-minute/` | `/overlay/battle-board/last-minute` |
| `levels/repair-party/` | `/overlay/battle-board/repair-party` |

## Banner folders → URLs

| Folder | Overlay URL |
|--------|-------------|
| `banners/win/` | `/overlay/battle-board/win` |
| `banners/lose/` | `/overlay/battle-board/lose` |
| `banners/repair/` | `/overlay/battle-board/repair` |
| `banners/party/` | `/overlay/battle-board/party` |

## OBS

Add a **Browser** source, paste your overlay origin + path (e.g. `https://yoursite.com/overlay/battle-board/win`), size **1080×1920** or let the page letterbox in a 9:16 dock.
