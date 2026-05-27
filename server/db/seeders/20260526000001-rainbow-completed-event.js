'use strict';
/**
 * Rainbow Bingo — completed event scenario seeder
 *
 * Creates a COMPLETE event with two teams:
 *   • Team Alpha — all 49 tiles complete (100%), with a handful of seeded submissions
 *   • Team Beta  — ~80% complete; I6 and V5 in-progress with partial progress + submissions
 *
 * Run:
 *   DATABASE_URL=postgresql://lemon@localhost:5432/osrsbingo_local npx sequelize-cli db:seed --seed 20260526000001-rainbow-completed-event.js
 * Undo:
 *   DATABASE_URL=postgresql://lemon@localhost:5432/osrsbingo_local npx sequelize-cli db:seed:undo --seed 20260526000001-rainbow-completed-event.js
 */

const { TILES, DEFAULT_TILE_GRAPH } = require('../../utils/rainbowTiles');

const EVENT_ID = 'rb_seed_complete';
const ALPHA_ID = 'rbt_seed_alpha';
const BETA_ID  = 'rbt_seed_beta';

// Beta: full colors done + partial Indigo/Violet
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

// Tiles Beta has partially started (in-progress): tileCode → progress %
const BETA_IN_PROGRESS = { I6: 40, V5: 60 };

function betaStatus(tileCode) {
  if (BETA_COMPLETE.has(tileCode)) return 'COMPLETE';
  if (BETA_IN_PROGRESS[tileCode])  return 'SUBMITTED';
  const prereqs = DEFAULT_TILE_GRAPH[tileCode];
  if (!prereqs || prereqs.length === 0) return 'UNLOCKED';
  if (prereqs.every((p) => BETA_COMPLETE.has(p))) return 'UNLOCKED';
  return 'LOCKED';
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now       = new Date();
    const startDate = daysAgo(14);
    const endDate   = daysAgo(2);

    // ── Event ──────────────────────────────────────────────────────────────
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

    // ── Teams ──────────────────────────────────────────────────────────────
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

    // ── Team tiles ─────────────────────────────────────────────────────────
    const alphaTiles = TILES.map((t, i) => ({
      teamTileId:  `rbt_seed_alpha_${t.tileCode.toLowerCase()}`,
      teamId:      ALPHA_ID,
      eventId:     EVENT_ID,
      tileCode:    t.tileCode,
      status:      'COMPLETE',
      progress:    100,
      unlockedAt:  daysAgo(14),
      completedAt: daysAgo(13 - Math.floor(i / 4)),
      createdAt:   now,
      updatedAt:   now,
    }));

    const betaTiles = TILES.map((t) => {
      const status   = betaStatus(t.tileCode);
      const progress = status === 'COMPLETE' ? 100 : (BETA_IN_PROGRESS[t.tileCode] ?? 0);
      return {
        teamTileId:  `rbt_seed_beta_${t.tileCode.toLowerCase()}`,
        teamId:      BETA_ID,
        eventId:     EVENT_ID,
        tileCode:    t.tileCode,
        status,
        progress,
        unlockedAt:  status !== 'LOCKED' ? daysAgo(13) : null,
        completedAt: status === 'COMPLETE' ? daysAgo(12) : null,
        createdAt:   now,
        updatedAt:   now,
      };
    });

    await queryInterface.bulkInsert('RainbowTeamTiles', [...alphaTiles, ...betaTiles]);

    // ── Submissions ────────────────────────────────────────────────────────
    // Alpha: a PRE + approved FINAL on a kc tile (R2), an xp tile (B3), and a unique tile (R1)
    // Beta:  PRE + approved FINAL on a complete tile (I4 — kc)
    //        PRE (approved) + FINAL (pending) on I6 (in-progress)
    //        PRE (approved) + FINAL (denied) + FINAL (pending re-submit) on V5 (in-progress)
    const subs = [
      // ── Alpha R2 (kc) ────────────────────────────────────────────────────
      {
        submissionId:     'rsub_seed_a_r2_pre',
        teamId:           ALPHA_ID,
        eventId:          EVENT_ID,
        tileCode:         'R2',
        type:             'PRE',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=WOM+Pre+Screenshot',
        discordMessageId: '1000000000000001',
        channelId:        '1111111111111111111',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(12),
        denialReason:     null,
        submittedAt:      daysAgo(13),
        createdAt:        now,
        updatedAt:        now,
      },
      {
        submissionId:     'rsub_seed_a_r2_final',
        teamId:           ALPHA_ID,
        eventId:          EVENT_ID,
        tileCode:         'R2',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/1a2e1a/white?text=WOM+Final+Screenshot',
        discordMessageId: '1000000000000002',
        channelId:        '1111111111111111111',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(10),
        denialReason:     null,
        submittedAt:      daysAgo(11),
        createdAt:        now,
        updatedAt:        now,
      },
      // ── Alpha B3 (xp) ────────────────────────────────────────────────────
      {
        submissionId:     'rsub_seed_a_b3_pre',
        teamId:           ALPHA_ID,
        eventId:          EVENT_ID,
        tileCode:         'B3',
        type:             'PRE',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=Smithing+XP+Pre',
        discordMessageId: '1000000000000003',
        channelId:        '1111111111111111111',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(11),
        denialReason:     null,
        submittedAt:      daysAgo(12),
        createdAt:        now,
        updatedAt:        now,
      },
      {
        submissionId:     'rsub_seed_a_b3_final',
        teamId:           ALPHA_ID,
        eventId:          EVENT_ID,
        tileCode:         'B3',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=Smithing+XP+Final',
        discordMessageId: '1000000000000004',
        channelId:        '1111111111111111111',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_002',
        reviewedAt:       daysAgo(8),
        denialReason:     null,
        submittedAt:      daysAgo(9),
        createdAt:        now,
        updatedAt:        now,
      },
      // ── Alpha R1 (unique) ─────────────────────────────────────────────────
      {
        submissionId:     'rsub_seed_a_r1_final',
        teamId:           ALPHA_ID,
        eventId:          EVENT_ID,
        tileCode:         'R1',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/2e1a1a/white?text=Moons+Drop+Screenshot',
        discordMessageId: '1000000000000005',
        channelId:        '1111111111111111111',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(9),
        denialReason:     null,
        submittedAt:      daysAgo(10),
        createdAt:        now,
        updatedAt:        now,
      },
      // ── Beta I4 (kc, complete) ─────────────────────────────────────────────
      {
        submissionId:     'rsub_seed_b_i4_pre',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'I4',
        type:             'PRE',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=Beta+I4+Pre',
        discordMessageId: '2000000000000001',
        channelId:        '2222222222222222222',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(11),
        denialReason:     null,
        submittedAt:      daysAgo(12),
        createdAt:        now,
        updatedAt:        now,
      },
      {
        submissionId:     'rsub_seed_b_i4_final',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'I4',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=Beta+I4+Final',
        discordMessageId: '2000000000000002',
        channelId:        '2222222222222222222',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_002',
        reviewedAt:       daysAgo(9),
        denialReason:     null,
        submittedAt:      daysAgo(10),
        createdAt:        now,
        updatedAt:        now,
      },
      // ── Beta I6 (in-progress, 40%) ─────────────────────────────────────────
      {
        submissionId:     'rsub_seed_b_i6_pre',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'I6',
        type:             'PRE',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=Beta+I6+Pre',
        discordMessageId: '2000000000000003',
        channelId:        '2222222222222222222',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(7),
        denialReason:     null,
        submittedAt:      daysAgo(8),
        createdAt:        now,
        updatedAt:        now,
      },
      {
        submissionId:     'rsub_seed_b_i6_final',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'I6',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/2e2e1a/white?text=Beta+I6+Final+%28Pending%29',
        discordMessageId: '2000000000000004',
        channelId:        '2222222222222222222',
        status:           'PENDING',
        reviewedBy:       null,
        reviewedAt:       null,
        denialReason:     null,
        submittedAt:      daysAgo(3),
        createdAt:        now,
        updatedAt:        now,
      },
      // ── Beta V5 (in-progress, 60%) — denied then re-submitted ────────────────
      {
        submissionId:     'rsub_seed_b_v5_pre',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'V5',
        type:             'PRE',
        screenshotUrl:    'https://placehold.co/800x450/1a1a2e/white?text=Beta+V5+Pre',
        discordMessageId: '2000000000000005',
        channelId:        '2222222222222222222',
        status:           'APPROVED',
        reviewedBy:       'ref_discord_001',
        reviewedAt:       daysAgo(6),
        denialReason:     null,
        submittedAt:      daysAgo(7),
        createdAt:        now,
        updatedAt:        now,
      },
      {
        submissionId:     'rsub_seed_b_v5_final1',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'V5',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/2e1a1a/white?text=Beta+V5+Final+%28Denied%29',
        discordMessageId: '2000000000000006',
        channelId:        '2222222222222222222',
        status:           'DENIED',
        reviewedBy:       'ref_discord_002',
        reviewedAt:       daysAgo(4),
        denialReason:     "Can't see the event password in the screenshot — please resubmit with it visible.",
        submittedAt:      daysAgo(5),
        createdAt:        now,
        updatedAt:        now,
      },
      {
        submissionId:     'rsub_seed_b_v5_final2',
        teamId:           BETA_ID,
        eventId:          EVENT_ID,
        tileCode:         'V5',
        type:             'FINAL',
        screenshotUrl:    'https://placehold.co/800x450/2e2e1a/white?text=Beta+V5+Re-submit+%28Pending%29',
        discordMessageId: '2000000000000007',
        channelId:        '2222222222222222222',
        status:           'PENDING',
        reviewedBy:       null,
        reviewedAt:       null,
        denialReason:     null,
        submittedAt:      daysAgo(3),
        createdAt:        now,
        updatedAt:        now,
      },
    ];

    await queryInterface.bulkInsert('RainbowSubmissions', subs);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('RainbowSubmissions', {
      eventId: EVENT_ID,
    });
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
