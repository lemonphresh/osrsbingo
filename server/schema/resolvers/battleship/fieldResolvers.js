'use strict';

const { getModels } = require('./helpers');

const BSEvent = {
  teams: (event) => {
    const { BSTeam } = getModels();
    return BSTeam.findAll({ where: { eventId: event.eventId } });
  },
  tasks: (event) => {
    const { BSTask } = getModels();
    return BSTask.findAll({ where: { eventId: event.eventId, isActive: true }, order: [['createdAt', 'ASC']] });
  },
  shipTemplates: (event) => {
    const { BSShipTemplate } = getModels();
    return BSShipTemplate.findAll({ where: { eventId: event.eventId } });
  },
  refs: (event) => {
    if (!event.refIds?.length) return [];
    const { User } = getModels();
    return User.findAll({ where: { id: event.refIds } });
  },
};

const BSTeam = {
  board: (team) => {
    const { BSBoard } = getModels();
    return BSBoard.findOne({ where: { teamId: team.teamId } });
  },
};

const BSBoard = {
  shipPlacements: (board) => {
    const { BSShipPlacement } = getModels();
    return BSShipPlacement.findAll({ where: { boardId: board.boardId } });
  },
  tiles: (board) => {
    const { BSTile } = getModels();
    return BSTile.findAll({ where: { boardId: board.boardId }, order: [['row', 'ASC'], ['col', 'ASC']] });
  },
};

const BSShipTemplate = {
  task: (template) => {
    if (!template.taskId) return null;
    const { BSTask } = getModels();
    return BSTask.findByPk(template.taskId);
  },
};

const BSTile = {
  task: (tile) => {
    if (!tile.taskId) return null;
    const { BSTask } = getModels();
    return BSTask.findByPk(tile.taskId);
  },
};

module.exports = { BSEvent, BSTeam, BSBoard, BSShipTemplate, BSTile };
