'use strict';

/**
 * Champion Forge — Task Pool
 *
 * Tasks are split by role:
 *   PVMER   — kill-count, boss, combat objectives
 *   SKILLER — skilling XP, item gathering, non-combat objectives
 *
 * Each task has:
 *   id         — stable unique string
 *   label      — display name shown to players
 *   description — optional hint / tooltip
 *   role       — 'PVMER' | 'SKILLER'
 *   difficulty — 'easy' | 'medium' | 'hard'
 *
 * At event creation the resolver samples from each bucket using seedrandom,
 * then bulk-inserts ClanWarsTask rows.
 *
 * Convention: task IDs start with 'pvm_' or 'skl_'
 */

// ---------------------------------------------------------------------------
// PVMER TASKS — combat / kill count
// ---------------------------------------------------------------------------

const PVM_EASY = [
  {
    id: 'pvm_easy_mole',
    label: 'Giant Mole Slayer',
    description: 'Kill 50 Giant Moles.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_sarachnis',
    label: 'Spider Season',
    description: 'Kill 30 Sarachnis.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_bryophyta',
    label: 'Moss Mauler',
    description: 'Kill 20 Bryophyta.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_obor',
    label: 'Hill Giant Havoc',
    description: 'Kill 30 Obor.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_dagannoth_rex',
    label: 'Rex in the Den',
    description: 'Kill 40 Dagannoth Rex.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_barrows',
    label: 'Barrows Run Blitz',
    description: 'Complete 20 Barrows chests.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_slayer',
    label: 'Slayer Streak',
    description: 'Complete 10 Slayer tasks.',
    role: 'PVMER',
    difficulty: 'easy',
  },
  {
    id: 'pvm_easy_wintertodt',
    label: 'Cold Snap Warmup',
    description: 'Complete 15 Wintertodt rounds.',
    role: 'PVMER',
    difficulty: 'easy',
  },
];

const PVM_MEDIUM = [
  {
    id: 'pvm_med_kalphite_queen',
    label: 'Queen\'s Bane',
    description: 'Kill 30 Kalphite Queen.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_kbd',
    label: 'Dragon Slayer',
    description: 'Kill 25 King Black Dragon.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_bandos',
    label: 'Big High War God',
    description: 'Kill 50 General Graardor.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_armadyl',
    label: 'Wings Clipped',
    description: 'Kill 50 Kree\'arra.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_zamorak',
    label: 'Chaos Reigned',
    description: 'Kill 50 K\'ril Tsutsaroth.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_saradomin',
    label: 'Light\'s End',
    description: 'Kill 50 Commander Zilyana.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_zulrah',
    label: 'Snake Charmer',
    description: 'Kill 50 Zulrah.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_nightmare',
    label: 'Sleepless Knight',
    description: 'Kill 20 The Nightmare.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_cox',
    label: 'Chambers Explorer',
    description: 'Complete 15 Chambers of Xeric.',
    role: 'PVMER',
    difficulty: 'medium',
  },
  {
    id: 'pvm_med_tob',
    label: 'Theatre Regular',
    description: 'Complete 10 Theatre of Blood.',
    role: 'PVMER',
    difficulty: 'medium',
  },
];

const PVM_HARD = [
  {
    id: 'pvm_hard_inferno',
    label: 'Touched by Fire',
    description: 'Complete 1 Inferno cape run.',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_cox_cm',
    label: 'Chambers: Challenge Mode',
    description: 'Complete 10 CoX Challenge Mode.',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_tob_hm',
    label: 'Hard Mode Theatre',
    description: 'Complete 5 ToB Hard Mode.',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_toa_expert',
    label: 'Tombs: Expert Mode',
    description: 'Complete 5 ToA at 300+ raid level.',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_nex',
    label: 'Nex Annihilated',
    description: 'Kill 30 Nex.',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_corp',
    label: 'Corporate Monster',
    description: 'Kill 20 Corporeal Beast solo.',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_slayer_master',
    label: 'Slayer Mastery',
    description: 'Complete 30 Slayer tasks (Duradel or Nieve only).',
    role: 'PVMER',
    difficulty: 'hard',
  },
  {
    id: 'pvm_hard_ba_attacker',
    label: 'Barbarian Assault Ace',
    description: 'Earn 150 Honour Points as Attacker in Barbarian Assault.',
    role: 'PVMER',
    difficulty: 'hard',
  },
];

// ---------------------------------------------------------------------------
// SKILLER TASKS — non-combat XP, gathering, crafting, clues
// ---------------------------------------------------------------------------

const SKL_EASY = [
  {
    id: 'skl_easy_fish',
    label: 'Fisherman\'s Luck',
    description: 'Catch 500 fish (any type).',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_woodcutting',
    label: 'Lumberjack',
    description: 'Chop 500 logs (any type).',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_mining',
    label: 'Rock Collector',
    description: 'Mine 500 ores (any type).',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_cooking',
    label: 'Short-Order Cook',
    description: 'Cook 300 food items successfully.',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_firemaking',
    label: 'Pyromaniac',
    description: 'Light 200 fires (any log type).',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_clue_beginner',
    label: 'Clue Newbie',
    description: 'Complete 10 Beginner clue scrolls.',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_farming',
    label: 'Green Thumb',
    description: 'Harvest 10 farming patches of any crop.',
    role: 'SKILLER',
    difficulty: 'easy',
  },
  {
    id: 'skl_easy_thieving',
    label: 'Sticky Fingers',
    description: 'Pickpocket 300 NPCs successfully.',
    role: 'SKILLER',
    difficulty: 'easy',
  },
];

const SKL_MEDIUM = [
  {
    id: 'skl_med_crafting',
    label: 'Jeweler\'s Guild',
    description: 'Craft 100 gems into jewellery.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_smithing',
    label: 'Master Blacksmith',
    description: 'Smith 200 bars into armour or weapons.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_herblore',
    label: 'Potions Expert',
    description: 'Brew 100 potions (prayer or combat only).',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_runecraft',
    label: 'Rune Crafter',
    description: 'Craft 5,000 runes at any altar.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_agility',
    label: 'Agility Grinder',
    description: 'Complete 200 laps on any agility course.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_clue_easy',
    label: 'Casual Treasure Hunter',
    description: 'Complete 15 Easy clue scrolls.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_clue_medium',
    label: 'Map Master',
    description: 'Complete 10 Medium clue scrolls.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_hunter',
    label: 'Nature\'s Trapper',
    description: 'Catch 100 creatures via Hunter.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_gp_1m',
    label: 'War Chest: 1M',
    description: 'Earn 1,000,000 GP through skilling methods.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
  {
    id: 'skl_med_construction',
    label: 'Home Improvement',
    description: 'Build 50 furniture items in your house.',
    role: 'SKILLER',
    difficulty: 'medium',
  },
];

const SKL_HARD = [
  {
    id: 'skl_hard_clue_hard',
    label: 'Hard Mode Treasure',
    description: 'Complete 10 Hard clue scrolls.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_clue_elite',
    label: 'Elite Treasure Hunter',
    description: 'Complete 5 Elite clue scrolls.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_gp_5m',
    label: 'War Chest: 5M',
    description: 'Earn 5,000,000 GP through skilling methods.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_99',
    label: '99 Grind',
    description: 'Achieve a level 99 in any skill during the event.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_farming_tree',
    label: 'Forest Keeper',
    description: 'Complete 5 full tree + fruit tree farming runs.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_slayer_xp',
    label: 'XP Machine',
    description: 'Earn 500,000 Slayer XP during the event.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_soul_runes',
    label: 'Soul Crafter',
    description: 'Craft 1,000 Soul runes.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
  {
    id: 'skl_hard_zalcano',
    label: 'Zalcano Dominator',
    description: 'Earn MVP in 20 Zalcano encounters.',
    role: 'SKILLER',
    difficulty: 'hard',
  },
];

// ---------------------------------------------------------------------------
// Exported structure — keyed by role then difficulty
// ---------------------------------------------------------------------------

const CW_OBJECTIVE_COLLECTIONS = {
  PVMER: {
    easy:   PVM_EASY,
    medium: PVM_MEDIUM,
    hard:   PVM_HARD,
  },
  SKILLER: {
    easy:   SKL_EASY,
    medium: SKL_MEDIUM,
    hard:   SKL_HARD,
  },
};

module.exports = { CW_OBJECTIVE_COLLECTIONS };
