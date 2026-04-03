# Squawk — stream commands cheat sheet

Use your **local bridge** base URL everywhere below (example: `http://127.0.0.1:8787` or your Railway bridge).

**Auth (Stream Deck + battle):** If `STREAM_DECK_SECRET` is set on the bridge, send either:

- Header: `x-stream-deck-key: <secret>`, or  
- Header: `Authorization: Bearer <secret>`

**Test** routes (`/api/test/*`) and **TikFinity** webhook do **not** use that secret unless you added something custom.

**Overlay:** Parrot listens on WebSocket `GET /ws` (e.g. `wss://your-bridge.example/ws`). Point the overlay at the bridge with `NEXT_PUBLIC_BRIDGE_HTTP`, `NEXT_PUBLIC_WS_URL`, or `?squawk_bridge=https://…` on the overlay URL.

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
