const UserResolvers = require('./resolvers/User');
const BingoBoardResolvers = require('./resolvers/BingoBoard');
const BingoTileResolvers = require('./resolvers/BingoTile');
const EditorInvitationResolvers = require('./resolvers/EditorInvitation');
const CalendarResolvers = require('./resolvers/Calendar');
const GielinorRushResolvers = require('./resolvers/GielinorRush');
const GielinorRushSubscriptions = require('./resolvers/GielinorRushSubscriptions');
const DraftRoomResolvers = require('./resolvers/DraftRoom');
const DraftRoomSubscriptions = require('./resolvers/DraftRoomSubscriptions');
const CFResolvers = require('./resolvers/ChampionForge');
const CFSubscriptions = require('./resolvers/ChampionForgeSubscriptions');
const GroupDashboardResolvers = require('./resolvers/GroupDashboard');
const RainbowBingoResolvers = require('./resolvers/RainbowBingo');
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
    ...GielinorRushResolvers.Query,
    ...SiteStats.Query,
    ...DraftRoomResolvers.Query,
    ...CFResolvers.Query,
    ...GroupDashboardResolvers.Query,
    ...RainbowBingoResolvers.Query,
  },
  Mutation: {
    ...BingoBoardResolvers.Mutation,
    ...BingoTileResolvers.Mutation,
    ...CalendarResolvers.Mutation,
    ...EditorInvitationResolvers.Mutation,
    ...UserResolvers.Mutation,
    ...GielinorRushResolvers.Mutation,
    ...SiteStats.Mutation,
    ...DraftRoomResolvers.Mutation,
    ...CFResolvers.Mutation,
    ...GroupDashboardResolvers.Mutation,
    ...RainbowBingoResolvers.Mutation,
  },
  Subscription: {
    ...GielinorRushSubscriptions.Subscription,
    ...DraftRoomSubscriptions.DraftSubscription,
    ...CFSubscriptions.CFSubscription,
    ...RainbowBingoResolvers.Subscription,
  },

  // type resolvers (field-level resolvers for nested data)
  User: {
    ...fieldResolvers.User,
  },
  BingoBoard: {
    ...fieldResolvers.BingoBoard,
  },
  GREvent: {
    ...fieldResolvers.GREvent,
  },
  GRTeam: {
    ...fieldResolvers.GRTeam,
  },
  GRSubmission: {
    ...fieldResolvers.GRSubmission,
  },
  CFEvent: {
    ...CFResolvers.CFEvent,
    ...fieldResolvers.CFEvent,
  },
  CFTeam: {
    ...CFResolvers.CFTeam,
    ...fieldResolvers.CFTeam,
  },
  CFSubmission: {
    ...CFResolvers.CFSubmission,
  },
  CFBattle: {
    ...CFResolvers.CFBattle,
  },
  GroupDashboard: {
    ...GroupDashboardResolvers.GroupDashboard,
  },
  GroupGoalEvent: {
    ...GroupDashboardResolvers.GroupGoalEvent,
  },
  RainbowEvent: {
    ...RainbowBingoResolvers.RainbowEvent,
  },
  RainbowSubmission: {
    ...RainbowBingoResolvers.RainbowSubmission,
  },
  RainbowTeam: {
    ...RainbowBingoResolvers.RainbowTeam,
  },
};

module.exports = resolvers;
