'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { Op, fn, col } = require('sequelize');
const { getEventOrThrow, getTeamOrThrow, getWarChest, getModels } = require('./helpers');

module.exports = {
  getClanWarsEvent: async (_, { eventId }) => {
    return getEventOrThrow(eventId);
  },

  getAllClanWarsEvents: async () => {
    const { ClanWarsEvent } = getModels();
    return ClanWarsEvent.findAll({ order: [['createdAt', 'DESC']] });
  },

  getMyClanWarsEvents: async (_, __, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsEvent } = getModels();
    return ClanWarsEvent.findAll({
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

  getClanWarsTeam: async (_, { eventId, teamId }) => {
    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findOne({ where: { teamId, eventId } });
    if (!team) throw new UserInputError('Team not found');
    return team;
  },

  getClanWarsWarChest: async (_, { teamId }) => {
    return getWarChest(teamId);
  },

  getClanWarsSubmissions: async (_, { eventId, status, limit = 200, offset = 0 }) => {
    const { ClanWarsSubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    return ClanWarsSubmission.findAll({ where, order: [['submittedAt', 'DESC']], limit, offset });
  },

  getClanWarsSubmissionSummaries: async (_, { eventId }) => {
    const { ClanWarsSubmission } = getModels();
    const rows = await ClanWarsSubmission.findAll({
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

  getClanWarsTaskSubmissions: async (_, { eventId, taskId, teamId }) => {
    const { ClanWarsSubmission } = getModels();
    return ClanWarsSubmission.findAll({
      where: { eventId, taskId, teamId },
      order: [['submittedAt', 'DESC']],
    });
  },

  getClanWarsBattle: async (_, { battleId }) => {
    const { ClanWarsBattle } = getModels();
    return ClanWarsBattle.findByPk(battleId);
  },

  getClanWarsBattleLog: async (_, { battleId, limit = 500, offset = 0 }) => {
    const { ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    return ClanWarsBattleLog.findAll({
      where: { battleId },
      order: [
        ['turnNumber', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      limit,
      offset,
    });
  },

  getClanWarsTaskPool: async (_, { eventId }) => {
    const { ClanWarsTask } = getModels();
    return ClanWarsTask.findAll({ where: { eventId, isActive: true } });
  },

  getClanWarsPreScreenshots: async (_, { eventId, limit = 200, offset = 0 }) => {
    const { ClanWarsPreScreenshot } = getModels();
    return ClanWarsPreScreenshot.findAll({ where: { eventId }, order: [['submittedAt', 'DESC']], limit, offset });
  },
};
