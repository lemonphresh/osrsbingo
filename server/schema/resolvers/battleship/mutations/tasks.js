'use strict';

const { getModels, requireAuth, requireAdmin, getEventOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');

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
};
