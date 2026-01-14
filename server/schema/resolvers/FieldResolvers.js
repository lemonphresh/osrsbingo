// server/graphql/resolvers/fieldResolvers.js
//
// These field resolvers tell GraphQL how to resolve nested fields.
// They use DataLoaders to batch and cache database lookups.
//
// Add these to your combined resolvers in index.js

const fieldResolvers = {
  // ============================================================
  // USER FIELD RESOLVERS
  // ============================================================
  User: {
    editorBoards: async (user, _, { loaders }) => {
      return loaders.boardsByUserId.load(user.id.toString());
    },
  },

  // ============================================================
  // BINGO BOARD FIELD RESOLVERS
  // ============================================================
  BingoBoard: {
    tiles: async (board, _, { loaders }) => {
      return loaders.tilesByBoardId.load(board.id.toString());
    },

    editors: async (board, _, { loaders }) => {
      return loaders.editorsByBoardId.load(board.id.toString());
    },
  },

  // ============================================================
  // TREASURE EVENT FIELD RESOLVERS
  // ============================================================
  TreasureEvent: {
    teams: async (event, _, { loaders }) => {
      return loaders.teamsByEventId.load(event.eventId);
    },

    nodes: async (event, _, { loaders }) => {
      return loaders.nodesByEventId.load(event.eventId);
    },

    admins: async (event, _, { loaders }) => {
      if (!event.adminIds?.length) return [];

      // Load all admin users in parallel, batched into single query
      const admins = await Promise.all(
        event.adminIds.map((id) => loaders.userById.load(id.toString()))
      );

      // Filter out any null values (users that don't exist)
      return admins.filter(Boolean);
    },

    creator: async (event, _, { loaders }) => {
      if (!event.creatorId) return null;
      return loaders.userById.load(event.creatorId.toString());
    },
  },

  // ============================================================
  // TREASURE TEAM FIELD RESOLVERS
  // ============================================================
  TreasureTeam: {
    submissions: async (team, _, { loaders }) => {
      return loaders.submissionsByTeamId.load(team.teamId);
    },

    event: async (team, _, { loaders }) => {
      return loaders.treasureEventById.load(team.eventId);
    },
  },

  // ============================================================
  // TREASURE SUBMISSION FIELD RESOLVERS
  // ============================================================
  TreasureSubmission: {
    team: async (submission, _, { loaders }) => {
      return loaders.teamForSubmission.load(submission.teamId);
    },
  },
};

module.exports = fieldResolvers;
