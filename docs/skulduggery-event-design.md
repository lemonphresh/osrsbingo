# skulduggery: event design doc

> status: **design locked: v1 build ready.** further answers should come from playtest, not more paper design
> owner: lemon
> last updated: 2026-09-06

## one-liner

teams are crews. they pull chained **contracts** off a shared **job board**, complete them for **cut**, and spend cut at the **black market** to sabotage rivals or protect themselves. **cut is tracked as two numbers**: `cutEarned` (your leaderboard score, only ever goes up) and `cutBalance` (spendable: buying market actions drains this, not your score).

---

## core loop

1. job board rotates a deck of contracts drawn from the content registry
2. a crew "pulls" a contract → its steps unlock in order (linear dep chain). no abandonment: once you pull it, you're on the hook
3. each step is a normal registry task (boss kc, xp, unique, minigame, clue) w/ wom auto-sync + ref review, so like same submission flow as everything else
4. final step pays out cut: added to **both** `cutEarned` (score) and `cutBalance` (spendable)
5. `cutBalance` gets spent at the black market to mess with rivals or defend yourself. spending does NOT touch `cutEarned`: your leaderboard number is safe
6. winning crew = most `cutEarned` at end of the event window. runner-up "honorable mentions" get tracked for the summary/achievements screen (most kingpins pulled, most sabotage bought, biggest single payout, cleanest crew, etc)

---

## why it fits the platform

almost all of this is stuff we already have:

| system                                                                                      | reused?                                                                                           |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| content registry entries                                                                    | ✅ direct                                                                                         |
| registry's short/medium/long duration quantities                                            | ✅ → heist / vault / kingpin **length** buckets (not difficulty: see length × difficulty section) |
| wom auto-sync per task                                                                      | ✅ per step                                                                                       |
| submission + ref flow (`TileReviewControls`, PENDING/APPROVED)                              | ✅ zero changes                                                                                   |
| `SubmissionsProvider` state machine (LOCKED → UNLOCKED → SUBMITTED → COMPLETE)              | ✅ a chain is just a linear dep graph                                                             |
| currency ledger (spoopy scare$)                                                             | ✅ rename to "cut"                                                                                |
| seeded rng for content pull (champion forge sampler)                                        | ✅ generates the contract deck                                                                    |
| `contentSelections` admin curation                                                          | ✅ theme filters                                                                                  |
| discord embeds                                                                              | ✅ phase field feeds copy                                                                         |
| gielinor rush's length/difficulty-driven task generation                                    | ✅ same idea: event length + difficulty tune how many contracts spawn                             |
| gielinor rush's split of **length** (short/medium/long) from **difficulty** (easy/int/hard) | ✅ contracts have both axes independently                                                         |
| champion forge's `cfTasks` extension pattern                                                | ✅ mirrored as **skulduggery task pool** for shakedown jobs                                       |
| **new: contract schema + black market**                                                     | ⚠️ the only real build                                                                            |

mental model: **spoopy's economy + rainbow's dep graph + champion forge's task sampler + gielinor rush's tuning knobs + a sabotage market**

---

## contract schema (sketch)

```
Contract {
  id
  name              # "the barrows job"
  length            # heist | vault | kingpin (drives step count + quantity bucket)
  difficulty        # easy | intermediate | hard (drives eligible content pool + payout multiplier: NOT slot count; slots are flat)
  basePayout        # lengthBase × difficultyMultiplier
  steps: [
    {
      contentId     # registry id, i.e. "giantMole": filtered by contract difficulty
      role          # scout | muscle | fence (flavor + discord copy)
      phase         # case | steal | launder (narrative phase)
      metricType    # boss_kc | xp | unique | ...
      metricTarget  # pulled from registry quantities by length
      # note: action slots are flat 1+1 regardless of length or difficulty; difficulty only affects payout multiplier
    }
  ]
}
```

- a contract is basically a **sequenced array of registry entries** w/ a light narrative overlay
- steps unlock in order: the existing state machine handles this for free
- payout hits the crew's ledger when the final step completes
- no abandonment once pulled
- **one active contract per crew at a time**: pull, work, complete, then pull the next

---

## the skulduggery task pool

separate from the main content registry: a curated pool of **thieving-flavored one-off tasks** for shakedown jobs. mirrors champion forge's `cfTasks` extension pattern (tasks live alongside registry entries but tagged for a specific event's use).

each entry:

```
SkulduggeryTask {
  id
  displayName       # "lift 50 magic seeds from ardougne stalls"
  difficulty        # easy | intermediate | hard
  metricType        # thieving_xp | pickpocket_kc | item_collection
  metricTarget      # scaled to a short-duration task regardless of difficulty
  womKey            # nullable, for auto-sync where applicable
}
```

**source pool candidates:** pickpocketing (h.a.m., ardougne, master farmer, elves), thieving stalls, rogue's outfit runs, safe-cracking, blackjacking, wilderness slayer-esque risky content, agility pyramid, pyramid plunder. anything that fits the "quick heist-y side gig" vibe.

only used by **shakedown** for now, but the pool exists as its own thing so we can slot it into future mechanics (bribes, side hustles, etc) w/o retrofitting the main registry.

---

## contracts: length × difficulty matrix

contracts have **two independent axes** (mirrors gielinor rush's model):

**length**: controls step count + registry quantity bucket. this is the old "tier" collapsed down to just time-to-complete.

| length  | steps | registry quantities |
| ------- | ----- | ------------------- |
| heist   | 2     | short               |
| vault   | 3     | medium              |
| kingpin | 4–5   | long                |

**difficulty**: controls _which_ registry content is eligible for the contract's steps.

| difficulty   | content pool                                                           |
| ------------ | ---------------------------------------------------------------------- |
| easy         | wintertodt, tempoross, low-level bosses, beginner clues, f2p content   |
| intermediate | dks, gwd, mid-level raids, medium clues, standard skilling             |
| hard         | tob, inferno, cox challenge mode, master/elite clues, endgame skilling |

so a contract is i.e. "**heist-hard**" (2 endgame steps, big multiplier, quick) or "**kingpin-easy**" (5 low-skill steps, casual grind for a long payout).

**payout formula (rough):**
`basePayout = lengthBase × difficultyMultiplier`
so short-easy = smallest, long-hard = huge.

**calibration caveat:** the length × difficulty matrix is a starting point, not gospel. kingpin compounds labor (more steps × bigger per-step quantities), which can make raw payouts diverge from actual team-hours invested. during playtest we should calibrate `basePayout` to **estimated team-hours + a difficulty/access premium** rather than trusting the multiplier grid alone. registry buckets alone don't normalize inferno vs elite clues vs plain xp grinds well enough. unique/drop tasks also have real variance we may need to smooth.

**action slots are always the same: 1 offensive/territorial + 1 defensive/empowerment per contract, regardless of length or difficulty.** difficulty only affects payout: hard contracts pay more, they don't grant more market power. keeps the system flat + predictable.

**kingpin gating:** two gates in sequence:

1. **visibility gate:** crews w/ < 3 completed contracts see kingpin cards as **redacted placeholders**: a "???" cover w/ "reputation required" callout. the card still occupies a real board slot but its contents are hidden. crews w/ 3+ completed contracts see the full kingpin details in-place
2. **pull gate:** even when visible, pulling a kingpin requires the crew to have bought **reputation** at the black market first

**reputation can be bought between contracts** (not only during one). if bought between contracts, it doesn't consume any current slot: it consumes the defensive/empowerment slot of the **next contract you pull**, tagged on that contract's `actionBudget` as pre-spent. this avoids an accidental "you need to do a 4th non-kingpin contract before you can pull a kingpin" trap: after your 3rd completed contract you can immediately spend reputation, then pull a kingpin.

**board density guarantee:** at least **half of the visible slots must be non-kingpin** at any time. if the natural distribution would push it past that, extra kingpin slots become "held back" until a non-kingpin slot opens. keeps the board playable for newer crews.

---

## the job board

- deck of ~30–50 contracts drawn from the registry at event seed time (deck size + refresh cadence tuned by event length, same way gielinor rush scales task pools)
- ~6–10 visible slots at once. when a contract is pulled, a new one flips up to replace it
- only one crew can hold a given contract at a time (pull = claim)
- no time limits on pulled contracts: you've got till event end. no abandonment either
- **deck exhaustion:** if all seeded contracts are pulled/discarded/burned, the system deterministically generates another seeded batch from the same registry + `contentSelections` (using an incremented seed). the board never runs empty: new events could theoretically play forever if teams keep pulling. discouraged in practice by event length cap, but avoids a degenerate "empty board" edge case

---

## the black market

### rules of the game (locked in)

- **all sabotage is public.** we want drama. victims see who attacked them, everyone sees it in the feed, discord embed posts it. rivalries are a feature
- **refs only touch submissions.** no black market action can create ref work outside of the normal submission flow. anything requiring ref intervention gets nixed or reworked to be system-driven
- **no rubber-banding.** losing crews don't get discounts or bonus cut. emergent chaos does the work
- **one active contract per crew.** you can only hold one contract at a time. pull it, work it, complete it, then pull your next one
- **per-contract action budget.** each contract you pull grants your crew **1 offensive-or-territorial** action + **1 defensive-or-empowerment** action. **usable only while that contract is active**: once it completes and you pull a new one, the old budget's gone and a fresh one appears. no stockpiling
- **dogpile cap.** heat: max 1 active heat per contract. shakedown: **max 1 shakedown per contract for its entire lifetime** (not just the race: once shakedown'd, contract can't be shakedown'd again even after resolution). any rival crew can still target the leader, but pile-ons are bounded
- **attack validity gate.** heat and shakedown cannot target a contract whose current final step is already submitted or has a pending completion claim. prevents attacks against contracts that are effectively finished
- **cut is split into two numbers:** `cutEarned` (leaderboard score, only ever increases) and `cutBalance` (spendable at the market). buying market actions drains `cutBalance` only. this way spending mechanics doesn't punish your score

---

### offensive (target a rival crew or contract)

| action            | effect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | notes                                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **heat**          | target a rival's active contract. appends **one short-quantity bonus step**: random registry pick, difficulty-matched to the contract, not already present. victim has to clear it before the contract completes. victim sees who bought it. **cap: max 1 active heat per contract**                                                                                                                                                                                                                                                                                                                                                                                                                           | short-quantity keeps the impact predictable at a fixed price. ref reviews it like any normal submission: zero extra ref burden                                                                                                  |
| **shakedown**     | declare a shakedown on a rival w/ an active contract. system spawns a **shakedown job** for your crew: a **single short task** from the skulduggery task pool, difficulty-matched to the victim's contract. race: if you complete it before the victim finishes their contract, you skim **25%** of their contract payout into both your `cutEarned` and `cutBalance` (they keep the remaining **75%** into both of theirs). if they finish first, shakedown fails and you eat the market fee. **caps: 1 shakedown per contract for its entire lifetime (not just its race)** + **max 1 unresolved shakedown per attacker**. once a contract has been shakedown'd, no other crew can shakedown it: win or lose | race resolution uses **authoritative submission timestamp** subject to eventual approval: not ref approval order. lifetime cap prevents kingpin from accumulating multiple 25% claims. see tech section for full race semantics |
| **rat out**       | cancel a rival's active stakeout OR insurance (target one specific buff). **cannot bypass alibi**: if the target has alibi banked, alibi absorbs the rat out and fizzles it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | counter-play to defensive buys. keeps the meta honest                                                                                                                                                                           |
| **~~frame job~~** | _(cut: required ref re-approval, violates the ref-burden rule)_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                                                                                                                                                 |

### territorial (affect the job board itself)

| action              | effect                                                                                                                                                                                    | notes                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **stakeout**        | lock a specific contract on the board for N minutes so nobody can pull it. price scales by tier: heist = cheap, vault = mid, kingpin = expensive. **cap: 1 concurrent stakeout per crew** | keeps stakeouts scarce enough to feel like a real move but not so scarce nobody uses 'em        |
| **tip-off**         | reveal the next 3 contracts about to flip up on the board: **your view only.** other crews still see the current slots                                                                    | private info edge. combos well w/ bribe the fixer (dump a bad current slot, know what's coming) |
| **bribe the fixer** | discard a contract from the board, force a new draw                                                                                                                                       | removes a bad-for-you contract or a juicy-for-rivals one                                        |

### defensive (protect yourself)

| action            | effect                                                                                                                                                                                                              | notes                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **insurance**     | protect one active contract from heat for a window                                                                                                                                                                  | basic shield          |
| **alibi**         | preemptive: next offensive action targeting you fizzles. expensive, **one use per event**. **attacker still pays their fee + still spends their action slot when alibi fizzles them**: otherwise alibi is worthless | one-shot panic button |
| **~~safehouse~~** | _(cut: shakedown never touches the ledger, so there's nothing to defend against. no purpose anymore)_                                                                                                               |                       |

### escape hatch (not part of the action budget)

| action            | effect                                                                                                                                                                                                                                                                  | notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **burn contract** | forfeit your active contract. no payout. step submissions preserved as read-only audit history. action-budget slots forfeit. **cost = `min(cutBalance, basePayout)`**: always affordable. **one burn per crew per event.** deducted from `cutBalance` only. no cooldown | escape hatch, not a strategy. single-use per event prevents zero-balance churn (pull-burn-pull-burn to exhaust the deck). **burn + shakedown:** burn voids the contract payout entirely: no skim is created regardless of race state. attacker's shakedown fee is refunded to their `cutBalance` (never `cutEarned`). the attempted shakedown is preserved in audit + feed. no leaderboard points ever created from a burned contract. closes the collusion vector where two crews could farm 25% skims out of unpaid contracts |

### economic (self-empowerment: all expensive)

| action             | effect                                                                                                                                             | notes                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **reputation**     | unlock kingpin-tier contracts for your crew                                                                                                        | investment gate. big spend                                                                                                                   |
| **getaway driver** | reduce the **next unlocked step of your active contract**'s requirement by X%                                                                      | expensive one-shot. keeps refs out of it: the reduced target just becomes the new `metricTarget` and normal submission flow handles the rest |
| **inside man**     | auto-complete one step of your active contract. **system marks it done, no submission needed, no ref involved.** very expensive, one use per event | reworked to be pure system action so it doesn't create ref work                                                                              |

---

## decisions locked in

- **win condition:** highest `cutEarned` at end of event window (score is separate from `cutBalance`, so spending never hurts your leaderboard). summary/achievements screen tracks honorable mentions (most kingpins, most sabotage bought, biggest heist, most-attacked crew, cleanest crew, etc)
- **event-end settlement:** at `endDate`, event enters `SETTLING`. new progress, submissions, pulls, and market purchases are frozen. **submissions timestamped before `endDate` remain eligible for review**: they don't lose merely because refs approve them after the deadline. shakedown races and contract payouts resolve based on those eligible pending submissions. once all are adjudicated (approved, rejected, or timed-out per admin rules), event flips to `COMPLETE` and the final leaderboard locks. this way a crew's final legitimate submission still pays out, and no race is decided by ref speed relative to the clock
- **sabotage transparency:** fully public. drama is the point
- **ref burden:** refs only review submissions. any black market action that would create out-of-band ref work is nixed or reworked
- **rubber-banding:** none
- **event length + tuning:** follow gielinor rush's pattern: length + difficulty tune how much content spawns (deck size, refresh cadence, market prices probably)
- **contract abandonment:** not allowed. pull = commitment

---

## market pricing (first pass)

prices anchored to a **heist-easy payout** (call it `H`) so everything self-scales when we tune the base later. rough payout ladder for reference:

| length \ difficulty | easy | intermediate | hard |
| ------------------- | ---- | ------------ | ---- |
| heist               | 1H   | 1.5H         | 2.5H |
| vault               | 2H   | 3H           | 5H   |
| kingpin             | 4H   | 6H           | 10H  |

so a kingpin-hard payout is ~10× a heist-easy. keeps the top-tier feeling worth the risk + gate.

**action prices:**

| action                      | price | reasoning                                                             |
| --------------------------- | ----- | --------------------------------------------------------------------- |
| rat out                     | 1H    | cheap counter-play: keeps defensive buys honest, must stay accessible |
| stakeout (heist)            | 1H    | denial-lite                                                           |
| heat                        | 1.5H  | mid-priced flagship offensive                                         |
| tip-off                     | 1.5H  | info play                                                             |
| stakeout (vault)            | 2H    | mid denial                                                            |
| bribe the fixer             | 2H    | board reshuffle                                                       |
| shakedown                   | 2H    | mid: you're gambling on winning a race                                |
| insurance                   | 1.5H  | defensive baseline                                                    |
| getaway driver              | 3H    | one-shot empowerment                                                  |
| stakeout (kingpin)          | 4H    | scarce, powerful denial                                               |
| alibi                       | 5H    | one-shot per event, panic button                                      |
| reputation (kingpin unlock) | 8H    | big permanent investment                                              |
| inside man                  | 10H   | one-shot per event, skip a whole step                                 |

**note on reputation:** buying reputation consumes your active contract's defensive/empowerment slot, and it's a permanent unlock: pay once, kingpins are visible for you the rest of the event.

**note on burn contract:** cost = `min(cutBalance, basePayout)`. **one use per crew per event** (single-use is the exploit fix: prevents zero-balance deck-churning and closes shakedown-collusion). does NOT count against your action budget. deducted from `cutBalance` only.

**note on divisibility:** prices like 1.5H aren't integer-safe if `H` is odd. **require `H` to be a multiple of 10**: simpler than fixed-point storage, keeps all math clean, easy to reason about at any tuning step. any price w/ a decimal (1.5H, 2.5H) is well-defined at any multiple of 10.

we'll tune the actual `H` value based on event length + how fast crews earn cut in playtesting.

---

## flavor & discord copy: the criminal contract ring

vibe: **1930s prohibition gangster meets modern heist crew.** every event message should sound like it's coming from a shadowy fixer, an anonymous tipster, or a headline in the underworld paper.

**tonal touchstones:**

- crews are always "**the [crew name]**" ("the ironclads pulled the barrows job")
- contracts are "**jobs**" or "**scores**" in copy even though the data model calls them contracts
- payouts are "**scores**", "**takes**", or "**loot**"
- market purchases are "**arrangements**", "**tips**", "**favors**"
- refs are "**the fixer**" when addressed in-narrative

**example copy shapes:**

- pull: _"the ironclads have taken the barrows job. word on the street: 3 steps, sizeable score."_
- completion: _"the ironclads walked away clean w/ 500 cut."_
- heat bought: _"someone's been asking questions about the ironclads' current job. bad luck: one extra loose end to tie up. paid for by: the crimson hand."_
- shakedown declared: _"the crimson hand's calling in a debt on the ironclads. race is on."_
- stakeout: _"the fixer's holding the temple job off the streets. off-limits for now, courtesy of the ironclads."_
- reputation unlock: _"the ironclads bought their way into the big leagues. kingpin jobs now on their radar."_
- inside man: _"the ironclads had a guy on the inside. one less loose end."_

**not doing now**: real copy generator, embed formatting, illustration pass. this section just sets the vibe target so we don't accidentally write boring event log lines.

---

# technical design

everything below is architecture / wiring / data model: the "how we actually build it" half of the doc. still first-pass, meant to be iterated on.

## graphql schema (sketch)

types are additive to what the platform already has (event/team/submission live in the base). skulduggery-specific stuff:

```graphql
enum EventStatus {
  SETUP
  ACTIVE
  SETTLING
  COMPLETE
}
# ACTIVE → SETTLING at endDate: new progress/submissions/pulls/purchases stop.
# SETTLING → COMPLETE once all pre-endDate submissions are adjudicated and races/contracts resolve.

enum ContractLength {
  HEIST
  VAULT
  KINGPIN
}
enum ContractDifficulty {
  EASY
  INTERMEDIATE
  HARD
}
enum ContractStatus {
  ON_BOARD
  ACTIVE
  COMPLETED
  DISCARDED
  BURNED
}
# note: stakeout is modeled as a *lock* on an ON_BOARD contract, not a separate status.
# DISCARDED = removed by bribe-the-fixer; BURNED = escape-hatch abandoned by holder.
enum StepStatus {
  LOCKED
  UNLOCKED
  SUBMITTED
  COMPLETE
}
enum ActionCategory {
  OFFENSIVE
  TERRITORIAL
  DEFENSIVE
  EMPOWERMENT
  ESCAPE_HATCH
}
enum ActionType {
  HEAT
  SHAKEDOWN
  RAT_OUT
  STAKEOUT
  TIP_OFF
  BRIBE_FIXER
  INSURANCE
  ALIBI
  REPUTATION
  GETAWAY_DRIVER
  INSIDE_MAN
  BURN_CONTRACT
}
enum ShakedownStatus {
  RACING
  ATTACKER_WON
  VICTIM_WON
  VOIDED_BY_BURN
}

type SkulduggeryEvent {
  id: ID!
  name: String!
  status: EventStatus! # SETUP | ACTIVE | COMPLETE (platform-standard)
  startDate: DateTime
  endDate: DateTime
  hValue: Int! # the base heist-easy payout: the anchor for all pricing
  contentSelections: JSON # admin curation, same shape as other events
  crews: [Crew!]!
  jobBoard: [Contract!]! # currently visible contracts
  feed: [EventFeedItem!]! # public activity log
  adminIds: [ID!]!
  refIds: [ID!]!
}

type Crew {
  id: ID!
  name: String!
  members: [User!]!
  cutEarned: Int! # leaderboard score: only ever goes up
  cutBalance: Int! # spendable at the market
  cutSpent: Int! # audit total (cutEarned - cutBalance + refunds = cutSpent, up to voids)
  activeContract: Contract # null between contracts
  completedContracts: [Contract!]!
  kingpinUnlocked: Boolean! # true once reputation bought
  activeBuffs: [ActiveBuff!]! # insurance, alibi banked, etc
  incomingAttacks: [MarketPurchase!]! # heat/shakedown targeting us
  contractsCompletedCount: Int! # for kingpin visibility gate
  usedOneShots: [ActionType!]! # tracks alibi + inside man + burn contract usage per event
  unresolvedShakedownsAsAttacker: Int! # for the 1-per-attacker cap
}

type Contract {
  id: ID!
  name: String!
  length: ContractLength!
  difficulty: ContractDifficulty!
  basePayout: Int! # already resolved: lengthBase × difficultyMult × H
  status: ContractStatus!
  holderCrew: Crew # null if on board
  steps: [ContractStep!]!
  actionBudget: ActionBudget # only populated when ACTIVE
  stakeoutLock: StakeoutLock # non-null if currently locked by a stakeout (contract stays ON_BOARD)
  activeHeat: MarketPurchase # at most 1 (dogpile cap); null if no heat currently applied
  lifetimeShakedown: Shakedown # at most 1 for the contract's ENTIRE lifetime; stays attached after resolution until contract pays or burns. null if never shakedown'd
  finalStepSubmitted: Boolean! # DERIVED: true iff current final step has a non-rejected pending submission. computed on read from step.submissions, not stored: no mutable state to reset after a rejection. resolver derives it fresh from submissions
  isKingpinVisibleTo(crewId: ID!): Boolean! # crew-scoped filter: kingpins only visible to crews w/ 3+ completed
}

type ContractStep {
  id: ID!
  order: Int!
  contentId: String! # registry id
  role: String # scout | muscle | fence
  phase: String # case | steal | launder
  metricType: String!
  metricTarget: Int!
  status: StepStatus!
  submissions: [Submission!]! # reuses platform Submission type
  isBonusStep: Boolean! # true if inserted by HEAT
  insertedBy: Crew # which crew bought the heat, if bonus
}

type ActionBudget {
  offensiveTerritorialUsed: Boolean!
  defensiveEmpowermentUsed: Boolean!
}

type StakeoutLock {
  id: ID! # rat out targets a specific lock via this id
  lockedBy: Crew!
  expiresAt: DateTime!
}

type ActiveBuff {
  id: ID!
  type: ActionType! # INSURANCE, ALIBI, etc
  appliedAt: DateTime!
  expiresAt: DateTime # null = permanent for this contract or event
  chargesRemaining: Int # i.e. alibi has 1
}

type MarketPurchase {
  id: ID!
  buyerCrew: Crew!
  actionType: ActionType!
  category: ActionCategory!
  price: Int! # in cut
  targetCrew: Crew # for offensive
  targetContract: Contract # for heat / shakedown / stakeout
  createdAt: DateTime!
  resolvedAt: DateTime # for shakedown races
}

type Shakedown {
  id: ID!
  attacker: Crew!
  victim: Crew!
  victimContract: Contract!
  attackerJob: ShakedownJob!
  status: ShakedownStatus!
  startedAt: DateTime!
  resolvedAt: DateTime
  payoutSkim: Int # 25% of victim contract payout, rounded down. resolved when race resolves; paid when victim contract completes
  raceWinTimestamp: DateTime # authoritative timestamp of whichever completion won the race (submission time, not approval time)
}

type ShakedownJob {
  id: ID!
  task: SkulduggeryTask!
  status: StepStatus!
  submissions: [Submission!]! # reuses Submission: refs approve like any other; race uses submission timestamp, not approval timestamp
  attackerBaseline: Int! # wom metric snapshot at Shakedown.startedAt: completion measured from here, not from zero-total
}

type SkulduggeryTask {
  id: ID!
  displayName: String!
  difficulty: ContractDifficulty!
  metricType: String!
  metricTarget: Int!
  womKey: String
}

type EventFeedItem {
  id: ID!
  timestamp: DateTime!
  kind: String! # PULL, COMPLETE, HEAT, SHAKEDOWN_DECLARED, ...
  actorCrew: Crew
  targetCrew: Crew
  contract: Contract
  copy: String! # pre-rendered narrative line
}
```

## queries / mutations / subscriptions

```graphql
type Query {
  skulduggeryEvent(id: ID!): SkulduggeryEvent
  jobBoard(eventId: ID!): [Contract!]!
  crew(id: ID!): Crew
  marketCatalog(eventId: ID!, crewId: ID!): [MarketActionListing!]! # prices + affordability + slot availability, per crew
  crewFeed(crewId: ID!, limit: Int): [EventFeedItem!]! # crew-scoped filter
  eventFeed(eventId: ID!, limit: Int): [EventFeedItem!]! # public drama feed
}

type Mutation {
  # progression: acting crew is ALWAYS derived from authenticated user + event membership.
  # NEVER accept a client-supplied crewId for authorization decisions.
  pullContract(contractId: ID!): Contract
  submitStep(stepId: ID!, submissionUrl: String!): Submission
  reviewSubmission(submissionId: ID!, decision: ReviewDecision!): Submission
  markStepComplete(submissionId: ID!): ContractStep # ref-only, same as other events
  # black market: actor derived from auth. input carries only target info.
  buyMarketAction(input: BuyMarketActionInput!): MarketPurchase
  # input fields vary by action type:
  #   - HEAT/SHAKEDOWN: targetContractId
  #   - RAT_OUT: targetStakeoutLockId OR targetBuffId
  #   - STAKEOUT/BRIBE_FIXER: targetContractId
  #   - GETAWAY_DRIVER/INSIDE_MAN/INSURANCE/ALIBI/REPUTATION/BURN_CONTRACT: no target
  #   - TIP_OFF: no target

  # admin: admin identity derived from auth + event.adminIds membership check
  createSkulduggeryEvent(input: CreateEventInput!): SkulduggeryEvent
  advanceEventStatus(eventId: ID!, status: EventStatus!): SkulduggeryEvent
  tuneHValue(eventId: ID!, hValue: Int!): SkulduggeryEvent # must be multiple of 10
}

type Subscription {
  jobBoardUpdated(eventId: ID!): JobBoardUpdate # slot flip, contract pulled, stakeout applied
  contractUpdated(contractId: ID!): Contract # step progress, submissions
  crewLedgerUpdated(crewId: ID!): Crew # cut changes
  marketActionApplied(eventId: ID!): MarketPurchase # public drama pipe
  shakedownRaceUpdated(shakedownId: ID!): Shakedown # tick during a race
  eventFeedAppended(eventId: ID!): EventFeedItem # firehose for tickers
}
```

## live subscriptions strategy

**general approach:** reuse the platform's existing pubsub topics + add skulduggery-specific ones. keep subscriptions **coarse-grained** (event-level firehoses) for public drama, **fine-grained** (contract-level) for per-crew hot paths.

**topics:**

| topic                                       | pushes                                                                      | who subscribes                                   |
| ------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| `SKULDUGGERY_JOB_BOARD_UPDATED`             | new contract flipped up, contract pulled, contract stakedown, board refresh | everyone viewing the board                       |
| `SKULDUGGERY_CONTRACT_UPDATED:<contractId>` | step submission, ref decision, step complete, bonus step inserted           | holder crew + refs + spectators of that contract |
| `SKULDUGGERY_CREW_LEDGER:<crewId>`          | ledger delta (payout, purchase, shakedown skim)                             | that crew's members                              |
| `SKULDUGGERY_MARKET_APPLIED:<eventId>`      | any market purchase event-wide                                              | everyone (drama pipe)                            |
| `SKULDUGGERY_SHAKEDOWN_TICK:<shakedownId>`  | either party makes progress on their side                                   | attacker + victim + spectators                   |
| `SKULDUGGERY_EVENT_FEED:<eventId>`          | any new feed item (superset of everything else, rendered as copy)           | ticker/log ui                                    |

**why event feed _and_ granular topics:** granular topics drive ui state (progress bars, ledger numbers). the event feed is the human-readable timeline. clients can subscribe to whichever's cheapest for what they're showing.

**mutation-side pattern:** every mutation that mutates game state publishes to (a) the relevant granular topic, and (b) creates an EventFeedItem which fires `SKULDUGGERY_EVENT_FEED`. one write, two pipes.

## submissionsprovider wiring

**model:** treat each `ContractStep` as a tile in `SubmissionsProvider` terms. state machine matches exactly: `LOCKED → UNLOCKED → SUBMITTED → COMPLETE`. no changes to the provider itself.

**chain unlocking:** when step N flips to `COMPLETE`, step N+1 auto-transitions `LOCKED → UNLOCKED`. this is the same pattern rainbow's dependency graph uses, just constrained to a linear chain.

**heat bonus step insertion:**

- when HEAT is purchased, the system picks a random registry entry (same difficulty as the contract, not already present) and **appends it as the new final step of the contract, always at short-quantity** regardless of the contract's length
- so if victim is already on their last step, they now have one more to do before payout: but it's a _short_ task, so the delay is predictable and fixed-price defensible
- new step is marked `isBonusStep: true`, `insertedBy: <buyerCrew>` so ui can flag it visually
- normal state machine takes over: victim submits it, ref approves it, then chain continues
- refs see it in the same review queue as any other submission. zero new ref surface
- **atomicity:** heat purchase and contract's final-step completion must be resolved atomically to avoid a race where heat succeeds while the last step is being paid out. server transaction wraps the "insert step + check contract not already complete" check
- **dogpile cap enforced at purchase:** if contract already has an `activeHeat`, buy attempt returns error

**inside man auto-complete:**

- **restricted to the currently `UNLOCKED` step with no pending submission.** cannot bypass or orphan a step that's already in review: that would create ref confusion and risk voiding legitimate work
- system directly transitions the chosen step from `UNLOCKED → COMPLETE`
- publishes `CONTRACT_UPDATED` + feed item
- no ref involvement, no submission record: an audit log entry captures "auto-completed via inside man purchase by <crew>"

**getaway driver:**

- targets the **next unlocked step of your active contract** (not "your next contract": that was a doc drift; the active-contract version is more useful and doesn't delay gratification)
- system mutates the target step's `metricTarget` to `original × (1 - reduction%)`, floored, before submission
- from ref's POV the target is just smaller. no special handling
- flagged on the step ui so everyone knows why the number's weird

**shakedown submissions + race semantics:**

- `ShakedownJob` has its own `submissions` list but they flow through the same `Submission` type + review controls
- refs see shakedown submissions in a separate tab/section w/ a "SHAKEDOWN: race active" badge
- **baseline capture:** at shakedown purchase time, the system snapshots the attacker's current wom metric baseline (kc/xp/etc) for the shakedown task. **race completion timestamps must be at or after `Shakedown.startedAt`**: pre-existing wom progress cannot qualify. attacker starts from zero on the task
- **race winner is determined by authoritative completion timestamp: NOT ref approval order.** ref latency is not part of the game:
  - **wom-verified completions** use the wom-reported timestamp (source of truth for auto-synced metrics), floored to `Shakedown.startedAt`
  - **manually-refereed completions** use the _submission timestamp_, subject to eventual approval, must be `>= Shakedown.startedAt`
  - if the earlier submission is later rejected, the next valid completion wins (race stays open until an approved submission wins)
- when either side's completion is resolved as valid, if this shakedown's `raceWinTimestamp` gets set → race is decided
- **caps enforced at purchase:** `lifetimeShakedown != null` on the contract → error (even if the shakedown already resolved). `attacker.unresolvedShakedownsAsAttacker >= 1` → error
- **edge case rules:**
  - attacker completing their _own_ separate active contract does NOT cancel the shakedown job: it persists until the victim's contract resolves
  - heat appending a step to the victim's contract _after_ shakedown starts does NOT reset the race: race end = victim's contract's _current_ final step completing, whatever step count it's at
  - 25% skim rounded down; if victim payout < 4, skim = 0 but shakedown still counts as "won" (feed still fires, honorable mentions still credit it)

**ref ui reuse:** the tileReviewControls + PENDING/APPROVED flow is unchanged in spirit. some new surface _is_ required though: race-active badges on shakedown submissions, heat/bonus-step flags on inserted steps, and shakedown grouping in the queue. so "no changes to the review flow itself" is accurate, but "no new ref-side ui" would be an overclaim: figure a small amount of adjacent surface.

## per-crew dashboard

what a crew sees when they open the event:

**hero section: active contract**

- contract name + length/difficulty badges
- step chain visual (5 dots for kingpin, w/ current step highlighted)
- current step: content, metric target, submission form + pre-screenshot slot
- payout preview: "estimated take: 500 cut (minus 125 if shakedown wins)"
- action budget indicator: `⚔️ 1 offensive/territorial available • 🛡️ 1 defensive/empowerment available`
- incoming attack badges: `⚠️ HEAT (bonus step added by the crimson hand)` / `⚠️ SHAKEDOWN in progress from the crimson hand`

**ledger + status**

- **two numbers**: `cutEarned` (leaderboard score: the big animated number) and `cutBalance` (spendable: subtler, next to it). `cutSpent` shown in a smaller stat block for transparency
- kingpin unlock status (`🔒 locked (complete 3 contracts to see them)` / `👁️ visible, unlock for 8H` / `✅ unlocked`)
- active buffs (insurance active: countdown from 6h, alibi banked, etc)
- one-shots remaining (alibi 1/1, inside man 1/1, burn contract available/used-on-current)
- if you've got an unresolved shakedown as attacker, badge that + block re-buying

**job board slice**

- 6–10 currently visible contract cards
- **kingpin cards are crew-filtered:** two-stage messaging matches the two gates:
  - crews w/ < 3 completed → **redacted "???" placeholder** w/ "complete 3 jobs to reveal" callout
  - crews w/ 3+ completed but haven't bought reputation → full details visible w/ "reputation required to pull" callout
  - crews w/ reputation → full details + pull button enabled
  - cards always occupy real slots; visibility is per-viewer render only
- **board density guarantee:** at least half of visible slots always non-kingpin, so newer crews never see a mostly-hidden board
- tip-off preview strip if bought (shows next 3 flipping up, crew-private)
- pull button per card (disabled if you're mid-contract, slot is staked out, or you haven't bought reputation for kingpins)
- staked-out cards show who staked + countdown

**market panel** (collapsible)

- catalog of all actions w/ prices in cut + affordability
- category-grouped (offensive/territorial vs defensive/empowerment)
- greyed if slot already used or if you can't afford
- target picker appears inline for offensive actions

**event feed** (side rail or bottom drawer)

- last N events in criminal-ring copy
- filter: my crew only / all drama / a specific rival

**stats/summary** (small persistent widget)

- contracts completed
- kingpins pulled
- market spend to date
- times attacked
- honorable-mentions running tally (for end-of-event screen)

**ref view diff:** refs see all of the above but also get a "review queue" panel: the tileReviewControls surface, same as they use for every other event, filtered to this event's pending submissions. no new ref ui besides shakedown grouping + heat/bonus-step flag. **queue filtering + sorting reuses battleship's ref queue pattern**: that one's already dialed in for high-volume events, so we get filter chips, sort, and search for free by cloning that component.

## black market: purchase & sales flow

**buy flow, server-side:**

1. client calls `buyMarketAction(input)`: includes actionType + conditional target fields. **acting crew is derived from authenticated user + event membership, NEVER from client input.** never trust a client-supplied crewId for authorization
2. server validates:
   - crew has an active contract (required for all actions EXCEPT reputation, which may be bought between contracts)
   - the action's category slot is unused for that contract (except BURN_CONTRACT + reputation-between-contracts)
   - one-shots (alibi, inside man, **burn contract**): crew hasn't used it this event (`BURN_CONTRACT ∉ usedOneShots`)
   - reputation: crew doesn't already have it
   - crew has enough `cutBalance` (never `cutEarned`)
   - target is valid (has active contract for heat/shakedown, is a real slot for stakeout, target buff/lock actually exists for rat out, etc)
   - **dogpile caps:** heat → target contract has no `activeHeat`. shakedown → target contract has no `lifetimeShakedown` (whether racing or already-resolved) AND buyer has no `unresolvedShakedownsAsAttacker`
   - **attack validity gate:** heat + shakedown → target contract's `finalStepSubmitted == false`
   - target isn't shielded (insurance active blocks heat; alibi absorbs the next offensive: but attacker still pays)
   - inside man → target contract has an UNLOCKED step with no pending submission
   - burn contract → crew has an active contract; hasn't already burned this event; cost is `min(cutBalance, basePayout)` so crew always affords it
3. server mutates:
   - decrement `cutBalance` by price, increment `cutSpent` by price (never touch `cutEarned`)
   - mark the appropriate slot as used (skip for BURN_CONTRACT)
   - apply the action (see per-action side effects below)
   - insert `MarketPurchase` record
   - append `EventFeedItem` w/ narrative copy
   - publish to relevant subscription topics
4. return `MarketPurchase` w/ resolution info

**alibi fizzle flow:** when an offensive action targets a crew w/ banked alibi:

- attacker's `cutBalance` is still decremented (payment made)
- attacker's action slot is still consumed
- the action's side effect is _not_ applied to victim
- victim's alibi charge is consumed (removed from `activeBuffs`, `ALIBI` added to `usedOneShots`)
- feed item fires: "the [victim] had an alibi. [attacker]'s move fell flat."

**per-action side effects (server):**

| action          | side effect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| heat            | append new short-quantity bonus step to target contract, set `isBonusStep` + `insertedBy`, set `contract.activeHeat`. **rejected if `contract.finalStepSubmitted == true`**                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| shakedown       | create `Shakedown` record, spawn `ShakedownJob` w/ a random `SkulduggeryTask` (short, difficulty-matched to victim). set `contract.lifetimeShakedown` + increment `attacker.unresolvedShakedownsAsAttacker`. race resolves on whichever completes first (see race semantics section). skim = floor(0.25 × victim.basePayout) split into both `cutEarned` and `cutBalance` for both crews. **rejected if `contract.finalStepSubmitted == true` OR `contract.lifetimeShakedown != null`**                                                                                                                                                               |
| rat out         | cancel target buff: either a specific `StakeoutLock` (by `id`) or a specific `ActiveBuff` (by `id`). if stakeout: clear `contract.stakeoutLock` + decrement locker crew's stakeout cap. if insurance: remove from `activeBuffs`. does nothing to alibi (alibi absorbs)                                                                                                                                                                                                                                                                                                                                                                                |
| stakeout        | set target contract's `stakeoutLock = { id, lockedBy, expiresAt }`. contract stays `ON_BOARD`. register against crew's stakeout cap (max 1 concurrent)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| tip-off         | return next 3 pending board contracts, store as crew-private preview until they flip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| bribe the fixer | set target contract status to `DISCARDED`, trigger new draw                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| insurance       | add ActiveBuff to crew's active contract, blocks any heat purchase targeting it for **6 hours** from purchase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| alibi           | add ActiveBuff w/ 1 charge, flags oneShotsUsed. triggered by next offensive action targeting crew (see alibi fizzle flow)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| reputation      | set `crew.kingpinUnlocked = true`. **buyable between contracts**: if bought during an active contract, consumes that contract's def/emp slot. if bought between contracts, tags the next-pulled contract's `actionBudget.defensiveEmpowermentUsed = true` on pull                                                                                                                                                                                                                                                                                                                                                                                     |
| getaway driver  | mutate next-unlocked step's metricTarget on active contract, floored                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| inside man      | auto-complete the currently UNLOCKED step (rejected if no UNLOCKED step or if UNLOCKED step already has pending submission), flag oneShotsUsed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| burn contract   | set active contract status to `BURNED`, forfeit all step progress (submissions preserved as read-only audit), forfeit action budget slots, decrement `cutBalance` by `min(cutBalance, basePayout)`, clear `crew.activeContract`, flag `crew.burnUsed = true` (one per event). **burn voids all payout entirely: no shakedown skim is ever created.** if `lifetimeShakedown` exists (racing or won): mark shakedown as `VOIDED_BY_BURN`, **refund attacker's shakedown fee to their `cutBalance`** (never `cutEarned`), decrement `attacker.unresolvedShakedownsAsAttacker`, preserve the attempt in audit + feed. crew can immediately pull a new one |

**ledger + audit:** every ledger delta writes an audit row (buyer, amount, reason). every MarketPurchase persists forever. we can reconstruct the whole event history for the summary screen + achievements.

**shakedown race resolution:**

- race winner determined by **authoritative completion timestamp** (submission time subject to eventual approval: see race semantics in the submissionsprovider section). ref latency is not part of the race
- if attacker's shakedown job resolves first → set `ShakedownStatus = ATTACKER_WON`. when victim eventually completes their contract, split payout 25/75 into **both `cutEarned` and `cutBalance`** for both crews. **decrement `attacker.unresolvedShakedownsAsAttacker`** at race resolve (not payout)
- if victim's contract resolves first → set `VICTIM_WON`, victim gets full payout (both cutEarned + cutBalance), attacker eats the fee (already deducted at purchase). **decrement `attacker.unresolvedShakedownsAsAttacker`**
- **explicit rule: decrement runs on both outcomes.** attacker never has more than 1 unresolved race in flight at once
- feed item + notification either way. **`contract.lifetimeShakedown` remains attached**: even after resolution, no other crew can shakedown this contract. only cleared when contract pays or burns
- **no explicit deadline**: races run until one side wins. edge case: if the event ends w/ a shakedown unresolved, attacker eats the fee. no auto-refund, no partial payout
- **burn interaction:** if victim burns their contract, shakedown status becomes `VOIDED_BY_BURN`. **no skim is ever awarded** (burn voids all payout, no leaderboard points from unpaid contracts). attacker's shakedown fee is refunded to `cutBalance` (never `cutEarned`). `unresolvedShakedownsAsAttacker` decremented. attempted shakedown preserved in audit + feed. closes the collusion vector where a shakedowner + victim could farm free skim from burned contracts

**concurrency:** everything that touches shared state (pull contract, stakeout, bribe fixer draw, heat insertion vs final-step-complete) uses atomic updates. two crews click "pull" on the same contract simultaneously → whoever hits the db first wins, the other gets a "just taken" toast. heat purchased against a contract that's completing its final step at the same instant → transaction wraps both operations; whichever commits first wins (heat wins → new step appended, contract not yet complete; final step wins → contract complete, heat purchase returns "target no longer valid" + refund).

## other things worth calling out

- **admin panel**: needs setup form (name, dates, refIds, adminIds, `hValue`, contentSelections filter, kingpin-gate contract threshold, event length preset), status advance buttons (SETUP → ACTIVE → COMPLETE), and a "force refresh board" panic button
- **discord integration**: event feed → announcements channel via existing embed pipeline. key moments (contract completion, shakedown resolution, kingpin unlock) get @crew role mentions. reuse the existing discord util
- **wom sync**: per contract step, exactly like other events. no new sync logic. shakedown jobs also wom-sync
- **end-of-event summary screen**: computed from the audit + MarketPurchase log. honorable mentions: most kingpins, biggest single score, most cut spent on sabotage, most-attacked crew, cleanest crew (fewest attacks bought), etc
- **conflict / dispute handling**: refs can void a MarketPurchase in edge cases (server bug, targeting error). audit row captures the void. no automatic refunds: admin call
- **what we're _not_ building v1**: no ai copy generator (hand-write flavor templates), no illustrations, no team-color theming, no mobile-first ui pass (desktop-first, mobile later), no achievements medal ui (just a text list on summary screen)

---

## visual design: neo-noir comic

**core metaphor:** the whole event is a **noir heist comic** you're playing through. every page is a job, every panel is a beat, every caption is a hard-boiled narrator making your crew sound like legends (or fools).

**tonal touchstones:** sin city, 100 bullets, criminal (ed brubaker), the pulp-inked underworld of frank miller. high contrast, heavy inks, halftone shadows, snap-punch panel layouts.

### palette

- **ink black**: everything foundational: borders, text, panel outlines
- **paper white**: backgrounds, negative space
- **one accent: gold**: cut/scores/success. money = gold. only splash of color for baseline states
- **danger red**: reserved _only_ for offensive/attack states (heat applied, shakedown incoming, alibi triggered). used sparingly so it hits when it appears
- everything else: greyscale halftone shading for depth

### typography

- **display font:** heavy condensed comic style: bebas neue, alfa slab one, or a hand-lettered comic-book face. all-caps for headlines and callouts
- **body font:** typewriter monospace (special elite, courier prime): feels like a case file, plays nice w/ noir
- **captions:** italicized serif in a yellowed narrator box, positioned like a comic caption at the top corner of a panel

### key ui: comic language without custom art

**important:** we don't have (and won't build) bespoke illustrations for individual contracts, steps, crews, or registry entries. the comic vibe comes from **layout, borders, typography, halftone fills, and stamp effects**: all achievable in css/svg with a small set of generic reusable assets. no per-content art expected.

- **contract card = a comic-page LAYOUT.** thick black borders, panel gutters, step chain rendered as a strip of framed cells. each cell shows the step's registry-content name (text), metric target, and status. no illustration: the frame + typography + halftone bg does the work. completed cells get a "STAMP" overlay (svg text rotated + slammed in)
- **crew dashboard = a splash-page LAYOUT.** crew name in huge display type, member names as a typography stack, ledger + stats in inked stat blocks. no character art: silhouetted avatar placeholders or crew-color monogram badges
- **job board = a corkboard / classifieds grid.** contracts are typography-heavy "poster" cards: big display title, metric summary, payout amount, length + difficulty badges. taken contracts get a red "TAKEN" diagonal stamp; staked-out ones get a "HELD" stamp
- **market panel = a menu-style list w/ noir framing.** actions grouped by category, each an inked row w/ price + effect. one small hero silhouette (a fedora'd fence) as a decorative anchor: that's a **generic asset**, not per-action art
- **event feed = a stacked-panel comic strip.** each entry is a bordered mini-panel w/ a narrator caption in an italic serif yellow box + crew/action in display type. dramatic ones get bigger panels + effect lettering ("HEAT!", "RACE!"): pure typography w/ transforms
- **shakedown race = split-screen w/ two progress panels.** ink-fill progress bars styled like gutter dividers. text-heavy, no character art

### interaction fx (all css/svg: no art needed)

- **completing a step** → svg "STAMP" text slams down at a slight rotation, halftone shockwave, satisfying thunk sfx _(this is the one you specifically liked: keep this vivid)_
- **contract completion** → payout number counts up in big gold display type, coins-scattering svg confetti, gold shimmer wash
- **heat purchased against you** → red splash wipe w/ "HEAT!" callout typography, then a persistent red border tint on your active-contract panel
- **shakedown declared** → split-panel appears w/ a "RACE!" callout in display type
- **kingpin unlock** → full-screen "WELCOME TO THE BIG LEAGUES" splash: pure typography w/ halftone bg, no illustration
- **big score / honorable mention** → auto-generated "front-page" summary card = layout template + typography fill, shareable

### one-off assets we DO want (generic + reusable)

- silhouette of a fedora'd figure for the market anchor
- "STAMP" text lockups: COMPLETE, TAKEN, HELD, HEAT!, RACE!, KINGPIN
- halftone pattern svg tiles (one or two variants)
- coin / dollar-sign glyphs for gold accent moments

### mobile / responsive

panel layouts already stack vertically: mobile-friendly by default. captions become full-width strips, splash moments go full-screen.

### explicitly NOT doing (v1)

- **no bespoke illustrations per contract, step, crew, or registry entry**: we don't have the art pipeline and shouldn't fake it
- no animated ink-drawing effects
- no character portraits
- no per-registry-entry imagery in v1 (osrs content thumbnails could be a nice-to-have later if we already cache them, but not required)
- no real print-halftone rendering: svg/css pattern fills are the target

**inspiration to link (for LAYOUT + TYPOGRAPHY, not illustration expectations):** sin city panel layouts, ed brubaker's _criminal_ covers, 100 bullets issue #1

---

## v1 build slice (recommended)

reviewer flagged (correctly) that "contract schema + black market" undersells the actual work. this is a **long** feature. don't build everything at once. proposed minimum-playable slice:

**must-have for a first playtest:**

- contracts + shared job board (pull, chain unlock, no abandonment)
- cutEarned / cutBalance / cutSpent split
- submission flow via existing SubmissionsProvider (no changes)
- **heat** (offensive flagship)
- **insurance** (its natural counter)
- **shakedown** (the marquee mechanic: races test the timestamp model)
- **reputation** + kingpin-length unlock
- public event feed
- basic per-crew dashboard w/ active-contract + ledger + market panel
- **burn contract** escape hatch (safety net for playtest)

**after playtest signal, add:**

- stakeout + rat out
- tip-off + bribe the fixer
- alibi
- getaway driver + inside man
- honorable-mentions summary screen
- discord embed polish

**why this ordering:** heat + insurance + shakedown + reputation gives us the full economic loop (earn, spend, sabotage, escalate) w/ minimal surface area. the other 6 actions are variations on that loop: worth building only if the base loop is actually fun. build order also front-loads the hardest new subsystem (shakedown race timestamps) so we learn early if that model works.

---

## still open

- **market pricing**: first pass above. real tuning pass after playtest
- **payout calibration**: team-hours + difficulty premium model. calibrate during playtest
- **discord embed formatting**: visual polish once base copy is written
- **font pick**: bebas neue vs alfa slab vs hand-lettered comic face. needs a mockup pass
- **halftone technique**: svg pattern vs pre-baked textures
- **fractional price storage**: locked in: require `H` to be a multiple of 10, no fixed-point storage needed

---

## iteration notes

_decisions + rejected ideas as we go_

**2026-09-06**

- event named **skulduggery**. "heist" retained as the short-length contract name: still fits thematically
- first pass on black market menu
- cut: snitch (boring, name parked), frame job (ref burden), safehouse (obsolete once shakedown stopped touching ledger)
- reworked: shakedown (flat ledger theft → race mechanic w/ 25%/75% contract-payout skim), inside man (ref auto-complete → system auto-complete)
- confirmed: heat, rat out, stakeout, tip-off, bribe the fixer, insurance, alibi, reputation, getaway driver, inside man
- shakedown % locked at 25% (attacker) / 75% (victim)
- **per-contract action budget** locked in: 1 offensive-or-territorial + 1 defensive-or-empowerment per contract pulled. usable only while that contract is active
- **one active contract per crew at a time** locked in
- **length × difficulty matrix** locked in (mirrors gielinor rush split): length drives step count + quantities, difficulty drives content pool + payout multiplier. **action slots are flat 1 + 1 always**: difficulty doesn't grant more slots, just bigger payout
- **shakedown job source:** dedicated **skulduggery task pool** (mirrors champion forge's cfTasks pattern): always a short task, difficulty-matched to victim's contract
- **stakeout cap:** 1 per crew
- **kingpin gating:** visible after 3 completed contracts + must buy reputation to actually pull
- **snitch:** fully removed from the design
- **market pricing first pass:** priced everything in units of `H` (heist-easy payout) so it self-scales when we tune. cheap counters ~1H, mid actions ~2H, one-shots 5–10H
- **flavor direction locked:** 1930s prohibition gangster / modern heist crew vibe. copy touchstones + example event log lines added
- meta locked: public sabotage, no rubber-banding, no abandonment, refs only touch submissions, gielinor-rush-style length tuning
- **technical design first pass:** graphql schema sketched, subscription topics laid out, submissionsprovider wiring plan, per-crew dashboard mapped out, black market buy flow + side effects specified, admin/discord/wom notes captured. see the technical design section
- **heat insertion:** always append to end of contract (dead simple, no branching)
- **insurance window:** 6 hours from purchase
- **shakedown race deadline:** none. runs until one side wins; if event ends unresolved, attacker eats the fee
- **ref queue filtering:** clone battleship's ref queue pattern: high-volume-tested, gets filter/sort/search for free
- **visual direction locked: neo-noir comic.** sin city / brubaker's _criminal_ aesthetic. palette: ink black + paper white + gold accent + danger red (attacks only). typography: heavy comic display + typewriter body + serif caption boxes. comic vibe comes from LAYOUT + BORDERS + TYPOGRAPHY + HALFTONE FILLS + STAMP FX: **no bespoke per-contract/step/crew art in v1.** stamp effect on step completion is the signature interaction moment
- **doc walkthrough pass:** fixed stale references (30m insurance → 6h, race deadline phrasing → no deadline, time-limit-on-pull note removed), added `stakedOutBy: Crew` field to Contract schema for stakeout display + rat-out targeting, clarified registry short/medium/long maps to length not difficulty

**2026-09-06 (review pass after coordinator feedback)**

- **cut split into `cutEarned` / `cutBalance` / `cutSpent`**: spending no longer punishes leaderboard score. shakedown skim splits both `cutEarned` and `cutBalance` for both parties. this was the biggest miss in the first pass
- **shakedown race timestamps:** ref approval order is NOT the race decider. authoritative timestamp is wom-verified time when available, else submission time subject to eventual approval. if earlier submission is rejected, race stays open until an approved one wins
- **shakedown ambiguity rules locked:** 1 active shakedown per contract cap, 1 unresolved shakedown per attacker cap, attacker's own contract completion doesn't cancel shakedown job, heat after shakedown starts doesn't reset race, 25% rounded down (still counts as win even at 0)
- **dogpile cap locked:** max 1 active heat + 1 active shakedown per contract. any rival can still target the leader, but not 5 at once
- **heat scope locked:** always short-quantity, difficulty-matched. keeps impact predictable at a fixed price
- **burn contract escape hatch added:** cost = burned contract's `basePayout`, forfeit all progress, no cooldown, doesn't consume action budget slots. `BURNED` added to ContractStatus enum, `BURN_CONTRACT` action type added w/ its own `ESCAPE_HATCH` category
- **alibi consumption clarified:** attacker still pays + still burns their action slot when fizzled. otherwise alibi is useless
- **rat out clarified:** targets one specific buff (insurance or stakeout), cannot bypass alibi (alibi absorbs)
- **payout calibration:** flagged as playtest-tuning problem, not paper-solvable. formula = estimated team-hours × difficulty/access premium, calibrated during playtest
- **schema cleanups:** ContractStatus loses `STAKED_OUT` (stakeout modeled as a lock property on ON_BOARD contracts); adds `DISCARDED` (bribe-the-fixer) and `BURNED`. kingpin visibility is a crew-scoped filter, not a per-slot property. cut-related Crew fields split. dogpile cap fields added
- **fractional price storage** proposal: internal tenths-of-H, formatted for display. keeps `H` tuning flexible
- **atomicity:** heat vs final-step-complete needs a wrapping transaction to avoid a race where heat succeeds against a contract that's in the middle of paying out
- **v1 build slice** locked in: contracts + board + cut split + heat + insurance + shakedown + reputation/kingpin + feed + burn contract. everything else deferred to post-playtest

**2026-09-06 (second review pass: edge cases)**

- **burn contract affordability fix:** cost now `min(cutBalance, basePayout)`: burn empties your wallet when broke instead of gating hard-locked crews. losing work + payout + slots + full wallet is already severe enough
- **burn + shakedown semantics locked:** unresolved race → attacker wins + 25% of basePayout. already-won → attacker still gets 25% of basePayout on burn. victim never receives anything
- **burn preserves submission history** as read-only audit (not deleted)
- **shakedown cap changed from "1 active" to "1 per contract lifetime":** once a contract has been shakedown'd, no other crew can shakedown it even after resolution. prevents kingpin from accumulating multiple 25% claims. schema field renamed `activeShakedown → lifetimeShakedown` and stays attached through payout/burn
- **unresolvedShakedownsAsAttacker decrement:** explicit rule that it fires on BOTH outcomes (win and loss), not just loss
- **attack validity gate:** heat + shakedown rejected against contracts w/ `finalStepSubmitted == true`. prevents attacks that started after the victim effectively finished. new `finalStepSubmitted: Boolean!` field on Contract
- **kingpin gating clarified:**
  - visibility: hidden kingpins now show as **redacted "???" placeholders** (still occupy real slots); crews w/ 3+ completed see full details
  - **board density guarantee:** at least half of visible slots always non-kingpin: newer crews never see a mostly-hidden board
  - **reputation buyable between contracts:** if bought between, tags the next-pulled contract's def/emp slot as pre-spent. avoids the accidental "you need a 4th non-kingpin contract to buy reputation" trap
- **inside man restricted** to the currently UNLOCKED step w/ no pending submission: can't bypass or orphan review work
- **rat out targeting cleaned:** `StakeoutLock` now has an `id`; rat out accepts either `targetStakeoutLockId` or `targetBuffId`
- **auth security:** all mutations derive acting crew from authenticated user + event membership. NEVER accept client-supplied crewId. explicitly called out in schema + buy flow
- **fractional prices simplified:** require `H` to be a multiple of 10, drop the fixed-point storage plan
- **softened "no new ref ui" claim:** race-active badges, heat/bonus-step flags, and shakedown queue grouping are new adjacent surface. review _flow_ is unchanged, but a small amount of new ref-side ui is required
- **schema slot-count comment fix** (still-lingering)

**2026-09-06 (third review pass: pre-build lockdown)**

- **burn contract → one use per crew per event.** closes the zero-balance pull-burn-pull-burn deck-churn exploit
- **burn voids all payout entirely: no shakedown skim is ever created from a burned contract.** closes the collusion exploit where a shakedowner + victim could farm 25% of unpaid contracts. attacker's shakedown fee refunded to `cutBalance` (never `cutEarned`). new `ShakedownStatus.VOIDED_BY_BURN`
- **event-end settlement rule locked:** at `endDate` event enters new `SETTLING` state. new progress/submissions/pulls/purchases freeze. submissions timestamped before `endDate` remain eligible for review; races + payouts resolve based on those. once all adjudicated, `SETTLING → COMPLETE` and leaderboard locks. no more "ref speed relative to the clock" ambiguity
- **finalStepSubmitted → derived,** not mutable state. resolved fresh from step.submissions on read. no reset-after-rejection bug surface
- **redacted kingpin card copy fixed:** two-stage messaging matching the two gates: "complete 3 jobs to reveal" (visibility gate) → "reputation required to pull" (unlock gate) → pull enabled
- **`activeShakedown` → `lifetimeShakedown`** in the lingering submissions section reference
- **deck exhaustion behavior:** deterministic reshuffle w/ incremented seed from same registry + `contentSelections`. board never runs empty
- **shakedown baseline captured at purchase:** attacker's wom metric snapshotted at `Shakedown.startedAt`. completion timestamps must be `>= startedAt`, so preexisting progress cannot qualify. new `ShakedownJob.attackerBaseline: Int!`

**doc closed for further design expansion.** reviewer's verdict: build the v1 slice now, remaining answers come from playtesting.
