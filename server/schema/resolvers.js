const UserResolvers = require('./resolvers/User');
const BingoBoardResolvers = require('./resolvers/BingoBoard');
const BingoTileResolvers = require('./resolvers/BingoTile');
const EditorInvitationResolvers = require('./resolvers/EditorInvitation');
const CalendarResolvers = require('./resolvers/Calendar');
const TreasureHuntResolvers = require('./resolvers/TreasureHunt');
const TreasureHuntSubscriptions = require('./resolvers/TreasureHuntSubscriptions');
const DraftRoomResolvers = require('./resolvers/DraftRoom');
const DraftRoomSubscriptions = require('./resolvers/DraftRoomSubscriptions');
const ClanWarsResolvers = require('./resolvers/ClanWars');
const ClanWarsSubscriptions = require('./resolvers/ClanWarsSubscriptions');
const fieldResolvers = require('./resolvers/FieldResolvers');
const SiteStats = require('./resolvers/SiteStats');

const { DateTimeResolver, JSONResolver } = require('graphql-scalars');

const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  Query: {
    ...BingoBoardResolvers.Query,
    ...BingoTileResolvers.Query,
    ...CalendarResolvers.Query,
    ...EditorInvitationResolvers.Query,
    ...UserResolvers.Query,
    ...TreasureHuntResolvers.Query,
    ...SiteStats.Query,
    ...DraftRoomResolvers.Query,
    ...ClanWarsResolvers.Query,
  },
  Mutation: {
    ...BingoBoardResolvers.Mutation,
    ...BingoTileResolvers.Mutation,
    ...CalendarResolvers.Mutation,
    ...EditorInvitationResolvers.Mutation,
    ...UserResolvers.Mutation,
    ...TreasureHuntResolvers.Mutation,
    ...SiteStats.Mutation,
    ...DraftRoomResolvers.Mutation,
    ...ClanWarsResolvers.Mutation,
  },
  Subscription: {
    ...TreasureHuntSubscriptions.Subscription,
    ...DraftRoomSubscriptions.DraftSubscription,
    ...ClanWarsSubscriptions.ClanWarsSubscription,
  },

  // type resolvers (field-level resolvers for nested data)
  User: {
    ...fieldResolvers.User,
  },
  BingoBoard: {
    ...fieldResolvers.BingoBoard,
  },
  TreasureEvent: {
    ...fieldResolvers.TreasureEvent,
  },
  TreasureTeam: {
    ...fieldResolvers.TreasureTeam,
  },
  TreasureSubmission: {
    ...fieldResolvers.TreasureSubmission,
  },
  ClanWarsEvent: {
    ...ClanWarsResolvers.ClanWarsEvent,
  },
  ClanWarsTeam: {
    ...ClanWarsResolvers.ClanWarsTeam,
  },
  ClanWarsSubmission: {
    ...ClanWarsResolvers.ClanWarsSubmission,
  },
  ClanWarsBattle: {
    ...ClanWarsResolvers.ClanWarsBattle,
  },
};

module.exports = resolvers;
