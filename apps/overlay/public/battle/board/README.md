# Battle title boards (9:16 OBS)

## Single browser source

**`https://<overlay-host>/overlay/battle-board/display`**  
Optional default: **`?scene=prepare`** (stays on Prepare until you tap **Minute one** on the battle board).

Scene buttons on **`/overlay/battle`** POST to the bridge; **`BATTLE_BOARD_SCENE`** on **`/ws`** updates OBS. See repo **`RAILWAY.md`**.

## Folder layout (every scene)

Each scene has a **`banner/`** folder and a **`tips/`** folder.

| Kind | Path pattern |
|------|----------------|
| Level | `levels/<slug>/banner/` · `levels/<slug>/tips/` |
| End banners | `banners/<slug>/banner/` · `banners/<slug>/tips/` |

### Level slugs

| Folder | Meaning |
|--------|---------|
| `levels/prepare/` | **Default** — before the match starts |
| `levels/minute-one/` | Clock started — minute one |
| `levels/minute-two/` | Minute two |
| `levels/minute-three/` | Minute three |
| `levels/last-minute/` | Last minute |
| `levels/repair-party/` | After the clock |

### Banner slugs

`banners/win/`, `banners/lose/`, `banners/repair/`, `banners/party/` — each with `banner/` + `tips/`.

## Images

- Put **any number** of images in each folder; the **first filename A→Z** is used.
- Extensions: `.webp`, `.png`, `.jpg`, `.jpeg`, `.gif`
- **`banner/`** — shown **full width** at the **top** (large, `object-contain`).
- **`tips/`** — shown on the **left**, **below** the banner row (smaller strip).
- If **`tips/`** is empty, the page shows **text tips** from code (`battle-board-slugs.ts`).

## Legacy URLs

Old paths **`phase-two`** / **`phase-three`** redirect to **`minute-two`** / **`minute-three`**.

## Moving old flat files

If you still have PNGs **directly under** `levels/<slug>/` (not in `banner/` or `tips/`), the API uses the **first A→Z file there as the banner only** until you move assets into `banner/` and `tips/`.

Rename folders **`phase-two`** → **`minute-two`** and **`phase-three`** → **`minute-three`** if you still use the old names.
