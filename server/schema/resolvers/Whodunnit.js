'use strict';

const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { Op } = require('sequelize');
const { pubsub } = require('../pubsub');

const getModels = () => require('../../db/models');

// ── ID generation ─────────────────────────────────────────────────
function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 10; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

// ── Auth helpers ──────────────────────────────────────────────────
function requireUser(context) {
  if (!context?.user) throw new AuthenticationError('Must be logged in');
  return context.user;
}

async function getCampaignOrThrow(campaignId) {
  const { WhodunnitCampaign } = getModels();
  const campaign = await WhodunnitCampaign.findByPk(campaignId);
  if (!campaign) throw new UserInputError(`Campaign ${campaignId} not found`);
  return campaign;
}

async function requireTeamMember(campaignId, userId) {
  const { WhodunnitTeamMember } = getModels();
  const membership = await WhodunnitTeamMember.findOne({
    where: { campaignId, userId: String(userId) },
  });
  if (!membership) throw new ForbiddenError('You are not on this team');
  return membership;
}

// ── Publish helpers ───────────────────────────────────────────────
function emitCampaignUpdate(campaignId) {
  pubsub.publish(`WHODUNNIT_CAMPAIGN_${campaignId}`, {
    whodunnitCampaignUpdated: campaignId,
  });
}

// ── Discord ID lookup ─────────────────────────────────────────────
// Resolves Discord user IDs to site User rows. Same pattern the battleship
// draft flow uses — the client picks members via DiscordMemberInput which
// returns discordUserId strings, and we map to site users here.
async function lookupUsersByDiscordId(discordIds) {
  const { User } = getModels();
  const cleaned = discordIds.map((d) => String(d).trim()).filter(Boolean);
  if (!cleaned.length) return { users: [], missing: [] };
  const users = await User.findAll({
    where: { discordUserId: { [Op.in]: cleaned } },
  });
  const found = new Map();
  for (const u of users) if (u.discordUserId) found.set(u.discordUserId, u);
  const missing = [];
  const orderedUsers = [];
  for (const did of cleaned) {
    const u = found.get(did);
    if (u) orderedUsers.push(u);
    else missing.push(did);
  }
  return { users: orderedUsers, missing };
}

// ── Queries ───────────────────────────────────────────────────────
const Query = {
  async myWhodunnitCampaigns(_, __, context) {
    const user = requireUser(context);
    const { WhodunnitCampaign, WhodunnitTeamMember } = getModels();
    const memberships = await WhodunnitTeamMember.findAll({
      where: { userId: String(user.id) },
      attributes: ['campaignId'],
    });
    if (!memberships.length) return [];
    const campaignIds = memberships.map((m) => m.campaignId);
    return WhodunnitCampaign.findAll({
      where: { campaignId: campaignIds },
      order: [['createdAt', 'DESC']],
    });
  },

  async whodunnitCampaign(_, { campaignId }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    if (!user.admin) {
      await requireTeamMember(campaignId, user.id);
    }
    return campaign;
  },

  async allWhodunnitCampaigns(_, __, context) {
    const user = requireUser(context);
    if (!user.admin) throw new ForbiddenError('Admin only');
    const { WhodunnitCampaign } = getModels();
    return WhodunnitCampaign.findAll({ order: [['createdAt', 'DESC']] });
  },

};

// ── Mutations ─────────────────────────────────────────────────────
const Mutation = {
  async createWhodunnitCampaign(_, { agencyName, teammateDiscordIds = [] }, context) {
    const user = requireUser(context);
    const { WhodunnitCampaign, WhodunnitTeamMember, WhodunnitNodeProgress } = getModels();

    // Agency name is optional at creation — the intro node collects it. If
    // it's supplied (or supplied later), we cap the length.
    const name = String(agencyName || '').trim() || 'Untitled Case';
    if (name.length > 60) throw new UserInputError('Agency name too long (max 60)');
    if (teammateDiscordIds.length > 3) throw new UserInputError('Up to 3 teammates (4 total including you)');

    // Resolve Discord IDs → site users (same pattern as battleship).
    let teammates = [];
    if (teammateDiscordIds.length) {
      const { users, missing } = await lookupUsersByDiscordId(teammateDiscordIds);
      if (missing.length) throw new UserInputError(`Not a registered site user: ${missing.join(', ')}`);
      teammates = users;
    }

    const teammateIds = teammates.map((u) => String(u.id));
    if (teammateIds.includes(String(user.id))) {
      throw new UserInputError('Cannot add yourself as a teammate');
    }
    if (new Set(teammateIds).size !== teammateIds.length) {
      throw new UserInputError('Duplicate teammate');
    }

    const campaignId = generateId('wd');
    const campaign = await WhodunnitCampaign.create({
      campaignId,
      agencyName: name,
      createdByUserId: String(user.id),
      status: 'ACTIVE',
      currentNodeId: 'intro',
    });

    await WhodunnitTeamMember.bulkCreate([
      { memberId: generateId('wdm'), campaignId, userId: String(user.id), isCreator: true },
      ...teammates.map((t) => ({
        memberId: generateId('wdm'),
        campaignId,
        userId: String(t.id),
        isCreator: false,
      })),
    ]);

    // Open the first NodeProgress for the intro
    await WhodunnitNodeProgress.create({
      progressId: generateId('wdnp'),
      campaignId,
      nodeId: 'intro',
    });

    return campaign;
  },

  async submitWhodunnitAnswer(_, { campaignId, nodeId, clueId, answer }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);
    if (campaign.status === 'COMPLETE') throw new UserInputError('Campaign is complete');

    const { WhodunnitClueAnswer } = getModels();
    const existing = await WhodunnitClueAnswer.findOne({
      where: { campaignId, clueId },
    });

    let record;
    if (existing) {
      await existing.update({
        answer: String(answer),
        submittedByUserId: String(user.id),
        submittedAt: new Date(),
        nodeId,
      });
      record = existing;
    } else {
      record = await WhodunnitClueAnswer.create({
        answerId: generateId('wda'),
        campaignId,
        nodeId,
        clueId,
        answer: String(answer),
        submittedByUserId: String(user.id),
      });
    }

    emitCampaignUpdate(campaignId);
    return record;
  },

  async advanceWhodunnitNode(_, { campaignId, nextNodeId }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);
    if (campaign.status === 'COMPLETE') throw new UserInputError('Campaign is complete');
    if (!nextNodeId) throw new UserInputError('nextNodeId required');

    const { WhodunnitNodeProgress } = getModels();

    // Close current node's progress (if it exists and is still open)
    const current = await WhodunnitNodeProgress.findOne({
      where: { campaignId, nodeId: campaign.currentNodeId, endedAt: null },
    });
    if (current) await current.update({ endedAt: new Date() });

    // Open next node's progress if not already there
    const existingNext = await WhodunnitNodeProgress.findOne({
      where: { campaignId, nodeId: nextNodeId },
    });
    if (!existingNext) {
      await WhodunnitNodeProgress.create({
        progressId: generateId('wdnp'),
        campaignId,
        nodeId: nextNodeId,
      });
    }

    await campaign.update({ currentNodeId: nextNodeId });
    emitCampaignUpdate(campaignId);
    return campaign;
  },

  async completeWhodunnitCampaign(_, { campaignId }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);
    if (campaign.status === 'COMPLETE') return campaign;

    const { WhodunnitNodeProgress } = getModels();
    await WhodunnitNodeProgress.update(
      { endedAt: new Date() },
      { where: { campaignId, endedAt: null } },
    );
    await campaign.update({ status: 'COMPLETE', completedAt: new Date() });
    emitCampaignUpdate(campaignId);
    return campaign;
  },

  async useWhodunnitHint(_, { campaignId, nodeId, clueId }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);

    const { WhodunnitNodeProgress } = getModels();
    const progress = await WhodunnitNodeProgress.findOne({
      where: { campaignId, nodeId },
    });
    if (!progress) throw new UserInputError('No progress row for this node');

    const existing = progress.hintUsedClueIds || [];
    if (!existing.includes(clueId)) {
      await progress.update({ hintUsedClueIds: [...existing, clueId] });
      emitCampaignUpdate(campaignId);
    }
    return progress;
  },

  async chooseWhodunnitBranch(_, { campaignId, choiceKey, path }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);
    if (campaign.status === 'COMPLETE') throw new UserInputError('Campaign is complete');

    if (choiceKey === 'A') {
      if (!['A1', 'A2'].includes(path)) throw new UserInputError('Invalid A path');
      await campaign.update({ choiceAPath: path });
    } else if (choiceKey === 'B') {
      if (!['B1', 'B2'].includes(path)) throw new UserInputError('Invalid B path');
      await campaign.update({ choiceBPath: path });
    } else {
      throw new UserInputError('Invalid choiceKey');
    }
    emitCampaignUpdate(campaignId);
    return campaign;
  },

  async updateWhodunnitAgencyName(_, { campaignId, agencyName }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);

    const name = String(agencyName || '').trim();
    if (!name) throw new UserInputError('Agency name required');
    if (name.length > 60) throw new UserInputError('Agency name too long (max 60)');

    await campaign.update({ agencyName: name });
    emitCampaignUpdate(campaignId);
    return campaign;
  },

  async updateWhodunnitPrimeSuspect(_, { campaignId, suspect }, context) {
    const user = requireUser(context);
    const campaign = await getCampaignOrThrow(campaignId);
    await requireTeamMember(campaignId, user.id);

    const { WhodunnitSuspectHistory } = getModels();
    const trimmed = String(suspect || '').trim();
    const prev = campaign.primeSuspect || '';

    if (trimmed !== prev) {
      await campaign.update({ primeSuspect: trimmed || null });
      if (trimmed) {
        await WhodunnitSuspectHistory.create({
          entryId: generateId('wds'),
          campaignId,
          suspect: trimmed,
          updatedByUserId: String(user.id),
        });
      }
      emitCampaignUpdate(campaignId);
    }
    return campaign;
  },
};

// ── Subscription ──────────────────────────────────────────────────
const Subscription = {
  whodunnitCampaignUpdated: {
    subscribe: (_, { campaignId }) => pubsub.asyncIterator(`WHODUNNIT_CAMPAIGN_${campaignId}`),
    resolve: async (_payload, { campaignId }) => {
      const { WhodunnitCampaign } = getModels();
      return WhodunnitCampaign.findByPk(campaignId);
    },
  },
};

// ── Field resolvers ───────────────────────────────────────────────
const WhodunnitCampaign = {
  id: (c) => c.campaignId,
  members: async (c) => {
    const { WhodunnitTeamMember } = getModels();
    return WhodunnitTeamMember.findAll({ where: { campaignId: c.campaignId } });
  },
  nodeProgress: async (c) => {
    const { WhodunnitNodeProgress } = getModels();
    return WhodunnitNodeProgress.findAll({
      where: { campaignId: c.campaignId },
      order: [['startedAt', 'ASC']],
    });
  },
  answers: async (c) => {
    const { WhodunnitClueAnswer } = getModels();
    return WhodunnitClueAnswer.findAll({
      where: { campaignId: c.campaignId },
      order: [['submittedAt', 'ASC']],
    });
  },
  suspectHistory: async (c) => {
    const { WhodunnitSuspectHistory } = getModels();
    return WhodunnitSuspectHistory.findAll({
      where: { campaignId: c.campaignId },
      order: [['updatedAt', 'ASC']],
    });
  },
  createdBy: async (c) => {
    const { User } = getModels();
    return User.findByPk(c.createdByUserId);
  },
  totalDurationSeconds: async (c) => {
    if (!c.completedAt) return null;
    return Math.floor((c.completedAt.getTime() - c.createdAt.getTime()) / 1000);
  },
};

const WhodunnitTeamMember = {
  id: (m) => m.memberId,
  user: async (m) => {
    const { User } = getModels();
    return User.findByPk(m.userId);
  },
};

const WhodunnitNodeProgress = {
  id: (n) => n.progressId,
  durationSeconds: (n) => {
    if (!n.endedAt) return null;
    return Math.floor((n.endedAt.getTime() - n.startedAt.getTime()) / 1000);
  },
};

const WhodunnitClueAnswer = {
  id: (a) => a.answerId,
  submittedBy: async (a) => {
    const { User } = getModels();
    return User.findByPk(a.submittedByUserId);
  },
};

const WhodunnitSuspectHistory = {
  id: (s) => s.entryId,
  updatedBy: async (s) => {
    const { User } = getModels();
    return User.findByPk(s.updatedByUserId);
  },
};

module.exports = {
  Query,
  Mutation,
  Subscription,
  WhodunnitCampaign,
  WhodunnitTeamMember,
  WhodunnitNodeProgress,
  WhodunnitClueAnswer,
  WhodunnitSuspectHistory,
};
