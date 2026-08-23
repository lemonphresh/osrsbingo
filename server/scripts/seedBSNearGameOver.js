'use strict';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPORARY DEV SEEDER — delete this file once game-over testing is done.
 *
 * Creates a battleship event that's one click away from ending, using real
 * Discord IDs so the actual game-over messages fire in the test channels.
 *
 * The state after seeding:
 *   • Event is ACTIVE with 2 teams, both with ships auto-placed.
 *   • Every ship tile on Team A's board (the WINNER) is shot + task complete.
 *   • Every ship tile on Team B's board (the LOSER) is shot + task complete
 *     EXCEPT ONE — that tile is shot, has a PENDING submission attached, and
 *     is sitting in the ref queue.
 *   • Clicking "Mark Complete" on that tile in the ref panel triggers the
 *     game-over sequence (Team A wins) and posts the Discord announcement.
 *
 * Usage (from repo root):
 *   DATABASE_URL=$(heroku config:get DATABASE_URL -a osrsbingo-stage) \
 *     node server/scripts/seedBSNearGameOver.js
 *
 * NOTE: Discord posts are silenced during seeding so channels don't get
 * spammed with placement/battle-start noise. Only the final game-over post
 * (triggered when the ref clicks Mark Complete) fires normally.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Silence Discord during the seed ──────────────────────────────────────────
process.env.DISCORD_BOT_TOKEN = '';

// ── Hardcoded staging IDs — DELETE ONCE TESTING IS DONE ──────────────────────
const CONFIG = {
  guildId: '1540767389589708880',
  creatorSiteUserId: 1,

  teamA: {
    name: 'team 1',
    color: 'RED',
    channelId: '1541131720953299087',
    roleId: null,
    memberDiscordIds: ['387789404544172033', '136602347999592448'],
  },
  teamB: {
    name: 'team 2',
    color: 'BLUE',
    channelId: '1541131730360991744',
    roleId: null,
    memberDiscordIds: [
      '221415080514945035',
      '343847026892603393',
      '539166972882190337',
    ],
  },

  // 'A' means Team A wins — Team B gets the pending tile.
  winner: 'A',
  eventName: null, // null → uses "Near-Complete Test <timestamp>"
};

// ── Imports (after env override so Discord util reads empty token) ───────────
const { generateId, shuffle } = require('../utils/battleship/bsConfig');
const { runBSPlacementStart } = require('../utils/battleship/bsPlacementStart');
const { runBSGameStart } = require('../utils/battleship/bsGameStart');
const battleshipResolvers = require('../schema/resolvers/Battleship');
const models = require('../db/models');

async function main() {
  const {
    BSEvent,
    BSTeam,
    BSBoard,
    BSTile,
    BSSubmission,
    sequelize,
  } = models;

  const winnerCfg = CONFIG.winner === 'B' ? CONFIG.teamB : CONFIG.teamA;
  const loserCfg  = CONFIG.winner === 'B' ? CONFIG.teamA : CONFIG.teamB;

  const eventName =
    CONFIG.eventName || `Near-Complete Test ${new Date().toISOString().slice(0, 16)}`;

  console.log(`\n🌊 Seeding a near-complete battleship event on ${sequelize.config.database} …\n`);

  // 1. Create the event via the real resolver — this also generates default
  // tasks, ship templates, and the template board.
  const fakeContext = {
    user: { id: CONFIG.creatorSiteUserId, admin: true, discordUserId: null },
  };
  const event = await battleshipResolvers.Mutation.createBSEvent(
    null,
    {
      input: {
        eventName,
        placementPhaseHours: 24,
        cooldownMinutes: 10,
        initialSkipTokens: 2,
        guildId: CONFIG.guildId,
        adminIds: [String(CONFIG.creatorSiteUserId)],
        refIds: [],
      },
    },
    fakeContext,
  );
  console.log(`  ✓ Created event ${event.eventId}`);

  // 2. Add both teams with their Discord metadata and rosters.
  const teamA = await BSTeam.create({
    teamId:           generateId('bst'),
    eventId:          event.eventId,
    teamName:         CONFIG.teamA.name,
    color:            CONFIG.teamA.color,
    members:          CONFIG.teamA.memberDiscordIds,
    skipTokens:       event.initialSkipTokens ?? 2,
    discordChannelId: CONFIG.teamA.channelId,
    discordRoleId:    CONFIG.teamA.roleId,
  });
  const teamB = await BSTeam.create({
    teamId:           generateId('bst'),
    eventId:          event.eventId,
    teamName:         CONFIG.teamB.name,
    color:            CONFIG.teamB.color,
    members:          CONFIG.teamB.memberDiscordIds,
    skipTokens:       event.initialSkipTokens ?? 2,
    discordChannelId: CONFIG.teamB.channelId,
    discordRoleId:    CONFIG.teamB.roleId,
  });
  console.log(`  ✓ Enlisted teams ${teamA.teamName} (${teamA.teamId}) + ${teamB.teamName} (${teamB.teamId})`);

  // 3. Start placement — creates team boards + clones ocean tiles.
  await runBSPlacementStart(event);
  console.log('  ✓ Placement phase kicked off (no discord posts — token silenced)');

  // 4. Start battle — auto-places any missing ships (all of them since we
  //    didn't manually place any) and marks event ACTIVE.
  await event.reload();
  await runBSGameStart(event);
  console.log('  ✓ Battle phase started, ships auto-placed');

  // Backdate the event timeline so the game-over screen doesn't read as
  // "commenced tomorrow / concluded today". Battle started ~2 days ago,
  // placement was the day before that. `completedAt` is left null — the
  // ref's Mark Complete click will fill it in when the game actually ends.
  const backdatedPlacementStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const backdatedPlacementEnd   = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  await event.update({
    placementStartsAt: backdatedPlacementStart,
    placementEndsAt:   backdatedPlacementEnd,
  });

  // 5. Fetch each team's board + tiles.
  const winnerTeam = CONFIG.winner === 'B' ? teamB : teamA;
  const loserTeam  = CONFIG.winner === 'B' ? teamA : teamB;

  const winnerBoard = await BSBoard.findOne({ where: { eventId: event.eventId, teamId: winnerTeam.teamId } });
  const loserBoard  = await BSBoard.findOne({ where: { eventId: event.eventId, teamId: loserTeam.teamId } });

  const winnerTiles = await BSTile.findAll({ where: { boardId: winnerBoard.boardId } });
  const loserTiles  = await BSTile.findAll({ where: { boardId: loserBoard.boardId } });

  const now = new Date();

  // Fabricate a realistic engagement history:
  //   • Loser's ship tiles: ALL hit + task-complete except the pending one.
  //   • Loser's ocean: ~12 random miss cells.
  //   • Winner's ship tiles: ~60% hit + task-complete (winner had survivors).
  //   • Winner's ocean: ~10 random miss cells.
  // A chronological BSShotLog is inserted alternating firing teams so the
  // game-over screen's "Engagement Log" actually has entries to render.

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffleArr = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const loserShipTiles = loserTiles.filter((t) => t.shipType !== null);
  const loserOceanTiles = loserTiles.filter((t) => t.shipType === null);
  const winnerShipTiles = winnerTiles.filter((t) => t.shipType !== null);
  const winnerOceanTiles = winnerTiles.filter((t) => t.shipType === null);

  if (loserShipTiles.length === 0 || winnerShipTiles.length === 0) {
    throw new Error('Ship tiles missing on one of the boards — game start failed?');
  }

  // Winner-target-set: winner (firing team) shot at loser's board.
  const pendingTile = loserShipTiles[loserShipTiles.length - 1];
  const loserHitTiles = loserShipTiles.filter((t) => t.tileId !== pendingTile.tileId);
  const loserMissTiles = shuffleArr(loserOceanTiles).slice(0, Math.min(12, loserOceanTiles.length));

  // Loser-target-set: loser (firing team) shot at winner's board.
  const winnerHitCount = Math.max(1, Math.floor(winnerShipTiles.length * 0.6));
  const winnerHitTiles = shuffleArr(winnerShipTiles).slice(0, winnerHitCount);
  const winnerMissTiles = shuffleArr(winnerOceanTiles).slice(0, Math.min(10, winnerOceanTiles.length));

  // Build shot queue — interleave firing teams so the log reads like a game.
  const winnerShots = [
    ...loserHitTiles.map((t) => ({ tile: t, boardId: loserBoard.boardId, firingTeamId: winnerTeam.teamId, result: 'HIT' })),
    ...loserMissTiles.map((t) => ({ tile: t, boardId: loserBoard.boardId, firingTeamId: winnerTeam.teamId, result: 'MISS' })),
  ];
  const loserShots = [
    ...winnerHitTiles.map((t) => ({ tile: t, boardId: winnerBoard.boardId, firingTeamId: loserTeam.teamId, result: 'HIT' })),
    ...winnerMissTiles.map((t) => ({ tile: t, boardId: winnerBoard.boardId, firingTeamId: loserTeam.teamId, result: 'MISS' })),
  ];
  const winnerShotsShuffled = shuffleArr(winnerShots);
  const loserShotsShuffled = shuffleArr(loserShots);
  const interleaved = [];
  const maxLen = Math.max(winnerShotsShuffled.length, loserShotsShuffled.length);
  for (let i = 0; i < maxLen; i++) {
    if (loserShotsShuffled[i]) interleaved.push(loserShotsShuffled[i]);
    if (winnerShotsShuffled[i]) interleaved.push(winnerShotsShuffled[i]);
  }

  // Reserve the very LAST spot in the log for the pending shot so it reads
  // as the final salvo before game-over.
  interleaved.push({
    tile:         pendingTile,
    boardId:      loserBoard.boardId,
    firingTeamId: winnerTeam.teamId,
    result:       'HIT',
    isPending:    true,
  });

  // Spread the shots across the battle window (from placementEndsAt to
  // ~15 minutes ago), evenly-ish with a small jitter, so the engagement log
  // reads like a multi-day skirmish rather than a burst 2 hours ago.
  const battleStart = backdatedPlacementEnd.getTime() + 5 * 60 * 1000; // 5 min after battle began
  const battleEnd   = now.getTime() - 15 * 60 * 1000; // last shot ~15 min ago
  const perShotMs   = Math.max(60 * 1000, Math.floor((battleEnd - battleStart) / Math.max(1, interleaved.length)));
  let cursor = new Date(battleStart);
  const shotLogRows = [];
  for (const shot of interleaved) {
    const jitterMs = (Math.random() - 0.5) * perShotMs * 0.4; // ±20% jitter
    const stepMs = Math.max(30 * 1000, perShotMs + jitterMs);
    cursor = new Date(cursor.getTime() + stepMs);
    shotLogRows.push({
      shotId:        generateId('bssl'),
      eventId:       event.eventId,
      firingTeamId:  shot.firingTeamId,
      targetBoardId: shot.boardId,
      tileId:        shot.tile.tileId,
      row:           shot.tile.row,
      col:           shot.tile.col,
      result:        shot.result,
      taskId:        shot.tile.shipTaskId ?? shot.tile.taskId ?? null,
      shotAt:        new Date(cursor),
    });
    // Update the tile itself so the final grid renders the shot correctly.
    if (shot.isPending) {
      await shot.tile.update({
        isShot: true,
        taskCompleted: false,
        shotAt: new Date(cursor),
        taskCompletedAt: null,
        progress: 100,
      });
    } else {
      await shot.tile.update({
        isShot: true,
        taskCompleted: true,
        shotAt: new Date(cursor),
        taskCompletedAt: new Date(cursor),
        progress: 100,
      });
    }
  }

  const { BSShotLog } = models;
  await BSShotLog.bulkCreate(shotLogRows);

  // 8. Insert a pre-APPROVED submission on the pending tile so the ref just
  //    needs to click Mark Complete (no approve step required first). The
  //    completeBSTile check requires: approved.length > 0, no pending subs,
  //    and progress >= 100 — all satisfied.
  const submitterDiscordId = winnerCfg.memberDiscordIds[0] ?? null;
  await BSSubmission.create({
    submissionId:     generateId('bssub'),
    eventId:          event.eventId,
    tileId:           pendingTile.tileId,
    boardId:          loserBoard.boardId,
    teamId:           winnerTeam.teamId,
    tileLabel:        'Final shot — ready to mark complete',
    discordUserId:    submitterDiscordId,
    discordUsername:  null,
    screenshotUrl:    null,
    channelId:        winnerCfg.channelId,
    discordMessageId: null,
    submissionType:   'SUBMISSION',
    status:           'APPROVED',
    reviewedBy:       String(CONFIG.creatorSiteUserId),
    reviewedAt:       now,
    submittedAt:      now,
  });
  console.log(`  ✓ Winner: ${winnerTeam.teamName}   Loser: ${loserTeam.teamName}`);
  console.log(`  ✓ Pending tile: ${pendingTile.tileId} on ${loserTeam.teamName}'s board`);

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  console.log(`\n🏁 Ready. Event URLs:`);
  console.log(`   Event:  ${baseUrl}/battleship/${event.eventId}`);
  console.log(`   Refs:   ${baseUrl}/battleship/${event.eventId}/refs`);
  console.log(`   Admin:  ${baseUrl}/battleship/${event.eventId}/admin`);
  console.log(`\n👉 Open the Refs page and click "Mark Complete" on the pending`);
  console.log(`   submission to fire the game-over sequence.\n`);
}

main()
  .then(async () => {
    await models.sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ Seed failed:', err);
    try { await models.sequelize.close(); } catch (_) {}
    process.exit(1);
  });
