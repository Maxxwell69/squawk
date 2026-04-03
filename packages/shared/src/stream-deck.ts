import type { ParrotState } from "./parrot-state";
import { pickRandomLine } from "./personality/captain-squawks";

/**
 * Stream Deck → bridge POST routes pick a random line from these pools.
 * Detail on the normalized event is the trigger id (e.g. `streamdeck_hello`).
 */
export const STREAM_DECK_POOLS = {
  streamdeck_hello: [
    "Ahoy, ye soggy barnacles — welcome to Pirate Maxx's deck!",
    "If ye can hear me, yer ears work. If ye can read this, miracles never cease.",
    "Drop anchor in chat, ye ghosts — Cap'n Maxx is watchin'.",
    "Welcome aboard, landlubbers. Try not to scuff the planks.",
    "Another tide, another crew of curious deck-scuffers. How quaint.",
    "Ye found the stream. Points for effort. Points for nothing else yet.",
    "Halt, ye wandering pixels — this ship runs on likes and mild disrespect.",
    "Fresh meat for the comment section — don't make me regret hoistin' the colors.",
    "Salutations, ye beautiful disasters. Behave yourselves… mostly.",
    "First Mate Squawks squawks; Cap'n Maxx runs the ship. Welcome to the fleet, trouble.",
  ],
  streamdeck_please_share: [
    "Spread this voyage like a good rumor in a port tavern — hit share, matey!",
    "Pass the wheel… er, the link — let others catch this salty broadcast.",
    "More eyes on deck mean more treasure in the hold — share the stream, ye flirt!",
    "Don't leave this channel stranded in dry dock — give it a share, ye saucy soul.",
    "One share and the whole sea hears ye whisper my name… figuratively.",
    "Cast this URL upon the waves — let the fleet grow, one scandalous click at a time.",
    "Sharing be the gentleman's way of sayin' the world wants more of this chaos.",
    "Broadcast this bilge-water brilliance — share before the kraken notices!",
    "Slide that link into DMs like a secret map to buried entertainment.",
    "If this stream tickled yer fancy, share it — we don't kiss and tell, we raid and yell!",
  ],
  streamdeck_thanks_likes: [
    "Hearts on the mast — thank ye all for the likes, ye glorious mob!",
    "The like cannon blew wide open — cheers, crew, keep poundin' that thumb!",
    "Every like be a kiss blown to Cap'n Maxx — thank ye, one and all!",
    "Ye hammered that heart button like it owed ye money — we love ye for it!",
    "Likes stackin' higher than the crow's nest — thank ye, every last scallywag!",
    "The whole deck felt that love tap — thanks for the likes, mates!",
    "Ye showered this ship in hearts — no complaints here, Cap'n Maxx included!",
    "Collective appreciation accepted — likes noted, egos stroked, cannons loaded!",
    "From prow to poop deck, thank ye for thumbin' this stream into legend!",
    "That's a proper heap o' likes — the crew tips hats to everyone aboard!",
  ],
  streamdeck_thanks_share: [
    "Shares be wind in our sails — thank ye, crew, for spreadin' the word!",
    "Ye passed the map around like true pirates — gratitude for every share!",
    "The fleet grows because ye blasted links everywhere — thank ye!",
    "Tellin' mates where the treasure lies — thanks for sharin' the stream!",
    "Every share recruits another scallywag — Cap'n Maxx owes ye a nod!",
    "Ye made this voyage contagious — in a good way. Thanks for sharin'!",
    "Word-of-mouth piracy: unlocked. Thanks for the shares, deckhands!",
    "The rumor mill spins gold today — cheers to everyone who shared!",
    "More shares than a tavern gossip — thank ye, truehearted crew!",
    "Ye turned viewers into recruiters — the hold thanks ye!",
  ],
  streamdeck_pirate_maxx: [
    "If ye haven't met Pirate Maxx yet, ye're fashionably lost — fix that, yeah?",
    "Pirate Maxx didn't send me to beg… but if ye're curious, he's around. No pressure. Much.",
    "Some folks discover Pirate Maxx instantly. Others take years. No judgment. (Judgment.)",
    "Cap'n Maxx suggests — gently, with cannons — that ye look him up online.",
    "It's cute how some of ye still haven't clicked Pirate Maxx. Adorable, really.",
    "Off-topic: Pirate Maxx exists, excels, and waits for ye to notice. Subtle, right?",
    "We're all adults here. Mostly. Go see what Pirate Maxx is up to — when ye're ready.",
    "Not sayin' ye're late to the party… but the party's named Pirate Maxx.",
    "Someone had to say it: Pirate Maxx — worth yer time unless ye dislike fun.",
    "Blink twice if ye want a hint: Pirate Maxx. That's the hint.",
  ],
  // Exit/return are animation-only. We keep the subtitle empty.
  streamdeck_exit: [""],
  streamdeck_return: [""],
  streamdeck_peck: [""],
  streamdeck_victory_dance: [
    "Victory lap — First Mate Squawks breaks it down for the crew!",
    "That's a winner's wiggle — hail Cap'n Maxx and the deckhands!",
    "Trophy feathers engaged — soak in the dub!",
    "The parrot's victory strut — join the flock!",
    "We painted the board — now we paint the dance floor!",
  ],
  streamdeck_dancing_squawk: [
    "The deck be shakin' — this bird's got moves that'd shame a mermaid!",
    "Feast yer eyes on the finest footwork on the seven seas!",
    "That's not a dance — that's a declaration of fabulous chaos!",
    "If rhythm were treasure, this parrot just looted the whole hold!",
    "Someone call the bard — First Mate Squawks stole the show again!",
    "Shake a leg, ye lubbers — the parrot's leadin' this jig!",
    "Gravity took the night off — look at those feathers fly!",
    "That's the kind of swagger that starts tavern brawls… the fun kind!",
    "The mast ain't the only thing swayin' tonight — behold the boogie!",
    "Even the kraken paused to watch this nonsense. Respect.",
  ],
  streamdeck_feeding_time: [
    "Chow time on deck — crumbs for crew, glory for Cap'n Maxx!",
    "Pass the biscuit barrel — this bird runs on sass and snacks!",
    "Dinner bell rang — no scallywag leaves this table hungry!",
    "Hot grub, cold grog, and one very smug parrot — feast up!",
    "The galley's servin' comfort food and mild disrespect. Dig in!",
    "If ye can chew it, ye can conquer it — plates forward, mates!",
    "This meal's sponsored by hunger and poor life choices. Enjoy!",
    "Seconds? Aye. Thirds? Also aye. We're pirates, not accountants.",
    "Eat like nobody's chartin' yer waistline — we're at sea!",
    "The cook swears it's edible. The parrot swears it's strategic. Eat!",
  ],
} as const;

export type StreamDeckTriggerId = keyof typeof STREAM_DECK_POOLS;

export const STREAM_DECK_TRIGGER_IDS = Object.keys(
  STREAM_DECK_POOLS
) as StreamDeckTriggerId[];

/** Visual state when this trigger fires */
export const STREAM_DECK_PARROT_STATE: Record<
  StreamDeckTriggerId,
  ParrotState
> = {
  streamdeck_hello: "hello_wave",
  // Idle clip is squawkidlereg (overlay); talking/battle use squawkidle.
  streamdeck_please_share: "idle",
  streamdeck_thanks_likes: "idle",
  streamdeck_thanks_share: "idle",
  streamdeck_pirate_maxx: "idle",
  streamdeck_exit: "exit",
  streamdeck_return: "return",
  streamdeck_peck: "peck",
  streamdeck_victory_dance: "victory_dance",
  streamdeck_dancing_squawk: "dancing_squawk",
  streamdeck_feeding_time: "feeding_time",
};

export function isStreamDeckTriggerId(v: string): v is StreamDeckTriggerId {
  return v in STREAM_DECK_POOLS;
}

export function lineForStreamDeckTrigger(trigger: string): string | null {
  if (!isStreamDeckTriggerId(trigger)) return null;
  return pickRandomLine(STREAM_DECK_POOLS[trigger]);
}
