'use strict';
/**
 * Rainbow Bingo — completed event scenario seeder
 *
 * Creates a COMPLETE event with two teams:
 *   • Team Alpha — all 49 tiles complete (100%)
 *   • Team Beta  — ~80% complete (Red, Orange, Yellow, Green, Blue all done; Indigo/Violet partial; capstones mixed)
 *
 * Good for testing:
 *   • /eg-rainbow post-event summary screen
 *   • Completed tile display on team boards
 *   • Overview page with mixed completion states
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260526000001-rainbow-completed-event.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260526000001-rainbow-completed-event.js
 */

const { TILES, DEFAULT_TILE_GRAPH } = require('../../utils/rainbowTiles');

const EVENT_ID   = 'rb_seed_complete';
const ALPHA_ID   = 'rbt_seed_alpha';
const BETA_ID    = 'rbt_seed_beta';

// Tiles Beta has completed (~80% = ~39 of 49)
// All of Red, Orange, Yellow, Green, Blue (35 tiles)
// Indigo: I1–I5 done, I6–I7 locked (5 tiles)
// Violet: V1–V4 done, V5–V7 locked (4 tiles)
// Capstones: C1, C2, C3, C4, C5 done (from completed color chains); C6, C7 locked
const BETA_COMPLETE = new Set([
  'R1','R2','R3','R4','R5','R6','R7',
  'O1','O2','O3','O4','O5','O6','O7',
  'Y1','Y2','Y3','Y4','Y5','Y6','Y7',
  'G1','G2','G3','G4','G5','G6','G7',
  'B1','B2','B3','B4','B5','B6','B7',
  'I1','I2','I3','I4','I5',
  'V1','V2','V3','V4',
  'C1','C2','C3','C4','C5',
]);

// Determine Beta tile status based on completion set and graph prerequisites
function betaStatus(tileCode) {
  if (BETA_COMPLETE.has(tileCode)) return 'COMPLETE';
  const prereqs = DEFAULT_TILE_GRAPH[tileCode];
  if (!prereqs || prereqs.length === 0) return 'UNLOCKED'; // start tile
  if (prereqs.every((p) => BETA_COMPLETE.has(p))) return 'UNLOCKED';
  return 'LOCKED';
}

function makeCompletedAt(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const startDate = makeCompletedAt(14);
    const endDate   = makeCompletedAt(2);

    await queryInterface.bulkInsert('RainbowEvents', [{
      eventId:        EVENT_ID,
      eventName:      'testpassword2026',
      status:         'COMPLETE',
      startDate,
      endDate,
      adminIds:       Sequelize.literal("ARRAY[]::varchar[]"),
      staffChannelId: null,
      tileGraph:      JSON.stringify(DEFAULT_TILE_GRAPH),
      createdAt:      now,
      updatedAt:      now,
    }]);

    await queryInterface.bulkInsert('RainbowTeams', [
      {
        teamId:           ALPHA_ID,
        eventId:          EVENT_ID,
        teamName:         'Team Alpha',
        discordChannelId: '1111111111111111111',
        captainDiscordId: null,
        notes:            null,
        teamToken:        'seedalpha0000001',
        discordRoleId:    null,
        createdAt:        now,
        updatedAt:        now,
      },
      {
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        teamName:         'Team Beta',
        discordChannelId: '2222222222222222222',
        captainDiscordId: null,
        notes:            null,
        teamToken:        'seedbeta00000001',
        discordRoleId:    null,
        createdAt:        now,
        updatedAt:        now,
      },
    ]);

    // Alpha — all 49 tiles complete, spread over the event duration
    const alphaTiles = TILES.map((t, i) => ({
      teamTileId:  `rbt_seed_alpha_${t.tileCode.toLowerCase()}`,
      teamId:      ALPHA_ID,
      eventId:     EVENT_ID,
      tileCode:    t.tileCode,
      status:      'COMPLETE',
      progress:    100,
      unlockedAt:  makeCompletedAt(14),
      completedAt: makeCompletedAt(13 - Math.floor(i / 4)),
      createdAt:   now,
      updatedAt:   now,
    }));

    // Beta — mixed completion
    const betaTiles = TILES.map((t) => {
      const status = betaStatus(t.tileCode);
      return {
        teamTileId:  `rbt_seed_beta_${t.tileCode.toLowerCase()}`,
        teamId:      BETA_ID,
        eventId:     EVENT_ID,
        tileCode:    t.tileCode,
        status,
        progress:    status === 'COMPLETE' ? 100 : status === 'UNLOCKED' ? 0 : 0,
        unlockedAt:  status !== 'LOCKED' ? makeCompletedAt(13) : null,
        completedAt: status === 'COMPLETE' ? makeCompletedAt(12) : null,
        createdAt:   now,
        updatedAt:   now,
      };
    });

    await queryInterface.bulkInsert('RainbowTeamTiles', [...alphaTiles, ...betaTiles]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('RainbowTeamTiles', {
      teamId: [ALPHA_ID, BETA_ID],
    });
    await queryInterface.bulkDelete('RainbowTeams', {
      eventId: EVENT_ID,
    });
    await queryInterface.bulkDelete('RainbowEvents', {
      eventId: EVENT_ID,
    });
  },
};
