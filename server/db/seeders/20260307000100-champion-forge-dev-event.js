'use strict';

/**
 * Dev seeder: Champion Forge "Dev Showdown"
 *
 * Creates a fully-populated event in BATTLE status with:
 *   - 2 teams (The Crimson Oath vs The Azure Pact)
 *   - Complete war chests + locked official loadouts
 *   - A battle record in IN_PROGRESS (turn 1, Team 1 goes first)
 *   - A bracket with the match wired up
 *
 * Creator: user ID 1 (you).
 *
 * To run:  npx sequelize-cli db:seed --seed 20260307000100-champion-forge-dev-event.js
 * To undo: npx sequelize-cli db:seed:undo --seed 20260307000100-champion-forge-dev-event.js
 */

const EVENT_ID  = 'cwev_devtest01';
const TEAM1_ID  = 'cwteam_crimson1';
const TEAM2_ID  = 'cwteam_azure001';
const BATTLE_ID = 'cwbat_devtest1';

// ── Item IDs ──────────────────────────────────────────────────────────────────

const C1 = {
  weapon: 'cwitem_c1weap01', // Shadowstep Dagger (rare, barrage)
  helm:   'cwitem_c1helm01', // Bonecrest Visor (uncommon)
  chest:  'cwitem_c1ches01', // Gloomweave Tunic (uncommon)
  legs:   'cwitem_c1legs01', // Ashwalker Trousers (uncommon)
  gloves: 'cwitem_c1glov01', // Steelstitch Gauntlets (uncommon)
  boots:  'cwitem_c1boot01', // Quickfoot Wraps (uncommon)
  ring:   'cwitem_c1ring01', // Ring of the Houndmaster (uncommon)
  amulet: 'cwitem_c1amul01', // Embershard Torc (uncommon)
  cape:   'cwitem_c1cape01', // Shadowweave Cape (uncommon)
  con1:   'cwitem_c1con01',  // Boar Rib (food, +40 HP)
  con2:   'cwitem_c1con02',  // Hunter's Stew (food, +65 HP)
  con3:   'cwitem_c1con03',  // Berserker Draught (potion, +12 atk 2 turns)
  con4:   'cwitem_c1con04',  // Blinding Powder (utility, enemy misses)
};

const C2 = {
  weapon: 'cwitem_c2weap01', // Void-touched Wand (rare, ambush)
  helm:   'cwitem_c2helm01', // Helm of the Forsaken (rare, fortress)
  chest:  'cwitem_c2ches01', // Void Warplate (rare, lifesteal)
  legs:   'cwitem_c2legs01', // Bonescale Tassets (uncommon)
  gloves: 'cwitem_c2glov01', // Grizzly Paw Gloves (uncommon)
  boots:  'cwitem_c2boot01', // Ironhide Sabatons (uncommon)
  shield: 'cwitem_c2shld01', // Stoneward Kite Shield (uncommon)
  ring:   'cwitem_c2ring01', // Stoneward Ring (uncommon)
  amulet: 'cwitem_c2amul01', // Pendant of the Deep (uncommon)
  cape:   'cwitem_c2cape01', // Ironback Shroud (uncommon)
  con1:   'cwitem_c2con01',  // Hero's Feast (food, +90 HP)
  con2:   'cwitem_c2con02',  // Ironhide Salve (potion, +18 def 2 turns)
  con3:   'cwitem_c2con03',  // Voidfire Flask (utility, 35 magic dmg)
  con4:   'cwitem_c2con04',  // Voidheart Elixir (elixir, +50 HP + debuff clear)
};

// ── Item snapshots ─────────────────────────────────────────────────────────────

const SNAPSHOTS = {
  // Crimson Oath
  [C1.weapon]: { name: 'Shadowstep Dagger', slot: 'weapon', rarity: 'rare',     stats: { attack: 30, defense: 0,  speed: 22, crit: 18, hp: 0  }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' } },
  [C1.helm]:   { name: 'Bonecrest Visor',   slot: 'helm',   rarity: 'uncommon', stats: { attack: 0,  defense: 22, speed: 8,  crit: 4,  hp: 20 }, special: null },
  [C1.chest]:  { name: 'Gloomweave Tunic',  slot: 'chest',  rarity: 'uncommon', stats: { attack: 0,  defense: 24, speed: 10, crit: 5,  hp: 25 }, special: null },
  [C1.legs]:   { name: 'Ashwalker Trousers',slot: 'legs',   rarity: 'uncommon', stats: { attack: 0,  defense: 22, speed: 10, crit: 5,  hp: 22 }, special: null },
  [C1.gloves]: { name: 'Steelstitch Gauntlets', slot: 'gloves', rarity: 'uncommon', stats: { attack: 10, defense: 14, speed: 8, crit: 6, hp: 15 }, special: null },
  [C1.boots]:  { name: 'Quickfoot Wraps',   slot: 'boots',  rarity: 'uncommon', stats: { attack: 0,  defense: 12, speed: 16, crit: 5,  hp: 12 }, special: null },
  [C1.ring]:   { name: 'Ring of the Houndmaster', slot: 'ring', rarity: 'uncommon', stats: { attack: 10, defense: 8, speed: 10, crit: 8, hp: 15 }, special: null },
  [C1.amulet]: { name: 'Embershard Torc',   slot: 'amulet', rarity: 'uncommon', stats: { attack: 12, defense: 8,  speed: 10, crit: 8,  hp: 18 }, special: null },
  [C1.cape]:   { name: 'Shadowweave Cape',  slot: 'cape',   rarity: 'uncommon', stats: { attack: 6,  defense: 10, speed: 12, crit: 6,  hp: 16 }, special: null },
  [C1.con1]:   { name: 'Boar Rib',          slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal', value: 40, duration: 0, description: 'Restore 40 HP.' } },
  [C1.con2]:   { name: "Hunter's Stew",     slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal', value: 65, duration: 0, description: 'Restore 65 HP.' } },
  [C1.con3]:   { name: 'Berserker Draught', slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_attack', value: 12, duration: 2, description: '+12 attack for 2 turns.' } },
  [C1.con4]:   { name: 'Blinding Powder',   slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'blind', value: 0, duration: 1, description: 'Enemy misses next attack.' } },

  // Azure Pact
  [C2.weapon]: { name: 'Void-touched Wand',     slot: 'weapon', rarity: 'rare', stats: { attack: 35, defense: 0,  speed: 16, crit: 15, hp: 0  }, special: { id: 'ambush',   label: 'Ambush',   description: 'Ignore defense, guaranteed crit' } },
  [C2.helm]:   { name: 'Helm of the Forsaken',  slot: 'helm',   rarity: 'rare', stats: { attack: 5,  defense: 38, speed: 12, crit: 8,  hp: 35 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' } },
  [C2.chest]:  { name: 'Void Warplate',          slot: 'chest',  rarity: 'rare', stats: { attack: 5,  defense: 40, speed: 12, crit: 8,  hp: 45 }, special: { id: 'lifesteal',label: 'Lifesteal',description: 'Heal 30% of damage dealt this turn' } },
  [C2.legs]:   { name: 'Bonescale Tassets',      slot: 'legs',   rarity: 'uncommon', stats: { attack: 0,  defense: 26, speed: 7,  crit: 4,  hp: 28 }, special: null },
  [C2.gloves]: { name: 'Grizzly Paw Gloves',     slot: 'gloves', rarity: 'uncommon', stats: { attack: 12, defense: 12, speed: 9,  crit: 8,  hp: 12 }, special: null },
  [C2.boots]:  { name: 'Ironhide Sabatons',      slot: 'boots',  rarity: 'uncommon', stats: { attack: 0,  defense: 18, speed: 10, crit: 3,  hp: 18 }, special: null },
  [C2.shield]: { name: 'Stoneward Kite Shield',  slot: 'shield', rarity: 'uncommon', stats: { attack: 0,  defense: 26, speed: 7,  crit: 2,  hp: 30 }, special: null },
  [C2.ring]:   { name: 'Stoneward Ring',          slot: 'ring',   rarity: 'uncommon', stats: { attack: 5,  defense: 12, speed: 6,  crit: 5,  hp: 18 }, special: null },
  [C2.amulet]: { name: 'Pendant of the Deep',    slot: 'amulet', rarity: 'uncommon', stats: { attack: 8,  defense: 10, speed: 8,  crit: 6,  hp: 20 }, special: null },
  [C2.cape]:   { name: 'Ironback Shroud',         slot: 'cape',   rarity: 'uncommon', stats: { attack: 5,  defense: 14, speed: 9,  crit: 5,  hp: 20 }, special: null },
  [C2.con1]:   { name: "Hero's Feast",            slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal', value: 90, duration: 0, description: 'Restore 90 HP.' } },
  [C2.con2]:   { name: 'Ironhide Salve',          slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_defense', value: 18, duration: 2, description: '+18 defense for 2 turns.' } },
  [C2.con3]:   { name: 'Voidfire Flask',          slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage', value: 35, duration: 0, description: '35 magic damage, bypasses defense.' } },
  [C2.con4]:   { name: 'Voidheart Elixir',        slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir',  consumableEffect: { type: 'heal', value: 50, duration: 0, description: 'Restore 50 HP and remove one debuff.' } },
};

// ── Pre-computed champion stats ────────────────────────────────────────────────
// (sum of equipped gear stats + base 100 HP — mirrors buildChampionStats logic)

const SNAP1 = {
  teamId: TEAM1_ID,
  teamName: 'The Crimson Oath',
  stats: {
    attack:  58,  // 30+10+12+6
    defense: 120, // 22+24+22+14+12+8+8+10
    speed:   106, // 22+8+10+10+8+16+10+10+12
    crit:    65,  // 18+4+5+5+6+5+8+8+6
    hp:      243, // 100 base + 20+25+22+15+12+15+18+16
    maxHp:   243,
  },
  specials: ['barrage'],
  consumables: [
    { itemId: C1.con1, name: 'Boar Rib',          consumableType: 'food',    consumableEffect: { type: 'heal', value: 40 } },
    { itemId: C1.con2, name: "Hunter's Stew",      consumableType: 'food',    consumableEffect: { type: 'heal', value: 65 } },
    { itemId: C1.con3, name: 'Berserker Draught',  consumableType: 'potion',  consumableEffect: { type: 'buff_attack', value: 12, duration: 2 } },
    { itemId: C1.con4, name: 'Blinding Powder',    consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'blind', duration: 1 } },
  ],
};

const SNAP2 = {
  teamId: TEAM2_ID,
  teamName: 'The Azure Pact',
  stats: {
    attack:  75,  // 35+5+5+12+5+8+5
    defense: 196, // 38+40+26+12+18+26+12+10+14
    speed:   96,  // 16+12+12+7+9+10+7+6+8+9
    crit:    64,  // 15+8+8+4+8+3+2+5+6+5
    hp:      326, // 100 base + 35+45+28+12+18+30+18+20+20
    maxHp:   326,
  },
  specials: ['ambush', 'fortress', 'lifesteal'],
  consumables: [
    { itemId: C2.con1, name: "Hero's Feast",   consumableType: 'food',    consumableEffect: { type: 'heal', value: 90 } },
    { itemId: C2.con2, name: 'Ironhide Salve', consumableType: 'potion',  consumableEffect: { type: 'buff_defense', value: 18, duration: 2 } },
    { itemId: C2.con3, name: 'Voidfire Flask', consumableType: 'utility', consumableEffect: { type: 'damage', value: 35 } },
    { itemId: C2.con4, name: 'Voidheart Elixir', consumableType: 'elixir', consumableEffect: { type: 'heal', value: 50 } },
  ],
};

// Team 1 goes first (speed 106 > 96)
const INITIAL_BATTLE_STATE = {
  currentTurn: 'team1',
  turnNumber: 1,
  hp: { team1: 243, team2: 326 },
  activeEffects: { team1: [], team2: [] },
  defendActive: { team1: false, team2: false },
  consumablesRemaining: {
    team1: [C1.con1, C1.con2, C1.con3, C1.con4],
    team2: [C2.con1, C2.con2, C2.con3, C2.con4],
  },
  specialUsed: { team1: false, team2: false },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(itemId, teamId, eventId, now) {
  const snap = SNAPSHOTS[itemId];
  return {
    itemId,
    teamId,
    eventId,
    name: snap.name,
    slot: snap.slot,
    rarity: snap.rarity,
    itemSnapshot: snap,
    sourceSubmissionId: null,
    earnedAt: now,
    isEquipped: true,
    isUsed: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Seeder ────────────────────────────────────────────────────────────────────

module.exports = {
  async up(queryInterface) {
    // Load models directly so ORM handles JSONB + ARRAY serialisation
    // (avoids queryInterface.bulkInsert quirks with complex PG types)
    const models = require('../models');
    const {
      ClanWarsEvent, ClanWarsTeam, ClanWarsItem,
      ClanWarsBattle, ClanWarsBattleEvent, ClanWarsTask, ClanWarsSubmission,
    } = models;

    // Idempotency guard — skip if already seeded
    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Dev seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    // ── Event ──────────────────────────────────────────────────────────────────
    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Champion Forge — Dev Showdown',
      status: 'BATTLE',
      gatheringStart: new Date(now - 48 * 3600_000),
      gatheringEnd:   new Date(now - 24 * 3600_000),
      outfittingEnd:  new Date(now -  1 * 3600_000),
      eventConfig: {
        gatheringHours: 24,
        outfittingHours: 4,
        turnTimerSeconds: 60,
        battleStyle: 'TURN_BASED',
        maxConsumableSlots: 4,
        flexRolesAllowed: true,
      },
      bracket: {
        rounds: [{
          matches: [{
            team1Id: TEAM1_ID,
            team2Id: TEAM2_ID,
            winnerId: null,
            battleId: BATTLE_ID,
            isBye: false,
          }],
        }],
      },
      creatorId: '1',
      adminIds: ['1'],
      createdAt: now,
      updatedAt: now,
    });

    // ── Teams ──────────────────────────────────────────────────────────────────
    await ClanWarsTeam.create({
      teamId: TEAM1_ID,
      eventId: EVENT_ID,
      teamName: 'The Crimson Oath',
      discordRoleId: '111111111111111111',
      members: [
        { discordId: '100000000000000001', username: 'devuser',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000002', username: 'CrimsonAce', avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000003', username: 'OathSkiller', avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: {
        weapon: C1.weapon,
        helm:   C1.helm,
        chest:  C1.chest,
        legs:   C1.legs,
        gloves: C1.gloves,
        boots:  C1.boots,
        ring:   C1.ring,
        amulet: C1.amulet,
        cape:   C1.cape,
        consumables: [C1.con1, C1.con2, C1.con3, C1.con4],
      },
      loadoutLocked: true,
      captainDiscordId: '100000000000000001',
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsTeam.create({
      teamId: TEAM2_ID,
      eventId: EVENT_ID,
      teamName: 'The Azure Pact',
      discordRoleId: '222222222222222222',
      members: [
        { discordId: '200000000000000001', username: 'AzureLord',    avatar: null, role: 'PVMER'   },
        { discordId: '200000000000000002', username: 'PactShielder',  avatar: null, role: 'PVMER'   },
        { discordId: '200000000000000003', username: 'AzureSkiller',  avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: {
        weapon: C2.weapon,
        helm:   C2.helm,
        chest:  C2.chest,
        legs:   C2.legs,
        gloves: C2.gloves,
        boots:  C2.boots,
        shield: C2.shield,
        ring:   C2.ring,
        amulet: C2.amulet,
        cape:   C2.cape,
        consumables: [C2.con1, C2.con2, C2.con3, C2.con4],
      },
      loadoutLocked: true,
      captainDiscordId: '200000000000000001',
      createdAt: now,
      updatedAt: now,
    });

    // ── Items (war chests) ─────────────────────────────────────────────────────
    const team1Items = Object.values(C1).map((id) => makeItem(id, TEAM1_ID, EVENT_ID, now));
    const team2Items = Object.values(C2).map((id) => makeItem(id, TEAM2_ID, EVENT_ID, now));

    for (const item of [...team1Items, ...team2Items]) {
      await ClanWarsItem.create(item);
    }

    // ── Tasks (reference — gathering is over) ──────────────────────────────────
    const taskDefs = [
      { taskId: 'cwtask_dev00001', label: 'Barrows Armour',    difficulty: 'initiate', role: 'PVMER'   },
      { taskId: 'cwtask_dev00002', label: 'Twisted Bow',       difficulty: 'master',   role: 'PVMER'   },
      { taskId: 'cwtask_dev00003', label: 'Hooked In',         difficulty: 'initiate', role: 'SKILLER' },
      { taskId: 'cwtask_dev00004', label: 'Rune Factory',      difficulty: 'adept',    role: 'SKILLER' },
      { taskId: 'cwtask_dev00005', label: 'Berserker Ring',    difficulty: 'adept',    role: 'PVMER'   },
      { taskId: 'cwtask_dev00006', label: 'Anvil Pounder',     difficulty: 'adept',    role: 'SKILLER' },
      { taskId: 'cwtask_dev00007', label: 'Scythe of Vitur',   difficulty: 'master',   role: 'PVMER'   },
      { taskId: 'cwtask_dev00008', label: 'Green Fingers',     difficulty: 'adept',    role: 'SKILLER' },
    ];

    for (const t of taskDefs) {
      await ClanWarsTask.create({
        ...t,
        eventId: EVENT_ID,
        description: null,
        isActive: false, // gathering is over
        createdAt: now,
        updatedAt: now,
      });
    }

    // ── Approved submissions (history) ─────────────────────────────────────────
    const submissions = [
      { id: 'cws_dev00001', teamId: TEAM1_ID, taskId: 'cwtask_dev00001', by: '100000000000000002', username: 'CrimsonAce',   difficulty: 'initiate', role: 'PVMER'   },
      { id: 'cws_dev00002', teamId: TEAM1_ID, taskId: 'cwtask_dev00002', by: '100000000000000002', username: 'CrimsonAce',   difficulty: 'master',   role: 'PVMER'   },
      { id: 'cws_dev00003', teamId: TEAM1_ID, taskId: 'cwtask_dev00003', by: '100000000000000003', username: 'OathSkiller',  difficulty: 'initiate', role: 'SKILLER' },
      { id: 'cws_dev00004', teamId: TEAM2_ID, taskId: 'cwtask_dev00004', by: '200000000000000003', username: 'AzureSkiller', difficulty: 'adept',    role: 'SKILLER' },
      { id: 'cws_dev00005', teamId: TEAM2_ID, taskId: 'cwtask_dev00005', by: '200000000000000001', username: 'AzureLord',    difficulty: 'adept',    role: 'PVMER'   },
    ];

    for (const s of submissions) {
      await ClanWarsSubmission.create({
        submissionId: s.id,
        eventId: EVENT_ID,
        teamId: s.teamId,
        submittedBy: s.by,
        submittedUsername: s.username,
        channelId: null,
        taskId: s.taskId,
        taskLabel: taskDefs.find((t) => t.taskId === s.taskId)?.label ?? s.taskId,
        difficulty: s.difficulty,
        role: s.role,
        proofUrl: 'https://example.com/dev-proof',
        status: 'APPROVED',
        reviewedBy: '1',
        reviewedAt: new Date(now - 3600_000),
        submittedAt: new Date(now - 6 * 3600_000),
        createdAt: now,
        updatedAt: now,
      });
    }

    // ── Battle (IN_PROGRESS, turn 1) ───────────────────────────────────────────
    await ClanWarsBattle.create({
      battleId: BATTLE_ID,
      eventId: EVENT_ID,
      team1Id: TEAM1_ID,
      team2Id: TEAM2_ID,
      status: 'IN_PROGRESS',
      championSnapshots: { team1: SNAP1, team2: SNAP2 },
      battleState: INITIAL_BATTLE_STATE,
      rngSeed: `dev_${Date.now()}`,
      winnerId: null,
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // Log the battle start event
    await ClanWarsBattleEvent.create({
      eventLogId: 'cwblog_dev00001',
      battleId: BATTLE_ID,
      turnNumber: 0,
      actorTeamId: null,
      action: 'BATTLE_START',
      rollInputs: null,
      damageDealt: null,
      isCrit: null,
      itemUsedId: null,
      effectApplied: null,
      hpAfter: { team1: 243, team2: 326 },
      narrative: '⚔️ Battle begins! The Crimson Oath faces The Azure Pact. First strike goes to The Crimson Oath (SPD 106 vs 96).',
      createdAt: now,
      updatedAt: now,
    });

    console.log('✅ Champion Forge dev seeder complete!');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Battle ID: ${BATTLE_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}`);
  },

  async down(queryInterface) {
    // Use models so Sequelize handles column name casing correctly
    const models = require('../models');
    const {
      ClanWarsEvent, ClanWarsTeam, ClanWarsItem,
      ClanWarsBattle, ClanWarsBattleEvent, ClanWarsTask, ClanWarsSubmission,
    } = models;

    // Delete in FK dependency order: events → battles → submissions/items/tasks/teams → event
    await ClanWarsBattleEvent.destroy({ where: { battleId: BATTLE_ID } });
    await ClanWarsBattle.destroy(     { where: { eventId:  EVENT_ID  } });
    await ClanWarsSubmission.destroy( { where: { eventId:  EVENT_ID  } });
    await ClanWarsItem.destroy(       { where: { eventId:  EVENT_ID  } });
    await ClanWarsTask.destroy(       { where: { eventId:  EVENT_ID  } });
    await ClanWarsTeam.destroy(       { where: { eventId:  EVENT_ID  } });
    await ClanWarsEvent.destroy(      { where: { eventId:  EVENT_ID  } });

    console.log('✅ Champion Forge dev seeder rolled back.');
  },
};
