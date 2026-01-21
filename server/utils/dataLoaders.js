// server/utils/dataLoaders.js
const DataLoader = require('dataloader');
const { Op } = require('sequelize');
const { nodeCache } = require('./nodeCache');

const DEBUG = process.env.NODE_ENV !== 'production';
const log = (msg) => DEBUG && console.log(msg);

const createLoaders = (models) => {
  const {
    User,
    BingoBoard,
    BingoTile,
    TreasureEvent,
    TreasureTeam,
    TreasureNode,
    TreasureSubmission,
  } = models;

  return {
    // ============================================================
    // USER LOADERS
    // ============================================================

    userById: new DataLoader(async (userIds) => {
      log(`📦 Batching ${userIds.length} user lookups`);

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'displayName', 'username', 'rsn', 'discordUserId', 'admin'],
        raw: true, // ✅ Skip Sequelize model instantiation
      });

      const userMap = new Map(users.map((u) => [u.id.toString(), u]));
      return userIds.map((id) => userMap.get(id.toString()) || null);
    }),

    userByDiscordId: new DataLoader(async (discordUserIds) => {
      log(`📦 Batching ${discordUserIds.length} Discord user lookups`);

      const users = await User.findAll({
        where: { discordUserId: { [Op.in]: discordUserIds } },
        attributes: ['id', 'displayName', 'username', 'rsn', 'discordUserId'],
        raw: true,
      });

      const userMap = new Map(users.map((u) => [u.discordUserId, u]));
      return discordUserIds.map((id) => userMap.get(id) || null);
    }),

    // ============================================================
    // BINGO BOARD LOADERS
    // ============================================================

    boardsByUserId: new DataLoader(async (userIds) => {
      log(`📦 Batching boards for ${userIds.length} users`);

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        include: [
          {
            model: BingoBoard,
            as: 'editorBoards',
            attributes: ['id', 'name', 'category', 'type', 'layout', 'isPublic', 'theme', 'userId'],
          },
        ],
      });

      const boardsMap = new Map();
      users.forEach((user) => {
        boardsMap.set(user.id.toString(), user.editorBoards || []);
      });

      return userIds.map((id) => boardsMap.get(id.toString()) || []);
    }),

    tilesByBoardId: new DataLoader(async (boardIds) => {
      log(`📦 Batching tiles for ${boardIds.length} boards`);

      const tiles = await BingoTile.findAll({
        where: { board: { [Op.in]: boardIds } },
        raw: true,
      });

      const tilesMap = new Map();
      boardIds.forEach((id) => tilesMap.set(id.toString(), []));

      tiles.forEach((tile) => {
        const arr = tilesMap.get(tile.board.toString());
        if (arr) arr.push(tile);
      });

      return boardIds.map((id) => tilesMap.get(id.toString()) || []);
    }),

    editorsByBoardId: new DataLoader(async (boardIds) => {
      log(`📦 Batching editors for ${boardIds.length} boards`);

      const boards = await BingoBoard.findAll({
        where: { id: { [Op.in]: boardIds } },
        include: [
          {
            model: User,
            as: 'editors',
            attributes: ['id', 'displayName', 'username', 'rsn'],
          },
        ],
      });

      const editorsMap = new Map();
      boards.forEach((board) => {
        editorsMap.set(board.id.toString(), board.editors || []);
      });

      return boardIds.map((id) => editorsMap.get(id.toString()) || []);
    }),

    // ============================================================
    // TREASURE EVENT LOADERS
    // ============================================================

    treasureEventById: new DataLoader(async (eventIds) => {
      log(`📦 Batching ${eventIds.length} treasure events`);

      const events = await TreasureEvent.findAll({
        where: { eventId: { [Op.in]: eventIds } },
      });

      const eventMap = new Map(events.map((e) => [e.eventId, e]));
      return eventIds.map((id) => eventMap.get(id) || null);
    }),

    teamsByEventId: new DataLoader(async (eventIds) => {
      log(`📦 Batching teams for ${eventIds.length} events`);

      const teams = await TreasureTeam.findAll({
        where: { eventId: { [Op.in]: eventIds } },
      });

      const teamsMap = new Map();
      eventIds.forEach((id) => teamsMap.set(id, []));

      teams.forEach((team) => {
        const arr = teamsMap.get(team.eventId);
        if (arr) arr.push(team);
      });

      return eventIds.map((id) => teamsMap.get(id) || []);
    }),

    /**
     * ✅ OPTIMIZED: Nodes with in-memory caching
     * Nodes rarely change - cache aggressively
     */
    nodesByEventId: new DataLoader(async (eventIds) => {
      log(`📦 Batching nodes for ${eventIds.length} events`);

      // Check cache first for each eventId
      const results = new Map();
      const uncachedIds = [];

      eventIds.forEach((id) => {
        const cached = nodeCache.get(`nodes:${id}`);
        if (cached) {
          results.set(id, cached);
        } else {
          uncachedIds.push(id);
        }
      });

      // Fetch uncached from DB
      if (uncachedIds.length > 0) {
        log(`  ↳ Cache miss for ${uncachedIds.length} events, fetching from DB`);

        const nodes = await TreasureNode.findAll({
          where: { eventId: { [Op.in]: uncachedIds } },
          raw: true, // ✅ Faster - skip model instantiation
        });

        // Group by eventId
        const nodesMap = new Map();
        uncachedIds.forEach((id) => nodesMap.set(id, []));

        nodes.forEach((node) => {
          const arr = nodesMap.get(node.eventId);
          if (arr) arr.push(node);
        });

        // Cache and add to results
        uncachedIds.forEach((id) => {
          const eventNodes = nodesMap.get(id) || [];
          nodeCache.set(`nodes:${id}`, eventNodes);
          results.set(id, eventNodes);
        });
      }

      return eventIds.map((id) => results.get(id) || []);
    }),

    // ============================================================
    // TREASURE TEAM LOADERS
    // ============================================================

    teamByCompositeKey: new DataLoader(
      async (keys) => {
        log(`📦 Batching ${keys.length} team lookups by composite key`);

        const conditions = keys.map((k) => ({
          teamId: k.teamId,
          eventId: k.eventId,
        }));

        const teams = await TreasureTeam.findAll({
          where: { [Op.or]: conditions },
        });

        const teamMap = new Map();
        teams.forEach((team) => {
          teamMap.set(`${team.teamId}:${team.eventId}`, team);
        });

        return keys.map((k) => teamMap.get(`${k.teamId}:${k.eventId}`) || null);
      },
      { cacheKeyFn: (key) => `${key.teamId}:${key.eventId}` }
    ),

    /**
     * ✅ OPTIMIZED: Only fetch needed fields for submissions list
     */
    submissionsByTeamId: new DataLoader(async (teamIds) => {
      log(`📦 Batching submissions for ${teamIds.length} teams`);

      const submissions = await TreasureSubmission.findAll({
        where: { teamId: { [Op.in]: teamIds } },
        attributes: [
          'submissionId',
          'teamId',
          'nodeId',
          'status',
          'submittedBy',
          'submittedByUsername',
          'submittedAt',
          'proofUrl',
          'reviewedBy',
          'reviewedAt',
        ],
        order: [['submittedAt', 'DESC']],
        raw: true,
      });

      const subsMap = new Map();
      teamIds.forEach((id) => subsMap.set(id, []));

      submissions.forEach((sub) => {
        const arr = subsMap.get(sub.teamId);
        if (arr) arr.push(sub);
      });

      return teamIds.map((id) => subsMap.get(id) || []);
    }),

    // ============================================================
    // TREASURE SUBMISSION LOADERS
    // ============================================================

    submissionById: new DataLoader(async (submissionIds) => {
      log(`📦 Batching ${submissionIds.length} submissions`);

      const submissions = await TreasureSubmission.findAll({
        where: { submissionId: { [Op.in]: submissionIds } },
      });

      const subMap = new Map(submissions.map((s) => [s.submissionId, s]));
      return submissionIds.map((id) => subMap.get(id) || null);
    }),

    teamForSubmission: new DataLoader(async (teamIds) => {
      log(`📦 Batching teams for ${teamIds.length} submissions`);

      const teams = await TreasureTeam.findAll({
        where: { teamId: { [Op.in]: teamIds } },
      });

      const teamMap = new Map(teams.map((t) => [t.teamId, t]));
      return teamIds.map((id) => teamMap.get(id) || null);
    }),

    // ============================================================
    // TREASURE NODE LOADERS
    // ============================================================

    nodeById: new DataLoader(async (nodeIds) => {
      log(`📦 Batching ${nodeIds.length} nodes`);

      const nodes = await TreasureNode.findAll({
        where: { nodeId: { [Op.in]: nodeIds } },
        raw: true,
      });

      const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
      return nodeIds.map((id) => nodeMap.get(id) || null);
    }),
  };
};

module.exports = { createLoaders };
