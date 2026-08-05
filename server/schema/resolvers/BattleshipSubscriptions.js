'use strict';

const { pubsub } = require('../pubsub');

function createSubscription(topicFn) {
  return {
    subscribe: (_, args) => {
      const topic = topicFn(args);
      const iterator = pubsub.asyncIterableIterator(topic);
      return {
        [Symbol.asyncIterator]() { return iterator; },
        return() { return Promise.resolve({ done: true }); },
      };
    },
  };
}

module.exports = {
  Subscription: {
    bsBoardUpdated:        createSubscription((args) => `BS_BOARD_UPDATED_${args.eventId}`),
    bsShotFired:           createSubscription((args) => `BS_SHOT_FIRED_${args.eventId}`),
    bsTileUpdated:         createSubscription((args) => `BS_TILE_UPDATED_${args.boardId}`),
    bsViewersUpdated:      createSubscription((args) => `BS_VIEWERS_${args.eventId}`),
    bsSubmissionAdded:     createSubscription((args) => `BS_SUBMISSION_ADDED_${args.eventId}`),
    bsSubmissionReviewed:  createSubscription((args) => `BS_SUBMISSION_REVIEWED_${args.eventId}`),
    bsProposalUpdated:     createSubscription((args) => `BS_PROPOSAL_${args.teamId}`),
  },
};
