'use strict';

const Query = require('./battleship/queries');
const { BSEvent, BSTeam, BSBoard, BSShipTemplate, BSTile } = require('./battleship/fieldResolvers');

const Mutation = {
  ...require('./battleship/mutations/event'),
  ...require('./battleship/mutations/teams'),
  ...require('./battleship/mutations/tasks'),
  ...require('./battleship/mutations/placement'),
  ...require('./battleship/mutations/game'),
  ...require('./battleship/mutations/viewers'),
  ...require('./battleship/mutations/submissions'),
  ...require('./battleship/mutations/proposals'),
  ...require('./battleship/mutations/skip'),
};

const { getModels } = require('./battleship/helpers');

const BSSubmission = {
  id:          (sub) => sub.submissionId,
  submittedBy: (sub) => sub.discordUsername ?? null,
  screenshot:  (sub) => sub.screenshotUrl   ?? null,
  reviewNote:  (sub) => sub.denialReason    ?? null,
  tile: (sub) => {
    const { BSTile } = getModels();
    return BSTile.findByPk(sub.tileId);
  },
  team: (sub) => {
    if (!sub.teamId) return null;
    const { BSTeam } = getModels();
    return BSTeam.findByPk(sub.teamId);
  },
};

module.exports = { Query, Mutation, BSEvent, BSTeam, BSBoard, BSShipTemplate, BSTile, BSSubmission };
