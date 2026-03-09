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

    refs: async (event, _, { loaders }) => {
      if (!event.refIds?.length) return [];
      const refs = await Promise.all(
        event.refIds.map((id) => loaders.userById.load(id.toString()))
      );
      return refs.filter(Boolean);
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
        attributes: ['discordUserId', 'discordUsername', 'discordAvatar', 'username', 'rsn'],
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
              rsn: user.rsn ?? null,
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
  // CHAMPION FORGE TEAM FIELD RESOLVERS
  // ============================================================
  ClanWarsTeam: {
    members: async (team) => {
      if (!team.members?.length) return [];

      // Normalise member entries — stored as objects { discordId, ... } or legacy plain strings
      const normalised = team.members.map((m) =>
        typeof m === 'string' ? { discordId: m, username: null, avatar: null, role: null } : m
      );

      // Enrich with site data for registered users
      const discordIds = normalised.map((m) => m.discordId).filter(Boolean);
      const siteUsers = await User.findAll({
        where: { discordUserId: discordIds },
        attributes: ['discordUserId', 'discordUsername', 'discordAvatar', 'username'],
      });
      const siteMap = new Map(siteUsers.map((u) => [u.discordUserId, u]));

      return Promise.all(
        normalised.map(async (m) => {
          const siteUser = siteMap.get(m.discordId);
          if (siteUser) {
            return {
              discordId: m.discordId,
              username: siteUser.discordUsername ?? siteUser.username ?? m.username ?? null,
              avatar: siteUser.discordAvatar ?? m.avatar ?? null,
              role: m.role ?? null,
            };
          }

          // Fall back to what was stored (from event creation form input)
          if (m.username) {
            return { discordId: m.discordId, username: m.username, avatar: m.avatar ?? null, role: m.role ?? null };
          }

          // Last resort — Discord API
          const discordUser = await fetchDiscordUser(m.discordId);
          return {
            discordId: m.discordId,
            username: discordUser?.global_name ?? discordUser?.username ?? null,
            avatar: discordUser?.avatar ?? null,
            role: m.role ?? null,
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
