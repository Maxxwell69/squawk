import { z } from "zod";
import type { ParrotState } from "./parrot-state";
import { pickRandomLine } from "./personality/captain-squawks";

/**
 * Battle mode — each trigger maps to a small pool; UI picks one line at random per button press.
 * Detail string on custom events: `battle_*` (see BATTLE_TRIGGER_IDS).
 */

export const BATTLE_TRIGGERS = {
  // —— Prepare for battle ——
  battle_prepare_1: [
    "Prepare for battle, crew! Start with taps and tiny gifts — warm the deck before we trade broadsides!",
  ],
  battle_prepare_2: [
    "Don't fire every cannon at once! Pace the fodder — small gifts first, then we stack when the time is right.",
  ],
  battle_prepare_3: [
    "Finger hearts, roses, light taps — tickle their board before we load the heavy shot!",
  ],
  battle_prepare_4: [
    "Save yer biggest gifts for the swing minutes — we need rhythm, not a one-minute dump!",
  ],
  battle_prepare_5: [
    "This is a marathon, not a sprint — taps first, then we call the targets together!",
  ],
  battle_prepare_6: [
    "Eyes up! Small gifts build pressure — hold the big guns until Captain says load!",
  ],
  battle_prepare_7: [
    "Crew, breathe — warm up with likes and taps. We'll name prize targets when the water's hot!",
  ],
  battle_prepare_8: [
    "Let 'em feel us before we break the bank — light gifts now, cannons when I squawk!",
  ],

  // —— Battle mode one (minute one) — 10 hype lines ——
  battle_phase1_1: [
    "Minute one — nice and easy! Have fun, stack light, and watch for bonus on that first gift!",
  ],
  battle_phase1_2: [
    "We're just getting warm! Keep it friendly — look for extra on the first gift swing!",
  ],
  battle_phase1_3: [
    "Smooth seas, steady hands — tap, gift small, smile big. This is our warm-up lap!",
  ],
  battle_phase1_4: [
    "No stress, crew — rhythm over rush. Fun first, fireworks later!",
  ],
  battle_phase1_5: [
    "Feel the room out — first gifts sometimes hide a little extra. Eyes open!",
  ],
  battle_phase1_6: [
    "We're vibing! Keep it light, keep it loud in chat, and let the gifts flow easy!",
  ],
  battle_phase1_7: [
    "Good energy only — we're building tempo. Stack with a smile!",
  ],
  battle_phase1_8: [
    "This is the feel-out round — taps, hearts, small bags. We've got time!",
  ],
  battle_phase1_9: [
    "Let 'em hear us cheer! First minute is about fun — the storm comes later!",
  ],
  battle_phase1_10: [
    "Stay frosty — bonus multipliers love a calm first push. You've got this!",
  ],

  // —— Battle mode two ——
  battle_phase2_watch_3x: [
    "Watch out — 3x gifting can flip a fight! Read the board before you blast!",
  ],
  battle_phase2_cannons: [
    "Get the cannons ready — steady stacks, call your shots, no wild broadsides!",
  ],
  battle_phase2_fun: [
    "Time for fun — hype the chat, hit your gifts, make noise!",
  ],
  battle_phase2_battle_on: [
    "Battle two is live — stay sharp, stay loud, stay together!",
  ],

  // —— Battle mode three ——
  battle_phase3_chain_shot: [
    "More cannons — send some chain shot! Break their rhythm and steal the pace!",
  ],
  battle_phase3_halfway: [
    "We're more than halfway there — positive vibes only, we're still in this fight!",
  ],
  battle_phase3_push: [
    "Stack with purpose — every gift counts from here. Eyes on the prize!",
  ],

  // —— Battle four — last minute ——
  battle_phase4_snipers: [
    "Last minute! Watch for snipers — big gifts can steal at the wire. Eyes open!",
  ],
  battle_phase4_board: [
    "Prepare to board — final push, everyone on deck, no sleep till the clock dies!",
  ],
  battle_phase4_ahead: [
    "We're ahead — hold the line! Clean stacks, no panic gifts, finish strong!",
  ],
  battle_phase4_behind: [
    "We're behind — we can still catch up once we board! One big coordinated push!",
  ],

  // —— Battle five — repair & party ——
  battle_phase5_repair_party: [
    "Repair and party — good fight either way. Breathe, cheer, and thank the room!",
  ],
  battle_phase5_we_won: [
    "Victory! We won this round — huge love to the crew! Now congratulate the other side — they brought the fight!",
  ],
  battle_phase5_we_lost: [
    "Tough seas — we lost this one, but we sailed hard! Salute the opponents and our MVPs who carried us!",
  ],
  battle_phase5_mvps_prompt: [
    "Captain Squawks wants to know — who were our MVPs tonight? Shout their names in chat!",
  ],

  // —— Squawk cheer (any phase) ——
  battle_cheer: [
    "That's the spirit — cheer on the crew! Louder, mates, they can hear us!",
    "Huzzah! Push the hype — every voice on deck counts!",
    "Squawk squawk! Let 'em feel the parrot energy — we don't quit!",
    "Cannons up, voices up — cheer like we own the tide!",
    "Yer Captain's proud — keep stomping, keep gifting, keep believing!",
  ],
} as const satisfies Record<string, readonly string[]>;

export type BattleTriggerId = keyof typeof BATTLE_TRIGGERS;

export function isBattleTriggerId(v: string): v is BattleTriggerId {
  return Object.prototype.hasOwnProperty.call(BATTLE_TRIGGERS, v.trim());
}

export const battleTriggerBodySchema = z.object({
  triggerId: z
    .string()
    .refine((v): v is BattleTriggerId => isBattleTriggerId(v), {
      message: "invalid battle triggerId",
    }),
});

export type BattleTriggerBody = z.infer<typeof battleTriggerBodySchema>;

export function lineForBattleTrigger(id: BattleTriggerId): string {
  return pickRandomLine(BATTLE_TRIGGERS[id]);
}

/** Visual state per battle line — cheer uses dance emote. */
export const BATTLE_PARROT_STATE: Record<BattleTriggerId, ParrotState> = {
  battle_prepare_1: "talking",
  battle_prepare_2: "talking",
  battle_prepare_3: "talking",
  battle_prepare_4: "talking",
  battle_prepare_5: "talking",
  battle_prepare_6: "talking",
  battle_prepare_7: "talking",
  battle_prepare_8: "talking",
  battle_phase1_1: "talking",
  battle_phase1_2: "talking",
  battle_phase1_3: "talking",
  battle_phase1_4: "talking",
  battle_phase1_5: "talking",
  battle_phase1_6: "talking",
  battle_phase1_7: "talking",
  battle_phase1_8: "talking",
  battle_phase1_9: "talking",
  battle_phase1_10: "talking",
  battle_phase2_watch_3x: "talking",
  battle_phase2_cannons: "talking",
  battle_phase2_fun: "talking",
  battle_phase2_battle_on: "talking",
  battle_phase3_chain_shot: "talking",
  battle_phase3_halfway: "talking",
  battle_phase3_push: "talking",
  battle_phase4_snipers: "talking",
  battle_phase4_board: "talking",
  battle_phase4_ahead: "talking",
  battle_phase4_behind: "talking",
  battle_phase5_repair_party: "talking",
  battle_phase5_we_won: "talking",
  battle_phase5_we_lost: "talking",
  battle_phase5_mvps_prompt: "talking",
  battle_cheer: "dancing_squawk",
};
