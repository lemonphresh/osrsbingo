'use strict';

process.env.NODE_ENV = 'test';

const { mockEvent, makeInitialTeamState } = require('../utils/spoopy/spoopyMockEvent');
const { TILE_TYPES, TILE_STATUSES } = require('../utils/spoopy/spoopyConfig');

describe('mockEvent shape', () => {
  test('has every tile type at least once', () => {
    const types = new Set(mockEvent.board.tiles.map((t) => t.tile_type));
    for (const type of Object.values(TILE_TYPES)) {
      expect(types.has(type)).toBe(true);
    }
  });

  test('every tile has matching content', () => {
    for (const tile of mockEvent.board.tiles) {
      expect(mockEvent.contentById[tile.id]).toBeDefined();
      expect(mockEvent.contentById[tile.id].tile_type).toBe(tile.tile_type);
    }
  });

  test('candybagTileId points at a real candybag tile', () => {
    const tile = mockEvent.board.tiles.find((t) => t.id === mockEvent.board.candybagTileId);
    expect(tile.tile_type).toBe(TILE_TYPES.CANDYBAG);
  });

  test('adjacency is symmetric', () => {
    const byId = Object.fromEntries(mockEvent.board.tiles.map((t) => [t.id, t]));
    for (const tile of mockEvent.board.tiles) {
      for (const nId of tile.neighbors) {
        expect(byId[nId].neighbors).toContain(tile.id);
      }
    }
  });

  test('haunted house has at least one warning tier', () => {
    expect(mockEvent.hauntedHouse.warningTiers.length).toBeGreaterThan(0);
  });
});

describe('makeInitialTeamState', () => {
  test('starts every tile locked except starting tiles', () => {
    const state = makeInitialTeamState('team-1', ['discord-user-1', 'discord-user-2']);
    for (const tile of mockEvent.board.tiles) {
      const expected = mockEvent.startingTileIds.includes(tile.id)
        ? TILE_STATUSES.UNLOCKED
        : TILE_STATUSES.LOCKED;
      expect(state.tiles[tile.id].status).toBe(expected);
    }
  });

  test('gpEarned starts at zero and no cashout', () => {
    const state = makeInitialTeamState('team-1');
    expect(state.gpEarned).toBe(0);
    expect(state.cashedOut).toBeNull();
  });
});
