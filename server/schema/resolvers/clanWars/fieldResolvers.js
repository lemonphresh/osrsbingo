'use strict';

const { getModels } = require('./helpers');

const ClanWarsEvent = {
  teams: async (event) => {
    const { ClanWarsTeam } = getModels();
    return ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
  },
  submissions: async (event) => {
    const { ClanWarsSubmission } = getModels();
    return ClanWarsSubmission.findAll({
      where: { eventId: event.eventId },
      order: [['submittedAt', 'DESC']],
    });
  },
  tasks: async (event) => {
    const { ClanWarsTask } = getModels();
    return ClanWarsTask.findAll({ where: { eventId: event.eventId, isActive: true } });
  },
  battles: async (event) => {
    const { ClanWarsBattle } = getModels();
    return ClanWarsBattle.findAll({ where: { eventId: event.eventId } });
  },
};

const ClanWarsTeam = {
  items: async (team) => {
    const { ClanWarsItem } = getModels();
    return ClanWarsItem.findAll({ where: { teamId: team.teamId } });
  },
  submissions: async (team) => {
    const { ClanWarsSubmission } = getModels();
    return ClanWarsSubmission.findAll({
      where: { teamId: team.teamId },
      order: [['submittedAt', 'DESC']],
    });
  },
};

const ClanWarsSubmission = {
  rewardItem: async (submission) => {
    if (!submission.rewardItemId) return null;
    const { ClanWarsItem } = getModels();
    return ClanWarsItem.findByPk(submission.rewardItemId);
  },
};

const ClanWarsBattle = {
  battleLog: async (battle) => {
    const { ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    return ClanWarsBattleLog.findAll({
      where: { battleId: battle.battleId },
      order: [
        ['turnNumber', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  },
};

module.exports = { ClanWarsEvent, ClanWarsTeam, ClanWarsSubmission, ClanWarsBattle };
