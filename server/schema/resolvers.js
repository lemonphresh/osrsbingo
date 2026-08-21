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
const { GREvent, GRTeam, BSEvent, BSTeam, User } = require('../db/models');

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

      function getRole(event, uid) {
        const id = String(uid);
        if (String(event.creatorId) === id) return 'Creator';
        if ((event.adminIds ?? []).includes(id)) return 'Admin';
        if ((event.refIds ?? []).includes(id)) return 'Ref';
        return 'Member';
      }
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
      const grEvents = [
        ...grStaff.map((e) => ({ e, role: getRole(e, userId) })),
        ...grMember.map((e) => ({ e, role: 'Member' })),
      ].map(({ e, role }) => ({
        type: 'gielinor-rush',
        eventId: e.eventId,
        eventName: e.eventName,
        status: e.status,
        url: `/gielinor-rush/${e.eventId}`,
        role,
        createdAt: e.createdAt,
      }));

      // CF: staff events + member events (by discordUserId in members array of objects)
      const cfRaw = await getActiveCFEventsForUser(userId, discordUserId);
      const cfEvents = cfRaw.map((e) => ({
        type: 'champion-forge',
        eventId: e.eventId,
        eventName: e.eventName,
        status: e.status,
        url: `/champion-forge/${e.eventId}`,
        role: getRole(e, userId),
        createdAt: e.createdAt,
      }));

      // BS: staff events + member events (by discordUserId)
      const bsStaff = await BSEvent.findAll({
        where: {
          status: { [Op.in]: ['PLACEMENT', 'ACTIVE'] },
          [Op.or]: [
            { creatorId: String(userId) },
            { adminIds: { [Op.contains]: [String(userId)] } },
            { refIds: { [Op.contains]: [String(userId)] } },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
      let bsMember = [];
      if (discordUserId) {
        const bsStaffIds = new Set(bsStaff.map((e) => e.eventId));
        const bsTeams = await BSTeam.findAll({
          where: { members: { [Op.contains]: [discordUserId] } },
          attributes: ['eventId'],
        });
        const bsMemberIds = [...new Set(bsTeams.map((t) => t.eventId))].filter(
          (id) => !bsStaffIds.has(id)
        );
        if (bsMemberIds.length > 0) {
          bsMember = await BSEvent.findAll({
            where: {
              eventId: { [Op.in]: bsMemberIds },
              status: { [Op.in]: ['PLACEMENT', 'ACTIVE'] },
            },
            order: [['createdAt', 'DESC']],
          });
        }
      }
      const bsEvents = [
        ...bsStaff.map((e) => ({ e, role: getRole(e, userId) })),
        ...bsMember.map((e) => ({ e, role: 'Member' })),
      ].map(({ e, role }) => ({
        type: 'battleship',
        eventId: e.eventId,
        eventName: e.eventName,
        status: e.status,
        url: `/battleship/${e.eventId}`,
        role,
        createdAt: e.createdAt,
      }));

      return [...grEvents, ...cfEvents, ...bsEvents];
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
