'use strict';

const { getModels, requireAuth, requireAdmin, getEventOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { generateDefaultBSTasks, SHIP_TEMPLATE_CONTENT_IDS } = require('../../../../utils/battleship/bsDefaultTasks');

module.exports = {
  createBSEvent: async (_, { input }, context) => {
    const user = requireAuth(context);
    const { BSEvent, BSTask, BSShipTemplate } = getModels();
    const eventId = generateId('bs');
    const event = await BSEvent.create({
      eventId,
      eventName: input.eventName,
      placementPhaseHours: input.placementPhaseHours ?? 24,
      cooldownMinutes: input.cooldownMinutes ?? 10,
      creatorId: String(user.id),
      adminIds: input.adminIds ?? [],
      refIds: input.refIds ?? [],
      guildId: input.guildId ?? null,
    });

    // Auto-populate tasks from contentRegistry
    const defaultEntries = generateDefaultBSTasks();
    const taskRecords = defaultEntries.map((e) => ({
      taskId:      generateId('bstk'),
      eventId,
      label:       e.label,
      bossOrSkill: e.bossOrSkill ?? null,
      metricType:  e.metricType ?? null,
      metricTarget:e.metricTarget ?? null,
      metricUnit:  e.metricUnit ?? null,
      metricLabel: e.metricLabel ?? null,
      validDrops:  e.validDrops ?? [],
      womMetric:   e.womMetric ?? null,
    }));
    await BSTask.bulkCreate(taskRecords);

    // Build contentId → taskId map for template wiring
    const contentIdToTaskId = new Map(
      taskRecords.map((r, i) => [defaultEntries[i].contentId, r.taskId])
    );

    // Auto-create ship template records
    const templateRecords = [];
    for (const [shipType, contentIds] of Object.entries(SHIP_TEMPLATE_CONTENT_IDS)) {
      contentIds.forEach((contentId, cellIndex) => {
        const taskId = contentIdToTaskId.get(contentId);
        if (taskId) {
          templateRecords.push({ templateId: generateId('bsst'), eventId, shipType, cellIndex, taskId });
        }
      });
    }
    await BSShipTemplate.bulkCreate(templateRecords);

    return event;
  },

  updateBSEvent: async (_, { eventId, input }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    await event.update({
      ...(input.eventName != null && { eventName: input.eventName }),
      ...(input.placementPhaseHours != null && { placementPhaseHours: input.placementPhaseHours }),
      ...(input.cooldownMinutes != null && { cooldownMinutes: input.cooldownMinutes }),
      ...(input.guildId != null && { guildId: input.guildId }),
      ...(input.announcementsChannelId != null && { announcementsChannelId: input.announcementsChannelId }),
    });
    return event;
  },

  addBSAdmin: async (_, { eventId, userId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    const adminIds = [...new Set([...event.adminIds, String(userId)])];
    await event.update({ adminIds });
    return event;
  },

  addBSRef: async (_, { eventId, userId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    const refIds = [...new Set([...(event.refIds ?? []), String(userId)])];
    await event.update({ refIds });
    return event;
  },

  removeBSRef: async (_, { eventId, userId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    const refIds = (event.refIds ?? []).filter((id) => id !== String(userId));
    await event.update({ refIds });
    return event;
  },

  deleteBSEvent: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const { BSTask, BSTeam, BSBoard, BSShipTemplate, BSShotLog, BSShipPlacement, BSTile } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);

    // Collect board IDs before deletion so we can cascade board-level children
    const boards = await BSBoard.findAll({ where: { eventId }, attributes: ['boardId'] });
    const boardIds = boards.map((b) => b.boardId);

    if (boardIds.length > 0) {
      await BSTile.destroy({ where: { boardId: boardIds } });
      await BSShipPlacement.destroy({ where: { boardId: boardIds } });
    }
    await BSBoard.destroy({ where: { eventId } });
    await BSShotLog.destroy({ where: { eventId } });
    await BSShipTemplate.destroy({ where: { eventId } });
    await BSTask.destroy({ where: { eventId } });
    await BSTeam.destroy({ where: { eventId } });
    await event.destroy();

    return { success: true, message: 'Event deleted.' };
  },

  startBSPlacementPhase: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const { BSBoard } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    if (event.status !== 'DRAFT') throw new Error('Event must be in DRAFT status to start placement');

    const now = new Date();
    const endsAt = new Date(now.getTime() + event.placementPhaseHours * 60 * 60 * 1000);

    await event.update({
      status: 'PLACEMENT',
      placementStartsAt: now,
      placementEndsAt: endsAt,
    });

    // Ensure boards exist for all teams
    const { BSTeam } = getModels();
    const teams = await BSTeam.findAll({ where: { eventId } });
    for (const team of teams) {
      const existing = await BSBoard.findOne({ where: { teamId: team.teamId } });
      if (!existing) {
        await BSBoard.create({
          boardId: generateId('bsb'),
          eventId,
          teamId: team.teamId,
        });
      }
    }

    return event;
  },
};
