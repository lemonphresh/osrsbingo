'use strict';

const { getModels, requireAuth, requireAdmin, getEventOrThrow } = require('../helpers');
const { generateId, shuffle } = require('../../../../utils/battleship/bsConfig');
const {
  generateDefaultBSTasks,
  SHIP_TEMPLATE_CONTENT_IDS,
  formatXp,
  buildOceanPool,
} = require('../../../../utils/battleship/bsDefaultTasks');
const { UserInputError } = require('apollo-server-express');

const roundTarget = (val, unit) => {
  if (val == null) return val;
  if (unit === 'xp')      return Math.ceil(val / 10000) * 10000;
  if (unit === 'kc')      return Math.ceil(val / 10) * 10;
  if (unit === 'uniques') return Math.ceil(val);
  return val;
};

function shuffledGridPositions() {
  const positions = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++)
      positions.push({ row: r, col: c });
  return shuffle(positions);
}

/** Creates template board tiles: ship tiles (row/col null) + ocean tiles (row/col assigned). */
async function createTemplateTiles(boardId, templateRecords, oceanPool, BSTile) {
  const shipTiles = templateRecords.map((t) => ({
    tileId:    generateId('bstl'),
    boardId,
    row:       null,
    col:       null,
    shipType:  t.shipType,
    cellIndex: t.cellIndex,
    taskId:    t.taskId,
  }));

  const positions = shuffledGridPositions();
  // 100 cells - 17 ship cells = 83 ocean cells per board
  const oceanTiles = oceanPool.slice(0, 100).map((taskId, i) => ({
    tileId:    generateId('bstl'),
    boardId,
    row:       positions[i].row,
    col:       positions[i].col,
    shipType:  null,
    cellIndex: null,
    taskId,
  }));

  await BSTile.bulkCreate([...shipTiles, ...oceanTiles]);
}

module.exports = {
  createBSEvent: async (_, { input }, context) => {
    const user = requireAuth(context);
    const { BSEvent, BSTask, BSShipTemplate, BSBoard, BSTile } = getModels();
    const eventId = generateId('bs');
    const multiplier = input.metricMultiplier ?? 1.0;
    const contentSelections = input.contentSelections ?? null;

    const event = await BSEvent.create({
      eventId,
      eventName: input.eventName,
      placementPhaseHours: input.placementPhaseHours ?? 24,
      cooldownMinutes: input.cooldownMinutes ?? 10,
      initialSkipTokens: input.initialSkipTokens ?? 2,
      metricMultiplier: multiplier,
      creatorId: String(user.id),
      adminIds: input.adminIds ?? [],
      refIds: input.refIds ?? [],
      guildId: input.guildId ?? null,
      eventPassword: input.eventPassword ?? null,
      contentSelections,
    });

    // Auto-populate tasks from contentRegistry, scaling targets by the multiplier
    const defaultEntries = generateDefaultBSTasks();
    const taskRecords = defaultEntries.map((e) => {
      const rawTarget = e.metricTarget ?? null;
      const unit = e.metricUnit;
      const scaledTarget = rawTarget != null ? roundTarget(rawTarget * multiplier, unit) : null;
      let scaledLabel = e.metricLabel ?? null;
      if (scaledTarget != null) {
        if (unit === 'kc')           scaledLabel = `${scaledTarget} kc`;
        else if (unit === 'xp')      scaledLabel = formatXp(scaledTarget);
        else if (unit === 'uniques') scaledLabel = `${scaledTarget} unique${scaledTarget !== 1 ? 's' : ''}`;
      }
      return {
        taskId:      generateId('bstk'),
        eventId,
        contentId:   e.contentId,
        label:       e.label,
        bossOrSkill: e.bossOrSkill ?? null,
        metricType:  e.metricType ?? null,
        metricTarget: scaledTarget,
        metricUnit:  e.metricUnit ?? null,
        metricLabel: scaledLabel,
        validDrops:  e.validDrops ?? [],
        womMetric:   e.womMetric ?? null,
      };
    });
    await BSTask.bulkCreate(taskRecords);

    // Build contentId → taskId map for template wiring
    const contentIdToTaskId = new Map(
      taskRecords.map((r, i) => [defaultEntries[i].contentId, r.taskId])
    );

    // Auto-create ship template records (17 cells across 5 ships)
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

    // Create the template board (teamId=null) with all 100 tiles pre-assigned
    const templateBoard = await BSBoard.create({
      boardId: generateId('bsb'),
      eventId,
      teamId: null,
    });

    const shipBaseContentIds = new Set(
      Object.values(SHIP_TEMPLATE_CONTENT_IDS).flat().map((cid) =>
        cid.endsWith('_kc') ? cid.slice(0, -3) : cid
      )
    );
    const oceanPool = buildOceanPool(taskRecords, contentSelections, shipBaseContentIds, shuffle);
    await createTemplateTiles(templateBoard.boardId, templateRecords, oceanPool, BSTile);

    return event;
  },

  updateBSContentSelections: async (_, { eventId, contentSelections }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSTask, BSShipTemplate, BSTile } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);

    if (event.status !== 'DRAFT') {
      throw new UserInputError('Content selections can only be changed while the event is in DRAFT.');
    }

    let templateBoard = await BSBoard.findOne({ where: { eventId, teamId: null } });

    const allTasks = await BSTask.findAll({ where: { eventId } });
    const templates = await BSShipTemplate.findAll({ where: { eventId } });
    const shipBaseContentIds = new Set(
      Object.values(SHIP_TEMPLATE_CONTENT_IDS).flat().map((cid) =>
        cid.endsWith('_kc') ? cid.slice(0, -3) : cid
      )
    );
    const oceanPool = buildOceanPool(allTasks, contentSelections, shipBaseContentIds, shuffle);

    if (!templateBoard) {
      // Event predates template board — create it now from existing ship templates
      templateBoard = await BSBoard.create({
        boardId: generateId('bsb'),
        eventId,
        teamId: null,
      });
      const templateRecords = templates.map((t) => ({
        shipType:  t.shipType,
        cellIndex: t.cellIndex,
        taskId:    t.taskId,
      }));
      await createTemplateTiles(templateBoard.boardId, templateRecords, oceanPool, BSTile);
    } else {
      // Delete only ocean tiles — ship tiles are untouched
      await BSTile.destroy({ where: { boardId: templateBoard.boardId, shipType: null } });

      const positions = shuffledGridPositions();
      const oceanTiles = oceanPool.slice(0, 100).map((taskId, i) => ({
        tileId:    generateId('bstl'),
        boardId:   templateBoard.boardId,
        row:       positions[i].row,
        col:       positions[i].col,
        shipType:  null,
        cellIndex: null,
        taskId,
      }));
      await BSTile.bulkCreate(oceanTiles);
    }

    await event.update({ contentSelections });
    return event;
  },

  updateBSMultiplier: async (_, { eventId, multiplier }, context) => {
    const user = requireAuth(context);
    const { BSTask } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);

    if (event.status !== 'DRAFT') {
      throw new UserInputError('Multiplier can only be changed while the event is in DRAFT.');
    }

    // Build contentId → base entry lookup from the unscaled registry defaults
    const baseEntries = generateDefaultBSTasks();
    const baseMap = new Map(baseEntries.map((e) => [e.contentId, e]));

    // Rescale every task that has a contentId
    const tasks = await BSTask.findAll({ where: { eventId } });
    await Promise.all(
      tasks.map((task) => {
        const base = baseMap.get(task.contentId);
        if (!base || base.metricTarget == null) return null;
        const unit = base.metricUnit;
        const scaledTarget = roundTarget(base.metricTarget * multiplier, unit);
        let scaledLabel = base.metricLabel ?? null;
        if (scaledTarget != null) {
          if (unit === 'kc')           scaledLabel = `${scaledTarget} kc`;
          else if (unit === 'xp')      scaledLabel = formatXp(scaledTarget);
          else if (unit === 'uniques') scaledLabel = `${scaledTarget} unique${scaledTarget !== 1 ? 's' : ''}`;
        }
        return task.update({ metricTarget: scaledTarget, metricLabel: scaledLabel });
      })
    );

    await event.update({ metricMultiplier: multiplier });

    return event;
  },

  updateBSEvent: async (_, { eventId, input }, context) => {
    const user = requireAuth(context);
    const { BSTeam } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);

    if (input.scheduledPlacementStart !== undefined && input.scheduledPlacementStart !== null) {
      if (event.status !== 'DRAFT') {
        throw new UserInputError('Cannot schedule launch — event is not in DRAFT.');
      }
      const scheduled = new Date(input.scheduledPlacementStart);
      if (Number.isNaN(scheduled.getTime())) {
        throw new UserInputError('scheduledPlacementStart is not a valid date.');
      }
      if (scheduled.getTime() <= Date.now()) {
        throw new UserInputError('Scheduled launch time must be in the future.');
      }
      const teams = await BSTeam.findAll({ where: { eventId } });
      if (teams.length < 2) {
        throw new UserInputError('At least 2 teams are required to schedule a launch.');
      }
      const missingChannel = teams.find((t) => !t.discordChannelId);
      if (missingChannel) {
        throw new UserInputError(
          `Team "${missingChannel.teamName}" is missing a Discord channel ID. Set it before scheduling a launch.`,
        );
      }
    }

    await event.update({
      ...(input.eventName != null && { eventName: input.eventName }),
      ...(input.placementPhaseHours != null && { placementPhaseHours: input.placementPhaseHours }),
      ...(input.cooldownMinutes != null && { cooldownMinutes: input.cooldownMinutes }),
      ...(input.guildId != null && { guildId: input.guildId }),
      ...(input.announcementsChannelId != null && { announcementsChannelId: input.announcementsChannelId }),
      ...(input.womCompetitionId != null && { womCompetitionId: input.womCompetitionId || null }),
      ...(input.scheduledPlacementStart !== undefined && {
        scheduledPlacementStart: input.scheduledPlacementStart ?? null,
      }),
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
    const { BSTeam } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    const isSiteAdmin = process.env.DEV_MODE === 'true' && user.admin === true;

    if (!isSiteAdmin && event.status !== 'DRAFT') throw new Error('Event must be in DRAFT status to start placement');

    if (!isSiteAdmin) {
      const teams = await BSTeam.findAll({ where: { eventId } });
      const missingChannel = teams.find((t) => !t.discordChannelId);
      if (missingChannel) {
        throw new UserInputError(
          `Team "${missingChannel.teamName}" is missing a Discord channel ID. Set it in the Admin page before starting.`,
        );
      }
    }

    const { runBSPlacementStart } = require('../../../../utils/battleship/bsPlacementStart');
    await runBSPlacementStart(event);
    return event;
  },
};
