const { User } = require('../../db/models');
const axios = require('axios');

const discordUserCache = new Map();
const DISCORD_CACHE_TTL = 30 * 60 * 1000;

const fetchDiscordUser = async (discordId) => {
  const cached = discordUserCache.get(discordId);
  if (cached && Date.now() - cached.fetchedAt < DISCORD_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await axios.get(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });
    discordUserCache.set(discordId, { data: res.data, fetchedAt: Date.now() });
    return res.data;
  } catch {
    return null;
  }
};

const DEFAULT_BONUS_SETTINGS = {
  allowDiagonals: false,
  horizontalBonus: 0,
  verticalBonus: 0,
  diagonalBonus: 0,
  blackoutBonus: 0,
};

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

    bonusSettings: (board) => {
      return board.bonusSettings ?? DEFAULT_BONUS_SETTINGS;
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

    members: async (team) => {
      if (!team.members?.length) return [];

      const users = await User.findAll({
        where: { discordUserId: team.members },
        attributes: ['discordUserId', 'discordUsername', 'discordAvatar', 'username'],
      });

      const userMap = new Map(users.map((u) => [u.discordUserId, u]));

      return Promise.all(
        team.members.map(async (id) => {
          const user = userMap.get(id);
          if (user) {
            return {
              discordUserId: id,
              discordUsername: user.discordUsername,
              discordAvatar: user.discordAvatar,
              username: user.username,
            };
          }

          // not registered — hit Discord API
          const discordUser = await fetchDiscordUser(id);
          return {
            discordUserId: id,
            discordUsername: discordUser?.username ?? null,
            discordAvatar: discordUser?.avatar ?? null,
            username: null,
          };
        })
      );
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
