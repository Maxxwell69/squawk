# Squawk — stream commands cheat sheet

Use your **local bridge** base URL everywhere below (example: `http://127.0.0.1:8787` or your Railway bridge).

**Auth (Stream Deck + battle + Sea of Thieves board):** If `STREAM_DECK_SECRET` is set on the bridge, send either:

- Header: `x-stream-deck-key: <secret>`, or  
- Header: `Authorization: Bearer <secret>`

**Test** routes (`/api/test/*`) and **TikFinity** webhook do **not** use that secret unless you added something custom.

**Overlay:** Parrot listens on WebSocket `GET /ws` (e.g. `wss://your-bridge.example/ws`). Point the overlay at the bridge with `NEXT_PUBLIC_BRIDGE_HTTP`, `NEXT_PUBLIC_WS_URL`, or `?squawk_bridge=https://…` on the overlay URL.

**Squawk voice volume:** Controls bridge TTS (`<audio>` + Web Audio fallback) and browser speech on the **parrot overlay**. Set it from the **Battle board** or **Sea of Thieves** board (bridge section) or the **Squawk** slider on parrot overlay routes (bottom-right). Same `localStorage` key: `squawk-overlay-tts-vol`. Changing it in one tab updates the other via a browser event when both are open; **OBS** uses its own storage — set level on the overlay URL inside OBS, or adjust there after changing in Chrome.

**Victory vs general dance (video files):**

- **`victorydance.webm`** — the **victory dance** clip (`victory_dance` state: Stream Deck `victory-dance`, battle party lines A/B, `battle_victory_dance`).
- **`dancingsquawk.webm`** — the **regular dance** loop (`dancing_squawk` state: `battle_cheer`, Stream Deck `dancing-squawk`).

---

## Stream Deck → `POST` (no JSON body)

| Button idea | `POST` path | Parrot emote | Notes |
|-------------|-------------|--------------|--------|
| Hello / welcome | `/api/streamdeck/hello` | Waving hello | Random line from pool |
| Ask to share | `/api/streamdeck/please-share` | Idle (talking clip) | |
| Thanks for likes | `/api/streamdeck/thanks-likes` | Idle | |
| Thanks for shares | `/api/streamdeck/thanks-share` | Idle | |
| Plug Pirate Maxx | `/api/streamdeck/pirate-maxx` | Idle | |
| Exit (stage left) | `/api/streamdeck/exit` | Exit webm | Subtitle empty; dedup ~3.5s |
| Return | `/api/streamdeck/return` | Return webm | Subtitle empty; dedup ~3.5s |
| Peck | `/api/streamdeck/peck` | Peck | Subtitle empty |
| **Victory dance** | `/api/streamdeck/victory-dance` | `victorydance.webm` | Anytime celebration |
| Dancing Squawk | `/api/streamdeck/dancing-squawk` | Dance loop | |
| Feeding time | `/api/streamdeck/squawk-feeding-time` | Feeding | |

**Example (PowerShell):**

```powershell
$H = @{ "x-stream-deck-key" = "YOUR_SECRET" }
Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/streamdeck/victory-dance" -Method POST -Headers $H
```

**Example (curl):**

```bash
curl -X POST -H "x-stream-deck-key: YOUR_SECRET" "http://127.0.0.1:8787/api/streamdeck/hello"
```

---

## Battle board → `POST /api/battle/trigger`

**Body (JSON):**

```json
{
  "triggerId": "battle_prepare_1",
  "opponentName": "Optional rival crew name"
}
```

`opponentName` is optional; used in hail lines that contain `{{OPPONENT}}`.

### Prepare for battle

| `triggerId` |
|-------------|
| `battle_prepare_1` … `battle_prepare_8` |

### Minute one (phase 1)

| `triggerId` |
|-------------|
| `battle_phase1_1` … `battle_phase1_10` |

### Phase two

| `triggerId` |
|-------------|
| `battle_phase2_watch_3x` |
| `battle_phase2_cannons` |
| `battle_phase2_fun` |
| `battle_phase2_battle_on` |

### Phase three

| `triggerId` |
|-------------|
| `battle_phase3_chain_shot` |
| `battle_phase3_halfway` |
| `battle_phase3_push` |

### Last minute (phase four) — **manual only** in random sprinkles

| `triggerId` |
|-------------|
| `battle_phase4_snipers` |
| `battle_phase4_board` |
| `battle_phase4_ahead` |
| `battle_phase4_behind` |

### Repair / outcome / MVPs

| `triggerId` |
|-------------|
| `battle_phase5_repair_party` |
| `battle_phase5_we_won` |
| `battle_phase5_we_lost` |
| `battle_phase5_mvps_prompt` |

### Auto minute callouts (timer-driven from battle UI; same API if you trigger manually)

| `triggerId` |
|-------------|
| `battle_auto_phase2` |
| `battle_auto_phase3` |
| `battle_auto_phase4` |
| `battle_auto_phase5` |

### Hail opponent (`{{OPPONENT}}`)

| `triggerId` |
|-------------|
| `battle_hail_nice_1` … `battle_hail_nice_3` |
| `battle_hail_roast_1` … `battle_hail_roast_3` |

### Victory / party / loss / cheer

| `triggerId` | Parrot emote (typical) |
|-------------|-------------------------|
| `battle_victory_dance` | Victory dance |
| `battle_party_victory_1` | Victory dance |
| `battle_party_victory_2` | Victory dance |
| `battle_party_loss_1` | Talking |
| `battle_party_loss_2` | Talking |
| `battle_cheer` | Dancing Squawk |

**Example:**

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "x-stream-deck-key: YOUR_SECRET" \
  -d '{"triggerId":"battle_victory_dance","opponentName":"Captain Rex"}' \
  "http://127.0.0.1:8787/api/battle/trigger"
```

---

## Sea of Thieves board → `POST /api/sot/trigger`

Separate UI: **`/overlay/sea-of-thieves`** (same bridge URL + Stream Deck secret `localStorage` keys as the battle board).

**Adventure music:** add audio files under **`public/sea-of-thieves/adventure-music/`** with any filenames (MP3, M4A, etc.). The page lists them via **`GET /api/sot-adventure-music`** (sorted A→Z). When you tap **Start** on an **action automation** or **AFK mode**, playback picks a **random** first track, then plays **through the rest of the list** in order until the last file ends or you tap **Finish** / end AFK. **Music volume and mute** are on the Sea of Thieves board in the **Bridge, voice & music** panel (`squawk-sot-adventure-music-vol` / `squawk-sot-adventure-music-muted` in `localStorage`). **AFK** is disabled while an action automation is running; starting an automation ends AFK and sends the matching AFK outro.

**Body (JSON):**

```json
{ "triggerId": "sot_island_arrival_1" }
```

No `opponentName`; each `triggerId` picks a random line from its pool and drives parrot emote per `SOT_PARROT_STATE` in shared.

### Island visit

| `triggerId` |
|-------------|
| `sot_island_arrival_1`, `sot_island_arrival_2` |
| `sot_island_explore_1` |
| `sot_island_rumor_1` |

### Fight other crews

| `triggerId` |
|-------------|
| `sot_pvp_spot_1` |
| `sot_pvp_engaged_1` |
| `sot_pvp_sink_1` |
| `sot_pvp_respawn_1` |

### Reaper chase

| `triggerId` |
|-------------|
| `sot_reaper_spotted_1` |
| `sot_reaper_chase_1` |
| `sot_reaper_close_1` |
| `sot_reaper_escape_1` |

### Treasure & digging

| `triggerId` |
|-------------|
| `sot_dig_map_1` |
| `sot_dig_x_marks_1` |
| `sot_chest_up_1` |
| `sot_turn_in_1` |

### Thanks viewers

| `triggerId` |
|-------------|
| `sot_thanks_gifts_1` |
| `sot_thanks_raiders_1` |
| `sot_thanks_hype_1` |
| `sot_thanks_mvp_chat_1` |

### Feeding / drink / dance

| `triggerId` | Parrot emote (typical) |
|-------------|-------------------------|
| `sot_feeding_time` | Feeding time clip |
| `sot_drink_cheers_1` | Talking |
| `sot_drink_grog_1` | Talking |
| `sot_drink_break_1` | Talking |
| `sot_dance_shanty_1` | Dancing Squawk |
| `sot_dance_victory_sea_1` | Victory dance |

### Action automations (`sot_seq_*`)

Used by **`/overlay/sea-of-thieves`** Start/Finish buttons (or call manually). Each id picks a random line from its pool.

| Scene | `triggerId` (start → mid → finish) | Notes |
|-------|-------------------------------------|--------|
| Skeleton ship | `sot_seq_skel_start` → `sot_seq_skel_fire_magic` + `sot_seq_skel_repair_players` (two POSTs per wave) → `sot_seq_skel_finish` | UI sends fire/magic then ~0.85s later repair/players |
| Player ship | `sot_seq_player_ship_start` → `sot_seq_player_ship_mid` → `sot_seq_player_ship_finish` | |
| Kraken | `sot_seq_kraken_start` → `sot_seq_kraken_mid` → `sot_seq_kraken_finish` | |
| Megalodon | `sot_seq_meg_start` → `sot_seq_meg_mid` → `sot_seq_meg_finish` | |
| Island run | `sot_seq_island_run_start` → `sot_seq_island_run_mid` → `sot_seq_island_run_finish` | |

### Streaming assist (SoT board)

When **Streaming assist** is on, the board tracks the last successful line sent from **that page**; if **60s** pass with no new line, it POSTs **one** of `sot_stream_nudge_like`, `sot_stream_nudge_share_repost`, or `sot_stream_nudge_combo` (random).

| `triggerId` | When |
|-------------|------|
| `sot_stream_mode_intro` | Tap **Start — streaming assist** |
| `sot_stream_mode_outro` | Tap **Finish — streaming assist** |
| `sot_stream_nudge_like` | Idle 60s (random among the three nudges) |
| `sot_stream_nudge_share_repost` | Idle 60s |
| `sot_stream_nudge_combo` | Idle 60s |

### AFK mode (SoT board)

Same adventure-music playlist as automations. Banter every **40s**. **Finish** stops music + interval. **Cap'n away** lines cover drinks, snacks, head, TikTok-on-the-loo, etc. On **`/overlay/sea-of-thieves`**, AFK buttons are disabled while an **action automation** is running; starting an automation sends `sot_afk_outro` or `sot_afk_captain_outro` if AFK was on.

**General AFK:**

| `triggerId` | When |
|-------------|------|
| `sot_afk_intro` | Start general AFK |
| `sot_afk_outro` | Finish general AFK |
| `sot_afk_banter_a` … `sot_afk_banter_d` | Every 40s while general AFK |

**Cap'n away AFK:**

| `triggerId` | When |
|-------------|------|
| `sot_afk_captain_intro` | Start Cap'n-away AFK |
| `sot_afk_captain_outro` | Finish Cap'n-away AFK |
| `sot_afk_captain_banter_a` … `sot_afk_captain_banter_d` | Every 40s while Cap'n-away AFK |

**Example:**

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "x-stream-deck-key: YOUR_SECRET" \
  -d '{"triggerId":"sot_reaper_chase_1"}' \
  "http://127.0.0.1:8787/api/sot/trigger"
```

---

## Rust adventure board → `POST /api/rust/trigger`

UI: **`/overlay/rust`** (same bridge URL + Stream Deck secret `localStorage` keys as battle / SoT).

**Adventure music:** add audio under **`public/rust/adventure-music/`**. Listed via **`GET /api/rust-adventure-music`**. **Start** on an action automation picks a **random** first track, then plays the rest in order until the last file ends or **Finish**. Volume / mute keys: `squawk-rust-adventure-music-vol` / `squawk-rust-adventure-music-muted`.

**Body (JSON):**

```json
{ "triggerId": "rust_roam_1" }
```

### Roaming / boat / base / raids

| `triggerId` |
|-------------|
| `rust_roam_1`, `rust_roam_2`, `rust_roam_3` |
| `rust_boat_1`, `rust_boat_2`, `rust_boat_3` |
| `rust_base_build_1`, `rust_base_build_2`, `rust_base_build_3` |
| `rust_raid_1`, `rust_raid_2`, `rust_raid_3` |
| `rust_raided_1`, `rust_raided_2`, `rust_raided_3` |

### Monuments

| `triggerId` |
|-------------|
| `rust_monument_enter_1`, `rust_monument_enter_2` |
| `rust_mon_small_oil`, `rust_mon_large_oil`, `rust_mon_water_treat`, `rust_mon_airfield` |
| `rust_monuments_more` |

### Farming

| `triggerId` |
|-------------|
| `rust_farm_ore_1`, `rust_farm_ore_2` |
| `rust_farm_tree_1`, `rust_farm_tree_2` |

### Streaming assist (Rust board)

Idle **60s** from **that page** → random among `rust_stream_nudge_like`, `rust_stream_nudge_share_repost`, `rust_stream_nudge_combo`.

| `triggerId` | When |
|-------------|------|
| `rust_stream_mode_intro` | Start streaming assist |
| `rust_stream_mode_outro` | Finish streaming assist |
| `rust_stream_nudge_like` | Idle 60s |
| `rust_stream_nudge_share_repost` | Idle 60s |
| `rust_stream_nudge_combo` | Idle 60s |

### AFK mode

Music playlist + banter every **40s**. **Finish** stops music + interval and sends the matching outro.

**General AFK** — Rust / chat banter pools:

| `triggerId` | When |
|-------------|------|
| `rust_afk_intro` | Start general AFK |
| `rust_afk_outro` | Finish general AFK |
| `rust_afk_banter_a` … `rust_afk_banter_d` | Every 40s while general AFK |

**Cap'n away AFK** — Pirate Maxx off-deck (drinks, snacks, throne, TikTok-on-the-loo, fell asleep scrolling, etc.):

| `triggerId` | When |
|-------------|------|
| `rust_afk_captain_intro` | Start Cap'n-away AFK |
| `rust_afk_captain_outro` | Finish Cap'n-away AFK |
| `rust_afk_captain_banter_a` … `rust_afk_captain_banter_d` | Every 40s while Cap'n-away AFK |

**Example:**

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "x-stream-deck-key: YOUR_SECRET" \
  -d '{"triggerId":"rust_mon_large_oil"}' \
  "http://127.0.0.1:8787/api/rust/trigger"
```

---

## Dev test → `POST /api/test/*` (JSON body, optional fields)

| Path | Body fields (all optional) |
|------|----------------------------|
| `/api/test/follow` | `username` |
| `/api/test/gift` | `username`, `giftName` |
| `/api/test/like-milestone` | `milestone` (number) |
| `/api/test/share` | `username` |
| `/api/test/comment` | `username`, `text` |
| `/api/test/chaos` | `note` |

---

## TikFinity webhook

| Method | Path |
|--------|------|
| `POST` | `/api/webhooks/tikfinity` |

Body: TikFinity-style JSON (see bridge normalize heuristics in repo).

---

## Health & WebSocket

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `GET` | `/ws` | WebSocket upgrade for overlays |
| `GET` | `/` | Small HTML index (API hints) |

---

## Source of truth in code

- Stream Deck paths: `apps/local-bridge/src/index.ts`  
- Line pools + trigger ids: `packages/shared/src/stream-deck.ts`  
- Battle triggers + emote map: `packages/shared/src/battle.ts` (`BATTLE_TRIGGERS`, `BATTLE_PARROT_STATE`)
- Sea of Thieves triggers: `packages/shared/src/sot-board.ts` (`SOT_TRIGGERS`, `SOT_PARROT_STATE`)
