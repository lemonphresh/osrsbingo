# Skulduggery: implementation guide 2 (open work)

> Companion to `skulduggery-agent-implementation-guide.md`. That doc is now
> mostly a record of what landed. This doc pulls the still-open items into
> one place so a next-session agent (or lemon) can see what's actually left.
>
> **Decisions locked with lemon** are marked ✅ in the section header.
> Everything else is still open for discussion or queued for a specific
> implementation pass. Section 3 (**NEEDS ATTENTION FROM LEMON**) is the
> shortlist of things that require lemon to sit with data, copy, or
> product decisions personally, with file/line pointers.
>
> Style: no em-dashes in this doc or in new Skulduggery copy. Colons,
> periods, commas, restructured sentences. If a sentence needs an em-dash
> to survive, rewrite it.

---

## 1. Decisions locked this session

Short recap so nothing gets re-litigated.

### ✅ Shakedown tasks come from a lemon-curated WOM allow-list

The retired curated thieving pool (`skulduggeryTaskPool.js`, now deleted)
is out for shakedown races. Pickpocketing, stalls, chests: none of
those are cleanly WOM-trackable and none survive the timestamp-winner
resolution well. Races need to be verifiable and timeable.

New direction: shakedown race tasks pull from a **lemon-curated
allow-list of WOM keys**. Not per-event configurable (like battleship's
content selection modal). One universal list living in the codebase.
Lemon decides once which content is eligible for shakedown races and
that's the pool. Same determinism rules apply after the filter (seeded
pick, difficulty-matched, short bucket).

The pre-filled list is in section 3 below (`🎯 Content decisions →
Shakedown allow-list`). Lemon prunes it, and the pruned list becomes
`server/utils/skulduggery/shakedownAllowlist.js` (a `Set` of WOM keys).

Implementation shape:

1. `server/utils/skulduggery/shakedownAllowlist.js` exports the pruned
   `SHAKEDOWN_WOM_ALLOWLIST` Set.
2. New helper `buildSkulduggeryShakedownPool({ registry, difficulty })`
   next to `buildSkulduggeryContentPool` in
   [`skulduggeryContent.js`](../server/utils/skulduggery/skulduggeryContent.js).
   Filters registry to entries that:
   - are enabled,
   - have a `womKey` present in `SHAKEDOWN_WOM_ALLOWLIST`,
   - support the short quantity bucket at the requested difficulty.
3. `buySkulduggeryShakedown` in
   [`market_buys.js`](../server/schema/resolvers/skulduggery/mutations/market_buys.js)
   swaps its task source from `pickShakedownTask` (task pool) to the
   new registry-backed picker.
4. The `SkulduggeryShakedown` model already has inlined task fields
   (`taskContentId`, `taskDisplayName`, `taskMetricType`,
   `taskMetricTarget`, `taskWomKey`, etc.), so the storage shape is
   already correct: it just needs to be populated from registry
   entries instead of thieving pool entries.
5. `skulduggeryTaskPool.js` is deleted (confirm nothing else uses it
   first with a grep for `pickShakedownTask` / `skulduggeryTaskPool`).
6. Test coverage: allow-list is authoritative (no entry outside the
   list ever surfaces), deterministic pick, difficulty match, all
   races get a short-bucket target, allow-list references only WOM
   keys that actually exist in the registry (guards against typos).
7. Rewrite `SHAKEDOWN.description` in
   [`skulduggeryMarket.js`](../server/utils/skulduggery/skulduggeryMarket.js)
   to reflect the new mechanic in the market catalog.

### ✅ Burn lives on the Black Market as an "Escape Hatch" section

Server already categorizes `BURN_CONTRACT` as `ESCAPE_HATCH`, so the
UI just needs to render a separate section beneath the four normal
categories (Offensive / Territorial / Defensive / Empowerment) with a
distinct visual cue that this is dangerous.

Copy needs to be **explicit** about consequences before the modal fires:

- Cost: `min(cutBalance, basePayout)` (dynamic, shown in the modal)
- Voids the contract's payout entirely (no `cutEarned`)
- One shot per event, no undo
- If a shakedown is racing against this contract, it resolves with
  the attacker refunded to `cutBalance` only (not `cutEarned`)
- Contract history is preserved for audit, but the contract itself is
  gone

The burn modal should walk through all of this in bullet form before
showing the Discord command. Match the interaction pattern from
`MarketBuyModal`: click Burn opens the modal, modal shows the
`!skulduggery burn` command, purchase is final once
someone on the crew sends the command.

Visual treatment: gold-tag "Escape hatch" section header, danger-red
button (the one exception to the outlined-cream style), maybe a
skull/hazard glyph. Reads as "big red button under glass".

### ✅ Prescreenshots are in, follow the Battleship pattern

Battleship uses prescreenshots as WOM baseline anchors: a player posts
`/battleship prescreenshot` before starting content, and the resulting
submission's `createdAt` becomes the baseline for later WOM progress
checks against that step. Same pattern for Skulduggery.

Where to look for the pattern:

- Battleship submission model + `type: 'PRESCREENSHOT'` handling in
  [`server/db/models/battleship/BattleshipSubmission.js`](../server/db/models/battleship/BattleshipSubmission.js)
- Prescreenshot mutation flow in
  [`server/schema/resolvers/battleship/mutations/submissions.js`](../server/schema/resolvers/battleship/mutations/submissions.js)
- WOM progress calculation using prescreenshot `createdAt` as baseline
  (grep for `prescreenshot` in the battleship WOM helpers)
- Client ref UI showing the prescreenshot alongside the completion
  submission for baseline comparison

For Skulduggery specifically:

1. Add `PRESCREENSHOT` to the `SkulduggerySubmission.type` enum
   (currently the submission model may not even have a `type` field:
   check).
2. Add a `submitSkulduggeryPrescreenshot` mutation.
3. When the player later submits proof of completion for a WOM-backed
   step, the ref UI shows both the prescreenshot and the completion
   proof side by side, and any WOM progress check compares against
   the prescreenshot's `createdAt`.
4. Shakedown races **especially** benefit from prescreenshots since
   they need a baseline anchor. If a crew starts racing against a
   Duke KC target and had 3 kills before the race started, we need
   the prescreenshot to prove that.
5. Ref queue needs to render prescreenshots as their own kind of row
   (or grouped under the step they anchor). See ref queue audit note
   in section 3.

### ✅ Em-dashes: purge them, forevermore rule

Grep for the Unicode em dash character (U+2014) across:

- `client/src/pages/skulduggery/**`
- `client/src/utils/skulduggery/**`
- `server/utils/skulduggery/**`
- `server/schema/resolvers/skulduggery/**` (esp. feed copy in `writeFeedItem` calls)
- Both impl guide docs
- Anywhere `NoirCaption` or market catalog descriptions live

Replacements: colon, period, comma, or restructure. Forevermore rule:
new Skulduggery copy uses no em-dashes.

### ✅ Alibi stays Rat-Out only

Locked. Nomenclature backs it up: "alibi" is "someone else's story
places me elsewhere", which maps cleanly to "the rat's tip was wrong",
not to "your Heat magically doesn't apply". Heat and Shakedown always
land; only Rat Out is reversible via reactive Alibi.

If playtest shows Alibi is too niche to justify a market slot, the
call to make is "remove Alibi" rather than "expand it".

### ✅ Tip Off has real value alongside Stakeout

Also locked. Buying Tip Off lets you see what's in every case file,
which makes Stakeout more strategic (you know exactly what you're
locking rivals out of). This synergy is the intended reason both
items exist. No changes.

---

## 2. Design/UX status and remaining passes

Ordered by sequencing dependency. Each unlocks the next.

### Dashboard + create page noir treatment

**Landed for v0.** The dashboard and sectioned create surface use the
shared noir primitives. The create page now uses the same
`DiscordMemberInput` lookup pattern as Battleship for every crew member,
including resolved Discord identities, add/remove rows, and visible
duplicate conflicts. Content-selection editing remains open.

Full direction is in the main guide's "Problem 6" section. Summary:

- [`SkulduggeryDashboard.jsx`](../client/src/pages/skulduggery/SkulduggeryDashboard.jsx):
  noir shell, hero pitch copy, event list as `NoirPanel` cards with
  `NoirDot` status, gold "Create event" CTA, flavor empty state,
  optional recent-activity teaser.
- [`SkulduggeryCreatePage.jsx`](../client/src/pages/skulduggery/SkulduggeryCreatePage.jsx):
  sectioned setup surface modelled on
  [`BattleshipCreatePage.jsx`](../client/src/pages/battleship/BattleshipCreatePage.jsx)
  and
  [`BattleshipAdminPage.jsx`](../client/src/pages/battleship/BattleshipAdminPage.jsx).
  Sections: base event, kingpin gating, staff, crews (per-crew
  `NoirPanel` with Discord channel + role + WOM team), content
  selections accordion, Discord announcements channel, launch CTA.

### Team setup UX rebuild

**Partially landed.** Crew creation and the admin add-crew form share the
Battleship-style Discord member lookup, and the server serializes crew
assignment to reject cross-crew duplicates. Editing existing crews,
resolved member chips on saved crew cards, refs management, test-message
buttons, WOM sync-now, and delete/archive controls remain open.

Port battleship's `TeamSection` (at
[`BattleshipAdminPage.jsx:275`](../client/src/pages/battleship/BattleshipAdminPage.jsx#L275))
and `RefsSection` patterns to Skulduggery. Coordinators live here after
launch. Key elements:

- Each crew is its own collapsible `NoirPanel`.
- Discord member IDs as chips with conflict detection (warn when the
  same Discord ID is on two crews: battleship already does this).
- Per-crew Discord channel + role fields with "test message" buttons.
- WOM team name field with "sync now" test button.
- Delete/archive crew action with confirmation modal.
- Add-crew CTA at bottom in a dashed noir outline placeholder.
- Refs section mirrors the pattern: `NoirPanel` + Discord ID chips +
  per-ref test button.

### Two-phase create flow

**Landed for v0.** Create saves an event in `SETUP` and routes to the
coordinator room. Launch is a separate explicit action.

Following Battleship's model, the event is created in `SETUP`, can be
reviewed in the coordinator room, and launches separately. Content-selection
editing and richer crew updates are still needed to complete the intended
"tune before launch" workflow.

### Admin page after launch

**Landed for v0** at `/skulduggery/:eventId/admin`, with setup review,
add-crew, and launch controls. The richer editing controls listed above
remain open.

The route reuses the create page's shared crew fields for new crews. Existing
crew editing and the remaining Battleship-style coordinator sections are the
next pass.

### Market panel anchor illustration

Currently reads as an admin form. Direction: one anchor asset
(silhouette fedora fence, hand-lettered "the fixer" chalkboard header,
or similar) transforms the feel of the whole panel without requiring
more art per action.

### Voice differentiation (narrator vs mechanic labels)

Narrator ("The fixer is holding the temple job off the streets") and
mechanic labels ("cutBalance: 500") currently share type treatment.
Narrator already has serif italic caption boxes. Mechanic labels should
stay neutral mono and calm. Audit the pages for places where a mechanic
label got noir-fied and pull it back.

### Densely-detailed vs calm mode toggle

Deferred to future. Some players want more info surface than others.
Toggle between dense-dashboard vs chapter-book layouts. Not v1. Flag
for post-playtest.

---

## 3. NEEDS ATTENTION FROM LEMON

Things that require you, personally, to sit with data or make a
product call. Grouped by kind of work.

### 🎯 Content decisions

**Shakedown allow-list.**
Prune this list of every WOM key in
[`server/utils/contentRegistry.js`](../server/utils/contentRegistry.js).
Keep only the ones you want eligible for shakedown races. Rough
criteria to weigh:

- Can be verified in a reasonable window (a race that takes 4 hours
  is not a race).
- Feels good to sprint against a rival.
- Both crews should be able to attempt it without hard progression
  gates blocking one of them.

Delete lines for content you're excluding. Whatever survives becomes
`server/utils/skulduggery/shakedownAllowlist.js` (a `Set` of WOM keys)
and the shakedown picker will only draw from it. See section 1 for
the implementation shape.

<details>
<summary><strong>Bosses (54)</strong></summary>

```
abyssal_sire
alchemical_hydra
amoxliatl
araxxor
artio
barrows_chests
brutus
bryophyta
callisto
calvarion
cerberus
chaos_elemental
chaos_fanatic
commander_zilyana
corporeal_beast
crazy_archaeologist
deranged_archaeologist
doom_of_mokhaiotl
duke_sucellus
general_graardor
giant_mole
grotesque_guardians
hespori
kalphite_queen
king_black_dragon
kraken
kreearra
kril_tsutsaroth
lunar_chests
mad_angel
maggot_king
mimic
nex
nightmare
obor
phantom_muspah
phosanis_nightmare
sarachnis
scorpia
scurrius
shellbane_gryphon
skotizo
spindel
the_corrupted_gauntlet
the_gauntlet
the_hueycoatl
the_leviathan
the_royal_titans
the_whisperer
thermonuclear_smoke_devil
vardorvis
venenatis
vetion
vorkath
yama
zulrah
```

</details>

<details>
<summary><strong>Raids (6)</strong></summary>

```
chambers_of_xeric
chambers_of_xeric_challenge_mode
theatre_of_blood
theatre_of_blood_hard_mode
tombs_of_amascut
tombs_of_amascut_expert
```

</details>

<details>
<summary><strong>Skills (17)</strong></summary>

```
agility
construction
cooking
crafting
farming
firemaking
fishing
fletching
herblore
hunter
mining
runecrafting
sailing
slayer
smithing
thieving
woodcutting
```

</details>

<details>
<summary><strong>Minigames (7)</strong></summary>

```
guardians_of_the_rift
sol_heredit
tempoross
tzkal_zuk
tztok_jad
wintertodt
zalcano
```

</details>

<details>
<summary><strong>Clues (6)</strong></summary>

```
clue_scrolls_beginner
clue_scrolls_easy
clue_scrolls_elite
clue_scrolls_hard
clue_scrolls_master
clue_scrolls_medium
```

</details>

**Registry classification overlay review.**
File: [`server/utils/skulduggery/skulduggeryContent.js`](../server/utils/skulduggery/skulduggeryContent.js).
Currently classifies bosses by category (short = easy, medium =
intermediate, long = hard). Some manual overrides in there. Worth
one focused pass to catch edge cases and preferences before playtest.

**Task pool audit: complete.**
The former 13-task thieving pool was used only by shakedowns. Its module
and dedicated tests were deleted after the registry-backed allow-list
tests replaced them.

- If something does use them, decide what.

### 📝 Copy decisions

**Market catalog descriptions.**
File: [`server/utils/skulduggery/skulduggeryMarket.js`](../server/utils/skulduggery/skulduggeryMarket.js).
The `description` field on every action gets surfaced in the
`getSkulduggeryPlayground` query. Some are punchy, some are dry.
Worth your voice pass on all 12 actions, especially:

- `SHAKEDOWN` needs a rewrite once the mechanic changes (registry
  based instead of thieving task).
- `ALIBI` needs to reflect the reactive mechanic (currently
  "Reverse the most recent Rat Out against your crew on this
  contract" which is accurate but dry).
- `TIP_OFF` currently reads "Unlock the fixer's leaks: every board
  contract shows its activity list (no metric numbers). Persistent
  for the rest of the event." Fine but yours to sign off on.

**Contract name pool review.**
File: [`server/utils/skulduggery/skulduggeryContractNames.js`](../server/utils/skulduggery/skulduggeryContractNames.js).
Three curated pools (HEIST / VAULT / KINGPIN) with `{anchor}`
templates. 70+ entries total. Read once, cut/add as you feel.

**Feed narrator copy.**
Scattered across `writeFeedItem` calls in mutation files in
[`server/schema/resolvers/skulduggery/mutations/`](../server/schema/resolvers/skulduggery/mutations/).
Every `copy:` string is player-facing narration. Worth a pass for
voice consistency and em-dash removal.

**Burn modal consequences copy.**
Doesn't exist yet. When the burn modal gets built (section 1 above),
the bullet list of consequences needs your voice. Draft is in
section 1 but polish is yours to write.

### 🎨 Design decisions still open

**Where does the burn button live visually.**
Locked to Black Market Escape Hatch section (section 1). But the
specific visual treatment (danger red button? skull glyph? gated
behind a "confirm intent" click before the modal even opens?) is
open. Wire it, look at it, iterate.

**Market panel anchor illustration.**
Section 2 above. One asset, transforms the feel. You'd know better
than the agent whether a fedora silhouette, a chalkboard header,
or something else fits.

**Splash-panel treatment for absolute-biggest feed moments.**
Feed already has dramatic vs routine hierarchy. Kingpin unlock,
event complete, biggest single payout could go further. Design call:
does the noir aesthetic want a full-width splash for these, or
should they stay in the same rhythm?

### 🧪 Testing decisions

**Manual smoke test schedule.**
Section 15 of the main guide has a 17-step smoke test script. Nobody
has run it end to end. Before crew-facing polish ships, we need to
walk through it with at least two crews, one ref, and one admin,
and confirm every step feels right. This is the "does the mode
actually play" checkpoint.

**Edge case audit sign-off.**
Section 16 of the main guide lists 30+ edge cases. Every one needs
either test coverage or your explicit "defer this" note. Half are
already covered by existing tests; the rest need you to say what
you want to test versus defer.

**Playtest scheduling.**
Once smoke test passes, we need to schedule a real playtest with
actual crews. That's a product/community decision that only you can
make.

---

## 4. Interaction pattern rollout: Discord as source of truth

Locked design (see main guide). Where it stands now:

**Landed end to end.** The playground and real event page use the shared
`DiscordActionModal`. The bot now registers `!skulduggery` in
[`bot/commands/skulduggery.js`](../bot/commands/skulduggery.js), validates
the crew channel, roster, event, and target ID, then calls the canonical
server resolver. Browser actions only show exact Discord commands.

The following player actions now use this pattern on
[`SkulduggeryEventPage.jsx`](../client/src/pages/skulduggery/SkulduggeryEventPage.jsx):

- Market buttons.
- Pull button on `JobBoardCard`.
- Prescreenshot and proof buttons on contract steps and shakedowns.
- Burn in the Black Market Escape Hatch section.

Subscription refetch remains the browser update path after the bot applies
the command. Feed events also invalidate the event query, covering contract
pulls and other state changes that are not market purchases.

---

## 5. Validation and privacy audit results

### Pull-validation error path audit

**Verified.** Pull checks that the target exists in the event and is still
`ON_BOARD`. Bot-side target validation and resolver tests cover unknown and
stale IDs for pull plus market target-taking commands, returning player-safe
errors.

Small lemon-flagged concern: if a user types `!skulduggery pull
contract:g3` but only `a-c` are on the board, what happens? Server
answer is probably "clean rejection" (`pullSkulduggeryContract` checks
`status === 'ON_BOARD'`), but verify:

- Error message is player-friendly, not a stack trace.
- Test exists specifically for the "typed a wrong/stale ID" path.
- Same audit for other target-taking commands: heat, shakedown, rat
  out, stakeout, bribe fixer. If any resolver blindly trusts an ID,
  the error path could look bad in Discord.

### Content preview leak through subscriptions

**Closed.** Job-board subscription payloads are invalidation-only
(`eventId` and `reason`). They cannot carry a viewer-specific
`contentPreview`; each browser refetches through its own authenticated query.

New `SkulduggeryContract.contentPreview` field is per-viewer (gated
on the requesting crew's `tipoffUnlocked`). Fine for HTTP queries.
Question: does the `SKULDUGGERY_JOB_BOARD_UPDATED` subscription push
the same payload to every subscriber, or does it re-run field
resolvers per subscriber? If it's shared, a crew without Tip Off
could see another crew's unlocked view. Add a test.

### Stakeout takeover mechanics

If a rival stakes out a contract you want, and you've bought Tip Off,
you now know what's in it. Does that make Stakeout more valuable or
less? Locked answer (section 1): both, which is why the synergy is
intended. But worth watching in playtest to see how it plays.

---

## 6. Testing / ops loose ends

- **Destructive up/down/up migration rehearsal** against a disposable
  Postgres database. Never run because we didn't want to touch your
  DB. Should run once against a throwaway before we're confident the
  migrations are reversible.
- **Manual smoke test** per main guide section 15. Not yet exercised
  end to end. See NEEDS ATTENTION section above.
- **Edge case audit** per main guide section 16 signed off. See NEEDS
  ATTENTION section above.
- **Spectator page.** Flagged deferred in the main guide (player page
  already viewable by non-members). Revisit if we decide non-crew
  spectators need a scoped read-only view.
- **Deeper mutation interaction tests** for ref and player pages.
  Render/state coverage exists, but chained mutation sequences (buy
  heat, target denies proof, refs approve, shakedown wins) are not
  covered as multi-step interaction tests.

---

## 7. Server changes queued (known deviations)

Called out in the main guide's "Copy alignment notes". These are
intentional trade-offs we chose to leave for now:

- **`ALIBI_FIZZLED` enum reused** for the reactive-reversal outcome.
  Cleaner would be a dedicated `ALIBI_REVERSED` value plus a migration.
  Current reuse is semantically fine (same meaning, different timing)
  and avoided a migration. Revisit if the audit trail gets confusing.
- **Old `TIP_OFF` metadata** (`{ contractIds: [...] }`) sits in existing
  `SkulduggeryMarketPurchase` rows from before the Tip Off rewrite. Not
  a problem: the field resolver ignores it. If we ever backfill or
  query on `TIP_OFF` purchase metadata for reporting, we'd need to
  either migrate historical rows or handle both shapes explicitly.

---

## 8. Nice to haves noted during polish

Not committed, just recorded so they don't get lost:

- Feed hierarchy is done for dramatic vs routine. Could go further
  with a splash-panel treatment for the absolute biggest moments
  (Kingpin unlock, event complete, biggest single payout).
- Stamp animation (`sk-stamp-slam` keyframe) exists. Could layer onto
  more state transitions (reputation buy, shakedown win, contract
  burn). Currently only fires on step clearance.
- Progress bar for the step chain: a leading gutter with a fill meter
  running down the side of the step list would reinforce the "chain"
  metaphor. Direction noted in main guide's "Design opportunities".

---

## 9. Best next passes if picking this up

If you have 30 minutes:

1. Review and prune `shakedownAllowlist.js` with lemon.
2. Voice-review the market descriptions and generated feed copy.
3. Smoke-test Discord member lookup and conflict warnings with real users.

If you have a full session:

1. Add editing for existing crews using the same Discord lookup UI.
2. Add refs management, Discord test-message, and WOM sync-now controls.

If you have a week:

1. Finish the coordinator setup surface, including content selections,
   update/delete flows, confirmations, and integration tests.
2. Run a full manual smoke test and a real two-crew playtest, then tune
   balance and content from observed play.

---

## 10. Master checklist (everything left to do)

Grouped by owner and phase. Each item cross-links back to the section
where it's explained.

### Lemon owns

- [ ] Prune the shakedown allow-list. Section 3 → 🎯 Content decisions.
- [ ] Review the registry classification overlay in
      [`skulduggeryContent.js`](../server/utils/skulduggery/skulduggeryContent.js).
      Section 3 → 🎯 Content decisions.
- [x] Confirm task pool deletion. Section 3 → 🎯 Content decisions.
- [ ] Voice pass on all 12 market catalog `description` fields in
      [`skulduggeryMarket.js`](../server/utils/skulduggery/skulduggeryMarket.js).
      Section 3 → 📝 Copy decisions.
- [ ] Review the contract name pool in
      [`skulduggeryContractNames.js`](../server/utils/skulduggery/skulduggeryContractNames.js).
      Section 3 → 📝 Copy decisions.
- [ ] Voice pass on `writeFeedItem` copy across
      [`mutations/`](../server/schema/resolvers/skulduggery/mutations/).
      Section 3 → 📝 Copy decisions.
- [ ] Draft the burn-modal consequences copy. Section 3 → 📝 Copy decisions.
- [ ] Pick the burn button visual treatment (danger red, glyph,
      confirm-intent gate). Section 3 → 🎨 Design decisions.
- [ ] Decide market panel anchor illustration direction. Section 3 → 🎨 Design decisions.
- [ ] Decide splash-panel treatment for biggest feed moments (or defer).
      Section 3 → 🎨 Design decisions.
- [ ] Schedule + run the manual smoke test end to end. Section 3 → 🧪 Testing decisions.
- [ ] Sign off (or explicitly defer) each edge case in main guide
      section 16. Section 3 → 🧪 Testing decisions.
- [ ] Schedule a real playtest with actual crews. Section 3 → 🧪 Testing decisions.

### Server work

- [x] Create `server/utils/skulduggery/shakedownAllowlist.js` from
      lemon's pruned list. Section 1 → Shakedown tasks.
- [x] Add `buildSkulduggeryShakedownPool` helper next to
      `buildSkulduggeryContentPool`. Section 1 → Shakedown tasks.
- [x] Rewrite `buySkulduggeryShakedown` to use the new pool. Section 1.
- [x] Delete `skulduggeryTaskPool.js` (after confirming no other use).
      Section 1.
- [x] Rewrite `SHAKEDOWN.description` in the market catalog. Section 1.
- [x] Add `PRESCREENSHOT` to `SkulduggerySubmission.type` (check if
      `type` field exists first; add if not). Section 1 → Prescreenshots.
- [x] Add `submitSkulduggeryPrescreenshot` mutation. Section 1 → Prescreenshots.
- [x] Wire prescreenshot `createdAt` as WOM baseline for step + race
      progress checks (follow battleship's helper). Section 1.
- [x] Test shakedown allow-list authoritativeness (no entry outside
      the list ever surfaces; allow-list references only real WOM
      keys). Section 1.
- [x] Add tests for the "picked wrong / stale contract ID" path on
      `pullSkulduggeryContract`, and audit the same for heat,
      shakedown, rat out, stakeout, bribe fixer. Section 5.
- [x] Add a subscription-payload leak test: subscriber without Tip Off
      never receives another crew's populated `contentPreview` array
      through `SKULDUGGERY_JOB_BOARD_UPDATED`. Section 5.

### Client work

- [x] Em-dash purge across Skulduggery client copy. Section 1 → Em-dashes.
- [x] Extract playground `MarketBuyModal` into a shared molecule.
      Section 4.
- [x] Build a contract-pull modal on the same pattern. Section 4.
- [x] Build a step-submit-proof modal on the same pattern (and figure
      out where prescreenshot submit fits). Section 4.
- [x] Build the burn modal with the consequences copy lemon drafted.
      Sections 1 + 4.
- [x] Add an Escape Hatch section to the Market tab that hosts the
      burn button. Section 1 → Burn placement.
- [x] Swap direct-mutation button handlers on
      [`SkulduggeryEventPage.jsx`](../client/src/pages/skulduggery/SkulduggeryEventPage.jsx)
      to `onClick={openModal}` for market, pull, submit, burn.
      Section 4.
- [x] Delete the direct-mutation buttons + optimistic UI once modals
      are wired. Section 4.
- [x] Ref queue context audit + redesign to show prescreenshots
      alongside completion proof, plus the missing metadata from
      section 1 (contract name, step target formatted, heat flag,
      race badge, prior submissions, blocked completion reason).
      Section 1 → Prescreenshots.
- [x] Dashboard noir pass. Section 2 → Dashboard.
- [x] Create page noir + sectioned setup rebuild. Section 2 → Dashboard.
- [ ] Finish team setup UX: existing-crew editing, refs, test-message,
      WOM sync-now, and delete/archive controls. Discord member lookup for
      crew creation is complete. Section 2 → Team setup.
- [x] Two-phase create flow (create in SETUP, tune, launch separately).
      Section 2.
- [x] Admin page at `/skulduggery/:eventId/admin`. Section 2.
- [ ] Market panel anchor illustration (once lemon picks direction).
      Section 2.
- [ ] Voice differentiation audit (narrator vs mechanic labels).
      Section 2.

### Server + client copy pass

- [x] Em-dash purge across all Skulduggery-related copy (server feed
      writes, market descriptions, both impl guides, playground copy,
      component captions). Section 1 → Em-dashes.

### Testing / ops

- [ ] Destructive up/down/up migration rehearsal against a disposable
      Postgres database. Section 6.
- [ ] Add deeper mutation interaction tests for chained sequences
      (i.e. "buy heat, deny proof, approve proof, shakedown wins").
      Section 6.

### Deferred (documented, not doing now)

- [ ] Spectator page. Section 6.
- [ ] Dense vs calm mode toggle. Section 2.
- [ ] Splash-panel feed treatment. Section 8.
- [ ] Extra stamp animations on state transitions. Section 8.
- [ ] Step-chain progress bar in the leading gutter. Section 8.
- [ ] Migrate `SkulduggeryMarketPurchase.outcome` enum to add
      `ALIBI_REVERSED` if audit trail confusion emerges. Section 7.

---

## 11. Next session checklist: latest Lemon notes

This section is based **only** on the notes below the divider in
[`skulduggery-lemon-notes.md`](./skulduggery-lemon-notes.md). Treat it as
the next session's execution order. The older sections above retain the
broader backlog and historical context.

### Decisions and defaults

No Lemon decision is required before starting this pass. Use these defaults:

- Follow Battleship's team-management behavior and components rather than
  designing another member-entry pattern.
- Display a linked RuneScape name first. Fall back to Discord display name,
  then a shortened Discord ID when no linked site user can be resolved.
- Allow admins to edit crew configuration during `SETUP` and `ACTIVE`.
  Do not add delete/archive behavior in this pass.
- Hide the admin page's **Event page** button during `SETUP`. Show it in
  `ACTIVE`, `SETTLING`, and `COMPLETE`.
- Give refs who are not crew members a clearly labeled, read-only staff view.
  They can inspect the board and feed and enter the refs queue, but they never
  receive crew actions, private crew state, or market controls.
- Use the existing noir system for the refs page. No new illustration or
  aesthetic decision is needed for this pass.

### 1. Rebuild saved crew cards from the Battleship reference

- [ ] Read Battleship's `TeamSection`, `MemberTag`, and
      `DiscordMemberInput` usage before editing Skulduggery.
- [ ] Replace raw member-ID text on
      [`SkulduggeryAdminPage.jsx`](../client/src/pages/skulduggery/SkulduggeryAdminPage.jsx)
      with resolved member rows/chips. Show RSN, Discord identity, and the raw
      ID as secondary diagnostic text.
- [ ] Reuse `DiscordMemberInput` for adding members to an existing crew.
      Preserve its search by site name, RSN, Discord name, or Discord ID.
- [ ] Show same-crew duplicates and cross-crew conflicts inline before save.
- [ ] Add loading, unresolved-user, empty-roster, save-success, and save-error
      states. A failed Discord lookup must not hide or discard the stored ID.

Acceptance criteria:

- No saved crew card renders a comma-separated list of opaque Discord IDs.
- A linked user is recognizable by RSN without copying their ID elsewhere.
- An unlinked Discord member remains visible and editable by ID.

### 2. Make existing crews editable from the admin page

- [ ] Add a canonical admin mutation for updating a crew's name, members,
      Discord channel ID, Discord role ID, and WOM team name. Do not emulate
      updates through delete/recreate.
- [ ] Lock the event row during roster updates and enforce the existing
      cross-crew Discord-ID uniqueness rule inside the transaction.
- [ ] Restrict the mutation to event admins and the `SETUP`/`ACTIVE` states.
- [ ] Turn each saved crew card into an editable/collapsible `NoirPanel`,
      following Battleship's `TeamSection` interaction pattern.
- [ ] Keep an explicit dirty state. Disable Save until something changes and
      restore persisted values after Cancel or a successful refetch.
- [ ] Add resolver tests for authorization, allowed statuses, duplicate
      membership, concurrent conflicts, and persistence of every field.
- [ ] Add client tests covering member add/remove, resolved labels, conflict
      display, Save/Cancel, and mutation errors.

Acceptance criteria:

- An admin can correct the roster, crew name, channel, role, and WOM team
  without recreating the event or crew.
- Two crews can never retain the same Discord member, including under
  concurrent update requests.

### 3. Fix setup navigation

- [ ] Hide the **Event page** button on `SkulduggeryAdminPage` while the event
      is in `SETUP`.
- [ ] Keep the button available after launch, including `SETTLING` and
      `COMPLETE`.
- [ ] Add a small render test for both pre-launch and post-launch states.

### 4. Give non-crew refs an intentional event view

- [ ] Distinguish `isEventRef && !currentCrew` from an ordinary authenticated
      non-member in `SkulduggeryEventPage`.
- [ ] Replace the generic "You're not on a crew" message for refs with a
      visible **Ref view** banner explaining that the page is read-only.
- [ ] Keep the job board, public event state, and activity feed visible.
- [ ] Give refs a prominent route to the refs queue.
- [ ] Confirm that pull, proof, prescreenshot, burn, and market command modals
      cannot be opened without a current crew.
- [ ] Keep ordinary non-members in the existing spectator/read-only state;
      do not accidentally grant them ref visibility or controls.
- [ ] Add tests for a crew member, a ref without a crew, an event admin, and an
      ordinary non-member.

Acceptance criteria:

- A ref can tell immediately that they have staff access and where reviews
  happen.
- A ref who is not on a crew sees no crew-only command or private-state UI.

### 5. Finish the refs queue presentation

- [ ] Apply the shared noir page shell and hierarchy to
      [`SkulduggeryRefsPage.jsx`](../client/src/pages/skulduggery/SkulduggeryRefsPage.jsx).
- [ ] Add a compact queue summary: pending submissions, approved baselines,
      completion-ready targets, and blocked targets.
- [ ] Resolve submitter Discord IDs to RSN/Discord identity with the same
      fallback rules as crew members.
- [ ] Replace the bare "No submissions yet" line with an intentional empty
      state that includes event status, a short explanation, recent activity,
      and a route back to the event when appropriate.
- [ ] Preserve the existing side-by-side baseline/completion evidence,
      denial reason input, prior submissions, WOM target context, Heat badge,
      race badge, and completion-blocked reason.
- [ ] Improve scanning with pending-first ordering, clear target grouping,
      sticky or repeated action context where useful, and responsive image
      previews.
- [ ] Add render tests for empty, pending, denied/resubmitted, ready-to-complete,
      blocked-WOM, Heat, and Shakedown states.

Acceptance criteria:

- The empty page looks deliberate rather than unfinished.
- A ref can identify the crew, submitter, target, baseline, completion proof,
  and next valid action without opening another page.

### 6. Verification and handoff

- [ ] Validate all changed GraphQL documents against the server schema using
      the existing `skulduggeryOperations.test.js` compatibility test.
- [ ] Run focused resolver and component tests while iterating.
- [ ] Run the complete server and client test suites plus a production client
      build before handoff.
- [ ] Manually exercise one `SETUP` event and one `ACTIVE` event as admin,
      crew member, ref-only user, and ordinary non-member.
- [ ] Update this section's checkboxes and record any genuinely deferred item.

---

## 12. Broader review before a real playtest

These are the details most likely to be overlooked while iterating on the
board, market, and visual feel. None blocks section 11's admin/ref work. The
items marked **Lemon call before playtest** should be settled before real crews
use the event.

### WOM truth versus manual ref truth

The registry-backed tasks and prescreenshot timestamps are in place, but that
does not automatically mean WOM progress is being fetched and calculated for
Skulduggery. Do not describe a target as auto-synced until the complete path
has been verified from WOM snapshot retrieval through stored progress and UI.

- [ ] Audit whether Skulduggery currently has an actual scheduled/manual WOM
      sync path, rather than only WOM keys and timestamp anchors.
- [ ] If automatic sync is part of v0, reuse the existing repository WOM
      client, snapshot semantics, and metric names. Do not create another
      metric mapping.
- [ ] Add admin-visible last-sync time, current progress, sync failure, and
      **Sync now** feedback.
- [ ] Keep manual evidence/ref review available when WOM is delayed or
      unavailable. WOM failure must never silently complete or erase progress.
- [ ] Test stale snapshots, API failure, no matching WOM team, renamed teams,
      simultaneous manual/WOM completion, and progress arriving after
      `endDate`.
- [ ] **Lemon call before playtest:** decide whether the first playtest promises
      automatic WOM tracking or explicitly runs on prescreenshots plus manual
      ref approval.

### Durable proof evidence

Submission rows currently retain proof URLs. Discord attachment URLs should
not be assumed to be permanent evidence without verifying their lifetime and
access behavior.

- [ ] Verify whether stored Discord attachment URLs remain readable for the
      entire event, settlement window, and later audit period.
- [ ] If they are not durable, copy attachments into repository-supported
      persistent storage when the bot receives the command. Store the durable
      URL and preserve source metadata for audit.
- [ ] Define behavior for upload failure, unsupported file type, oversized
      image, deleted source message, inaccessible link, and duplicate command.
- [ ] Ensure refs see a clear broken-evidence state instead of a silently empty
      image panel.
- [ ] **Lemon call before playtest:** choose the acceptable evidence-retention
      policy if Discord URLs are not durable enough.

### Live roster and staff policy

- [ ] Confirm whether changing crew membership during `ACTIVE` is an intended
      recovery tool or should be limited to `SETUP`. Section 11 currently uses
      the practical default that admins may edit during both states.
- [ ] If active-event roster edits remain allowed, decide whether they need a
      feed/audit entry and whether a newly added member immediately inherits
      access to private crew state.
- [ ] Confirm how removing the last member, moving a member between crews, and
      editing the acting admin/ref should behave.
- [ ] Verify that ref, admin, crew, and ordinary spectator permissions are
      tested independently. Being a ref must not imply being a crew member.
- [ ] **Lemon call before playtest:** approve or change the active-roster-edit
      default. This does not block implementing the editor in `SETUP` first.

### Discord and notification operations

- [ ] Add/test a coordinator-facing Discord channel test action before launch.
- [ ] Verify bot permissions for reading commands, reading attachments,
      replying, posting announcements, and mentioning configured roles.
- [ ] Validate guild, announcement channel, crew channel, and role IDs with
      useful setup errors. Detect duplicate crew channels where ambiguity
      would make command routing unsafe.
- [ ] Make best-effort announcement failures visible to admins through logs or
      admin UI without rolling back committed gameplay state.
- [ ] Confirm the deployed bot actually includes the same Skulduggery command
      version as the deployed server/client.
- [ ] Test command help and errors in Discord, including wrong channel, user on
      no crew, stale target ID, missing attachment, and repeated command.

### Lifecycle, recovery, and coordinator escape hatches

- [ ] Exercise `SETUP → ACTIVE → SETTLING → COMPLETE` with the scheduler and
      manual admin controls, including process restart around `endDate`.
- [ ] Decide what an admin can safely repair when an event is stuck: incorrect
      roster/channel, broken WOM team, pending proof, unresolved Shakedown, or
      failed announcement. Prefer narrow audited actions over arbitrary status
      mutation.
- [ ] Confirm settlement behavior for late proof, delayed ref review, tied race
      timestamps, a denied prescreenshot, and a target completed while its
      Shakedown is unresolved.
- [ ] Confirm content selections can be reviewed before launch so generating
      the contract batch is not the first time an admin sees the effective
      pool.
- [ ] Run the disposable migration up/down/up rehearsal and document recovery
      if server, bot, and client versions briefly differ during deploy.

### Player onboarding and comprehensibility

- [ ] Walk the mode as someone who has not read the design doc. Verify they can
      find the correct crew channel and understand `!skulduggery` commands,
      H/cut terminology, contract IDs, step IDs, target-buff IDs, Heat,
      Shakedown, prescreenshots, and the separation of score from balance.
- [ ] Put the exact next command near each actionable state and keep Discord
      help output synchronized with browser copy.
- [ ] Explain why a button is unavailable: active contract, Kingpin gate,
      insufficient balance, one-shot already used, target locked, event ended,
      or unresolved Shakedown.
- [ ] Check all empty, loading, error, settling, and completed states. These
      often matter more than another decorated happy-path card.

### UI feel, motion, and interaction polish

This is the natural home for Lemon's next round of feedback about wiggling,
stamps, transitions, density, and making the mode feel less static.

- [ ] Inventory moments that deserve motion: modal arrival, contract pull,
      step clearance, Heat insertion, Shakedown start/result, market purchase,
      Kingpin reveal, burn, settlement, and final winner.
- [ ] Give each motion a purpose such as hierarchy, confirmation, danger, or
      state change. Avoid continuous decorative movement and avoid shifting
      controls while a player is trying to click or copy a command.
- [ ] Keep timing and motion language consistent across the mode. Prefer a few
      reusable transitions over bespoke animation in every component.
- [ ] Respect `prefers-reduced-motion`; the reduced version must retain the
      same information through text, icons, and stable state changes.
- [ ] Check keyboard focus after modals, visible focus rings, Escape behavior,
      screen-reader labels, contrast, and non-color status cues.
- [ ] Check narrow/mobile layouts with long crew names, long RSNs, five-step
      contracts plus Heat, side-by-side ref evidence, and Discord commands.
- [ ] Watch for layout jumps during refetch/subscription updates. Preserve the
      user's tab, scroll position, expanded crew panel, and partially entered
      denial reason wherever practical.
- [ ] Do one calmness pass after adding motion. The noir theme should feel
      tense and tactile, not noisy or exhausting during a multi-day event.

### Balance and post-playtest evidence

- [ ] Capture what happened rather than relying only on impressions: contract
      completion time by length/difficulty, market purchases, unused actions,
      Shakedown duration/outcome, burn usage, ref turnaround time, denied proof,
      and Cut earned/spent/remaining.
- [ ] Review H value, market prices, Kingpin gate, board slot count, content
      pool, and Shakedown targets using that evidence after the first playtest.
- [ ] Treat actions nobody buys and actions every crew always buys as balance
      signals. Check comprehension before assuming the price is wrong.
- [ ] Record rules/copy changes in the design doc before changing server
      behavior so the next implementation pass has one source of truth.
