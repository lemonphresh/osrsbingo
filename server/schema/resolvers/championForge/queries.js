'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { Op, fn, col } = require('sequelize');
const {
  getEventOrThrow,
  getTeamOrThrow,
  getWarChest,
  getModels,
  isAdminOrRef,
} = require('./helpers');
const { getViewerCount } = require('../../../utils/championForge/battleViewers');

function requireAuth(user) {
  if (!user) throw new AuthenticationError('Not authenticated');
}

function isTeamMember(team, discordId) {
  if (!discordId) return false;
  return (team.members ?? []).some((m) =>
    typeof m === 'string' ? m === discordId : m.discordId === discordId
  );
}

module.exports = {
  getCFEvent: async (_, { eventId }, { user }) => {
    requireAuth(user);
    return getEventOrThrow(eventId);
  },

  getAllCFEvents: async (_, __, { user }) => {
    requireAuth(user);
    const { CFEvent } = getModels();
    return CFEvent.findAll({ order: [['createdAt', 'DESC']] });
  },

  getMyCFEvents: async (_, __, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { CFEvent } = getModels();
    return CFEvent.findAll({
      where: {
        [Op.or]: [
          { creatorId: String(user.id) },
          { adminIds: { [Op.contains]: [String(user.id)] } },
          { refIds: { [Op.contains]: [String(user.id)] } },
        ],
      },
      order: [['createdAt', 'DESC']],
    });
  },

  getCFTeam: async (_, { eventId, teamId }, { user }) => {
    requireAuth(user);
    const { CFTeam } = getModels();
    const team = await CFTeam.findOne({ where: { teamId, eventId } });
    if (!team) throw new UserInputError('Team not found');
    return team;
  },

  getCFWarChest: async (_, { teamId }, { user }) => {
    requireAuth(user);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    const discordId = user.discordUserId ?? null;
    // During OUTFITTING the war chest is opponent-secret: only team members
    // and event admins/refs can inspect it. After BATTLE begins, it's public
    // for spectators.
    if (event.status === 'OUTFITTING' || event.status === 'GATHERING') {
      const canView = isAdminOrRef(event, user.id, discordId) || isTeamMember(team, discordId);
      if (!canView) throw new AuthenticationError('War chest is hidden until battle');
    }
    return getWarChest(teamId);
  },

  getCFSubmissions: async (_, { eventId, status, limit = 200, offset = 0 }, { user }) => {
    requireAuth(user);
    const { CFSubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    return CFSubmission.findAll({ where, order: [['submittedAt', 'DESC']], limit, offset });
  },

  getCFSubmissionSummaries: async (_, { eventId }, { user }) => {
    requireAuth(user);
    const { CFSubmission } = getModels();
    const rows = await CFSubmission.findAll({
      where: { eventId },
      attributes: ['taskId', 'teamId', 'status', [fn('COUNT', col('submissionId')), 'count']],
      group: ['taskId', 'teamId', 'status'],
      raw: true,
    });

    const map = {};
    for (const row of rows) {
      const key = `${row.taskId}_${row.teamId}`;
      if (!map[key])
        map[key] = {
          taskId: row.taskId,
          teamId: row.teamId,
          pendingCount: 0,
          approvedCount: 0,
          deniedCount: 0,
        };
      const count = parseInt(row.count, 10);
      if (row.status === 'PENDING') map[key].pendingCount = count;
      if (row.status === 'APPROVED') map[key].approvedCount = count;
      if (row.status === 'DENIED') map[key].deniedCount = count;
    }
    return Object.values(map);
  },

  getCFTaskSubmissions: async (_, { eventId, taskId, teamId }, { user }) => {
    requireAuth(user);
    const { CFSubmission } = getModels();
    return CFSubmission.findAll({
      where: { eventId, taskId, teamId },
      order: [['submittedAt', 'DESC']],
    });
  },

  getBattleViewerCount: async (_, { eventId }) => {
    return getViewerCount(eventId);
  },

  getCFBattle: async (_, { battleId }, { user }) => {
    requireAuth(user);
    const { CFBattle } = getModels();
    return CFBattle.findByPk(battleId);
  },

  getCFBattlesByEvent: async (_, { eventId }, { user }) => {
    requireAuth(user);
    const { CFBattle } = getModels();
    return CFBattle.findAll({
      where: { eventId, status: 'COMPLETED' },
      order: [['endedAt', 'ASC']],
    });
  },

  getCFBattleLog: async (_, { battleId, limit = 500, offset = 0 }, { user }) => {
    requireAuth(user);
    const { CFBattleEvent: CFBattleLog } = getModels();
    return CFBattleLog.findAll({
      where: { battleId },
      order: [
        ['turnNumber', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      limit,
      offset,
    });
  },

  getCFTaskPool: async (_, { eventId }, { user }) => {
    requireAuth(user);
    const { CFTask } = getModels();
    return CFTask.findAll({ where: { eventId, isActive: true } });
  },

  getCFPreScreenshots: async (_, { eventId, limit = 200, offset = 0 }, { user }) => {
    requireAuth(user);
    const { CFPreScreenshot } = getModels();
    return CFPreScreenshot.findAll({ where: { eventId }, order: [['submittedAt', 'DESC']], limit, offset });
  },
};

