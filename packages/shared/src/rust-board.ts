import { z } from "zod";
import type { ParrotState } from "./parrot-state";
import { pickRandomLine } from "./personality/captain-squawks";

/**
 * Rust adventure board — random line per trigger via POST /api/rust/trigger
 * (same Stream Deck auth as battle / SoT when secret is set).
 */

export const RUST_TRIGGERS = {
  rust_roam_1: [
    "Roaming the map — First Mate Squawks says keep yer head on a swivel, Cap'n Maxx!",
    "Cross-country Rust — if it moves, it might be friendly. If it shoots, it ain't.",
    "Open world, open problems — Squawks votes we loot before we lose!",
  ],
  rust_roam_2: [
    "No base in sight — classic naked anxiety. Chat, manifest stone!",
    "Wandering like we pay rent to the grass — eyes up for rooftops!",
    "Roamin' free — the only blueprint we need is survival!",
  ],
  rust_roam_3: [
    "That's not a stroll — that's tactical repositioning with style!",
    "Every bush is a player until proven otherwise — Squawks trusts nobody!",
    "Map crossin' — hydrate IRL, panic in-game, we're professionals!",
  ],

  rust_boat_1: [
    "Boat buildin' time — wood, hope, and a dream of not sinking!",
    "Hull goin' up — Cap'n Maxx of the scrap lake, comin' through!",
    "If it floats, we raid; if it sinks, we blame physics!",
  ],
  rust_boat_2: [
    "Maritime engineering: Rust edition — duct tape and prayers!",
    "Squawks approves this vessel — mostly because he ain't rowin'!",
    "Boat's almost seaworthy — define seaworthy loosely!",
  ],
  rust_boat_3: [
    "Push to water — chat counts down the inevitable sploosh!",
    "Naval superiority starts with one sketchy dinghy!",
    "Launch day — may the waves respect Pirate Maxx!",
  ],

  rust_base_build_1: [
    "Base goin' up — from twig to trouble, one wall at a time!",
    "Honeycomb or bust — First Mate Squawks demands structural drama!",
    "TC placed — welcome to home ownership and neighbor problems!",
  ],
  rust_base_build_2: [
    "Upgradin' tiers — stone says we mean business; sheet metal says we're scared!",
    "Tool cupboard secured — now we decorate with turrets!",
    "Build meta engaged — if it ain't ugly, is it even Rust?",
  ],
  rust_base_build_3: [
    "Compound dreams — high walls, higher electricity bills!",
    "Furnace song on loop — that's the sound of progress!",
    "Base tour later — for now, more grind, less glam!",
  ],

  rust_raid_1: [
    "Raid time — we're the problem the neighbors warned about!",
    "Explosives out — knock knock, it's yer lease inspector!",
    "Breach in progress — Squawks brought popcorn for the boom!",
  ],
  rust_raid_2: [
    "Rocket rhythm — if the wall twitches, we're doing it right!",
    "Online raid energy — chat, pick a side and scream!",
    "Door to treasure — or door to trap; either way, content!",
  ],
  rust_raid_3: [
    "TC hunt — find the brain, steal the pain!",
    "They built it pretty — we unbuilt it louder!",
    "Raid moral high ground: optional. Loot: mandatory.",
  ],

  rust_raided_1: [
    "WE'RE GETTING RAIDED — all hands, all swear words, defend!",
    "Sirens in chat — base under fire, Cap'n Maxx to the walls!",
    "Explosions at home — Squawks did NOT authorize this renovation!",
  ],
  rust_raided_2: [
    "Counter-raid mindset — make 'em regret the commute!",
    "Turrets sing, traps snap — welcome party engaged!",
    "Defend the core — we didn't grind for strangers!",
  ],
  rust_raided_3: [
    "They're inside — time for shotgun diplomacy!",
    "Despawn race — save what ye can, roast what ye can't!",
    "This is fine — the base is screaming but we're built different!",
  ],

  rust_monument_enter_1: [
    "Monument run — radiation, radiation, and maybe a crate!",
    "Pushing monument — assume campers, pray for loot!",
    "Industrial tourism — don't forget yer meds, landlubber!",
  ],
  rust_monument_enter_2: [
    "Card swipe or sneaky feet — Squawks bets on chaos either way!",
    "Monument puzzle or PvP puzzle — Rust never gives both days off!",
    "Entering the compound — keep voice comms loud and survival louder!",
  ],

  rust_mon_small_oil: [
    "Small Oil Rig — vertical loot, horizontal danger!",
    "Riggin' the small oil — seagulls, scientists, and sneaky boats!",
    "Oil rig lite — still enough bullets to write a diary!",
  ],
  rust_mon_large_oil: [
    "LARGE Oil Rig — that's not a hike, that's a heist!",
    "Heavy oil energy — helis, heavies, and hurt feelings!",
    "Big rig — Squawks suggests prayer and plate!",
  ],
  rust_mon_water_treat: [
    "Water Treatment — pipes, pumps, and players who pump lead!",
    "Wet work at Water Treatment — loot flowin', red barrels glowin'!",
    "Treatment plant — we treat every corner like it's hostile!",
  ],
  rust_mon_airfield: [
    "Airfield — runways, recyclers, and recurring regrets!",
    "Planes on the ground, players in the towers — classic airfield!",
    "Airfield sweep — if ye hear a mini, duck first!",
  ],
  rust_monuments_more: [
    "More monument callouts comin' to this board — for now, stay sharp and loot loud!",
    "Squawks is still learnin' the map — monument lineup expands later!",
    "Future monuments: locked in the roadmap — today we improvise!",
  ],

  rust_farm_ore_1: [
    "Ore grind — pickaxe symphony, inventory fantasy!",
    "Nodes droppin' — metal, sulfur, soul fragments!",
    "Mining mood — swing, collect, repeat until rich or dead!",
  ],
  rust_farm_ore_2: [
    "Sulfur for boom — the only math Squawks respects!",
    "Metal frags stackin' — base upgrades incoming!",
    "Rock fight club — first rule: bring a better hatchet!",
  ],

  rust_farm_tree_1: [
    "Wood farm — trees fear Cap'n Maxx!",
    "Choppin' for the build — Squawks counts rings of drama!",
    "Lumberjack hours — axe goes brrr, base goes up!",
  ],
  rust_farm_tree_2: [
    "Tree genocide for a good cause — it's called architecture!",
    "Logs for days — if it ain't a forest, it's a future wall!",
    "Harvest season — Rust doesn't do Earth Day, it does raid week!",
  ],

  // —— Streaming assist ——
  rust_stream_mode_intro: [
    "Rust stream assist on — Squawks'll bark at chat for likes, shares, reposts when it goes quiet!",
    "We're live on the wipe — hearts up, links out, algorithm fed!",
    "Engagement bird deployed — Cap'n Maxx plays; Squawks collects thumbs!",
  ],
  rust_stream_mode_outro: [
    "Rust stream assist off — Squawks stops beggin', starts lootin'!",
    "Hype timer paused — manual lines still work!",
    "Auto-chat-CTA docked — back to pure sulfur violence!",
  ],
  rust_stream_nudge_like: [
    "Chat gone quiet? Likes shouldn't — tap heart for the wipe!",
    "Thumb the stream if ye're still breathin' — Squawks counts!",
    "Algorithm thirsts — hydrate it with likes!",
  ],
  rust_stream_nudge_share_repost: [
    "Share the wipe — draft a mate into the suffering!",
    "Repost if Rust is yer toxic ex ye keep runnin' back to!",
    "Link the stream — recruit more victims… viewers!",
  ],
  rust_stream_nudge_combo: [
    "Like, share, repost — pick two, ye cowards!",
    "Triple threat: heart it, share it, yeet it to the FYP!",
    "Engagement combo for the wipe — Squawks is shameless and proud!",
  ],

  // —— AFK mode (banter every 40s + music) ——
  rust_afk_intro: [
    "AFK mode — Squawks holds chat hostage with banter while Cap'n Maxx grabs life stuff!",
    "Be right back energy — music's on, bird's talkin', don't touch the loot!",
    "Steppin' away — First Mate Squawks runs mouth until return!",
  ],
  rust_afk_outro: [
    "AFK over — Cap'n Maxx is back; Squawks bills chat for overtime!",
    "Return of the Maxx — silence was temporary, chaos is forever!",
    "Bird off duty — thanks for watchin' the pixels!",
  ],
  rust_afk_banter_a: [
    "Still AFK — chat argue about best gun in Rust while we wait!",
    "Squawks inventories yer excuses — water break valid, rage quit debatable!",
    "If ye're new, type 1; if ye're toxic, type… actually don't!",
  ],
  rust_afk_banter_b: [
    "This silence is sponsored by real life — rude!",
    "Cap'n'll be back — pretend ye're farming nodes emotionally!",
    "Squawks recommends stretchin' — neck, legs, ego!",
  ],
  rust_afk_banter_c: [
    "Rust tip: doors exist. Also players behind them. Good luck!",
    "Fun fact: the bird never sleeps. The Cap'n does. Unfair!",
    "Whisper yer wipe stories — Squawks judges silently!",
  ],
  rust_afk_banter_d: [
    "Hydrate, hydrate, then door camp responsibly!",
    "If ye hear footsteps, it's not Squawks — he's pixels only!",
    "Chat MVP today: whoever kept the hype while AFK!",
  ],
} as const satisfies Record<string, readonly string[]>;

export type RustTriggerId = keyof typeof RUST_TRIGGERS;

export const RUST_STREAM_IDLE_TRIGGER_IDS: readonly RustTriggerId[] = [
  "rust_stream_nudge_like",
  "rust_stream_nudge_share_repost",
  "rust_stream_nudge_combo",
];

export const RUST_AFK_BANTER_TRIGGER_IDS: readonly RustTriggerId[] = [
  "rust_afk_banter_a",
  "rust_afk_banter_b",
  "rust_afk_banter_c",
  "rust_afk_banter_d",
];

export function isRustTriggerId(v: string): v is RustTriggerId {
  return Object.prototype.hasOwnProperty.call(RUST_TRIGGERS, v.trim());
}

export function lineForRustTrigger(id: RustTriggerId): string {
  return pickRandomLine(RUST_TRIGGERS[id]);
}

export const RUST_PARROT_STATE: Record<RustTriggerId, ParrotState> = {
  rust_roam_1: "talking",
  rust_roam_2: "talking",
  rust_roam_3: "talking",
  rust_boat_1: "talking",
  rust_boat_2: "talking",
  rust_boat_3: "hype",
  rust_base_build_1: "talking",
  rust_base_build_2: "talking",
  rust_base_build_3: "talking",
  rust_raid_1: "hype",
  rust_raid_2: "hype",
  rust_raid_3: "chaos",
  rust_raided_1: "chaos",
  rust_raided_2: "chaos",
  rust_raided_3: "hype",
  rust_monument_enter_1: "talking",
  rust_monument_enter_2: "talking",
  rust_mon_small_oil: "hype",
  rust_mon_large_oil: "chaos",
  rust_mon_water_treat: "talking",
  rust_mon_airfield: "talking",
  rust_monuments_more: "talking",
  rust_farm_ore_1: "talking",
  rust_farm_ore_2: "talking",
  rust_farm_tree_1: "talking",
  rust_farm_tree_2: "talking",
  rust_stream_mode_intro: "hype",
  rust_stream_mode_outro: "talking",
  rust_stream_nudge_like: "hype",
  rust_stream_nudge_share_repost: "hype",
  rust_stream_nudge_combo: "hype",
  rust_afk_intro: "talking",
  rust_afk_outro: "talking",
  rust_afk_banter_a: "talking",
  rust_afk_banter_b: "talking",
  rust_afk_banter_c: "talking",
  rust_afk_banter_d: "hype",
};

export const rustTriggerBodySchema = z.object({
  triggerId: z
    .string()
    .trim()
    .refine((v): v is RustTriggerId => isRustTriggerId(v), {
      message: "invalid Rust triggerId",
    }),
});

export type RustTriggerBody = z.infer<typeof rustTriggerBodySchema>;
