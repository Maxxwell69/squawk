import { z } from "zod";
import type { ParrotState } from "./parrot-state";
import { pickRandomLine } from "./personality/captain-squawks";

/**
 * Windrose board — Squawk lines about the game plus support / crew mentions.
 * Facts are based on the public game site: Age of Piracy survival adventure,
 * procedural open world, build/craft, soulslite combat, and solo/co-op play.
 */
export const WINDROSE_TRIGGERS = {
  windrose_game_hook_1: [
    "Windrose check, crew: this one's a survival adventure in the Age of Piracy, so Pirate Maxx is basically workin' in his natural habitat!",
    "If ye're new here, Windrose is pirate survival with attitude — explore, gather, build, and make the sea regret knowin' yer name!",
    "Pirate Maxx picked Windrose for a reason — Age of Piracy vibes, survival pressure, and enough open-water trouble to keep a parrot employed!",
  ],
  windrose_open_world_1: [
    "Windrose throws us into a procedural open world — islands, seas, and dungeons shift the adventure so the voyage stays fresh!",
    "That's the hook right there: procedural islands, open sea, dungeon crawls — Windrose wants every run to feel like a new map and a new mistake!",
    "Open world pirate survival, but not static — Windrose remixes islands and dungeons so Pirate Maxx can't autopilot the adventure!",
  ],
  windrose_build_craft_1: [
    "This ain't just sightseein' — Windrose lets ye gather, build, and craft yer base, yer ship, yer weapons, and the gear ye survive with!",
    "Build-and-craft fans, take notes: ye're collectin' resources for shelter, ship upgrades, weapons, and equipment — proper pirate homework!",
    "Windrose wants the full pirate loop: gather the goods, build the base, craft the loadout, then sail out lookin' dangerous!",
  ],
  windrose_ship_sailing_1: [
    "Best part? Pirate Maxx gets to sail the ship, and Windrose actually cares about life on land and sea — proper dual-threat pirate business!",
    "Windrose lets the Cap'n take the helm instead of just fast-travelin' everywhere — sail the ship, chase the horizon, then fight where ye land!",
    "Ship under us, trouble ahead — that's the Windrose promise. Sail first, scrap second, loot third, brag forever!",
  ],
  windrose_combat_boss_1: [
    "Windrose leans soulslite in the combat, so the bosses on land and sea are there to test reactions, greed, and emotional stability!",
    "This game don't hand out freebies — challenging bosses, soulslite combat, and fights that can happen ashore or right out on the water!",
    "If Pirate Maxx starts lockin' in, that's the soulslite part talkin' — Windrose bosses demand timing, nerve, and a little disrespect for danger!",
  ],
  windrose_solo_coop_1: [
    "Windrose works solo or with friends, so whether Pirate Maxx is lone-wolfin' or bringin' mates aboard, the voyage still plays!",
    "Good news for the fleet: ye can run Windrose alone for survival grit or co-op with friends when ye want full pirate chaos!",
    "Solo captain or co-op menace — Windrose supports both, and Squawks approves options that scale the nonsense!",
  ],
  windrose_why_watch_1: [
    "Why are we watchin' Windrose? Because it jams pirate sailing, survival systems, crafting, and boss fights into one salty little package!",
    "This game's speakin' Pirate Maxx's language — open world exploration, buildin', craftin', and enough boss drama to keep chat loud!",
    "Windrose is easy stream food: sailin', scrappin', lootin', buildin' — always somethin' for Squawks to yell about!",
  ],
  windrose_squawk_intro: [
    "Cap'n wants a Windrose intro? Aye! I'm First Mate Squawks — Pirate Maxx's loudest crewman. I call the hype, praise the deckhands, and explain why every pirate game needs more chaos!",
    "Introduce meself for Windrose? Squawks here — first mate, feathered analyst, and full-time Pirate Maxx instigator. If there's sailing, bosses, and pirate nonsense, I'm clocked in!",
    "Windrose watch begins with proper manners: I'm First Mate Squawks, Pirate Maxx's parrot. I keep the banter movin', the praise flowin', and the sea legally unquiet!",
  ],
  windrose_feeding_time: [
    "{{CREW}} just fed Squawks on the Windrose run — now that's premium bird-support behavior!",
    "Big thanks to {{CREW}} for the snack drop! Feed the bird before he starts review-bombin' the voyage!",
    "Windrose snack break courtesy of {{CREW}} — Squawks is eatin', the crew's vibin', and the Cap'n is expected to honor the crumbs!",
  ],
  windrose_crew_praise: [
    "{{CREW}} — that's fleet energy right there. Squawks salutes ye for keepin' this Windrose voyage lively!",
    "Big respect to {{CREW}} — dependable deckhand behavior, and the bird absolutely notices it!",
    "{{CREW}} keeps the crew sharp, the chat loud, and the Windrose run feelin' blessed. Love that!",
    "First Mate Squawks tips a wing to {{CREW}} — that's the kind of support that keeps the ship movin'!",
  ],
  windrose_gift_praise: [
    "{{CREW}} just dropped {{GIFT}} on the Windrose voyage — now that's pirate patron energy!",
    "Treasure on deck from {{CREW}}! {{GIFT}} for Pirate Maxx and Squawks — ye beautiful menace!",
    "{{CREW}} came through with {{GIFT}} — big love from the whole Windrose crew!",
    "Gift salute for {{CREW}}! {{GIFT}} hit the deck and the bird is flappin' with gratitude!",
  ],
} as const satisfies Record<string, readonly string[]>;

export type WindroseTriggerId = keyof typeof WINDROSE_TRIGGERS;

export function isWindroseTriggerId(v: string): v is WindroseTriggerId {
  return Object.prototype.hasOwnProperty.call(WINDROSE_TRIGGERS, v.trim());
}

export function lineForWindroseTrigger(
  id: WindroseTriggerId,
  opts?: { crewMemberName?: string; giftName?: string }
): string {
  let line = pickRandomLine(WINDROSE_TRIGGERS[id]);
  const crew = opts?.crewMemberName?.trim() || "this legend";
  const gift = opts?.giftName?.trim() || "a gift";
  line = line.replace(/\{\{CREW\}\}/g, crew);
  line = line.replace(/\{\{GIFT\}\}/g, gift);
  return line;
}

export const WINDROSE_PARROT_STATE: Record<WindroseTriggerId, ParrotState> = {
  windrose_game_hook_1: "talking",
  windrose_open_world_1: "talking",
  windrose_build_craft_1: "talking",
  windrose_ship_sailing_1: "hype",
  windrose_combat_boss_1: "hype",
  windrose_solo_coop_1: "talking",
  windrose_why_watch_1: "hype",
  windrose_squawk_intro: "talking",
  windrose_feeding_time: "feeding_time",
  windrose_crew_praise: "hype",
  windrose_gift_praise: "hype",
};

export const windroseTriggerBodySchema = z.object({
  triggerId: z
    .string()
    .trim()
    .refine((v): v is WindroseTriggerId => isWindroseTriggerId(v), {
      message: "invalid Windrose triggerId",
    }),
  crewMemberName: z.string().max(80).optional(),
  giftName: z.string().max(120).optional(),
});

export type WindroseTriggerBody = z.infer<typeof windroseTriggerBodySchema>;
