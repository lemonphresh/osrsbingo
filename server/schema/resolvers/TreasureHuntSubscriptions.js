const { withFilter } = require('graphql-subscriptions');
const { pubsub, SUBMISSION_TOPICS } = require('../pubsub');

module.exports = {
  Subscription: {
    submissionAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(SUBMISSION_TOPICS.SUBMISSION_ADDED),
        async (payload, vars, ctx) => {
          // admins only
          return (
            payload.submissionAdded?.team?.eventId === vars.eventId &&
            (await isEventAdmin(ctx.user?.id, vars.eventId))
          );
        }
      ),
    },
    submissionReviewed: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(SUBMISSION_TOPICS.SUBMISSION_REVIEWED),
        async (payload, vars, ctx) => {
          return (
            payload.submissionReviewed?.team?.eventId === vars.eventId &&
            (await isEventAdmin(ctx.user?.id, vars.eventId))
          );
        }
      ),
    },
    nodeCompleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(SUBMISSION_TOPICS.NODE_COMPLETED),
        async (payload, vars, ctx) => {
          return (
            payload.nodeCompleted?.eventId === vars.eventId &&
            (await isEventAdmin(ctx.user?.id, vars.eventId))
          );
        }
      ),
    },
  },
};
