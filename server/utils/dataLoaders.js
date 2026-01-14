// server/utils/dataLoaders.js
const DataLoader = require('dataloader');
const { Op } = require('sequelize');

/**
 * Creates fresh DataLoader instances for each request.
 *
 * IMPORTANT: DataLoader batch functions must:
 * 1. Return an array the SAME LENGTH as input keys
 * 2. Return items in the SAME ORDER as input keys
 * 3. Return null for missing items (not undefined)
 */
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

    /**
     * Load users by ID
     * Usage: loaders.userById.load(userId)
     */
    userById: new DataLoader(async (userIds) => {
      console.log(`📦 Batching ${userIds.length} user lookups`);

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'displayName', 'username', 'rsn', 'discordUserId', 'admin'],
      });

      const userMap = new Map(users.map((u) => [u.id.toString(), u]));
      return userIds.map((id) => userMap.get(id.toString()) || null);
    }),

    /**
     * Load user by Discord ID
     * Usage: loaders.userByDiscordId.load(discordUserId)
     */
    userByDiscordId: new DataLoader(async (discordUserIds) => {
      console.log(`📦 Batching ${discordUserIds.length} Discord user lookups`);

      const users = await User.findAll({
        where: { discordUserId: { [Op.in]: discordUserIds } },
        attributes: ['id', 'displayName', 'username', 'rsn', 'discordUserId'],
      });

      const userMap = new Map(users.map((u) => [u.discordUserId, u]));
      return discordUserIds.map((id) => userMap.get(id) || null);
    }),

    // ============================================================
    // BINGO BOARD LOADERS
    // ============================================================

    /**
     * Load bingo boards by user ID (boards user can edit)
     * Usage: loaders.boardsByUserId.load(userId)
     */
    boardsByUserId: new DataLoader(async (userIds) => {
      console.log(`📦 Batching boards for ${userIds.length} users`);

      // This requires a join through the editors association
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

    /**
     * Load tiles by board ID
     * Usage: loaders.tilesByBoardId.load(boardId)
     */
    tilesByBoardId: new DataLoader(async (boardIds) => {
      console.log(`📦 Batching tiles for ${boardIds.length} boards`);

      const tiles = await BingoTile.findAll({
        where: { board: { [Op.in]: boardIds } },
      });

      const tilesMap = new Map();
      boardIds.forEach((id) => tilesMap.set(id.toString(), []));

      tiles.forEach((tile) => {
        const arr = tilesMap.get(tile.board.toString());
        if (arr) arr.push(tile);
      });

      return boardIds.map((id) => tilesMap.get(id.toString()) || []);
    }),

    /**
     * Load editors by board ID
     * Usage: loaders.editorsByBoardId.load(boardId)
     */
    editorsByBoardId: new DataLoader(async (boardIds) => {
      console.log(`📦 Batching editors for ${boardIds.length} boards`);

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

    /**
     * Load treasure event by ID
     * Usage: loaders.treasureEventById.load(eventId)
     */
    treasureEventById: new DataLoader(async (eventIds) => {
      console.log(`📦 Batching ${eventIds.length} treasure events`);

      const events = await TreasureEvent.findAll({
        where: { eventId: { [Op.in]: eventIds } },
      });

      const eventMap = new Map(events.map((e) => [e.eventId, e]));
      return eventIds.map((id) => eventMap.get(id) || null);
    }),

    /**
     * Load teams by event ID
     * Usage: loaders.teamsByEventId.load(eventId)
     */
    teamsByEventId: new DataLoader(async (eventIds) => {
      console.log(`📦 Batching teams for ${eventIds.length} events`);

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
     * Load nodes by event ID
     * Usage: loaders.nodesByEventId.load(eventId)
     */
    nodesByEventId: new DataLoader(async (eventIds) => {
      console.log(`📦 Batching nodes for ${eventIds.length} events`);

      const nodes = await TreasureNode.findAll({
        where: { eventId: { [Op.in]: eventIds } },
      });

      const nodesMap = new Map();
      eventIds.forEach((id) => nodesMap.set(id, []));

      nodes.forEach((node) => {
        const arr = nodesMap.get(node.eventId);
        if (arr) arr.push(node);
      });

      return eventIds.map((id) => nodesMap.get(id) || []);
    }),

    // ============================================================
    // TREASURE TEAM LOADERS
    // ============================================================

    /**
     * Load team by composite key (teamId + eventId)
     * Usage: loaders.teamByCompositeKey.load({ teamId, eventId })
     */
    teamByCompositeKey: new DataLoader(
      async (keys) => {
        console.log(`📦 Batching ${keys.length} team lookups by composite key`);

        // Build OR conditions for each key pair
        const conditions = keys.map((k) => ({
          teamId: k.teamId,
          eventId: k.eventId,
        }));

        const teams = await TreasureTeam.findAll({
          where: { [Op.or]: conditions },
        });

        // Create a map with composite key
        const teamMap = new Map();
        teams.forEach((team) => {
          const key = `${team.teamId}:${team.eventId}`;
          teamMap.set(key, team);
        });

        return keys.map((k) => teamMap.get(`${k.teamId}:${k.eventId}`) || null);
      },
      {
        // Custom cache key function for object keys
        cacheKeyFn: (key) => `${key.teamId}:${key.eventId}`,
      }
    ),

    /**
     * Load submissions by team ID
     * Usage: loaders.submissionsByTeamId.load(teamId)
     */
    submissionsByTeamId: new DataLoader(async (teamIds) => {
      console.log(`📦 Batching submissions for ${teamIds.length} teams`);

      const submissions = await TreasureSubmission.findAll({
        where: { teamId: { [Op.in]: teamIds } },
        order: [['submittedAt', 'DESC']],
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

    /**
     * Load submission by ID
     * Usage: loaders.submissionById.load(submissionId)
     */
    submissionById: new DataLoader(async (submissionIds) => {
      console.log(`📦 Batching ${submissionIds.length} submissions`);

      const submissions = await TreasureSubmission.findAll({
        where: { submissionId: { [Op.in]: submissionIds } },
      });

      const subMap = new Map(submissions.map((s) => [s.submissionId, s]));
      return submissionIds.map((id) => subMap.get(id) || null);
    }),

    /**
     * Load team for a submission
     * Usage: loaders.teamForSubmission.load(teamId)
     */
    teamForSubmission: new DataLoader(async (teamIds) => {
      console.log(`📦 Batching teams for ${teamIds.length} submissions`);

      const teams = await TreasureTeam.findAll({
        where: { teamId: { [Op.in]: teamIds } },
      });

      const teamMap = new Map(teams.map((t) => [t.teamId, t]));
      return teamIds.map((id) => teamMap.get(id) || null);
    }),

    // ============================================================
    // TREASURE NODE LOADERS
    // ============================================================

    /**
     * Load node by ID
     * Usage: loaders.nodeById.load(nodeId)
     */
    nodeById: new DataLoader(async (nodeIds) => {
      console.log(`📦 Batching ${nodeIds.length} nodes`);

      const nodes = await TreasureNode.findAll({
        where: { nodeId: { [Op.in]: nodeIds } },
      });

      const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
      return nodeIds.map((id) => nodeMap.get(id) || null);
    }),
  };
};

module.exports = { createLoaders };
