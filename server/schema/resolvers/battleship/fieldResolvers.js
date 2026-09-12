'use strict';

const { Op, literal } = require('sequelize');
const { getModels } = require('./helpers');

// Ship data (placements + unshot tile.shipType) must not leak to opponents while
// the game is live. Site admins, event admins/refs, and members of the board's
// own team can see everything. Everyone else sees only the coordinates that
// have already been shot.
async function canSeeShips(board, context) {
  const user = context?.user;
  if (!user) return false;
  if (user.admin === true) return true;
  const { BSEvent, BSTeam } = getModels();
  const event = await BSEvent.findByPk(board.eventId, {
    attributes: ['eventId', 'creatorId', 'adminIds', 'refIds', 'status'],
  });
  if (!event) return false;
  const uid = String(user.id);
  if (event.creatorId === uid) return true;
  if ((event.adminIds ?? []).includes(uid)) return true;
  if ((event.refIds ?? []).includes(uid)) return true;
  // Completed events reveal both boards to everyone (post-game recap).
  if (event.status === 'COMPLETED' || event.status === 'ARCHIVED') return true;
  // Template boards (teamId is null) hold no ship overlays anyway.
  if (!board.teamId) return true;
  if (!user.discordUserId) return false;
  const team = await BSTeam.findByPk(board.teamId, { attributes: ['teamId', 'members'] });
  return !!team && (team.members ?? []).includes(user.discordUserId);
}

const BSEvent = {
  teams: (event) => {
    const { BSTeam } = getModels();
    // Ordered so the UI doesn't reshuffle team cards when a team's row is
    // touched (i.e., adding/removing members).
    return BSTeam.findAll({
      where: { eventId: event.eventId },
      order: [['createdAt', 'ASC']],
    });
  },
  tasks: (event) => {
    const { BSTask } = getModels();
    return BSTask.findAll({
      where: { eventId: event.eventId, isActive: true },
      order: [['createdAt', 'ASC']],
    });
  },
  shipTemplates: (event) => {
    const { BSShipTemplate } = getModels();
    return BSShipTemplate.findAll({ where: { eventId: event.eventId } });
  },
  refs: (event) => {
    if (!event.refIds?.length) return [];
    // Coerce to numbers for the same reason as `admins` below: User.id is
    // an auto-increment INTEGER column, refIds is ARRAY(STRING). Passing
    // strings mostly works via Postgres coercion, but explicit ints
    // eliminate a whole class of "record silently missing from findAll".
    const numericIds = [...new Set(event.refIds.map(String))]
      .map((id) => Number.parseInt(id, 10))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (numericIds.length === 0) return [];
    const { User } = getModels();
    return User.findAll({ where: { id: numericIds } });
  },
  admins: async (event) => {
    // The event creator has admin powers even if they're not in adminIds
    // (the server's requireAdmin helper accepts creatorId OR adminIds).
    // Fold them into the surfaced list so UIs render a complete picture of
    // "everyone who can admin this event" instead of just "extra admins".
    //
    // Coerce every id to a number before the findAll: User.id is an
    // auto-increment INTEGER column but adminIds is stored as ARRAY(STRING)
    // and creatorId is a STRING, so a raw findAll on the string values
    // occasionally missed rows depending on Postgres coercion path. Filter
    // out anything that isn't a valid positive integer (defensive against
    // legacy junk) rather than passing NaN into the query.
    const rawIds = [
      ...(event.adminIds ?? []).map(String),
      ...(event.creatorId ? [String(event.creatorId)] : []),
    ];
    const numericIds = [...new Set(rawIds)]
      .map((id) => Number.parseInt(id, 10))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (numericIds.length === 0) return [];
    const { User } = getModels();
    const users = await User.findAll({ where: { id: numericIds } });
    // Diagnostic for the "counter says 1 but list renders empty" bug where
    // adminIds contained a user id that findAll couldn't match. Fires only
    // when there's a real drift so it doesn't spam.
    if (users.length !== numericIds.length) {
      const returnedIds = new Set(users.map((u) => Number(u.id)));
      const missing = numericIds.filter((n) => !returnedIds.has(n));
      const logger = require('../../../utils/logger');
      logger.warn(
        {
          eventId: event.eventId,
          adminIds: event.adminIds,
          creatorId: event.creatorId,
          requestedIds: numericIds,
          returnedIds: [...returnedIds],
          missingIds: missing,
        },
        '[BSEvent.admins] User.findAll did not return records for every id (data drift)'
      );
    }
    return users;
  },
  templateBoard: (event) => {
    const { BSBoard } = getModels();
    return BSBoard.findOne({ where: { eventId: event.eventId, teamId: null } });
  },
};

// Whether the requester can see this team's strategic intel (skip tokens,
// last-shot timing). Site admins, event admins/refs, own-team members always
// can. Everyone else gets redacted values.
async function canSeeTeamIntel(team, context) {
  const user = context?.user;
  if (!user) return false;
  if (user.admin === true) return true;
  const { BSEvent } = getModels();
  const event = await BSEvent.findByPk(team.eventId, {
    attributes: ['eventId', 'creatorId', 'adminIds', 'refIds', 'status'],
  });
  if (!event) return false;
  const uid = String(user.id);
  if (event.creatorId === uid) return true;
  if ((event.adminIds ?? []).includes(uid)) return true;
  if ((event.refIds ?? []).includes(uid)) return true;
  if (event.status === 'COMPLETED' || event.status === 'ARCHIVED') return true;
  if (!user.discordUserId) return false;
  return (team.members ?? []).includes(user.discordUserId);
}

const BSTeam = {
  board: (team) => {
    const { BSBoard } = getModels();
    return BSBoard.findOne({ where: { teamId: team.teamId } });
  },
  skipTokens: async (team, _args, context) => {
    if (await canSeeTeamIntel(team, context)) return team.skipTokens ?? 0;
    return 0;
  },
  lastShotAt: async (team, _args, context) => {
    if (await canSeeTeamIntel(team, context)) return team.lastShotAt ?? null;
    return null;
  },
};

const BSBoard = {
  shipPlacements: async (board, _args, context) => {
    if (!(await canSeeShips(board, context))) return [];
    const { BSShipPlacement } = getModels();
    return BSShipPlacement.findAll({ where: { boardId: board.boardId } });
  },
  tiles: async (board, _args, context) => {
    const { BSTile } = getModels();
    const tiles = await BSTile.findAll({
      where: { boardId: board.boardId },
      // NULLS LAST keeps pre-placement tiles (row=null) from breaking sorted views
      order: [literal('"row" ASC NULLS LAST, "col" ASC NULLS LAST')],
    });
    const visible = await canSeeShips(board, context);
    if (visible) return tiles;
    // Redact ship overlays on cells the opponent hasn't shot yet.
    return tiles.map((t) => {
      if (t.isShot) return t;
      // Return a shallow plain object so the ORM instance isn't mutated in-place.
      const plain = t.get({ plain: true });
      plain.shipType = null;
      plain.cellIndex = null;
      plain.shipTaskId = null;
      return plain;
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
