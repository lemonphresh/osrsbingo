'use strict';

const { UserInputError } = require('apollo-server-express');
const { validatePlacement, SHIP_TYPES } = require('./bsConfig');

function layoutSignature(ships) {
  return (ships ?? [])
    .map((ship) => `${ship.shipType}:${ship.orientation}:${ship.startRow}:${ship.startCol}`)
    .sort()
    .join('|');
}

function validateShipLayout(ships) {
  if (!Array.isArray(ships) || ships.length !== SHIP_TYPES.length) {
    throw new UserInputError(`Layout must contain exactly ${SHIP_TYPES.length} ships.`);
  }

  const seen = new Set();
  const accepted = [];
  for (const ship of ships) {
    if (!SHIP_TYPES.includes(ship.shipType)) {
      throw new UserInputError(`Unknown ship type: ${ship.shipType}`);
    }
    if (seen.has(ship.shipType)) {
      throw new UserInputError(`Duplicate ship type in layout: ${ship.shipType}`);
    }
    seen.add(ship.shipType);
    if (
      !validatePlacement(
        ship.shipType,
        ship.orientation,
        ship.startRow,
        ship.startCol,
        accepted,
        ship.shipType
      )
    ) {
      throw new UserInputError(
        `Invalid placement for ${ship.shipType}: out of bounds or overlapping.`
      );
    }
    accepted.push(ship);
  }
}

function assertPlacementWindowOpen(
  event,
  action = 'modify placement suggestions',
  now = new Date()
) {
  if (event.status !== 'PLACEMENT') {
    throw new UserInputError(`You can only ${action} during the placement phase.`);
  }
  const endsAt = event.placementEndsAt ? new Date(event.placementEndsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= now.getTime()) {
    throw new UserInputError('The placement window has ended. Votes and suggestions are locked.');
  }
}

function validTeamVotes(suggestion, team) {
  const members = new Set(team.members ?? []);
  return [...new Set(suggestion.votes ?? [])].filter((discordId) => members.has(discordId));
}

module.exports = {
  assertPlacementWindowOpen,
  layoutSignature,
  validTeamVotes,
  validateShipLayout,
};
