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
const BSResolvers = require('./resolvers/Battleship');
const BSSubscriptions = require('./resolvers/BattleshipSubscriptions');
const fieldResolvers = require('./resolvers/FieldResolvers');
const SiteStats = require('./resolvers/SiteStats');
const { getActiveCFEventsForUser } = require('./resolvers/championForge/cfAssociatedEvents');
const { AuthenticationError } = require('apollo-server-express');
const { Op } = require('sequelize');
const { GREvent, GRTeam, User } = require('../db/models');

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
    getAssociatedEvents: async (_, __, context) => {
      if (!context.user) throw new AuthenticationError('Not authenticated');
      const userId = context.user.id;
      const dbUser = await User.findByPk(userId, { attributes: ['discordUserId'] });
      const discordUserId = dbUser?.discordUserId ?? null;

      // GR: staff events + member events (by discordUserId)
      const grStaff = await GREvent.findAll({
        where: {
          status: { [Op.in]: ['PUBLIC'] },
          [Op.or]: [
            { creatorId: userId },
            { adminIds: { [Op.contains]: [userId] } },
            { refIds: { [Op.contains]: [userId] } },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
      let grMember = [];
      if (discordUserId) {
        const staffIds = new Set(grStaff.map((e) => e.eventId));
        const teams = await GRTeam.findAll({
          where: { members: { [Op.contains]: [discordUserId] } },
          attributes: ['eventId'],
        });
        const memberIds = [...new Set(teams.map((t) => t.eventId))].filter(
          (id) => !staffIds.has(id)
        );
        if (memberIds.length > 0) {
          grMember = await GREvent.findAll({
            where: { eventId: { [Op.in]: memberIds }, status: 'PUBLIC' },
            order: [['createdAt', 'DESC']],
          });
        }
      }
      const grEvents = [...grStaff, ...grMember].map((e) => ({
        type: 'gielinor-rush',
        eventId: e.eventId,
        eventName: e.eventName,
        status: e.status,
        url: `/gielinor-rush/${e.eventId}`,
      }));

      // CF: staff events + member events (by discordUserId in members array of objects)
      const cfRaw = await getActiveCFEventsForUser(userId, discordUserId);
      const cfEvents = cfRaw.map((e) => ({
        type: 'champion-forge',
        eventId: e.eventId,
        eventName: e.eventName,
        status: e.status,
        url: `/champion-forge/${e.eventId}`,
      }));

      return [...grEvents, ...cfEvents];
    },
    ...DraftRoomResolvers.Query,
    ...CFResolvers.Query,
    ...GroupDashboardResolvers.Query,
    ...RainbowBingoResolvers.Query,
    ...BSResolvers.Query,
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
    ...BSResolvers.Mutation,
  },
  Subscription: {
    ...GielinorRushSubscriptions.Subscription,
    ...DraftRoomSubscriptions.DraftSubscription,
    ...CFSubscriptions.CFSubscription,
    ...RainbowBingoResolvers.Subscription,
    ...BSSubscriptions.Subscription,
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
  BSEvent: {
    ...BSResolvers.BSEvent,
  },
  BSTeam: {
    ...BSResolvers.BSTeam,
  },
  BSBoard: {
    ...BSResolvers.BSBoard,
  },
  BSShipTemplate: {
    ...BSResolvers.BSShipTemplate,
  },
  BSTile: {
    ...BSResolvers.BSTile,
  },
  BSSubmission: {
    ...BSResolvers.BSSubmission,
  },
};

module.exports = resolvers;
