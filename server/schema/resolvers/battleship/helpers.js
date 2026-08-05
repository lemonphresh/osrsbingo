'use strict';

const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');

const getModels = () => require('../../../db/models');

function isAdmin(event, userId) {
  if (!userId) return false;
  const id = String(userId);
  return event.creatorId === id || (event.adminIds ?? []).includes(id);
}

function isRef(event, userId) {
  if (!userId) return false;
  return (event.refIds ?? []).includes(String(userId));
}

function isAdminOrRef(event, userId) {
  return isAdmin(event, userId) || isRef(event, userId);
}

function isTeamMember(team, discordUserId) {
  if (!discordUserId) return false;
  return (team.members ?? []).includes(discordUserId);
}

async function getEventOrThrow(eventId) {
  const { BSEvent } = getModels();
  const event = await BSEvent.findByPk(eventId);
  if (!event) throw new UserInputError(`BSEvent ${eventId} not found`);
  return event;
}

async function getTeamOrThrow(teamId) {
  const { BSTeam } = getModels();
  const team = await BSTeam.findByPk(teamId);
  if (!team) throw new UserInputError(`BSTeam ${teamId} not found`);
  return team;
}

async function getBoardOrThrow(boardId) {
  const { BSBoard } = getModels();
  const board = await BSBoard.findByPk(boardId);
  if (!board) throw new UserInputError(`BSBoard ${boardId} not found`);
  return board;
}

async function getTileOrThrow(tileId) {
  const { BSTile } = getModels();
  const tile = await BSTile.findByPk(tileId);
  if (!tile) throw new UserInputError(`BSTile ${tileId} not found`);
  return tile;
}

function requireAuth(context) {
  if (!context.user) throw new AuthenticationError('Not authenticated');
  return context.user;
}

function requireAdmin(event, userId) {
  if (!isAdmin(event, userId)) throw new ForbiddenError('Admin access required');
}

function requireAdminOrRef(event, userId) {
  if (!isAdminOrRef(event, userId)) throw new ForbiddenError('Staff access required');
}

module.exports = {
  getModels,
  isAdmin,
  isRef,
  isAdminOrRef,
  isTeamMember,
  getEventOrThrow,
  getTeamOrThrow,
  getBoardOrThrow,
  getTileOrThrow,
  requireAuth,
  requireAdmin,
  requireAdminOrRef,
};
