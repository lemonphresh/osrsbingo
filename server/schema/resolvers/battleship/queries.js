'use strict';

const { getModels, requireAuth } = require('./helpers');
const { getViewerCount } = require('../../../utils/battleship/bsViewers');
const { getProposal } = require('../../../utils/battleship/bsProposals');

module.exports = {
  getBSEvent: async (_, { eventId }) => {
    const { BSEvent } = getModels();
    return BSEvent.findByPk(eventId);
  },

  getAllBSEvents: async (_, { creatorId } = {}) => {
    const { BSEvent } = getModels();
    const where = creatorId ? { creatorId: String(creatorId) } : {};
    return BSEvent.findAll({ where, order: [['createdAt', 'DESC']] });
  },

  getBSTaskPool: async (_, { eventId }, context) => {
    requireAuth(context);
    const { BSTask } = getModels();
    return BSTask.findAll({ where: { eventId, isActive: true }, order: [['createdAt', 'ASC']] });
  },

  getBSBoard: async (_, { boardId }, context) => {
    requireAuth(context);
    const { BSBoard } = getModels();
    return BSBoard.findByPk(boardId);
  },

  getBSShotLog: async (_, { eventId }, context) => {
    requireAuth(context);
    const { BSShotLog } = getModels();
    return BSShotLog.findAll({ where: { eventId }, order: [['shotAt', 'DESC']] });
  },

  getBSViewerCount: async (_, { eventId }, context) => {
    requireAuth(context);
    return getViewerCount(eventId);
  },

  getBSSubmissions: async (_, { eventId, status, tileId }, context) => {
    requireAuth(context);
    const { BSSubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    if (tileId) where.tileId = tileId;
    return BSSubmission.findAll({ where, order: [['submittedAt', 'DESC']] });
  },

  getActiveBSProposal: async (_, { teamId }, context) => {
    requireAuth(context);
    return getProposal(teamId) ?? null;
  },
};
