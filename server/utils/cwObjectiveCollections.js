'use strict';

/**
 * Champion Forge — Task Pool
 *
 * Tasks are split by role:
 *   PVMER   — item collection drops from bosses / raids
 *   SKILLER — XP milestones (xp_gain) and skilling minigame completions
 *
 * Each task has:
 *   id         — stable unique string
 *   label      — display name shown to players
 *   description — optional hint / tooltip
 *   role       — 'PVMER' | 'SKILLER'
 *   difficulty — 'initiate' | 'adept' | 'master'
 *
 * At event creation the resolver samples from each bucket using seedrandom,
 * then bulk-inserts ClanWarsTask rows.
 *
 * Convention: task IDs start with 'pvm_' or 'skl_'
 */

// ---------------------------------------------------------------------------
// PVMER TASKS — item collection drops (no boss kill-count tasks)
// ---------------------------------------------------------------------------

const PVM_INITIATE = [
  {
    id: 'pvm_init_abyssal_whip',
    label: 'Abyssal Whip',
    description: 'Obtain an Abyssal Whip from the Abyssal Sire.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_trident_seas',
    label: 'Trident of the Seas',
    description: 'Obtain a Trident of the Seas from the Kraken.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_berserker_ring',
    label: 'Berserker Ring',
    description: 'Obtain a Berserker Ring from Dagannoth Rex.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_barrows_piece',
    label: 'Barrows Armour',
    description: 'Obtain any Barrows equipment piece from the Barrows.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_kbd_dragon_pickaxe',
    label: 'Dragon Pickaxe',
    description: 'Obtain a Dragon Pickaxe from the King Black Dragon.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_saradomin_sword',
    label: 'Saradomin Sword',
    description: 'Obtain a Saradomin Sword from Commander Zilyana.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_dragon_warhammer',
    label: 'Dragon Warhammer',
    description: 'Obtain a Dragon Warhammer from Lizardman Shamans.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
  {
    id: 'pvm_init_ancient_shards',
    label: 'Ancient Shards',
    description: 'Collect 5 Ancient Shards from Catacombs of Kourend Slayer monsters.',
    role: 'PVMER',
    difficulty: 'initiate',
  },
];

const PVM_ADEPT = [
  {
    id: 'pvm_adept_bandos_tassets',
    label: 'Bandos Tassets',
    description: 'Obtain Bandos Tassets from General Graardor.',
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_bandos_chestplate',
    label: 'Bandos Chestplate',
    description: 'Obtain a Bandos Chestplate from General Graardor.',
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_armadyl_chestplate',
    label: 'Armadyl Chestplate',
    description: "Obtain an Armadyl Chestplate from Kree'arra.",
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_armadyl_chainskirt',
    label: 'Armadyl Chainskirt',
    description: "Obtain an Armadyl Chainskirt from Kree'arra.",
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_tanzanite_fang',
    label: 'Tanzanite Fang',
    description: 'Obtain a Tanzanite Fang from Zulrah.',
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_vorkath_head',
    label: "Vorkath's Head",
    description: "Obtain Vorkath's Head from Vorkath.",
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_zenyte_shard',
    label: 'Zenyte Shard',
    description: 'Obtain a Zenyte Shard from Demonic Gorillas.',
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_spectral_sigil',
    label: 'Spectral Spirit Shield',
    description: 'Obtain a Spectral Spirit Shield from the Corporeal Beast.',
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_nightmare_orb',
    label: 'Nightmare Staff Orb',
    description: 'Obtain any Nightmare staff orb from The Nightmare.',
    role: 'PVMER',
    difficulty: 'adept',
  },
  {
    id: 'pvm_adept_crystal_armour_seed',
    label: 'Crystal Armour Seed',
    description: 'Obtain a Crystal Armour Seed from the Gauntlet.',
    role: 'PVMER',
    difficulty: 'adept',
  },
];

const PVM_MASTER = [
  {
    id: 'pvm_master_twisted_bow',
    label: 'Twisted Bow',
    description: 'Obtain a Twisted Bow from Chambers of Xeric.',
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_scythe_vitur',
    label: 'Scythe of Vitur',
    description: 'Obtain a Scythe of Vitur from Theatre of Blood.',
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_tumekens_shadow',
    label: "Tumeken's Shadow",
    description: "Obtain Tumeken's Shadow from Tombs of Amascut.",
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_elysian_sigil',
    label: 'Elysian Spirit Shield',
    description: 'Obtain an Elysian Spirit Shield from the Corporeal Beast.',
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_infernal_cape',
    label: 'Infernal Cape',
    description: 'Earn the Infernal Cape by completing the Inferno.',
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_avernic_hilt',
    label: 'Avernic Defender Hilt',
    description: 'Obtain an Avernic Defender Hilt from Theatre of Blood.',
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_zaryte_vambraces',
    label: 'Zaryte Vambraces',
    description: 'Obtain Zaryte Vambraces from Nex.',
    role: 'PVMER',
    difficulty: 'master',
  },
  {
    id: 'pvm_master_torva_platebody',
    label: 'Torva Platebody',
    description: 'Obtain a Torva Platebody from Nex.',
    role: 'PVMER',
    difficulty: 'master',
  },
];

// ---------------------------------------------------------------------------
// SKILLER TASKS — XP milestones (xp_gain) and skilling minigame completions
// ---------------------------------------------------------------------------

const SKL_INITIATE = [
  {
    id: 'skl_init_fishing_xp',
    label: 'Hooked In',
    description: 'Earn 300,000 Fishing XP.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_woodcutting_xp',
    label: 'Timber!',
    description: 'Earn 300,000 Woodcutting XP.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_mining_xp',
    label: 'Rock Solid',
    description: 'Earn 300,000 Mining XP.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_cooking_xp',
    label: 'Ready to Serve',
    description: 'Earn 300,000 Cooking XP.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_wintertodt',
    label: 'Cold Snap',
    description: 'Complete 15 Wintertodt rounds.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_tempoross',
    label: 'Fish Fight',
    description: 'Complete 10 Tempoross encounters.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_thieving_xp',
    label: 'Five-Finger Discount',
    description: 'Earn 300,000 Thieving XP.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
  {
    id: 'skl_init_firemaking_xp',
    label: 'Light It Up',
    description: 'Earn 300,000 Firemaking XP.',
    role: 'SKILLER',
    difficulty: 'initiate',
  },
];

const SKL_ADEPT = [
  {
    id: 'skl_adept_agility_xp',
    label: 'In Stride',
    description: 'Earn 500,000 Agility XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_herblore_xp',
    label: 'Brew Master',
    description: 'Earn 500,000 Herblore XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_runecrafting_xp',
    label: 'Rune Factory',
    description: 'Earn 500,000 Runecrafting XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_guardians_rift',
    label: 'Guardians of the Rift',
    description: 'Complete 15 Guardians of the Rift rounds.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_farming_xp',
    label: 'Green Fingers',
    description: 'Earn 500,000 Farming XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_hunter_xp',
    label: "Nature's Trapper",
    description: 'Earn 500,000 Hunter XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_construction_xp',
    label: 'Home Builder',
    description: 'Earn 500,000 Construction XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_crafting_xp',
    label: 'Master Craftsman',
    description: 'Earn 500,000 Crafting XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_smithing_xp',
    label: 'Anvil Pounder',
    description: 'Earn 500,000 Smithing XP.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
  {
    id: 'skl_adept_zalcano',
    label: 'Zalcano Miner',
    description: 'Complete 20 Zalcano encounters.',
    role: 'SKILLER',
    difficulty: 'adept',
  },
];

const SKL_MASTER = [
  {
    id: 'skl_master_agility_xp',
    label: 'Parkour Pro',
    description: 'Earn 1,000,000 Agility XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_runecrafting_xp',
    label: 'Soul of the Altar',
    description: 'Earn 1,000,000 Runecrafting XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_fishing_xp',
    label: 'Master Angler',
    description: 'Earn 1,000,000 Fishing XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_slayer_xp',
    label: 'Slayer Legend',
    description: 'Earn 1,000,000 Slayer XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_mining_xp',
    label: 'Deep Digger',
    description: 'Earn 1,000,000 Mining XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_sailing_xp',
    label: 'High Seas',
    description: 'Earn 1,000,000 Sailing XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_guardians_rift',
    label: 'Rift Veteran',
    description: 'Complete 50 Guardians of the Rift rounds.',
    role: 'SKILLER',
    difficulty: 'master',
  },
  {
    id: 'skl_master_herblore_xp',
    label: 'Alchemist Supreme',
    description: 'Earn 1,000,000 Herblore XP.',
    role: 'SKILLER',
    difficulty: 'master',
  },
];

// ---------------------------------------------------------------------------
// Exported structure — keyed by role then difficulty
// ---------------------------------------------------------------------------

const CW_OBJECTIVE_COLLECTIONS = {
  PVMER: {
    initiate: PVM_INITIATE,
    adept:    PVM_ADEPT,
    master:   PVM_MASTER,
  },
  SKILLER: {
    initiate: SKL_INITIATE,
    adept:    SKL_ADEPT,
    master:   SKL_MASTER,
  },
};

module.exports = { CW_OBJECTIVE_COLLECTIONS };
