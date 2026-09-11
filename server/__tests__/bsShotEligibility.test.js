'use strict';

const {
  assertCooldownReady,
  assertNoUnresolvedShot,
} = require('../utils/battleship/bsShotEligibility');

describe('assertCooldownReady', () => {
  const now = new Date('2026-09-11T12:00:00.000Z');

  test('rejects a team still inside its cooldown', () => {
    expect(() =>
      assertCooldownReady(
        { cooldownMinutes: 10 },
        { lastShotAt: new Date('2026-09-11T11:55:00.000Z') },
        now
      )
    ).toThrow(/5 minute/i);
  });

  test('accepts a team at the exact cooldown boundary', () => {
    expect(() =>
      assertCooldownReady(
        { cooldownMinutes: 10 },
        { lastShotAt: new Date('2026-09-11T11:50:00.000Z') },
        now
      )
    ).not.toThrow();
  });
});

describe('assertNoUnresolvedShot', () => {
  test('uses the target board and transaction when checking', async () => {
    const transaction = {};
    const BSTile = { findOne: jest.fn(async () => null) };
    await expect(
      assertNoUnresolvedShot(BSTile, 'board-b', { transaction })
    ).resolves.toBeUndefined();
    expect(BSTile.findOne).toHaveBeenCalledWith({
      where: {
        boardId: 'board-b',
        isShot: true,
        taskCompleted: false,
        skipped: false,
      },
      transaction,
    });
  });

  test('rejects while any previous shot is unresolved', async () => {
    const BSTile = { findOne: jest.fn(async () => ({ tileId: 'pending' })) };
    await expect(assertNoUnresolvedShot(BSTile, 'board-b')).rejects.toThrow(/previous shot task/i);
  });
});
