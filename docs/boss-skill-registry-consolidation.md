# boss + skill registry consolidation

a plan to replace the scattered per-subsystem boss/skill lists with a single source of truth, anchored to wom's official api types.

## goal

competitions and bingo events need a consistent, shared baseline for what content is valid, how much of it counts as a task, and how kills/xp/drops are measured. right now each subsystem answers those questions independently, which means:

- a boss can exist in the group dashboard but not bingo, or vice versa
- kill count ranges and drop expectations aren't calibrated against each other
- adding a new boss requires hunting down and editing multiple files
- wom key format (snake_case) and our internal format (camelCase) are only loosely connected with no enforcement

the registry fixes this by making every subsystem read from one place, so "what bosses exist" and "what counts as a valid task" are answered consistently everywhere.

---

## wom as the ground truth for what exists

wom publishes an official set of metric types at https://docs.wiseoldman.net/api/global-type-definitions. their `Boss`, `Skill`, and `Activity` enums define what can actually be tracked. our registry should be a strict superset — every entry in our registry must have a valid wom key from one of those enums.

**wom's current enums (as of 2026-08):**

bosses (81):

```
abyssal_sire, alchemical_hydra, amoxliatl, araxxor, artio, barrows_chests, brutus,
bryophyta, callisto, calvarion, cerberus, chambers_of_xeric,
chambers_of_xeric_challenge_mode, chaos_elemental, chaos_fanatic, commander_zilyana,
corporeal_beast, crazy_archaeologist, dagannoth_prime, dagannoth_rex,
dagannoth_supreme, deranged_archaeologist, doom_of_mokhaiotl, duke_sucellus,
general_graardor, giant_mole, grotesque_guardians, hespori, kalphite_queen,
king_black_dragon, kraken, kreearra, kril_tsutsaroth, lunar_chests, mad_angel,
maggot_king, mimic, nex, nightmare, phosanis_nightmare, obor, phantom_muspah,
sarachnis, scorpia, scurrius, shellbane_gryphon, skotizo, sol_heredit, spindel,
tempoross, the_gauntlet, the_corrupted_gauntlet, the_hueycoatl, the_leviathan,
the_royal_titans, the_whisperer, theatre_of_blood, theatre_of_blood_hard_mode,
thermonuclear_smoke_devil, tombs_of_amascut, tombs_of_amascut_expert, tzkal_zuk,
tztok_jad, vardorvis, venenatis, vetion, vorkath, wintertodt, yama, zalcano, zulrah
```

skills (25):

```
overall, attack, defence, strength, hitpoints, ranged, prayer, magic, cooking,
woodcutting, fletching, fishing, firemaking, crafting, smithing, mining, herblore,
agility, thieving, slayer, farming, runecrafting, hunter, construction, sailing
```

activities (15, tracked separately from bosses in wom but relevant for clue/minigame objectives):

```
bounty_hunter_hunter, bounty_hunter_rogue, clue_scrolls_all, clue_scrolls_beginner,
clue_scrolls_easy, clue_scrolls_medium, clue_scrolls_hard, clue_scrolls_elite,
clue_scrolls_master, last_man_standing, pvp_arena, soul_wars_zeal,
guardians_of_the_rift, colosseum_glory, collections_logged
```

when wom adds a new boss, it shows up in their enum — that's our cue to add it to the registry. the validate script (see phase 1) will catch any keys in our registry that no longer exist in wom, and flag any wom bosses we haven't added yet.

---

## the problem (current state)

every subsystem maintains its own boss/skill list and makes its own decisions about format and wom keys:

| location                                                                    | what it stores           | format                                                   | wom key?                |
| --------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------- | ----------------------- |
| `server/utils/objectiveCollections.js` → `SOLO_BOSSES`                      | bingo-eligible bosses    | camelCase id, name, category, quantities, dropQuantities | ❌ no explicit field    |
| `client/src/utils/objectiveCollections.js`                                  | same as above            | duplicate copy                                           | ❌                      |
| `client/src/organisms/GroupDashboard/GroupGoalBuilder.jsx` → `BOSS_METRICS` | group dashboard dropdown | `{ value: 'snake_case', label: 'Display Name' }`         | ✅ value is the wom key |
| `server/utils/cwObjectiveCollections.js`                                    | cw objectives            | `boss: 'Display Name'` string only                       | ❌                      |
| `server/utils/rainbowTiles.js`                                              | rainbow board tiles      | `womMetric: 'snake_case'` per tile                       | ✅ explicit field       |
| `server/utils/womService.js`                                                | wom api calls            | uses wom keys directly inline                            | —                       |

skills have the same problem:

| location                                                                     | what it stores                                |
| ---------------------------------------------------------------------------- | --------------------------------------------- |
| `server/utils/objectiveCollections.js` → `SKILLS`                            | bingo-eligible skills with xp quantity ranges |
| `client/src/organisms/GroupDashboard/GroupGoalBuilder.jsx` → `SKILL_METRICS` | flat string array for the dropdown            |

**pain points:**

- mad angel took edits in 2 files just to show up in the group dashboard dropdown. it's still missing from bingo objectives entirely. maggot_king was also missing from the dropdown
- `SOLO_BOSSES` has no `womKey` field, so the connection to wom data is implicit (works for single-word bosses, silently wrong for anything like `mad_angel` vs `madAngel`)
- client has a full copy of `objectiveCollections.js` that can go stale independently of the server copy
- cw objectives reference bosses by display name string, not id — no cross-system linkability
- kc ranges, drop expectations, and difficulty labels are defined independently per-subsystem with no shared calibration

---

## proposed solution: a unified content registry

one file: `server/utils/contentRegistry.js`

all boss and skill metadata lives here, keyed on wom's enum values. every other subsystem imports what it needs and derives its format from the registry. the client gets the data via a lightweight api endpoint — no duplicate files.

---

### boss registry schema

the `womKey` field is the primary key and must be a valid value from wom's `Boss` enum. the camelCase `id` is derived from it for internal use (`mad_angel` → `madAngel`).

all optional fields live inline — `null` when not applicable. this keeps everything in one place even if some fields are only relevant to specific subsystems.

```js
{
  womKey: 'mad_angel',         // wom api metric key. must match wom's Boss enum exactly
  id: 'madAngel',              // camelCase version, used as internal id across the codebase
  displayName: 'Mad Angel',    // shown in all ui
  category: 'medium',          // short | medium | long — inherent boss difficulty/length
  tags: ['slayer'],            // searchable: 'afk', 'group-friendly', 'slayer', 'f2p', 'raid', etc.
  enabled: true,               // controls whether it appears in objective generation at all

  // baseline kc quantities — calibrated numbers used across all competition types.
  // all subsystems pull from here so a "medium mad angel task" means the same thing
  // in a bingo, a cw event, and a group dashboard goal.
  // null = boss doesn't support boss_kc objectives
  quantities: {
    short:  { min: 50,  max: 75  },
    medium: { min: 75,  max: 100 },
    long:   { min: 100, max: 150 },
  },

  // canonical list of notable drops for this boss.
  // this is our data — wom doesn't track drops. null = no drop objectives for this boss.
  // this is the single source for:
  //   - champion forge acceptableItems (currently defined per-objective in cwObjectiveCollections)
  //   - rainbow bingo validDrops (currently defined per-tile in rainbowTiles.js)
  //   - any future item_collection objective for this boss
  drops: ['Aggy', 'Hallowfell'],

  // how many drops count as a valid task at each difficulty.
  // null = boss doesn't support item_collection objectives
  dropQuantities: {
    short:  { min: 1, max: 1 },
    medium: { min: 2, max: 3 },
    long:   { min: 3, max: 4 },
  },

  killsPerHour: 25,            // kills per hour estimate. sources in priority order:
                               //   1. rainbowTiles.js: metricTarget / hoursEstimate (8 bosses)
                               //   2. wom ehb rates (fetched by validate-registry.js, stored in fixtures)
                               //   3. manual estimate. null if unknown

  // champion forge (formerly champion wars) specific metadata. null = boss not in cf objectives
  cw: {
    difficulty: 'adept',       // casual | standard | hardcore | adept
    label: 'Fallen Angel',     // flavour name shown in cf ui (not the boss name)
  },

  // gielinor rush (treasure hunt) specific metadata. null = use registry defaults.
  // gr currently derives everything it needs from the top-level quantities/dropQuantities/enabled,
  // so most bosses won't need this block. it exists for per-boss overrides as the feature grows.
  gr: {
    enabled: true,             // override the top-level enabled just for gr maps
    label: null,               // gr-specific flavour label, if different from displayName
    // future: nodeType, mapRegion, difficultyTierOverride, etc.
  },
}
```

note: `drops` is top-level, not nested under `cw` or `gr`. acceptable drops apply to any subsystem that supports item_collection — the subsystem blocks only hold presentation/override data specific to that game type.

### skill registry schema

skills are simpler — the wom key and id already match (all lowercase, no underscores). note: wom uses british spelling `defence`, match it exactly.

```js
{
  womKey: 'fishing',           // wom Skill enum value (british spelling where applicable: 'defence')
  id: 'fishing',               // same as womKey for skills
  displayName: 'Fishing',
  category: 'gathering',       // gathering | artisan | combat | support
  tags: ['afk', 'relaxing', 'profitable'],
  enabled: true,
  quantities: {                // xp ranges for bingo/gr objectives
    short:  { min: 300000,  max: 500000  },
    medium: { min: 500000,  max: 1000000 },
    long:   { min: 800000,  max: 1500000 },
  },
}
```

### raid registry schema

raids fall under wom's `Boss` enum. same shape as solo bosses but no `cw` block — raids don't appear in champion forge. they also only generate long-difficulty kc objectives.

```js
{
  womKey: 'chambers_of_xeric',
  id: 'chambersOfXeric',
  displayName: 'Chambers of Xeric',
  tags: ['raid', 'group'],
  enabled: true,
  quantities: {
    long: { min: 50, max: 75 },  // raids only ever appear in long objectives
  },
  drops: ['Twisted Bow', 'Kodai Wand', 'Elder Maul', ...],
  dropQuantities: {
    long: { min: 1, max: 2 },
  },
  killsPerHour: 3,
  cw: null,
  gr: null,
}
```

### minigame registry schema

minigames use wom's `Activity` enum. the `womKey` maps directly to the activity value. not all activities are minigames we'd use for objectives — `collections_logged` for example isn't relevant.

```js
{
  womKey: 'guardians_of_the_rift',   // wom Activity enum value
  id: 'guardiansOfTheRift',           // camelCase internal id
  displayName: 'Guardians of the Rift',
  category: 'skilling',               // skilling | combat | pvp
  tags: ['afk-friendly', 'runecrafting'],
  enabled: true,
  quantities: {                       // completion counts for objectives
    short:  { min: 50,  max: 75  },
    medium: { min: 75,  max: 150 },
    long:   { min: 150, max: 250 },
  },
}
```

### clue registry schema

clues also use wom's `Activity` enum. they're treated as their own content type since the tiered structure matters for objective generation and ui grouping.

```js
{
  womKey: 'clue_scrolls_hard',  // wom Activity enum value
  id: 'hard',                    // short tier name used as internal id
  displayName: 'Hard Clues',
  color: 'orange',               // used for ui display in ContentSelectionModal
  enabled: true,
  quantities: {                  // completion counts for objectives
    short:  { min: 5,  max: 10 },
    medium: { min: 10, max: 20 },
    long:   { min: 20, max: 35 },
  },
}
```

---

## resolvers: querying the registry by capability

instead of each subsystem knowing about registry internals, we expose named resolvers that answer specific questions. a game type or feature asks for what it needs and gets back only what's relevant.

```js
// all bosses that can generate a boss_kc objective (have quantities)
getBossKcBosses();
// → all bosses where quantities != null

// all bosses that can generate an item_collection objective (have drops defined)
getDropBosses();
// → all bosses where dropQuantities != null && drops != null

// all bosses that support both (for game types that mix them)
getBossesWithMetric('boss_kc' | 'item_collection' | 'both');

// for a specific boss, get its acceptable drops (our data, not wom)
getAcceptableDrops('madAngel');
// → ['Aggy', 'Hallowvale']

// group dashboard dropdown — sorted, wom keys as values
getBossMetricOptions();
// → [{ value: 'mad_angel', label: 'Mad Angel' }, ...]

// bingo objective generation — keyed by camelCase id
getSoloBossMap();
// → { madAngel: { ... }, vorkath: { ... }, ... }

// cw objective builder — only bosses with cw metadata
getCwBosses();
// → bosses where cw != null

// wom key validation sets
getValidWomBossKeys(); // → Set<string> (bosses + raids, both use Boss enum)
getValidWomSkillKeys(); // → Set<string>
getValidWomActivityKeys(); // → Set<string> (minigames + clues, both use Activity enum)
```

this means a new game type that only wants, say, slayer bosses with drop objectives can do:

```js
const tiles = getDropBosses().filter((b) => b.tags.includes('slayer'));
```

without knowing anything about the registry's internal structure.

---

## the client/server split

the registry lives server-side only. the client currently has a full copy of `objectiveCollections.js` — that goes away. instead:

1. add a `/api/content-registry` endpoint that returns a serialized version of the registry
2. client fetches and caches it at app startup (can piggyback on the existing auth/settings fetch)
3. store it in react context — it's static after load and needed broadly
4. `GroupGoalBuilder`, `ContentSelectionModal`, and anything else that currently imports from `client/src/utils/objectiveCollections.js` reads from that context instead

adding a new boss = edit one server-side file. the client picks it up on next load automatically.

---

## migration phases

### phase 1 — build the registry, keep everything else working

- create `server/utils/contentRegistry.js` with the full boss and skill list, all metadata
- add `/api/content-registry` endpoint (no auth required, it's static public data)
- no existing consumers change yet — registry runs alongside current lists
- write `server/scripts/validate-registry.js`: fetches wom's boss/skill enums and efficiency (ehb) rates, diffs against the registry, logs anything missing in either direction, and outputs a suggested `killsPerHour` for any boss currently set to `null`. snapshots both into `server/scripts/fixtures/`. run any time a new osrs update drops

### phase 2 — migrate server-side consumers

- `objectiveCollections.js`: derive `SOLO_BOSSES` and `SKILLS` from the registry. file becomes much smaller — just imports and re-exports derived shapes
- `cwObjectiveCollections.js`: replace `boss: 'Display Name'` strings with `bosId: 'madAngel'` references; derive the display name and drop list from `CW_BOSSES`
- `rainbowTiles.js`: add a startup assertion that every tile's `womMetric` exists in `VALID_WOM_BOSS_KEYS` (throws in dev, logs warning in prod); replace per-tile `validDrops` arrays with a lookup from `registry.getBoss(tile.womMetric).drops`; replace `bossOrSkill` strings with `registry.getBoss(tile.womMetric).displayName`
- `womService.js`: replace any inline `kc('some_key')` magic with registry lookups where metadata is needed

### phase 3 — migrate client-side consumers

- add `useContentRegistry()` hook backed by the `/api/content-registry` fetch, cached in context
- `GroupGoalBuilder.jsx`: replace `BOSS_METRICS` and `SKILL_METRICS` constants with derived values from the hook
- `ContentSelectionModal.jsx`: same — replace `SOLO_BOSSES` import with registry data
- any other component importing from `client/src/utils/objectiveCollections.js`: audit and migrate
- once all consumers are off it, delete `client/src/utils/objectiveCollections.js`

### phase 4 — enforce it

- ci check: if anyone modifies `client/src/utils/objectiveCollections.js`, fail with a clear message pointing to the registry
- test: `validate-registry.js` runs in ci against a pinned wom response snapshot — catches registry drift without a live api call
- update this doc with the "how to add a new boss" workflow, which at that point is: add one entry to `contentRegistry.js`, optionally add cw metadata, done

---

## calibrating the baseline quantities

the quantities in the registry are the shared measurement for what constitutes a "short", "medium", or "long" task at a given boss. when setting or updating them, consider:

- **kill speed** — a 5-minute boss and a 30-second boss shouldn't have the same short-task KC
- **drop rate** — `dropQuantities` should reflect realistic rates, not aspirational ones. if a drop is 1/500 the long quantity shouldn't be 3
- **cross-competition consistency** — a medium-difficulty mad angel task in a bingo and in a group dashboard goal should feel roughly equivalent in time investment. the registry enforces this by being the only place those numbers live

`killsPerHour` is a lightweight proxy for kill speed. it doesn't need to be exact — just enough to flag obviously miscalibrated quantities (e.g. 200 kc short task at a boss you can only do 5/hr).

---

## decisions

- **subsystem-specific fields** (`cw`, `gr`, `killsPerHour`, etc.) live inline in the registry entry with `null` for inapplicable ones. resolver functions hide the nulls from consumers so subsystems never need to know about fields that don't apply to them.
- **drops are manually maintained** — wom doesn't track drop items. when the validate script flags a new boss, that's also the cue to fill in the `drops` field. it can't be automated.
- **everything is in scope for phase 1** — bosses, raids, skills, minigames, clues. all are used across existing game types. `contentRegistry.js` exports `registry.bosses`, `registry.raids`, `registry.skills`, `registry.minigames`, `registry.clues`.
- **generated files get cleaned up** — `cwObjectiveCollections.generated.js`, `syncCwObjectives.js`, and other stale files get removed after migration. there's broader cleanup needed across the codebase beyond just these.
- **wom enum snapshot** — `validate-registry.js` snapshots wom's enums and efficiency rates into `server/scripts/fixtures/`. ci runs against the snapshot so it doesn't depend on wom being up. refresh the snapshot manually when wom adds new content.

---

## files touched (full list)

**new:**

- `server/utils/contentRegistry.js`
- `server/routes/contentRegistry.js` (or inline in existing routes)
- `server/scripts/validate-registry.js`
- `server/scripts/fixtures/wom-enums.json` (snapshot for ci)

**modified:**

- `server/utils/objectiveCollections.js` — derive from registry
- `server/utils/cwObjectiveCollections.js` — use boss ids, derive display/drop data from registry
- `server/utils/rainbowTiles.js` — validate `womMetric` keys, replace `validDrops` with registry lookup, replace `bossOrSkill` with `displayName`
- `server/utils/womService.js` — use registry for any metadata lookups
- `server/utils/groupDashboardHelpers.js` — use registry for wom key resolution
- `client/src/utils/objectiveCollections.js` — replace with thin api-backed wrapper
- `client/src/organisms/GroupDashboard/GroupGoalBuilder.jsx` — derive lists from registry via hook
- `client/src/organisms/TreasureHunt/ContentSelectionModal.jsx` — same

**deleted (eventually):**

- `client/src/utils/objectiveCollections.js` — once all consumers are migrated off it
