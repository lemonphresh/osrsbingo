'use strict';

const { Op, literal } = require('sequelize');
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
  templateBoard: (event) => {
    const { BSBoard } = getModels();
    return BSBoard.findOne({ where: { eventId: event.eventId, teamId: null } });
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
    // NULLS LAST keeps pre-placement tiles (row=null) from breaking sorted views
    return BSTile.findAll({
      where: { boardId: board.boardId },
      order: [literal('"row" ASC NULLS LAST, "col" ASC NULLS LAST')],
    });
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
    const activeTaskId = tile.shipTaskId ?? tile.taskId;
    if (!activeTaskId) return null;
    const { BSTask } = getModels();
    return BSTask.findByPk(activeTaskId);
  },
};

module.exports = { BSEvent, BSTeam, BSBoard, BSShipTemplate, BSTile };
