'use strict';

const { UserInputError } = require('apollo-server-express');

function assertCooldownReady(event, firingTeam, now = new Date()) {
  if (!firingTeam.lastShotAt) return;
  const cooldownMs = (event.cooldownMinutes ?? 0) * 60 * 1000;
  const elapsedMs = now.getTime() - new Date(firingTeam.lastShotAt).getTime();
  if (elapsedMs < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - elapsedMs) / 1000 / 60);
    throw new UserInputError(`Cooldown active — ${remaining} minute(s) remaining`);
  }
}

async function assertNoUnresolvedShot(BSTile, targetBoardId, options = {}) {
  const pendingTile = await BSTile.findOne({
    where: {
      boardId: targetBoardId,
      isShot: true,
      taskCompleted: false,
      skipped: false,
    },
    ...options,
  });
  if (pendingTile) {
    throw new UserInputError(
      'Your previous shot task must be completed or skipped before firing again.'
    );
  }
}

module.exports = { assertCooldownReady, assertNoUnresolvedShot };
