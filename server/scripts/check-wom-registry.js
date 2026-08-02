'use strict';

// Compares the content registry against known WOM enums and reports anything
// in WOM that isn't covered, plus any registry womKeys that don't match a
// real WOM key (which would silently fail in group dashboard / validation).
//
// Run with: node server/scripts/check-wom-registry.js
//
// Update the WOM_* sets below whenever WOM adds new content.
// Source: https://docs.wiseoldman.net/api/global-type-definitions

// ── WOM enums (last synced 2026-08) ───────────────────────────────────────────

const WOM_BOSSES = new Set([
  'abyssal_sire', 'alchemical_hydra', 'amoxliatl', 'araxxor', 'artio',
  'barrows_chests', 'brutus', 'bryophyta', 'callisto', 'calvarion', 'cerberus',
  'chambers_of_xeric', 'chambers_of_xeric_challenge_mode', 'chaos_elemental',
  'chaos_fanatic', 'commander_zilyana', 'corporeal_beast', 'crazy_archaeologist',
  'dagannoth_prime', 'dagannoth_rex', 'dagannoth_supreme', 'deranged_archaeologist',
  'doom_of_mokhaiotl', 'duke_sucellus', 'general_graardor', 'giant_mole',
  'grotesque_guardians', 'hespori', 'kalphite_queen', 'king_black_dragon', 'kraken',
  'kreearra', 'kril_tsutsaroth', 'lunar_chests', 'mad_angel', 'maggot_king', 'mimic',
  'nex', 'nightmare', 'phosanis_nightmare', 'obor', 'phantom_muspah', 'sarachnis',
  'scorpia', 'scurrius', 'shellbane_gryphon', 'skotizo', 'sol_heredit', 'spindel',
  'tempoross', 'the_gauntlet', 'the_corrupted_gauntlet', 'the_hueycoatl',
  'the_leviathan', 'the_royal_titans', 'the_whisperer', 'theatre_of_blood',
  'theatre_of_blood_hard_mode', 'thermonuclear_smoke_devil', 'tombs_of_amascut',
  'tombs_of_amascut_expert', 'tzkal_zuk', 'tztok_jad', 'vardorvis', 'venenatis',
  'vetion', 'vorkath', 'wintertodt', 'yama', 'zalcano', 'zulrah',
]);

const WOM_SKILLS = new Set([
  'overall', 'attack', 'defence', 'strength', 'hitpoints', 'ranged', 'prayer',
  'magic', 'cooking', 'woodcutting', 'fletching', 'fishing', 'firemaking',
  'crafting', 'smithing', 'mining', 'herblore', 'agility', 'thieving', 'slayer',
  'farming', 'runecrafting', 'hunter', 'construction', 'sailing',
]);

const WOM_ACTIVITIES = new Set([
  'bounty_hunter_hunter', 'bounty_hunter_rogue', 'clue_scrolls_all',
  'clue_scrolls_beginner', 'clue_scrolls_easy', 'clue_scrolls_medium',
  'clue_scrolls_hard', 'clue_scrolls_elite', 'clue_scrolls_master',
  'last_man_standing', 'pvp_arena', 'soul_wars_zeal', 'guardians_of_the_rift',
  'colosseum_glory', 'collections_logged',
]);

// ── Intentional exclusions ────────────────────────────────────────────────────
// WOM keys that are deliberately absent from the registry, with a reason.
// Add entries here to silence the "not in registry" warning for a known key.

const EXCLUDED_BOSSES = {
  // WOM tracks the kings individually; we use a composite dagannoth_kings entry
  // with womKey: null for event objectives
  dagannoth_prime:   'use dagannoth_kings composite entry (womKey: null)',
  dagannoth_rex:     'use dagannoth_kings composite entry (womKey: null)',
  dagannoth_supreme: 'use dagannoth_kings composite entry (womKey: null)',
  // WOM classifies these as Bosses, but we model them as MINIGAMES because
  // their objective type is completions, not KC. Their womKey is still valid —
  // it just lives in the MINIGAMES map instead of BOSSES.
  tempoross:   'modelled as MINIGAME — womKey is a WOM Boss key',
  wintertodt:  'modelled as MINIGAME — womKey is a WOM Boss key',
  zalcano:     'modelled as MINIGAME — womKey is a WOM Boss key',
  tztok_jad:   'modelled as MINIGAME (Fight Caves) — womKey is a WOM Boss key',
  tzkal_zuk:   'modelled as MINIGAME (Inferno) — womKey is a WOM Boss key',
  sol_heredit: 'modelled as MINIGAME (Colosseum) — womKey is a WOM Boss key',
};

const EXCLUDED_SKILLS = {
  // Combat stats aren't useful as standalone event objectives
  overall:   'not used as an event objective',
  attack:    'combat stat — not a standalone event objective',
  defence:   'combat stat — not a standalone event objective',
  strength:  'combat stat — not a standalone event objective',
  hitpoints: 'combat stat — not a standalone event objective',
  ranged:    'combat stat — not a standalone event objective',
  prayer:    'combat stat — not a standalone event objective',
  magic:     'combat stat — not a standalone event objective',
};

const EXCLUDED_ACTIVITIES = {
  clue_scrolls_all:    'aggregate — individual tiers are tracked instead',
  bounty_hunter_hunter: 'PvP minigame — not used for event objectives',
  bounty_hunter_rogue:  'PvP minigame — not used for event objectives',
  last_man_standing:    'PvP minigame — not used for event objectives',
  pvp_arena:            'PvP minigame — not used for event objectives',
  soul_wars_zeal:       'PvP minigame — not used for event objectives',
  colosseum_glory:      'not yet added to registry',
  collections_logged:   'account metric — not used for event objectives',
};

// MINIGAME entries whose womKey is a WOM Boss key (not Activity).
// These are valid keys — just in the wrong WOM category from our perspective.
// Exclude them from the "invalid activity key" check.
const MINIGAME_BOSS_KEYS = new Set([
  'tempoross', 'wintertodt', 'zalcano', 'tztok_jad', 'tzkal_zuk', 'sol_heredit',
]);

// ── Load registry ─────────────────────────────────────────────────────────────

const path = require('path');
const { registry } = require(path.join(__dirname, '../utils/contentRegistry'));
const { BOSSES, RAIDS, SKILLS, MINIGAMES, CLUES } = registry;

function collectWomKeys(map) {
  return new Set(
    Object.values(map)
      .map((e) => e.womKey)
      .filter(Boolean)
  );
}

const registryBossKeys     = collectWomKeys({ ...BOSSES, ...RAIDS });
const registrySkillKeys    = collectWomKeys(SKILLS);
const registryActivityKeys = collectWomKeys({ ...MINIGAMES, ...CLUES });

// ── Diff ──────────────────────────────────────────────────────────────────────

function diff(womSet, registrySet, exclusions, label) {
  const missing   = [];
  const excluded  = [];
  const invalid   = [];
  const newIgnore = [];

  for (const key of womSet) {
    if (registrySet.has(key)) continue;
    if (exclusions[key]) {
      excluded.push({ key, reason: exclusions[key] });
    } else {
      missing.push(key);
    }
  }

  for (const key of registrySet) {
    if (!womSet.has(key)) invalid.push(key);
  }

  // Exclusions that are now actually in the registry (stale exclusion entries)
  for (const key of Object.keys(exclusions)) {
    if (registrySet.has(key)) newIgnore.push(key);
  }

  return { label, missing, excluded, invalid, newIgnore };
}

// For the Activities diff, strip out MINIGAME keys that are WOM Boss keys —
// they're legitimately in the registry but under the Boss enum, not Activity.
const registryActivityKeysFiltered = new Set(
  [...registryActivityKeys].filter((k) => !MINIGAME_BOSS_KEYS.has(k))
);

const results = [
  diff(WOM_BOSSES,     registryBossKeys,            EXCLUDED_BOSSES,     'Bosses / Raids'),
  diff(WOM_SKILLS,     registrySkillKeys,            EXCLUDED_SKILLS,     'Skills'),
  diff(WOM_ACTIVITIES, registryActivityKeysFiltered, EXCLUDED_ACTIVITIES, 'Activities (Minigames + Clues)'),
];

// ── Output ────────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const GRAY   = '\x1b[90m';
const BOLD   = '\x1b[1m';

let anyIssues = false;

for (const { label, missing, excluded, invalid, newIgnore } of results) {
  console.log(`\n${BOLD}── ${label} ──${RESET}`);

  if (missing.length) {
    anyIssues = true;
    console.log(`${RED}  ✗ In WOM but not in registry (consider adding):${RESET}`);
    for (const key of missing) console.log(`      ${key}`);
  }

  if (invalid.length) {
    anyIssues = true;
    console.log(`${YELLOW}  ⚠ In registry but not a valid WOM key (typo?):${RESET}`);
    for (const key of invalid) console.log(`      ${key}`);
  }

  if (newIgnore.length) {
    anyIssues = true;
    console.log(`${YELLOW}  ⚠ These keys are in EXCLUDED_* but are now also in the registry — remove the exclusion:${RESET}`);
    for (const key of newIgnore) console.log(`      ${key}`);
  }

  if (excluded.length) {
    console.log(`${GRAY}  · Intentionally excluded (${excluded.length}):${RESET}`);
    for (const { key, reason } of excluded) {
      console.log(`${GRAY}      ${key} — ${reason}${RESET}`);
    }
  }

  if (!missing.length && !invalid.length && !newIgnore.length) {
    console.log(`${GREEN}  ✓ All WOM keys accounted for${RESET}`);
  }
}

console.log('');
if (anyIssues) {
  console.log(`${YELLOW}${BOLD}Registry has gaps — see above.${RESET}`);
  if (require.main === module) process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}Registry is in sync with WOM.${RESET}`);
}
