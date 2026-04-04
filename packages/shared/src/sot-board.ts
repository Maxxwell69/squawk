import { z } from "zod";
import type { ParrotState } from "./parrot-state";
import { pickRandomLine } from "./personality/captain-squawks";

/**
 * Sea of Thieves stream board — one random line per button from each pool.
 * Fired via POST /api/sot/trigger (same auth as battle / Stream Deck when secret is set).
 */

export const SOT_TRIGGERS = {
  // —— Island visit ——
  sot_island_arrival_1: [
    "Land ho! First Mate Squawks sees sand — drop anchor pretty, Cap'n Maxx!",
    "We're stepping on dry land! Mind the crabs and the other crews' bootprints!",
    "Island ahead — eyes sharp for barrels, maps, and trouble in the palms!",
  ],
  sot_island_arrival_2: [
    "Shallows look quiet… that's when the skellies start hummin'!",
    "Anchor's down — chat, keep watch on the horizon while we loot!",
    "First Mate Squawks approves this beach day — now find the shiny bits!",
  ],
  sot_island_explore_1: [
    "Spread out, search ruins, listen for snakes — classic vacation!",
    "If ye see a riddle, read it slow — no one likes a wrong dig!",
    "Exploring the island — Cap'n Maxx leads, Squawks judges yer shovel form!",
  ],
  sot_island_rumor_1: [
    "Rumor says treasure here — or maybe just bananas. Worth a peek!",
    "Other crews might've left scraps — we take seconds like winners!",
    "The map whispered secrets… Squawks heard crumbs. Let's verify!",
  ],

  // —— Fight other players ——
  sot_pvp_spot_1: [
    "Sails on the horizon — that ain't friendly merch, that's players!",
    "Another crew's in the water — decide fast: parley or powder!",
    "First Mate Squawks spots hostiles — cannons or legs, Cap'n's call!",
  ],
  sot_pvp_engaged_1: [
    "Steel out, boards ready — it's a proper pirate disagreement!",
    "Broadside incoming — patch holes and return the favor!",
    "PvP engaged! Chat, hype the deck — Cap'n Maxx needs the noise!",
  ],
  sot_pvp_sink_1: [
    "They listed… they're going down — clean fight, loud cheer!",
    "Ship's theirs was; sea's it is now — respawn respects paid!",
    "Splash! That's one less rival on the map — well sailed!",
  ],
  sot_pvp_respawn_1: [
    "We're back from the Ferry — grudge mode optional, fun mode mandatory!",
    "Fresh ship, old attitude — let's find that crew again!",
    "Respawned with style — First Mate Squawks never skips the drama!",
  ],

  // —— Reaper's Bones / chased ——
  sot_reaper_spotted_1: [
    "Reaper flag on the table — someone wants smoke. Eyes up!",
    "That's not a fishing boat — that's ambition with a red sail!",
    "Squawks sees Reaper energy — assume they saw us first!",
  ],
  sot_reaper_chase_1: [
    "They're gaining — full sails, zig-zags, and pray for wind!",
    "Chase music engaged! Cap'n Maxx, weave through rocks if ye can!",
    "Reaper on our tail — chat, manifest destiny is NOT today!",
  ],
  sot_reaper_close_1: [
    "They're kissin' our rudder — brace, repair, and rude emotes!",
    "Harpoons, blunders, panic — it's the full Sea of Thieves combo!",
    "Too close for comfort — First Mate Squawks suggests creative fleeing!",
  ],
  sot_reaper_escape_1: [
    "We shook 'em — mist, islands, or pure disrespect for physics!",
    "Lost the Reaper in the fog — breathe, repair, laugh at chat!",
    "Escape successful! Squawks awards style points to Cap'n Maxx!",
  ],

  // —— Treasure / digging ——
  sot_dig_map_1: [
    "Map in hand — X isn't a suggestion, it's a lifestyle!",
    "Follow the chart, ignore the seagulls judging yer shovel!",
    "Cap'n Maxx reads legends; First Mate Squawks supervises the dirt!",
  ],
  sot_dig_x_marks_1: [
    "Dig here — if it's a chest, we cheer; if it's a crate, we improvise!",
    "Shovel rhythm matters — chat counts the thumps!",
    "X marks the spot — Squawks holds the hype meter!",
  ],
  sot_chest_up_1: [
    "Chest up! That's weight worth carryin' — mind the skellies!",
    "Loot secured — now the real game: not tripping on the beach!",
    "Gold in hand — First Mate Squawks demands a victory strut!",
  ],
  sot_turn_in_1: [
    "Sellin' at the outpost — behave until the coin hits!",
    "Turn-in time — smile at the NPCs, they're tired of us too!",
    "Gold sold — Cap'n Maxx funded the next bad idea!",
  ],

  // —— Thanks viewers / support ——
  sot_thanks_gifts_1: [
    "Gifts hit the deck — thank ye, crew! Ye keep this voyage afloat!",
    "Treasure from chat — Cap'n Maxx and Squawks salute every name!",
    "That support stacked higher than our loot — ye're legends!",
  ],
  sot_thanks_raiders_1: [
    "Raiders brought the party — welcome aboard, stay for the chaos!",
    "Thanks for the raid — more eyes, more hype, more sea nonsense!",
    "New faces in chat — First Mate Squawks sees fresh deckhands!",
  ],
  sot_thanks_hype_1: [
    "The hype in here's saltier than the ocean — thank ye all!",
    "Chat's loud enough to scare the kraken — keep poundin' those hearts!",
    "Cap'n Maxx feels the love — Squawks might actually share crackers!",
  ],
  sot_thanks_mvp_chat_1: [
    "MVPs in chat tonight — ye know who ye are, show yourselves!",
    "Big thanks to everyone callin' shots and tellin' jokes — crew solid!",
    "This stream runs on yer energy — gratitude from Squawks and Cap'n!",
  ],

  // —— Feeding time (emote) ——
  sot_feeding_time: [
    "Feeding time on deck — Squawk gets crumbs, chat gets chaos!",
    "Snack break for the first mate — nobody touch his biscuit!",
    "Galley's open — fuel up, pirates, we've got seas to tilt!",
  ],

  // —— Drink / grog ——
  sot_drink_cheers_1: [
    "Cheers, crew — raise yer grog, real or imaginary!",
    "Drink break! Cap'n Maxx hydrates; Squawks judges pour height!",
    "To health, loot, and never running out of tankards!",
  ],
  sot_drink_grog_1: [
    "Grog time — sip slow, tell tall tales, blame the lag!",
    "That's not water — that's pirate performance fuel!",
    "First Mate Squawks does NOT partake; he's on wing duty!",
  ],
  sot_drink_break_1: [
    "Grab a drink IRL — chat holds the wheel for thirty seconds!",
    "Hydration break — Squawks will scream if anything sinks!",
    "Cap'n's cup runneth over; we'll be back to plunderin' shortly!",
  ],

  // —— Music & dance ——
  sot_dance_shanty_1: [
    "Shanty mode — First Mate Squawks is shakin' feathers to the beat!",
    "Music up, sails imaginary — dance like the kraken ain't watchin'!",
    "Sea groove engaged — Cap'n Maxx leads, Squawks steals the spotlight!",
  ],
  sot_dance_victory_sea_1: [
    "Victory lap on the waves — Squawk breaks out the big dance!",
    "We earned this moment — celebrate like pirates who paid taxes!",
    "That's how you sail — dance it out, crew!",
  ],
} as const satisfies Record<string, readonly string[]>;

export type SotTriggerId = keyof typeof SOT_TRIGGERS;

export function isSotTriggerId(v: string): v is SotTriggerId {
  return Object.prototype.hasOwnProperty.call(SOT_TRIGGERS, v.trim());
}

export function lineForSotTrigger(id: SotTriggerId): string {
  return pickRandomLine(SOT_TRIGGERS[id]);
}

/** Visual per SoT line — shanty = dance emote, victory sea = victory dance, feeding = feeding clip. */
export const SOT_PARROT_STATE: Record<SotTriggerId, ParrotState> = {
  sot_island_arrival_1: "talking",
  sot_island_arrival_2: "talking",
  sot_island_explore_1: "talking",
  sot_island_rumor_1: "talking",
  sot_pvp_spot_1: "hype",
  sot_pvp_engaged_1: "hype",
  sot_pvp_sink_1: "hype",
  sot_pvp_respawn_1: "talking",
  sot_reaper_spotted_1: "chaos",
  sot_reaper_chase_1: "chaos",
  sot_reaper_close_1: "chaos",
  sot_reaper_escape_1: "talking",
  sot_dig_map_1: "talking",
  sot_dig_x_marks_1: "talking",
  sot_chest_up_1: "hype",
  sot_turn_in_1: "talking",
  sot_thanks_gifts_1: "hype",
  sot_thanks_raiders_1: "hype",
  sot_thanks_hype_1: "hype",
  sot_thanks_mvp_chat_1: "talking",
  sot_feeding_time: "feeding_time",
  sot_drink_cheers_1: "talking",
  sot_drink_grog_1: "talking",
  sot_drink_break_1: "talking",
  sot_dance_shanty_1: "dancing_squawk",
  sot_dance_victory_sea_1: "victory_dance",
};

export const sotTriggerBodySchema = z.object({
  triggerId: z
    .string()
    .trim()
    .refine((v): v is SotTriggerId => isSotTriggerId(v), {
      message: "invalid SoT triggerId",
    }),
});

export type SotTriggerBody = z.infer<typeof sotTriggerBodySchema>;
