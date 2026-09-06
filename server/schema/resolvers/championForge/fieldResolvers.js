'use strict';

const { getModels } = require('./helpers');

const CFEvent = {
  teams: async (event) => {
    const { CFTeam } = getModels();
    return CFTeam.findAll({ where: { eventId: event.eventId } });
  },
  submissions: async (event) => {
    const { CFSubmission } = getModels();
    return CFSubmission.findAll({
      where: { eventId: event.eventId },
      order: [['submittedAt', 'DESC']],
    });
  },
  tasks: async (event) => {
    const { CFTask } = getModels();
    return CFTask.findAll({ where: { eventId: event.eventId, isActive: true } });
  },
  battles: async (event) => {
    const { CFBattle } = getModels();
    return CFBattle.findAll({ where: { eventId: event.eventId } });
  },
};

const CFTeam = {
  items: async (team) => {
    const { CFItem } = getModels();
    return CFItem.findAll({ where: { teamId: team.teamId } });
  },
  submissions: async (team) => {
    const { CFSubmission } = getModels();
    return CFSubmission.findAll({
      where: { teamId: team.teamId },
      order: [['submittedAt', 'DESC']],
    });
  },
};

const CFSubmission = {
  rewardItem: async (submission) => {
    if (!submission.rewardItemId) return null;
    const { CFItem } = getModels();
    return CFItem.findByPk(submission.rewardItemId);
  },
};

const CFBattle = {
  battleLog: async (battle) => {
    const { CFBattleEvent: CFBattleLog } = getModels();
    return CFBattleLog.findAll({
      where: { battleId: battle.battleId },
      order: [
        ['turnNumber', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  },
  // Server clock at the moment this response is built. Client compares to its
  // own Date.now() to correct clock skew before running the turn timer —
  // without this, a client whose clock is ahead of the server sees the timer
  // hit 0 while the server thinks the turn is still active.
  serverNow: () => new Date().toISOString(),
};

module.exports = { CFEvent, CFTeam, CFSubmission, CFBattle };
