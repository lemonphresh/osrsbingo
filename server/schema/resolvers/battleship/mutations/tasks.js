'use strict';

const { getModels, requireAuth, requireAdmin, getEventOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const {
  parseDraftWorkbook,
  taskAttributes,
} = require('../../../../utils/battleship/bsDraftWorkbook');
const { UserInputError } = require('apollo-server-express');

function baseContentId(contentId) {
  return String(contentId ?? '').replace(/_kc$/, '');
}

function taskSignature(attrs) {
  return JSON.stringify([
    baseContentId(attrs.contentId),
    attrs.metricType,
    attrs.metricTarget,
    attrs.womMetric ?? null,
    attrs.validDrops ?? [],
  ]);
}

module.exports = {
  addBSTask: async (_, { eventId, input }, context) => {
    const user = requireAuth(context);
    const { BSTask } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    return BSTask.create({
      taskId: generateId('bstk'),
      eventId,
      label: input.label,
      description: input.description ?? null,
    });
  },

  updateBSTask: async (_, { taskId, input }, context) => {
    const user = requireAuth(context);
    const { BSTask } = getModels();
    const task = await BSTask.findByPk(taskId);
    if (!task) throw new UserInputError(`BSTask ${taskId} not found`);
    const event = await getEventOrThrow(task.eventId);
    requireAdmin(event, user.id);
    await task.update({
      ...(input.label       != null && { label:       input.label }),
      ...(input.bossOrSkill != null && { bossOrSkill: input.bossOrSkill }),
      ...(input.metricType  != null && { metricType:  input.metricType }),
      ...(input.metricTarget!= null && { metricTarget:input.metricTarget }),
      ...(input.metricUnit  != null && { metricUnit:  input.metricUnit }),
      ...(input.metricLabel != null && { metricLabel: input.metricLabel }),
      ...(input.validDrops  != null && { validDrops:  input.validDrops }),
      ...(input.womMetric   != null && { womMetric:   input.womMetric }),
      ...(input.description != null && { description: input.description }),
    });
    return task;
  },

  removeBSTask: async (_, { taskId }, context) => {
    const user = requireAuth(context);
    const { BSTask } = getModels();
    const task = await BSTask.findByPk(taskId);
    if (!task) throw new UserInputError(`BSTask ${taskId} not found`);
    const event = await getEventOrThrow(task.eventId);
    requireAdmin(event, user.id);
    await task.update({ isActive: false });
    return true;
  },

  setBSShipTemplate: async (_, { eventId, shipType, cellIndex, taskId }, context) => {
    const user = requireAuth(context);
    const { BSShipTemplate, BSTask } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);

    // Validate task belongs to this event
    const task = await BSTask.findByPk(taskId);
    if (!task || task.eventId !== eventId) throw new UserInputError('Task not found in this event');

    // Upsert: one template record per (eventId, shipType, cellIndex)
    const existing = await BSShipTemplate.findOne({ where: { eventId, shipType, cellIndex } });
    if (existing) {
      await existing.update({ taskId });
      return existing;
    }
    return BSShipTemplate.create({
      templateId: generateId('bsst'),
      eventId,
      shipType,
      cellIndex,
      taskId,
    });
  },

  updateBSTileTask: async (_, { tileId, taskId }, context) => {
    const user = requireAuth(context);
    const { BSTile, BSTask, BSBoard } = getModels();
    const tile = await BSTile.findByPk(tileId);
    if (!tile) throw new UserInputError(`BSTile ${tileId} not found`);
    const board = await BSBoard.findByPk(tile.boardId);
    const event = await getEventOrThrow(board.eventId);
    requireAdmin(event, user.id);
    const task = await BSTask.findByPk(taskId);
    if (!task || task.eventId !== board.eventId) throw new UserInputError('Task not found in this event');
    await tile.update({ taskId });
    return tile;
  },

  importBSDraftWorkbook: async (_, { eventId, contentBase64, apply }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSEvent, BSBoard, BSTile, BSTask, BSShipTemplate } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    if (event.status !== 'DRAFT') {
      throw new UserInputError('The Battleship workbook can only be imported during DRAFT.');
    }
    if (typeof contentBase64 !== 'string' || contentBase64.length === 0) {
      throw new UserInputError('Workbook data is required.');
    }
    if (contentBase64.length > 8_000_000) {
      throw new UserInputError('Workbook is too large. Maximum size is 6 MB.');
    }

    let parsed;
    try {
      parsed = await parseDraftWorkbook(Buffer.from(contentBase64, 'base64'));
    } catch (err) {
      return {
        applied: false,
        oceanTileCount: 0,
        shipTileCount: 0,
        errors: [`Could not read workbook: ${err.message}`],
      };
    }
    const result = {
      applied: false,
      oceanTileCount: parsed.oceanTiles.length,
      shipTileCount: parsed.shipTiles.length,
      errors: parsed.errors,
    };
    if (parsed.errors.length > 0 || !apply) return result;

    await sequelize.transaction(async (transaction) => {
      const lockedEvent = await BSEvent.findByPk(eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!lockedEvent || lockedEvent.status !== 'DRAFT') {
        throw new UserInputError('The event left DRAFT before the workbook could be imported.');
      }
      const templateBoard = await BSBoard.findOne({
        where: { eventId, teamId: null },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!templateBoard) throw new UserInputError('Draft template board not found.');

      const existingTasks = await BSTask.findAll({ where: { eventId }, transaction });
      const tasksBySignature = new Map(existingTasks.map((task) => [taskSignature(task), task]));
      const taskForRow = async (row) => {
        const attrs = taskAttributes(row);
        const signature = taskSignature(attrs);
        if (tasksBySignature.has(signature)) return tasksBySignature.get(signature);
        const task = await BSTask.create(
          { taskId: generateId('bstk'), eventId, ...attrs },
          { transaction }
        );
        tasksBySignature.set(signature, task);
        return task;
      };

      const oceanRows = await BSTile.findAll({
        where: { boardId: templateBoard.boardId, shipType: null },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const oceanMap = new Map(oceanRows.map((tile) => [`${tile.row},${tile.col}`, tile]));
      if (oceanMap.size !== 100) {
        throw new UserInputError('Draft template must contain exactly 100 ocean tiles.');
      }
      for (const row of parsed.oceanTiles) {
        const tile = oceanMap.get(`${row.row},${row.col}`);
        if (!tile) throw new UserInputError(`Ocean tile ${row.row},${row.col} was not found.`);
        const task = await taskForRow(row);
        await tile.update({ taskId: task.taskId }, { transaction });
      }

      const templates = await BSShipTemplate.findAll({
        where: { eventId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const templateMap = new Map(
        templates.map((item) => [`${item.shipType}:${item.cellIndex}`, item])
      );
      for (const row of parsed.shipTiles) {
        const key = `${row.shipType}:${row.cellIndex}`;
        const task = await taskForRow(row);
        const template = templateMap.get(key);
        if (template) {
          await template.update({ taskId: task.taskId }, { transaction });
        } else {
          await BSShipTemplate.create(
            {
              templateId: generateId('bsst'),
              eventId,
              shipType: row.shipType,
              cellIndex: row.cellIndex,
              taskId: task.taskId,
            },
            { transaction }
          );
        }
        // Keep legacy null-position ship rows consistent with the canonical template.
        await BSTile.update(
          { taskId: task.taskId },
          {
            where: {
              boardId: templateBoard.boardId,
              shipType: row.shipType,
              cellIndex: row.cellIndex,
            },
            transaction,
          }
        );
      }
    });

    return { ...result, applied: true };
  },
};
