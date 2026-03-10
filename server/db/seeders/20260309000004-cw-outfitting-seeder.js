'use strict';
/**
 * Champion Forge — OUTFITTING phase scenario seeder
 *
 * Creates an event in the outfitting phase with both teams loaded with
 * a wide variety of war chest items so you can test:
 *   • Team Outfitter — equip items into champion slots
 *   • Consumable slot management (max 4)
 *   • Loadout save / revise / lock
 *   • Admin → Lock All Loadouts
 *
 * Team 1 "Iron Vanguard"  — captain devuser, no loadout yet
 * Team 2 "Shadow Sigil"   — captain ShadowLord, partially saved loadout (not locked)
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000004-cw-outfitting-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000004-cw-outfitting-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');

const EVENT_ID = 'cwev_outfitting01';
const TEAM1_ID = 'cwt_out_t1';
const TEAM2_ID = 'cwt_out_t2';

// Snapshots pulled from server/utils/clanWarsItems.js
const S = {
  // weapons
  RUSTED_SHORTSWORD:    { name: 'Rusted Shortsword',       slot: 'weapon',     rarity: 'common',   stats: { attack: 10, defense: 0,  speed: 7,  crit: 3,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  GRIMFANG_DAGGER:      { name: 'Grimfang Dagger',         slot: 'weapon',     rarity: 'uncommon', stats: { attack: 18, defense: 0,  speed: 15, crit: 10, hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  AXE_FALLEN_KING:      { name: 'Axe of the Fallen King',  slot: 'weapon',     rarity: 'rare',     stats: { attack: 38, defense: 0,  speed: 12, crit: 12, hp: 0  }, special: { id: 'cleave', label: 'Cleave', description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },
  VOID_WAND:            { name: 'Void-touched Wand',       slot: 'weapon',     rarity: 'rare',     stats: { attack: 35, defense: 0,  speed: 16, crit: 15, hp: 0  }, special: { id: 'ambush', label: 'Ambush', description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },
  SOULRENDER:           { name: 'Soulrender Blade',        slot: 'weapon',     rarity: 'epic',     stats: { attack: 65, defense: 0,  speed: 18, crit: 22, hp: 0  }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  // helms
  COPPER_SKULLCAP:      { name: 'Copper Skullcap',         slot: 'helm',       rarity: 'common',   stats: { attack: 0,  defense: 10, speed: 5,  crit: 0,  hp: 10 }, special: null, consumableType: null, consumableEffect: null },
  BONECREST_VISOR:      { name: 'Bonecrest Visor',         slot: 'helm',       rarity: 'uncommon', stats: { attack: 0,  defense: 22, speed: 8,  crit: 4,  hp: 20 }, special: null, consumableType: null, consumableEffect: null },
  HELM_FORSAKEN:        { name: 'Helm of the Forsaken',    slot: 'helm',       rarity: 'rare',     stats: { attack: 5,  defense: 38, speed: 12, crit: 8,  hp: 35 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  DREADHELM:            { name: 'Dreadhelm of the Abyss',  slot: 'helm',       rarity: 'epic',     stats: { attack: 10, defense: 55, speed: 18, crit: 15, hp: 60 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  // chest
  TATTERED_RINGMAIL:    { name: 'Tattered Ringmail',       slot: 'chest',      rarity: 'common',   stats: { attack: 0,  defense: 12, speed: 4,  crit: 0,  hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  HEXPLATE_BRIGANDINE:  { name: 'Hexplate Brigandine',     slot: 'chest',      rarity: 'uncommon', stats: { attack: 0,  defense: 28, speed: 7,  crit: 4,  hp: 30 }, special: null, consumableType: null, consumableEffect: null },
  VOID_WARPLATE:        { name: 'Void Warplate',           slot: 'chest',      rarity: 'rare',     stats: { attack: 5,  defense: 40, speed: 12, crit: 8,  hp: 45 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  ABYSSAL_WARPLATE:     { name: 'Abyssal Warplate',        slot: 'chest',      rarity: 'epic',     stats: { attack: 12, defense: 58, speed: 16, crit: 14, hp: 75 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  // legs
  IRONHIDE_GREAVES:     { name: 'Ironhide Greaves',        slot: 'legs',       rarity: 'uncommon', stats: { attack: 0,  defense: 24, speed: 8,  crit: 3,  hp: 25 }, special: null, consumableType: null, consumableEffect: null },
  GRAVEWARDEN_TASSETS:  { name: 'Gravewarden Tassets',     slot: 'legs',       rarity: 'rare',     stats: { attack: 5,  defense: 36, speed: 12, crit: 8,  hp: 40 }, special: { id: 'cleave', label: 'Cleave', description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },
  DREADKNIGHT_LEGPLATES:{ name: 'Dreadknight Legplates',   slot: 'legs',       rarity: 'epic',     stats: { attack: 10, defense: 52, speed: 18, crit: 14, hp: 65 }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' }, consumableType: null, consumableEffect: null },
  // gloves
  STEELSTITCH_GAUNTLETS:{ name: 'Steelstitch Gauntlets',   slot: 'gloves',     rarity: 'uncommon', stats: { attack: 10, defense: 14, speed: 8,  crit: 6,  hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  RIFTWEAVE_HANDGUARDS: { name: 'Riftweave Handguards',    slot: 'gloves',     rarity: 'rare',     stats: { attack: 20, defense: 22, speed: 14, crit: 14, hp: 25 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },
  GAUNTLETS_UNDYING:    { name: 'Gauntlets of the Undying',slot: 'gloves',     rarity: 'epic',     stats: { attack: 30, defense: 35, speed: 20, crit: 20, hp: 40 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  // boots
  QUICKFOOT_WRAPS:      { name: 'Quickfoot Wraps',         slot: 'boots',      rarity: 'uncommon', stats: { attack: 0,  defense: 12, speed: 16, crit: 5,  hp: 12 }, special: null, consumableType: null, consumableEffect: null },
  SHADOWSTRIDERS:       { name: 'Shadowstriders',          slot: 'boots',      rarity: 'rare',     stats: { attack: 5,  defense: 20, speed: 22, crit: 12, hp: 25 }, special: { id: 'ambush', label: 'Ambush', description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },
  BOOTS_OF_RIFT:        { name: 'Boots of the Rift',       slot: 'boots',      rarity: 'epic',     stats: { attack: 8,  defense: 30, speed: 30, crit: 18, hp: 40 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },
  // shields
  RUNEWALL_AEGIS:       { name: 'Runewall Aegis',          slot: 'shield',     rarity: 'rare',     stats: { attack: 0,  defense: 42, speed: 10, crit: 6,  hp: 50 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  BULWARK_LAST_AGE:     { name: 'Bulwark of the Last Age', slot: 'shield',     rarity: 'epic',     stats: { attack: 0,  defense: 62, speed: 14, crit: 10, hp: 75 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  // rings
  STONEWARD_RING:       { name: 'Stoneward Ring',          slot: 'ring',       rarity: 'uncommon', stats: { attack: 5,  defense: 12, speed: 6,  crit: 5,  hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  LOOP_OF_UNDYING:      { name: 'Loop of the Undying',     slot: 'ring',       rarity: 'rare',     stats: { attack: 12, defense: 18, speed: 14, crit: 14, hp: 30 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  RIFT_EYE_BAND:        { name: 'Rift-Eye Band',           slot: 'ring',       rarity: 'epic',     stats: { attack: 20, defense: 28, speed: 22, crit: 22, hp: 50 }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' }, consumableType: null, consumableEffect: null },
  // amulets
  EMBERSHARD_TORC:      { name: 'Embershard Torc',         slot: 'amulet',     rarity: 'uncommon', stats: { attack: 12, defense: 8,  speed: 10, crit: 8,  hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  AMULET_THORNVEIL:     { name: 'Amulet of the Thornveil', slot: 'amulet',     rarity: 'rare',     stats: { attack: 15, defense: 20, speed: 14, crit: 12, hp: 35 }, special: { id: 'ambush', label: 'Ambush', description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },
  COLLAR_RIFTBORN:      { name: 'Collar of the Riftborn',  slot: 'amulet',     rarity: 'epic',     stats: { attack: 25, defense: 30, speed: 22, crit: 20, hp: 55 }, special: { id: 'cleave', label: 'Cleave', description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },
  // capes
  SHADOWWEAVE_CAPE:     { name: 'Shadowweave Cape',        slot: 'cape',       rarity: 'uncommon', stats: { attack: 6,  defense: 10, speed: 12, crit: 6,  hp: 16 }, special: null, consumableType: null, consumableEffect: null },
  VOIDWEAVE_CLOAK:      { name: 'Voidweave Cloak',         slot: 'cape',       rarity: 'rare',     stats: { attack: 12, defense: 22, speed: 18, crit: 10, hp: 32 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },
  CAPE_UNDYING_VEIL:    { name: 'Cape of the Undying Veil',slot: 'cape',       rarity: 'epic',     stats: { attack: 20, defense: 35, speed: 26, crit: 18, hp: 52 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  // consumables
  BOAR_RIB:             { name: 'Boar Rib',                slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',        value: 40,  duration: 0, description: 'Restore 40 HP.' } },
  HUNTERS_STEW:         { name: "Hunter's Stew",           slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',        value: 65,  duration: 0, description: 'Restore 65 HP.' } },
  HEROS_FEAST:          { name: "Hero's Feast",            slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',        value: 90,  duration: 0, description: 'Restore 90 HP.' } },
  WARLORDS_BANQUET:     { name: "Warlord's Banquet",       slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',        value: 120, duration: 0, description: 'Restore 120 HP.' } },
  BERSERKER_DRAUGHT:    { name: 'Berserker Draught',       slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_attack', value: 12,  duration: 2, description: '+12 attack for 2 turns.' } },
  QUICKFOOT_ELIXIR:     { name: 'Quickfoot Elixir',        slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_speed',  value: 14,  duration: 2, description: '+14 speed for 2 turns.' } },
  SHARPEYE_TINCTURE:    { name: 'Sharpeye Tincture',       slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_crit',   value: 15,  duration: 3, description: '+15% crit for 3 turns.' } },
  BLINDING_POWDER:      { name: 'Blinding Powder',         slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'blind',  value: 0,  duration: 1, description: 'Enemy misses next attack.' } },
  VOIDFIRE_FLASK:       { name: 'Voidfire Flask',          slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage',      value: 35,  duration: 0, description: '35 magic damage, bypasses defense.' } },
  HEXBOLT_VIAL:         { name: 'Hexbolt Vial',            slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage',      value: 60,  duration: 0, description: '60 magic damage, bypasses defense.' } },
  CHAMPIONS_BLESSING:   { name: "Champion's Blessing",     slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir',  consumableEffect: { type: 'buff_all',    value: 15,  duration: 1, description: '+15 to all stats for 1 turn.' } },
};

// Helper to build an item row
function item(itemId, teamId, key, submId = null, earnedMinsAgo = 60) {
  const snap = S[key];
  return {
    itemId, teamId, eventId: EVENT_ID,
    name: snap.name, slot: snap.slot, rarity: snap.rarity,
    itemSnapshot: snap,
    sourceSubmissionId: submId,
    earnedAt: new Date(Date.now() - earnedMinsAgo * 60_000),
    isEquipped: false, isUsed: false,
  };
}

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Outfitting seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Outfitting Phase',
      status: 'OUTFITTING',
      difficulty: 'standard',
      guildId: '999999999999999999',
      gatheringStart: new Date(now - 24 * 3600_000),
      gatheringEnd:   new Date(now - 2  * 3600_000),
      outfittingEnd:  new Date(now.getTime() + 6 * 3600_000),
      eventConfig: {
        gatheringHours: 24,
        outfittingHours: 8,
        turnTimerSeconds: 60,
        battleStyle: 'TURN_BASED',
        maxConsumableSlots: 4,
        flexRolesAllowed: true,
      },
      bracket: null,
      creatorId: '1',
      adminIds: ['1'],
      createdAt: now,
      updatedAt: now,
    });

    // Generate full task pool (same as real event creation)
    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard');

    // Pick a spread of completed tasks for each team
    const pvmerTasks   = tasks.filter(t => t.role === 'PVMER');
    const skillerTasks = tasks.filter(t => t.role === 'SKILLER');
    const t1Done = [
      pvmerTasks[0].taskId, pvmerTasks[1].taskId, pvmerTasks[2].taskId,
      skillerTasks[0].taskId, skillerTasks[1].taskId,
    ];
    const t2Done = [
      pvmerTasks[3].taskId, pvmerTasks[4].taskId,
      skillerTasks[2].taskId, skillerTasks[3].taskId, skillerTasks[4].taskId,
    ];

    // -------------------------------------------------------------------------
    // Team 1: Iron Vanguard — no loadout saved yet
    // -------------------------------------------------------------------------
    await ClanWarsTeam.create({
      teamId: TEAM1_ID,
      eventId: EVENT_ID,
      teamName: 'Iron Vanguard',
      members: [
        { discordId: '100000000000000001', username: 'devuser',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000002', username: 'IronBow',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000003', username: 'VanguardWC', avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: '100000000000000001',
      taskProgress: {},
      completedTaskIds: t1Done,
      createdAt: now,
      updatedAt: now,
    });

    // -------------------------------------------------------------------------
    // Team 2: Shadow Sigil — partially saved loadout (not locked)
    // -------------------------------------------------------------------------
    await ClanWarsTeam.create({
      teamId: TEAM2_ID,
      eventId: EVENT_ID,
      teamName: 'Shadow Sigil',
      members: [
        { discordId: '200000000000000001', username: 'ShadowLord',   avatar: null, role: 'PVMER'   },
        { discordId: '200000000000000002', username: 'SigilArcher',  avatar: null, role: 'PVMER'   },
        { discordId: '200000000000000003', username: 'SigilSkiller', avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: {
        weapon: 'cwi_out_t2_001',   // VOID_WAND equipped
        helm: 'cwi_out_t2_005',     // HELM_FORSAKEN
      },
      loadoutLocked: false,
      captainDiscordId: '200000000000000001',
      taskProgress: {},
      completedTaskIds: t2Done,
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsTask.bulkCreate(
      tasks.map((t) => ({ ...t, createdAt: now, updatedAt: now }))
    );

    // -------------------------------------------------------------------------
    // War chest items — Team 1 (diverse options for meaningful choices)
    // -------------------------------------------------------------------------
    const t1Items = [
      item('cwi_out_t1_001', TEAM1_ID, 'RUSTED_SHORTSWORD', null, 200),
      item('cwi_out_t1_002', TEAM1_ID, 'GRIMFANG_DAGGER',   null, 180),
      item('cwi_out_t1_003', TEAM1_ID, 'AXE_FALLEN_KING',   null, 150),
      item('cwi_out_t1_004', TEAM1_ID, 'COPPER_SKULLCAP',   null, 200),
      item('cwi_out_t1_005', TEAM1_ID, 'BONECREST_VISOR',   null, 160),
      item('cwi_out_t1_006', TEAM1_ID, 'DREADHELM',         null, 120),
      item('cwi_out_t1_007', TEAM1_ID, 'TATTERED_RINGMAIL', null, 200),
      item('cwi_out_t1_008', TEAM1_ID, 'VOID_WARPLATE',     null, 140),
      item('cwi_out_t1_009', TEAM1_ID, 'IRONHIDE_GREAVES',  null, 180),
      item('cwi_out_t1_010', TEAM1_ID, 'GRAVEWARDEN_TASSETS', null, 130),
      item('cwi_out_t1_011', TEAM1_ID, 'STEELSTITCH_GAUNTLETS', null, 170),
      item('cwi_out_t1_012', TEAM1_ID, 'RIFTWEAVE_HANDGUARDS', null, 110),
      item('cwi_out_t1_013', TEAM1_ID, 'QUICKFOOT_WRAPS',   null, 190),
      item('cwi_out_t1_014', TEAM1_ID, 'SHADOWSTRIDERS',    null, 125),
      item('cwi_out_t1_015', TEAM1_ID, 'STONEWARD_RING',    null, 175),
      item('cwi_out_t1_016', TEAM1_ID, 'LOOP_OF_UNDYING',   null, 115),
      item('cwi_out_t1_017', TEAM1_ID, 'EMBERSHARD_TORC',   null, 165),
      item('cwi_out_t1_018', TEAM1_ID, 'SHADOWWEAVE_CAPE',  null, 185),
      item('cwi_out_t1_019', TEAM1_ID, 'VOIDWEAVE_CLOAK',   null, 135),
      // consumables (5 options — captain picks best 4)
      item('cwi_out_t1_020', TEAM1_ID, 'HEROS_FEAST',       null, 120),
      item('cwi_out_t1_021', TEAM1_ID, 'BERSERKER_DRAUGHT', null, 155),
      item('cwi_out_t1_022', TEAM1_ID, 'QUICKFOOT_ELIXIR',  null, 145),
      item('cwi_out_t1_023', TEAM1_ID, 'BLINDING_POWDER',   null, 190),
      item('cwi_out_t1_024', TEAM1_ID, 'CHAMPIONS_BLESSING', null, 100),
    ];

    // -------------------------------------------------------------------------
    // War chest items — Team 2 (skewed toward epic/rare for comparison)
    // -------------------------------------------------------------------------
    const t2Items = [
      item('cwi_out_t2_001', TEAM2_ID, 'VOID_WAND',         null, 200),
      item('cwi_out_t2_002', TEAM2_ID, 'SOULRENDER',        null, 140),
      item('cwi_out_t2_003', TEAM2_ID, 'AXE_FALLEN_KING',   null, 160),
      item('cwi_out_t2_004', TEAM2_ID, 'COPPER_SKULLCAP',   null, 200),
      item('cwi_out_t2_005', TEAM2_ID, 'HELM_FORSAKEN',     null, 155),
      item('cwi_out_t2_006', TEAM2_ID, 'HEXPLATE_BRIGANDINE', null, 175),
      item('cwi_out_t2_007', TEAM2_ID, 'ABYSSAL_WARPLATE',  null, 120),
      item('cwi_out_t2_008', TEAM2_ID, 'IRONHIDE_GREAVES',  null, 185),
      item('cwi_out_t2_009', TEAM2_ID, 'DREADKNIGHT_LEGPLATES', null, 110),
      item('cwi_out_t2_010', TEAM2_ID, 'GAUNTLETS_UNDYING', null, 130),
      item('cwi_out_t2_011', TEAM2_ID, 'BOOTS_OF_RIFT',     null, 135),
      item('cwi_out_t2_012', TEAM2_ID, 'RUNEWALL_AEGIS',    null, 145),
      item('cwi_out_t2_013', TEAM2_ID, 'BULWARK_LAST_AGE',  null, 100),
      item('cwi_out_t2_014', TEAM2_ID, 'RIFT_EYE_BAND',     null, 115),
      item('cwi_out_t2_015', TEAM2_ID, 'COLLAR_RIFTBORN',   null, 105),
      item('cwi_out_t2_016', TEAM2_ID, 'CAPE_UNDYING_VEIL', null, 125),
      // consumables
      item('cwi_out_t2_017', TEAM2_ID, 'WARLORDS_BANQUET',  null, 110),
      item('cwi_out_t2_018', TEAM2_ID, 'SHARPEYE_TINCTURE', null, 120),
      item('cwi_out_t2_019', TEAM2_ID, 'VOIDFIRE_FLASK',    null, 155),
      item('cwi_out_t2_020', TEAM2_ID, 'HEXBOLT_VIAL',      null, 100),
      item('cwi_out_t2_021', TEAM2_ID, 'HUNTERS_STEW',      null, 180),
    ];

    const allItems = [...t1Items, ...t2Items].map((i) => ({
      ...i, createdAt: new Date(), updatedAt: new Date(),
    }));
    await ClanWarsItem.bulkCreate(allItems);

    console.log('✅ Dev Outfitting seeder complete!');
    console.log(`   Event ID   : ${EVENT_ID}`);
    console.log(`   Team 1     : ${TEAM1_ID}  (Iron Vanguard — 19 items + 5 consumables, no loadout)`);
    console.log(`   Team 2     : ${TEAM2_ID}  (Shadow Sigil  — 16 items + 5 consumables, partial loadout)`);
    console.log(`   Admin view : /champion-forge/${EVENT_ID}`);
    console.log(`   Barracks 1 : /champion-forge/${EVENT_ID}/barracks/${TEAM1_ID}`);
    console.log(`   Barracks 2 : /champion-forge/${EVENT_ID}/barracks/${TEAM2_ID}`);
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    await ClanWarsItem.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Outfitting seeder undone.');
  },
};
