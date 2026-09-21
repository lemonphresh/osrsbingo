'use strict';

const {
  getModels,
  requireAuth,
  requireAdmin,
  isAdminOrRef,
  getEventOrThrow,
} = require('./helpers');
const { getLayout } = require('../../../utils/battleship/bsLayoutCache');
const { getViewerCount } = require('../../../utils/battleship/bsViewers');
const { getProposal, isProposalExpired } = require('../../../utils/battleship/bsProposals');
const {
  getSkipProposal,
  isSkipProposalExpired,
} = require('../../../utils/battleship/bsSkipProposals');
const { createDraftWorkbook } = require('../../../utils/battleship/bsDraftWorkbook');
const { ForbiddenError } = require('apollo-server-express');

// Completed / archived events are public game-recap material — the URL is safe
// to share with anyone. Everything else still requires auth.
function isPublicRecap(event) {
  return event?.status === 'COMPLETED' || event?.status === 'ARCHIVED';
}

module.exports = {
  getBSEvent: async (_, { eventId }, context) => {
    const { BSEvent } = getModels();
    const event = await BSEvent.findByPk(eventId);
    if (isPublicRecap(event)) return event;
    requireAuth(context);
    return event;
  },

  getAllBSEvents: async (_, { creatorId } = {}, context) => {
    requireAuth(context);
    const { BSEvent } = getModels();
    const where = creatorId ? { creatorId: String(creatorId) } : {};
    return BSEvent.findAll({ where, order: [['createdAt', 'DESC']] });
  },

  getBSTaskPool: async (_, { eventId }, context) => {
    requireAuth(context);
    try {
      const layout = await getLayout(eventId);
      if (layout) return layout.tasks.filter((t) => t.isActive);
    } catch (_) {
      // Fail open — fall through to the direct DB read.
    }
    const { BSTask } = getModels();
    return BSTask.findAll({ where: { eventId, isActive: true }, order: [['createdAt', 'ASC']] });
  },

  getBSBoard: async (_, { boardId }, context) => {
    requireAuth(context);
    const { BSBoard } = getModels();
    return BSBoard.findByPk(boardId);
  },

  getBSShotLog: async (_, { eventId }, context) => {
    const { BSEvent, BSShotLog } = getModels();
    const event = await BSEvent.findByPk(eventId);
    if (!isPublicRecap(event)) requireAuth(context);
    return BSShotLog.findAll({ where: { eventId }, order: [['shotAt', 'DESC']] });
  },

  getBSProposalLog: async (_, { eventId }, context) => {
    const { BSEvent, BSProposalLog } = getModels();
    const event = await BSEvent.findByPk(eventId);
    if (!isPublicRecap(event)) requireAuth(context);
    return BSProposalLog.findAll({
      where: { eventId },
      order: [['resolvedAt', 'DESC']],
    });
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
    const user = requireAuth(context);
    const { BSTeam, BSEvent } = getModels();
    const team = await BSTeam.findByPk(teamId);
    if (!team) return null;
    const event = await BSEvent.findByPk(team.eventId);
    if (!event) return null;
    const uid = String(user.id);
    const canView =
      user.admin === true ||
      event.creatorId === uid ||
      (event.adminIds ?? []).includes(uid) ||
      (event.refIds ?? []).includes(uid) ||
      (!!user.discordUserId && (team.members ?? []).includes(user.discordUserId));
    if (!canView) throw new ForbiddenError('Team access required');

    const proposal = await getProposal(teamId);
    if (proposal && isProposalExpired(proposal)) {
      await proposal.destroy();
      return null;
    }
    return proposal ?? null;
  },

  getActiveBSSkipProposal: async (_, { teamId }, context) => {
    const user = requireAuth(context);
    const { BSTeam, BSEvent } = getModels();
    const team = await BSTeam.findByPk(teamId);
    if (!team) return null;
    const event = await BSEvent.findByPk(team.eventId);
    if (!event) return null;
    const uid = String(user.id);
    const canView =
      user.admin === true ||
      event.creatorId === uid ||
      (event.adminIds ?? []).includes(uid) ||
      (event.refIds ?? []).includes(uid) ||
      (!!user.discordUserId && (team.members ?? []).includes(user.discordUserId));
    if (!canView) throw new ForbiddenError('Team access required');

    const proposal = getSkipProposal(teamId);
    if (proposal && isSkipProposalExpired(proposal)) return null;
    return proposal;
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
      isSiteAdmin || (event.adminIds ?? []).includes(uid) || event.creatorId === uid;
    // Team members always see their own team's suggestions. Refs can only see
    // if they're on the team. Admins see everything.
    const onTeam = !!user.discordUserId && (team.members ?? []).includes(user.discordUserId);
    if (!isEventAdmin && !onTeam) return [];
    return BSPlacementSuggestion.findAll({
      where: { teamId },
      order: [['createdAt', 'ASC']],
    });
  },

  // Focused ref-console query. Instead of shipping every tile on every board
  // to derive one active shot per firing team, we resolve the shape server-side
  // with a single indexed BSTile.findAll over just the open shots. Payload drops
  // from ~200 tiles to at most one per team, which matters when the refs page
  // refetches on every BS_TILE_UPDATED broadcast.
  getBSRefActiveShots: async (_, { eventId }, context) => {
    requireAuth(context);
    const { BSTeam, BSBoard, BSTile } = getModels();

    const teams = await BSTeam.findAll({
      where: { eventId },
      order: [['createdAt', 'ASC']],
    });
    if (teams.length === 0) return [];

    const boards = await BSBoard.findAll({
      where: { eventId, teamId: teams.map((t) => t.teamId) },
    });
    if (boards.length === 0) return teams.map((team) => ({ team, activeTile: null }));

    // One query — indexed on boardId — for every currently-open shot across
    // every team's board. shotAt DESC so the first match per firing team wins.
    const openTiles = await BSTile.findAll({
      where: {
        boardId: boards.map((b) => b.boardId),
        isShot: true,
        taskCompleted: false,
        skipped: false,
      },
      order: [['shotAt', 'DESC']],
    });

    const boardOwnerByBoardId = new Map(boards.map((b) => [b.boardId, b.teamId]));

    // Decorate .task from the layout cache so BSTile.task returns without a DB
    // hop. Fail-open: if the cache errors we skip decoration and BSTile.task
    // falls back to its own findByPk.
    const layout = await getLayout(eventId).catch(() => null);
    if (layout) {
      openTiles.forEach((tile) => {
        const activeTaskId = tile.shipTaskId ?? tile.taskId;
        tile.task = activeTaskId ? layout.tasksById.get(activeTaskId) ?? null : null;
      });
    }

    return teams.map((team) => {
      // A firing team's active tile lives on any board they don't own. openTiles
      // is already sorted newest-first, so .find returns the most recent match.
      const activeTile =
        openTiles.find((t) => boardOwnerByBoardId.get(t.boardId) !== team.teamId) ?? null;
      return { team, activeTile };
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
