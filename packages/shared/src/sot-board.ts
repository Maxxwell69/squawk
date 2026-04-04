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

  // —— Scripted automations (SoT board Start / Finish) ——
  /** Skeleton ship: opening — crew of skellies on the waves. */
  sot_seq_skel_start: [
    "Skeleton ship rising — that's a whole crew of boneheads with paychecks due!",
    "Undead galleon on the scope — skellies don't negotiate, they decorate the sea!",
    "First Mate Squawks sees ribs and rigging — skeleton crew, live-fire rehearsal!",
  ],
  /** Skeleton ship: mid — fire + cursed / wraith shots. */
  sot_seq_skel_fire_magic: [
    "Keep the cannons hot — burn 'em down before they patch their planks!",
    "Watch the waterline for green flashes — cursed balls love our hull!",
    "If ye see a wraith trail, brace — that's not fireworks, that's rude!",
    "Fire discipline, crew — chain 'em, flame 'em, don't let 'em breathe!",
  ],
  /** Skeleton ship: mid — repairs + other players. */
  sot_seq_skel_repair_players: [
    "Someone grab wood — holes don't fix themselves while skellies cheer!",
    "Buckets and boards — we're trading paint with bones AND the clock!",
    "Eyes on the horizon — players love third-partying a skeleton brawl!",
    "Repair under fire — if a rival ship smells blood, assume they're hungry!",
  ],
  sot_seq_skel_finish: [
    "Skeleton scrap wrapped — planks patched, ego inflated, Squawks exhausted!",
    "Skelly ship handled — chat, rate that broadside ballet!",
    "Bones sent home — Cap'n Maxx, that's how ye filet a crew without skin!",
  ],

  /** Player ship: ruthless pirate vs humble crew. */
  sot_seq_player_ship_start: [
    "Player ship — they think we're humble merchants; Squawks says we're drama bait!",
    "Hostile crew sizing us up — ruthless pirates versus Cap'n Maxx's reasonable chaos!",
    "That's not a parley flag — that's greed with better graphics!",
  ],
  sot_seq_player_ship_mid: [
    "They want our loot — joke's on 'em, half of it's bananas!",
    "Hold the line — we're the underbirds with the bigger mouth!",
    "They're playing cutthroat; we're playing Sea of Thieves — same thing, louder!",
    "Chat, manifest polite disrespect — we're humble until we're not!",
    "Board 'em, sink 'em, or run — Squawks votes for whatever looks funniest!",
  ],
  sot_seq_player_ship_finish: [
    "Player brawl settled — win or learn, but never bore the stream!",
    "That crew met Pirate Maxx — tuition paid in cannonballs!",
    "PvP chapter closed — First Mate Squawks needs a cracker and a lie-down!",
  ],

  /** Kraken: beast fight + stuck / feast banter. */
  sot_seq_kraken_start: [
    "Kraken on the hull — this is a beast of an action sequence, chat!",
    "Tentacles and terror — Squawks didn't sign up for seafood THIS personal!",
    "The kraken wants a hug — decline politely with cannons!",
  ],
  sot_seq_kraken_mid: [
    "If we're stuck in the wrap — keep shooting; hope the ugly chokes on us!",
    "Feast on kraken later — right now, make it regret the appetizer!",
    "Tangle feels hopeless? Joke's on him — we're spicy and hard to swallow!",
    "Harpoons, holes, screaming — classic family dinner with a kraken!",
    "Stay moving — if ye go still, ye become today's special!",
  ],
  sot_seq_kraken_finish: [
    "Kraken beat or fled — either way, Squawks needs dry feathers!",
    "Tentacle tantrum over — Cap'n Maxx, that's legendary stress management!",
    "Sea monster chapter done — someone tell the fish we're closed!",
  ],

  /** Megalodon: greatness + feast / cook banter. */
  sot_seq_meg_start: [
    "Meg on the line — tales of greatness for this beauty, chat!",
    "Big fish energy — First Mate Squawks respects the teeth!",
    "Megalodon incoming — that's not a dolphin, that's a lifestyle!",
  ],
  sot_seq_meg_mid: [
    "If we land this beast, Squawks votes fish fry — chat brings sides!",
    "Feast talk later — first, don't become the appetizer!",
    "Cookin' meg is a dream — surviving meg is the homework!",
    "Chum in the water, drama in the air — peak Sea of Thieves cuisine!",
    "Keep the rail clear — this one's a moving buffet with attitude!",
  ],
  sot_seq_meg_finish: [
    "Meg chapter closed — grill's cold, hearts loud, Squawks impressed!",
    "Big shark handled — someone write a shanty with too many teeth!",
    "Fish tale secured — Cap'n Maxx, that's how ye filet legend!",
  ],

  /** Island run: players + loot focus. */
  sot_seq_island_run_start: [
    "Island run — eyes up for other crews, pockets down for every shiny!",
    "We're beachin' for loot — assume players already staked the good sand!",
    "Shore party rules: watch the tree line, grab the gold, don't trip!",
  ],
  sot_seq_island_run_mid: [
    "Loot fast — the map ain't the only thing that knows we're here!",
    "Listen for shots — if players farm us, we farm drama back!",
    "Stack chests, stack caution — outposts aren't the only exit!",
    "Dig, grab, scan horizon — multitask like pirates with ADHD!",
    "Every barrel might be bait — every bush might be a rival!",
  ],
  sot_seq_island_run_finish: [
    "Island haul wrapped — bags heavy, paranoia healthy!",
    "Back to the ship — Squawks counts loot; chat counts close calls!",
    "Shore leave over — Cap'n Maxx, that's how ye shop with cannons nearby!",
  ],

  // —— Live streaming assist (SoT board: Start / Finish) ——
  sot_stream_mode_intro: [
    "Streaming assist armed — First Mate Squawks'll nag chat for likes, shares, and reposts when it goes quiet!",
    "We're live and shameless — chat, warm those hearts, spread the link, smash repost if ye love chaos!",
    "Voyage's broadcasting — Squawks is on hype duty: like, share, repost, pretend ye're proud of us!",
    "Deck's open to the world — if ye enjoy the show, tell the algorithm with thumbs and shares!",
    "Cap'n Maxx is sailing; Squawks is marketing — hearts up, shares out, reposts for the culture!",
  ],
  sot_stream_mode_outro: [
    "Streaming assist standin' down — Squawks rests his pitchfork. Back to pure sea nonsense!",
    "Auto-hype paused — thanks for lettin' this bird bark at chat. See ye next broadcast!",
    "Engagement bird clockin' out — manual buttons still work if ye need a fresh squawk!",
  ],
  sot_stream_nudge_like: [
    "Minute of silence? Unacceptable — tap like if Squawks still has yer attention!",
    "Hearts look lonely — give this stream a thumb before the kraken judges us!",
    "If ye're vibin', double-tap the love — Cap'n Maxx feeds on validation!",
    "Like button's collectin' dust — one tap keeps the parrot off strike!",
    "Ye've been lurkin' like pros — now bless the feed with a heart, ye beautiful ghosts!",
    "No likes in a bit — Squawks assumes ye're stunned. Prove it with a tap!",
    "The algorithm forgets us without hearts — pound that like for Pirate Maxx!",
  ],
  sot_stream_nudge_share_repost: [
    "Chat gone quiet? Share this voyage — draft a mate into the mess!",
    "Repost if ye'd watch this nonsense again — let the FYP learn yer taste!",
    "One share recruits another scallywag — pass the link like a secret map!",
    "If this made ye smirk, repost it — Squawks demands cultural distribution!",
    "Spread the stream like gossip in a tavern — share, repost, recruit the fleet!",
    "Shares and reposts be wind in our sails — ye know what to do, deckhands!",
    "Quiet deck? Loud links — share or repost before we start beggin' in shanty form!",
  ],
  sot_stream_nudge_combo: [
    "Like if ye're here, share if ye know a troublemaker, repost if ye dare — pick yer weapon!",
    "Triple threat ask: heart it, share it, repost it — Squawks ain't proud, just effective!",
    "Engagement combo: tap like, yeet a share, slap repost — First Mate Squawks counts to three!",
    "We need noise on the feed — likes for love, shares for friends, reposts for chaos!",
    "If ye watched this long, ye owe the timeline one like and one repost. Maritime law. Probably.",
    "Like for Cap'n Maxx, share for yer crew, repost for the algorithm gods — balance restored!",
  ],

  // —— AFK mode (Voyages board: music + banter every 40s) ——
  sot_afk_intro: [
    "AFK on the high seas — Squawks keeps chat company while Cap'n Maxx handles land business!",
    "Helm on autopilot — music up, bird yappin', don't steal the ship while we're gone!",
    "Stepped away from the wheel — First Mate Squawks entertains the crew!",
  ],
  sot_afk_outro: [
    "Cap'n's back on deck — Squawks hands over the wheel!",
    "Return aboard — the voyage resumes, the bird goes back to hecklin'!",
    "AFK anchor weighed — thanks for mindin' the rum… I mean morale!",
  ],
  sot_afk_banter_a: [
    "Still AFK — chat, debate best outpost or worst meg story while we wait!",
    "The ship's driftin' metaphorically — Squawks is fine, the Cap'n's refuelin'!",
    "If ye hear seagulls, that's ambience; if ye hear chaos, that's still ambience!",
  ],
  sot_afk_banter_b: [
    "Quiet deck? Someone tell a shanty in chat — Squawks is listenin'!",
    "This pause is sponsored by hydration and sanity — pirates need both!",
    "Cap'n'll return — pretend ye're fishin' for likes in the meantime!",
  ],
  sot_afk_banter_c: [
    "Sea tip: mermaids exist; blame them for any missed shots later!",
    "Fun fact: Squawks never sleeps. The Cap'n does. Crew meeting adjourned!",
    "Whisper yer worst skelly ship story — bird rates the drama one to ten!",
  ],
  sot_afk_banter_d: [
    "Kraken's on break too — even legends respect AFK etiquette!",
    "If ye see a rowboat comin', it's not us — we're pixels and patience!",
    "Chat MVP: whoever kept the tavern energy while the helm was empty!",
  ],

  // —— AFK — Cap'n life breaks (drinks, food, throne, phone) ——
  sot_afk_captain_intro: [
    "Cap'n Maxx left the deck — Squawks covers; odds are grog, grub, or the head!",
    "BRB voyage: Pirate Maxx is negotiatin' with a cooler. Bird's on watch!",
    "Human overboard… to the kitchen. Squawks assumes snacks or strategic bathroom diplomacy!",
  ],
  sot_afk_captain_outro: [
    "Cap'n's back — hopefully bilge-free and ready to sail!",
    "Return of Pirate Maxx — Squawks retires from explainin' the captain's shore leave!",
    "Feet on deck again — thanks for not scuttlin' the stream!",
  ],
  sot_afk_captain_banter_a: [
    "He's huntin' hydration — pirates get thirsty; science says blame the salt air!",
    "Drink run — could be water, could be something grog-colored. Squawks asks no questions!",
    "Thirst level: legendary — Cap'n vanished toward liquids like a sloop to an outpost!",
  ],
  sot_afk_captain_banter_b: [
    "Snack sortie — Pirate Maxx is feedin' the engine so the engine can feed the grind!",
    "Galley raid IRL — zero doubloons, maximum crunch!",
    "If ye hear crunchin' off-mic, that's this expedition. Squawks disavows all crumbs!",
  ],
  sot_afk_captain_banter_c: [
    "Head call — even captains duel the porcelain kraken sometimes!",
    "Visitin' the captain's quarters… the small one astern. Dignity intact, timer runnin'!",
    "Nature sounded the bell; Cap'n answered. Squawks stays here so chat don't picture the waves!",
  ],
  sot_afk_captain_banter_d: [
    "Plot twist: Cap'n Maxx is on the throne scrollin' TikTok — two thrones, one algorithm!",
    "He's in the head with his phone — FYP won, Sea of Thieves paused, pride… negotiable!",
    "Phone + bathroom + autoplay = Pirate Maxx in a scroll hole. Squawks is mortified!",
    "He said 'one minute' — that was three TikToks ago. The bird keeps ship's log; the Cap'n keeps likes!",
    "AFK brought to ye by: autoplay and weak will on the ceramic deck!",
    "Squawks peeked — Cap'n's eyes closed, phone glowin'. That's a nap with Wi-Fi, not a break!",
    "Dozed mid-scroll — TikTok one, Pirate Maxx nil. Someone ring the bell gently!",
  ],
} as const satisfies Record<string, readonly string[]>;

export type SotTriggerId = keyof typeof SOT_TRIGGERS;

/** One of these fires when streaming assist is on and no Squawk line ran for 60s. */
export const SOT_STREAM_IDLE_TRIGGER_IDS: readonly SotTriggerId[] = [
  "sot_stream_nudge_like",
  "sot_stream_nudge_share_repost",
  "sot_stream_nudge_combo",
];

export const SOT_AFK_BANTER_TRIGGER_IDS: readonly SotTriggerId[] = [
  "sot_afk_banter_a",
  "sot_afk_banter_b",
  "sot_afk_banter_c",
  "sot_afk_banter_d",
];

export const SOT_AFK_CAPTAIN_BANTER_TRIGGER_IDS: readonly SotTriggerId[] = [
  "sot_afk_captain_banter_a",
  "sot_afk_captain_banter_b",
  "sot_afk_captain_banter_c",
  "sot_afk_captain_banter_d",
];

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

  sot_seq_skel_start: "chaos",
  sot_seq_skel_fire_magic: "chaos",
  sot_seq_skel_repair_players: "hype",
  sot_seq_skel_finish: "talking",
  sot_seq_player_ship_start: "hype",
  sot_seq_player_ship_mid: "hype",
  sot_seq_player_ship_finish: "talking",
  sot_seq_kraken_start: "chaos",
  sot_seq_kraken_mid: "chaos",
  sot_seq_kraken_finish: "talking",
  sot_seq_meg_start: "hype",
  sot_seq_meg_mid: "hype",
  sot_seq_meg_finish: "talking",
  sot_seq_island_run_start: "talking",
  sot_seq_island_run_mid: "talking",
  sot_seq_island_run_finish: "hype",

  sot_stream_mode_intro: "hype",
  sot_stream_mode_outro: "talking",
  sot_stream_nudge_like: "hype",
  sot_stream_nudge_share_repost: "hype",
  sot_stream_nudge_combo: "hype",

  sot_afk_intro: "talking",
  sot_afk_outro: "talking",
  sot_afk_banter_a: "talking",
  sot_afk_banter_b: "talking",
  sot_afk_banter_c: "talking",
  sot_afk_banter_d: "hype",
  sot_afk_captain_intro: "talking",
  sot_afk_captain_outro: "talking",
  sot_afk_captain_banter_a: "talking",
  sot_afk_captain_banter_b: "talking",
  sot_afk_captain_banter_c: "hype",
  sot_afk_captain_banter_d: "hype",
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
