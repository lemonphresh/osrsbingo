'use strict';

const {
  getModels,
  requireAuth,
  requireAdmin,
  isAdminOrRef,
  getEventOrThrow,
} = require('./helpers');
const { getViewerCount } = require('../../../utils/battleship/bsViewers');
const { getProposal } = require('../../../utils/battleship/bsProposals');
const { createDraftWorkbook } = require('../../../utils/battleship/bsDraftWorkbook');

module.exports = {
  getBSEvent: async (_, { eventId }, context) => {
    requireAuth(context);
    const { BSEvent } = getModels();
    return BSEvent.findByPk(eventId);
  },

  getAllBSEvents: async (_, { creatorId } = {}, context) => {
    requireAuth(context);
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
    const user = requireAuth(context);
    const { BSSubmission, BSEvent, BSTeam } = getModels();
    const event = await BSEvent.findByPk(eventId);
    if (!event) return [];
    // Site admins, event admins/refs, and members of any team in the event
    // can see submissions. Everyone else gets nothing.
    const staffAccess = user.admin === true || isAdminOrRef(event, user.id);
    if (!staffAccess) {
      if (!user.discordUserId) return [];
      const teams = await BSTeam.findAll({ where: { eventId } });
      const onTeam = teams.some((t) => (t.members ?? []).includes(user.discordUserId));
      if (!onTeam) return [];
    }
    const where = { eventId };
    if (status) where.status = status;
    if (tileId) where.tileId = tileId;
    return BSSubmission.findAll({ where, order: [['submittedAt', 'DESC']] });
  },

  getActiveBSProposal: async (_, { teamId }, context) => {
    requireAuth(context);
    return getProposal(teamId) ?? null;
  },

  getBSPlacementSuggestions: async (_, { teamId }, context) => {
    const user = requireAuth(context);
    const { BSTeam, BSPlacementSuggestion } = getModels();
    const team = await BSTeam.findByPk(teamId);
    if (!team) return [];
    const { BSEvent } = getModels();
    const event = await BSEvent.findByPk(team.eventId);
    if (!event) return [];
    const uid = String(user.id);
    const isSiteAdmin = user.admin === true;
    const isEventAdmin =
      isSiteAdmin ||
      (event.adminIds ?? []).includes(uid) ||
      event.creatorId === uid;
    // Team members always see their own team's suggestions. Refs can only see
    // if they're on the team. Admins see everything.
    const onTeam = !!user.discordUserId && (team.members ?? []).includes(user.discordUserId);
    if (!isEventAdmin && !onTeam) return [];
    return BSPlacementSuggestion.findAll({
      where: { teamId },
      order: [['createdAt', 'ASC']],
    });
  },

  exportBSDraftWorkbook: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    const { BSBoard, BSTile, BSShipTemplate, BSTask } = getModels();
    const templateBoard = await BSBoard.findOne({ where: { eventId, teamId: null } });
    if (!templateBoard) throw new Error('This event does not have a draft template board.');
    const oceanTiles = await BSTile.findAll({
      where: { boardId: templateBoard.boardId, shipType: null },
      include: [{ model: BSTask, as: 'task' }],
      order: [
        ['row', 'ASC'],
        ['col', 'ASC'],
      ],
    });
    const shipTemplates = await BSShipTemplate.findAll({
      where: { eventId },
      include: [{ model: BSTask, as: 'task' }],
      order: [
        ['shipType', 'ASC'],
        ['cellIndex', 'ASC'],
      ],
    });
    const buffer = await createDraftWorkbook({
      eventName: event.eventName,
      oceanTiles,
      shipTemplates,
    });
    const slug = event.eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return {
      filename: `${slug || 'battleship'}-draft.xlsx`,
      contentBase64: Buffer.from(buffer).toString('base64'),
    };
  },
};
