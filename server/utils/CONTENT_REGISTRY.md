# Content Registry

`contentRegistry.js` is the single source of truth for all OSRS content used across the platform — Gielinor Rush map generation, Champion Forge task sampling, Group Dashboard goal metrics, and the client's content selection UI. Everything that references a boss, skill, raid, minigame, or clue tier pulls from here.

---

## Structure

The file defines five top-level maps, then a set of resolver functions, then exports everything.

| Map         | Keyed by              | Used for                                    |
| ----------- | --------------------- | ------------------------------------------- |
| `BOSSES`    | WOM boss enum key     | GR objectives, CF tasks, group dashboard    |
| `RAIDS`     | WOM boss enum key     | GR objectives, CF tasks, group dashboard    |
| `SKILLS`    | WOM skill enum key    | GR XP objectives, CF tasks, group dashboard |
| `MINIGAMES` | camelCase internal id | GR objectives, CF tasks                     |
| `CLUES`     | WOM activity enum key | GR objectives, group dashboard              |

---

## Entry Schemas

### BOSSES / RAIDS

```js
giant_mole: {
  womKey: 'giant_mole',      // WOM enum key; null if WOM tracks sub-bosses individually
  id: 'giantMole',           // camelCase internal key — used throughout the codebase
  displayName: 'Giant Mole',
  category: 'short',         // 'short' | 'medium' | 'long' | 'raid' — used for GR map budgeting
  tags: ['safe', 'beginner'],// freeform strings for filtering/display
  enabled: true,             // false = excluded from all systems

  // KC objective quantities by difficulty — used by event map generation
  quantities: {
    short: { min: 100, max: 150 },
    medium: { min: 175, max: 200 },
    long: { min: 200, max: 250 },
  },

  // Item collection objective options (displayed drops)
  drops: ['Baby Mole', 'Immaculate Mole Skin'],
  dropQuantities: {
    casual:   { min: 4, max: 6 },    // not all tiers required on every boss
    standard: { min: 6, max: 10 },
    hardcore: { min: 10, max: 14 },
  },

  killsPerHour: null,  // stubbed; not read by any current game logic

  // Champion Forge task definitions — one entry per task variant.
  // cfTasks is the pattern to follow for any future event that needs to associate
  // extra per-content data with a boss/raid/skill/minigame (e.g. a different event's
  // task list, drop overrides, or custom quantities). Add a new top-level array field
  // named after the event rather than extending cfTasks.
  cfTasks: [
    {
      id: 'pvm_giantMole',           // globally unique across all cfTasks
      role: 'PVMER',                  // 'PVMER' | 'SKILLER'
      type: 'item_collection',        // 'boss_kc' | 'item_collection' | 'xp_gain' | 'minigame_completions'
      difficulty: 'adept',           // 'initiate' | 'adept' | 'master'
      label: 'Underground Menace',   // display name for the task
      descriptionTemplate: 'Obtain {quantity} drops from the Giant Mole.',
      quantities: {
        casual:   { min: 4, max: 6 },
        standard: { min: 6, max: 10 },
        hardcore: { min: 10, max: 14 },
      },
      drops: [],  // synthesised at runtime — inherits parent entry's drops array
    },
  ],
}
```

RAIDS have the same shape plus a `shortName` field (e.g. `'CoX'`, `'ToB'`, `'ToA'`).

### SKILLS

```js
fishing: {
  womKey: 'fishing',
  id: 'fishing',
  displayName: 'Fishing',
  category: 'gathering',    // 'gathering' | 'production' | 'combat' | etc.
  tags: ['afk', 'relaxing'],
  enabled: true,

  // XP quantities by difficulty — used by event map generation
  quantities: {
    short:  { min: 300000, max: 500000 },
    medium: { min: 500000, max: 1000000 },
    long:   { min: 800000, max: 1500000 },
  },

  cfTasks: [ /* same shape as above, role: 'SKILLER', type: 'xp_gain' */ ],
}
```

Skills have no `drops`, `dropQuantities`, or `killsPerHour`.

### MINIGAMES

```js
tempoross: {
  womKey: 'tempoross',     // null if WOM doesn't track this minigame
  id: 'tempoross',
  displayName: 'Tempoross',
  category: 'skilling',
  tags: ['fishing', 'group', 'safe'],
  enabled: true,

  // Completion quantities by difficulty — used by event map generation
  quantities: { short: { min: 5, max: 15 }, ... },

  // Optional drops — shown in submission review UI
  drops: ['Tiny Tempor', 'Tackle Box', ...],

  cfTasks: [ /* role: 'SKILLER', type: 'minigame_completions' */ ],
}
```

### CLUES

```js
clue_scrolls_hard: {
  womKey: 'clue_scrolls_hard',
  id: 'hard',          // short tier id — used by ContentSelectionModal grouping logic
  displayName: 'Hard Clues',
  color: 'purple',     // used for UI color coding
  enabled: true,
  quantities: { short: { min: 5, max: 10 }, ... },
}
```

Clues have no `drops`, `cfTasks`, or `killsPerHour`.

---

## Special Cases

**`dagannoth_kings`** — `womKey: null` because WOM tracks the three kings individually (`dagannoth_prime`, `dagannoth_rex`, `dagannoth_supreme`). This entry is used for Gielinor Rush objectives only. The Group Dashboard boss dropdown uses the individual WOM keys instead.

**`killsPerHour: null`** — All boss/raid entries have `killsPerHour: null`. The field was stubbed for a future script that would populate rates from WOM EHB data, but that script hasn't been written yet. The field is not read by any game logic today.

**Legacy `cw` field** — A few older entries still have a `cw: { difficulty, label }` block rather than a `cfTasks` array. `getCwBosses()` / `getCwRaids()` handle both shapes: if `cfTasks` is present it synthesises a `cw` shim from the first task for backward compatibility.

---

## Exported Functions

### Data access (used by objectiveBuilder, cfTaskSampler, resolvers)

| Function                      | Returns                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `getBossKcBosses()`           | Enabled bosses with `quantities` (KC objectives)                                     |
| `getDropBosses()`             | Enabled bosses with `drops` + `dropQuantities` (item collection objectives)          |
| `getBossesWithMetric(metric)` | Filtered by `'boss_kc'`, `'item_collection'`, or `'both'`                            |
| `getAcceptableDrops(id)`      | Drop names for a boss by camelCase id                                                |
| `getCwBosses()`               | Bosses with CF task metadata (supports legacy `cw` and new `cfTasks`)                |
| `getCwRaids()`                | Raids with CF task metadata                                                          |
| `getCfTaskPool()`             | Full task pool grouped by `{ PVMER: { initiate, adept, master }, SKILLER: { ... } }` |

### Client-facing maps (served via `/api/content-registry`)

| Function           | Returns                       | Client key   |
| ------------------ | ----------------------------- | ------------ |
| `getSoloBossMap()` | `{ [camelCaseId]: boss }`     | `soloBosses` |
| `getRaidMap()`     | `{ [camelCaseId]: raid }`     | `raids`      |
| `getSkillMap()`    | `{ [camelCaseId]: skill }`    | `skills`     |
| `getMinigameMap()` | `{ [camelCaseId]: minigame }` | `minigames`  |
| `getClueMap()`     | `{ [shortTierId]: clue }`     | `clueTiers`  |

### Group Dashboard dropdowns

| Function                  | Returns                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `getBossMetricOptions()`  | `[{ value: womKey, label: displayName }]` — bosses + raids, sorted, excludes `womKey: null` |
| `getSkillMetricOptions()` | Same shape for skills                                                                       |
| `getClueMetricOptions()`  | Same shape for clues                                                                        |

### WOM validation

| Function                    | Returns                                           |
| --------------------------- | ------------------------------------------------- |
| `getValidWomBossKeys()`     | `Set` of all valid WOM boss + raid enum strings   |
| `getValidWomSkillKeys()`    | `Set` of all valid WOM skill enum strings         |
| `getValidWomActivityKeys()` | `Set` of WOM activity strings (minigames + clues) |

---

## Client-Side Flow

```
useContentRegistry() hook
  → GET /api/content-registry  (5-min Cache-Control)
  → server/routes/contentRegistry.js
  → pre-computed JSON from getSoloBossMap() / getRaidMap() / getSkillMap() / getMinigameMap() / getClueMap()
```

The payload is computed once at server startup (module load) and cached for the process lifetime. The client hook has its own in-memory cache (`_cache`) so the fetch only happens once per browser session even if multiple components call `useContentRegistry()`.

Consumers: `ContentSelectionModal`, `NodeDetailModal`, `GRMapVisualization`, `SubmissionsTab` (all in `client/src/organisms/GielinorRush/`), and `PlayerCard` in the draft room.

---

## Adding a New Entry

### Adding data for a new event type

If a future event needs to associate extra metadata with bosses, skills, or minigames (custom task lists, drop overrides, event-specific quantities, etc.), follow the `cfTasks` pattern: add a new top-level array field on the relevant entries named after the event (e.g. `grTasks`, `myEventTasks`). Then write a new resolver function in the exports block that reads only that field. This keeps each event's data self-contained inside the registry without coupling event systems to each other.

### New boss or raid

1. Add an entry to `BOSSES` (or `RAIDS`) following the schema above.
2. Set `enabled: true` and fill in `quantities`, `drops`, `dropQuantities`.
3. Add a `cfTasks` array if this boss should appear in Champion Forge. Give each task a globally unique `id` following the `pvm_<camelCaseId>` convention.
4. Leave `killsPerHour: null` — it will be populated by `validate-registry.js`.
5. If WOM doesn't track this boss directly, set `womKey: null` (it will be excluded from group dashboard dropdowns and WOM validation).

### New skill

1. Add an entry to `SKILLS` with `womKey` matching the WOM skill enum exactly (British spelling: `'defence'`, not `'defense'`).
2. Add a `cfTasks` entry with `role: 'SKILLER'`, `type: 'xp_gain'` if it should appear in Champion Forge.
3. No `drops` or `killsPerHour` needed.

### New minigame

1. Add an entry to `MINIGAMES` with a camelCase key (the key itself is the `id`).
2. Set `womKey` to the WOM Activity or Boss enum string, or `null` if WOM doesn't track it.
3. Add `drops` if the minigame has collectible rewards shown in submission review.

### Enabling/disabling content

Set `enabled: false` to exclude an entry from all systems without deleting it. Disabled bosses are excluded from GR map generation, CF task sampling, and the client dropdown. Re-enabling requires no other changes.

---

## Raw Registry Access

If you need the raw maps (e.g. for a one-off script or a new resolver that doesn't fit an existing helper):

```js
const { registry } = require('../utils/contentRegistry');
const { BOSSES, RAIDS, SKILLS, MINIGAMES, CLUES } = registry;
```
