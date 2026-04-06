import { z } from "zod";
import type { ParrotState } from "./parrot-state";
import { pickRandomLine } from "./personality/captain-squawks";

/**
 * Battle mode — each trigger maps to a small pool; UI picks one line at random per button press.
 * Use {{OPPONENT}} and {{CREW}} in strings (see lineForBattleTrigger).
 */

export const BATTLE_TRIGGERS = {
  // —— Prepare for battle ——
  battle_prepare_1: [
    "Prepare for battle, crew! Start with taps and tiny gifts — warm the deck before we trade broadsides!",
    "{{CREW}} — ye heard the call: warm the deck with taps before we trade broadsides!",
  ],
  battle_prepare_2: [
    "Don't fire every cannon at once! Pace the fodder — small gifts first, then we stack when the time is right.",
    "{{CREW}}, pace it pretty — small gifts first, then we stack when Cap'n says!",
  ],
  battle_prepare_3: [
    "Finger hearts, roses, light taps — tickle their board before we load the heavy shot!",
    "{{CREW}} on the rail — hearts, roses, light taps till their board blinks!",
  ],
  battle_prepare_4: [
    "Save yer biggest gifts for the swing minutes — we need rhythm, not a one-minute dump!",
    "{{CREW}} knows rhythm — save the heavy shot for when Squawk calls it!",
  ],
  battle_prepare_5: [
    "This is a marathon, not a sprint — taps first, then we call the targets together!",
    "{{CREW}} — marathon energy: taps first, targets when we're hot!",
  ],
  battle_prepare_6: [
    "Eyes up! Small gifts build pressure — hold the big guns until Cap'n Maxx says load!",
    "{{CREW}}, eyes up — small gifts build pressure till the Cap'n loads!",
  ],
  battle_prepare_7: [
    "Crew, breathe — warm up with likes and taps. We'll name prize targets when the water's hot!",
    "{{CREW}} — breathe and tap; we name targets when the water's right!",
  ],
  battle_prepare_8: [
    "Let 'em feel us before we break the bank — light gifts now, cannons when I squawk!",
    "{{CREW}} — light gifts now, cannons when Squawk squawks!",
  ],

  // —— Battle mode one (minute one) — 10 hype lines ——
  battle_phase1_1: [
    "Minute one — nice and easy! Have fun, stack light, and watch for bonus on that first gift!",
    "{{CREW}} — minute one's yours: fun, light stacks, eyes on that first-gift bonus!",
  ],
  battle_phase1_2: [
    "We're just getting warm! Keep it friendly — look for extra on the first gift swing!",
    "{{CREW}}, keep it friendly — first swing sometimes hides a little extra!",
  ],
  battle_phase1_3: [
    "Smooth seas, steady hands — tap, gift small, smile big. This is our warm-up lap!",
    "{{CREW}} — smooth hands, small gifts, big smile. Warm-up lap!",
  ],
  battle_phase1_4: [
    "No stress, crew — rhythm over rush. Fun first, fireworks later!",
    "{{CREW}} — rhythm over rush; fun first, fireworks when I say!",
  ],
  battle_phase1_5: [
    "Feel the room out — first gifts sometimes hide a little extra. Eyes open!",
    "{{CREW}}, feel the room — first gifts hide extras sometimes!",
  ],
  battle_phase1_6: [
    "We're vibing! Keep it light, keep it loud in chat, and let the gifts flow easy!",
    "{{CREW}} — we're vibing! Chat loud, gifts easy!",
  ],
  battle_phase1_7: [
    "Good energy only — we're building tempo. Stack with a smile!",
    "{{CREW}} — good energy, build tempo, stack smilin'!",
  ],
  battle_phase1_8: [
    "This is the feel-out round — taps, hearts, small bags. We've got time!",
    "{{CREW}}, feel-out round — taps, hearts, small bags. Time's on our side!",
  ],
  battle_phase1_9: [
    "Let 'em hear us cheer! First minute is about fun — the storm comes later!",
    "{{CREW}} — cheer like they can hear ye! Fun first, storm later!",
  ],
  battle_phase1_10: [
    "Stay frosty — bonus multipliers love a calm first push. You've got this!",
    "{{CREW}} — stay frosty; calm first push wins bonuses!",
  ],

  // —— Battle mode two ——
  battle_phase2_watch_3x: [
    "Watch out — 3x gifting can flip a fight! Read the board before you blast!",
    "{{CREW}} — watch 3× close; read the board before ye blast!",
  ],
  battle_phase2_cannons: [
    "Get the cannons ready — steady stacks, call your shots, no wild broadsides!",
    "{{CREW}} — cannons ready: steady stacks, called shots!",
  ],
  battle_phase2_fun: [
    "Time for fun — hype the chat, hit your gifts, make noise!",
    "{{CREW}} — fun minute: hype chat, hit gifts, make noise!",
  ],
  battle_phase2_battle_on: [
    "Battle two is live — stay sharp, stay loud, stay together!",
    "{{CREW}} — battle two live: sharp, loud, together!",
  ],

  // —— Battle mode three ——
  battle_phase3_chain_shot: [
    "More cannons — send some chain shot! Break their rhythm and steal the pace!",
    "{{CREW}} — chain shot their rhythm; steal the pace!",
  ],
  battle_phase3_halfway: [
    "We're more than halfway there — positive vibes only, we're still in this fight!",
    "{{CREW}} — past halfway, positive only, still in this!",
  ],
  battle_phase3_push: [
    "Stack with purpose — every gift counts from here. Eyes on the prize!",
    "{{CREW}} — stack with purpose; every gift counts now!",
  ],

  // —— Battle four — last minute ——
  battle_phase4_snipers: [
    "Last minute! Watch for snipers — big gifts can steal at the wire. Eyes open!",
    "{{CREW}} — snipers at the wire; eyes open for big steals!",
  ],
  battle_phase4_board: [
    "Prepare to board — final push, everyone on deck, no sleep till the clock dies!",
    "{{CREW}} — boardin' push: all hands, no sleep till the horn!",
  ],
  battle_phase4_ahead: [
    "We're ahead — hold the line! Clean stacks, no panic gifts, finish strong!",
    "{{CREW}} — we're ahead: hold the line, clean stacks!",
  ],
  battle_phase4_behind: [
    "We're behind — we can still catch up once we board! One big coordinated push!",
    "{{CREW}} — we're chasin': one coordinated board push!",
  ],

  // —— Battle five — repair & party ——
  battle_phase5_repair_party: [
    "Repair and party — good fight either way. Breathe, cheer, and thank the room!",
    "{{CREW}} — repair and party; breathe, cheer, thank the room!",
  ],
  battle_phase5_we_won: [
    "Victory! We won this round — huge love to the crew! Now congratulate the other side — they brought the fight!",
    "Victory! {{CREW}} and the whole rail — ye did it! Now show love to the other side!",
  ],
  battle_phase5_we_lost: [
    "Tough seas — we lost this one, but we sailed hard! Salute the opponents and our MVPs who carried us!",
    "Tough round — {{CREW}} and crew sailed hard! Salute the other side and our MVPs!",
  ],
  battle_phase5_mvps_prompt: [
    "First Mate Squawks wants to know — who were our MVPs tonight? Shout their names in chat!",
    "{{CREW}} — who else was MVP? Shout names in chat!",
  ],

  /** Cap'n told Squawk to introduce himself — battle board button. */
  battle_squawk_intro: [
    "Cap'n says introduce meself before the fight? Aye! I'm First Mate Squawks — Pirate Maxx's parrot, battle hype officer, and the loudest bird on TikTok! I call minutes, I cheer stacks, I never let the room go quiet. Let's battle!",
    "Orders received: tell 'em who I am! Squawks here — First Mate when the clock's runnin'. Taps, gifts, chaos — I squawk for all of it. Pleasure to raid with ye!",
    "Intro? *ruffles feathers* First Mate Squawks! I ride with Cap'n Maxx through battles, seas, and Rust wipes. When ye hear me, it's time to move — now tap it out!",
  ],

  /** Fired once when the 5:00 match starts — immediate battle + tap callout. */
  battle_match_start: [
    "Battle's live, crew! This is a fight — tap it out! Hearts, taps, light gifts — warm the deck now!",
    "We're in battle mode — Squawk's on deck! Tap it out, make noise, let 'em feel us before the heavy shot!",
    "First Mate Squawks — battle stations! Tap it out nice and easy: likes, roses, small bags. Wake the room!",
    "It's go time — battle clock is running! Tap it out, crew — rhythm first, cannons when I call it!",
    "{{CREW}} — battle's live! Tap it out with me: hearts, taps, warm the deck!",
  ],

  /** Short auto lines from ~0:30 through end of minute one; keeps Squawk chatty without long speeches. */
  battle_banter_chip: [
    "Tap it out — light and steady!",
    "Hearts up — warm the room!",
    "Small gifts — stack the vibe!",
    "Chat loud — let 'em hear the flock!",
    "Easy stacks — we're just getting started!",
    "Taps count — keep 'em coming!",
    "Rhythm, not rush — you've got this!",
    "Nice and easy — fun first!",
    "Feel the room — light pressure only!",
    "Squawk says tap — make that board blink!",
    "Warm the deck — tiny gifts, big energy!",
    "One tap at a time — we're building!",
    "{{CREW}} — taps light and steady!",
    "{{CREW}} — chat loud, flock proud!",
    "{{CREW}} — rhythm, not rush!",
  ],

  // —— Timer auto callouts (Squawk names the mode; random line per fire) ——
  battle_auto_phase2: [
    "We just passed our second minute — keep it up! Watch for 3× gifting and keep those cannons warm!",
    "Minute two on the clock! Steady stacks, call the shots — don't dump everything at once!",
    "Second minute — this is where the fun really starts! Hype the room and read the board!",
    "We're in battle mode two now — eyes on 3×, voices up, make 'em feel the pressure!",
    "Two minutes down — pace yourselves, save a punch for the wire, and cheer like pirates!",
    "{{CREW}} — minute two: eyes on 3×, stacks steady!",
  ],
  battle_auto_phase3: [
    "Third minute — we're past halfway! Chain-shot their rhythm and steal the pace!",
    "Halfway home, crew! Positive stacks only — we're still in this fight!",
    "Battle mode three — push with purpose! Every gift from here is gold!",
    "Third minute energy — more than halfway! Stay loud, stay smart, stay together!",
    "We're sailing the middle stretch — stack clean, call targets, no panic gifts!",
    "{{CREW}} — past halfway: push with purpose!",
  ],
  battle_auto_phase4: [
    "Fourth minute — watch for snipers and last-second steals! Eyes open at the wire!",
    "Battle mode four — prepare to board! Final push, all hands, no sleep till the horn!",
    "Last leg before the bell — hold the line if we're ahead, coordinated rush if we're chasing!",
    "Fourth minute — snipers love the chaos! Call your shots and protect the stack!",
    "We're in the deep water now — board 'em with hype, finish with heart!",
    "{{CREW}} — sniper minute: eyes at the wire!",
  ],
  battle_auto_phase5: [
    "Final minute — this is it! Everything on the deck, nothing held back!",
    "Last sixty — snipers, boarders, big gifts — the whole ocean's watching!",
    "Fifth minute — empty the powder if you must, but finish as a crew!",
    "Clock's almost dry — cheer like the parrot army, one last coordinated swing!",
    "Endgame — breathe, then blast! Make this minute count!",
    "{{CREW}} — last minute: everything on deck!",
  ],

  // —— Hail opponent (use {{OPPONENT}}) ——
  battle_hail_nice_1: [
    "Big respect to {{OPPONENT}} and their crew — bringin' the fight tonight!",
    "Hail {{OPPONENT}} — yer chat's loud and yer house is strong. Good seas to ye!",
    "Shout to {{OPPONENT}} — thanks for a wild match, mates!",
    "Fair winds to {{OPPONENT}}'s crew — we love a worthy rival!",
    "{{OPPONENT}} — ye sailed clean. Salute from First Mate Squawks!",
  ],
  battle_hail_nice_2: [
    "Tip the hat to {{OPPONENT}} — that room's electric!",
    "Love the energy from {{OPPONENT}}'s side — give 'em a cheer, crew!",
    "{{OPPONENT}}'s deckhands are legends tonight — show love in chat!",
    "Nothing but respect for {{OPPONENT}} — what a battle!",
    "Huzzah for {{OPPONENT}} — ye made us work for every inch!",
  ],
  battle_hail_nice_3: [
    "Let's hear it for {{OPPONENT}} — class act, loud chat, big hearts!",
    "{{OPPONENT}}, ye brought the storm — we're honored to share the water!",
    "Good sport, {{OPPONENT}} — may yer next raid be twice as fierce!",
    "Crowd love to {{OPPONENT}} and everyone sailing with 'em!",
    "{{OPPONENT}} — thanks for the show — now let's finish strong!",
  ],

  battle_hail_roast_1: [
    "{{OPPONENT}} — yer ship's so slow the barnacles filed a complaint!",
    "We see {{OPPONENT}}'s stack wobblin' like a three-legged crab!",
    "{{OPPONENT}}, did ye bring cannons or confetti? Either way we're still here!",
    "Tell {{OPPONENT}} we're stealin' their wind — fair chase!",
    "{{OPPONENT}}'s crew hits like wet paper — love ye anyway!",
    "{{CREW}} — we're roastin' {{OPPONENT}} with love — pile on in chat!",
  ],
  battle_hail_roast_2: [
    "If {{OPPONENT}}'s gifts were any lighter they'd float away!",
    "{{OPPONENT}} — nice try, cute try, we're still the louder birds!",
    "We've seen scarier waves in a bathtub than {{OPPONENT}}'s last push!",
    "{{OPPONENT}}, save some energy for the sail home — ye'll need it!",
    "First Mate Squawks says {{OPPONENT}}'s chat types faster than they gift — all love!",
    "{{CREW}} — {{OPPONENT}} heard us; keep the banter fun!",
  ],
  battle_hail_roast_3: [
    "{{OPPONENT}} — we're not sayin' yer predictable, but the parrot called that play!",
    "Someone tell {{OPPONENT}} the 3× window isn't a suggestion — it's a warning!",
    "{{OPPONENT}}'s ship leaks hype — we're bailin' with victory buckets!",
    "We still love {{OPPONENT}} — even when they're feedin' us easy reads!",
    "{{OPPONENT}}, ye fight like a legend… from the kiddie pool!",
    "{{CREW}} — all in good fun — {{OPPONENT}} knows we love 'em!",
  ],

  // —— Victory dance (emote-forward; same clip as Stream Deck victory-dance) ——
  battle_victory_dance: [
    "Victory dance on deck — First Mate Squawks is feelin' it!",
    "We won the moment — stomp with the parrot!",
    "That's the victory shuffle — crew, make noise!",
    "Spin the compass — we dance like champions!",
    "{{CREW}} — victory shuffle with Squawks!",
  ],

  // —— Victory party (optional taps during 2 min celebration) ——
  battle_party_victory_1: [
    "Victory lap! This crew doesn't miss — keep the party loud!",
    "We won — spin the wheel, pop the pretend powder, hail the MVPs!",
    "That's how you raid! Celebrate like parrots who own the tide!",
    "Winners' deck — stomp, cheer, and soak it in!",
    "Champions tonight — let the chat hear ye!",
  ],
  battle_party_victory_2: [
    "Party mode — two minutes of pure pirate pride!",
    "Victory tastes like salt and gold — keep cheerin'!",
    "We painted the scoreboard — now paint the chat!",
    "Winning never gets old — neither does this crew!",
    "First Mate Squawks is dancin' — join the flock!",
  ],

  // —— Loss — lighter tone ——
  battle_party_loss_1: [
    "Tough one — but we sailed honest. Salute the other crew!",
    "We didn't get the dub — still proud of every gift and every voice!",
    "Loss stings, but the crew's heart didn't — we'll be back!",
    "Shake it off — good fight, good chat, we'll run it back!",
    "{{CREW}} — tough round, proud of ye anyway!",
  ],
  battle_party_loss_2: [
    "Lighter seas tonight — still love our MVPs who showed up!",
    "No shame in a hard loss — we showed up loud!",
    "Rest the cannons, hug the chat — we go again next time!",
    "They got the round — they don't get our spirit!",
    "{{CREW}} — heads up; we run it back louder!",
  ],

  // —— Squawk cheer (any phase) ——
  battle_cheer: [
    "That's the spirit — cheer on the crew! Louder, mates, they can hear us!",
    "Huzzah! Push the hype — every voice on deck counts!",
    "Squawk squawk! Let 'em feel the parrot energy — we don't quit!",
    "Cannons up, voices up — cheer like we own the tide!",
    "Cap'n Maxx is proud — keep stomping, keep gifting, keep believing!",
    "{{CREW}} — that's the spirit! Louder!",
  ],
} as const satisfies Record<string, readonly string[]>;

export type BattleTriggerId = keyof typeof BATTLE_TRIGGERS;

export function isBattleTriggerId(v: string): v is BattleTriggerId {
  return Object.prototype.hasOwnProperty.call(BATTLE_TRIGGERS, v.trim());
}

export const battleTriggerBodySchema = z.object({
  triggerId: z
    .string()
    .trim()
    .refine((v): v is BattleTriggerId => isBattleTriggerId(v), {
      message: "invalid battle triggerId",
    }),
  opponentName: z.string().max(100).optional(),
  /** From battle board crew list — lines with {{CREW}} shout them out. */
  crewMemberName: z.string().max(80).optional(),
});

export type BattleTriggerBody = z.infer<typeof battleTriggerBodySchema>;

export function lineForBattleTrigger(
  id: BattleTriggerId,
  opts?: { opponentName?: string; crewMemberName?: string }
): string {
  let line = pickRandomLine(BATTLE_TRIGGERS[id]);
  const name = opts?.opponentName?.trim() || "the other crew";
  line = line.replace(/\{\{OPPONENT\}\}/g, name);
  const crew = opts?.crewMemberName?.trim() || "mates";
  line = line.replace(/\{\{CREW\}\}/g, crew);
  return line;
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
  battle_squawk_intro: "talking",
  battle_match_start: "talking",
  battle_banter_chip: "talking",
  battle_auto_phase2: "talking",
  battle_auto_phase3: "talking",
  battle_auto_phase4: "talking",
  battle_auto_phase5: "talking",
  battle_hail_nice_1: "talking",
  battle_hail_nice_2: "talking",
  battle_hail_nice_3: "talking",
  battle_hail_roast_1: "talking",
  battle_hail_roast_2: "talking",
  battle_hail_roast_3: "talking",
  battle_victory_dance: "victory_dance",
  battle_party_victory_1: "victory_dance",
  battle_party_victory_2: "victory_dance",
  battle_party_loss_1: "talking",
  battle_party_loss_2: "talking",
  battle_cheer: "dancing_squawk",
};
