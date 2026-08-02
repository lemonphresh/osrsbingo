'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { Op, fn, col } = require('sequelize');
const { getEventOrThrow, getTeamOrThrow, getWarChest, getModels } = require('./helpers');
const { getViewerCount } = require('../../../utils/championForge/battleViewers');

module.exports = {
  getCFEvent: async (_, { eventId }) => {
    return getEventOrThrow(eventId);
  },

  getAllCFEvents: async () => {
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

  getCFTeam: async (_, { eventId, teamId }) => {
    const { CFTeam } = getModels();
    const team = await CFTeam.findOne({ where: { teamId, eventId } });
    if (!team) throw new UserInputError('Team not found');
    return team;
  },

  getCFWarChest: async (_, { teamId }) => {
    return getWarChest(teamId);
  },

  getCFSubmissions: async (_, { eventId, status, limit = 200, offset = 0 }) => {
    const { CFSubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    return CFSubmission.findAll({ where, order: [['submittedAt', 'DESC']], limit, offset });
  },

  getCFSubmissionSummaries: async (_, { eventId }) => {
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

  getCFTaskSubmissions: async (_, { eventId, taskId, teamId }) => {
    const { CFSubmission } = getModels();
    return CFSubmission.findAll({
      where: { eventId, taskId, teamId },
      order: [['submittedAt', 'DESC']],
    });
  },

  getBattleViewerCount: async (_, { eventId }) => {
    return getViewerCount(eventId);
  },

  getCFBattle: async (_, { battleId }) => {
    const { CFBattle } = getModels();
    return CFBattle.findByPk(battleId);
  },

  getCFBattleLog: async (_, { battleId, limit = 500, offset = 0 }) => {
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

  getCFTaskPool: async (_, { eventId }) => {
    const { CFTask } = getModels();
    return CFTask.findAll({ where: { eventId, isActive: true } });
  },

  getCFPreScreenshots: async (_, { eventId, limit = 200, offset = 0 }) => {
    const { CFPreScreenshot } = getModels();
    return CFPreScreenshot.findAll({ where: { eventId }, order: [['submittedAt', 'DESC']], limit, offset });
  },
};
