'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const logger = require('../../../../utils/logger');
const { rollPvmerDrop, rollSkillerDrop } = require('../../../../utils/clanWarsRandomisation');
const { generateId } = require('../../../../utils/cwTaskSampler');
const { isAdmin, isAdminOrRef, getEventOrThrow, getTeamOrThrow, getWarChest, getModels } = require('../helpers');

module.exports = {
  joinTaskInProgress: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.status !== 'GATHERING')
      throw new UserInputError('Event is not in the Gathering phase');

    const discordId = user.discordUserId ?? null;
    if (!discordId)
      throw new AuthenticationError('Link your Discord account to track task progress');

    const { ClanWarsTeam, ClanWarsTask } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    const isEventAdmin = isAdmin(event, user.id, discordId);
    if (!isEventAdmin) {
      const isMember = (team.members ?? []).some((m) =>
        typeof m === 'string' ? m === discordId : m.discordId === discordId
      );
      if (!isMember) throw new AuthenticationError('You are not a member of this team');

      const task = await ClanWarsTask.findByPk(taskId);
      if (!task || task.eventId !== eventId) throw new UserInputError('Task not found');

      const memberRecord = (team.members ?? []).find(
        (m) => typeof m !== 'string' && m.discordId === discordId
      );
      const memberRole = memberRecord?.role;
      if (!memberRole || memberRole === 'UNSET') {
        throw new UserInputError('Choose your role before joining a task');
      }
      if (task.role !== 'ANY' && memberRole !== 'ANY' && memberRole !== task.role) {
        throw new UserInputError(`This task is for ${task.role}s only`);
      }
    }

    if ((team.completedTaskIds ?? []).includes(taskId)) {
      throw new UserInputError('This task is already completed');
    }

    const progress = { ...(team.taskProgress ?? {}) };

    const currentTaskId = Object.entries(progress).find(
      ([tid, ids]) => tid !== taskId && Array.isArray(ids) && ids.includes(discordId)
    )?.[0];
    if (currentTaskId) {
      throw new UserInputError('You are already working on a task. Leave it before joining another.');
    }

    const current = progress[taskId] ?? [];
    if (!current.includes(discordId)) {
      progress[taskId] = [...current, discordId];
      await team.update({ taskProgress: progress });
    }

    return team;
  },

  leaveTaskInProgress: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const discordId = user.discordUserId ?? null;
    if (!discordId) throw new AuthenticationError('Discord account required');

    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    const progress = { ...(team.taskProgress ?? {}) };
    const current = progress[taskId] ?? [];
    progress[taskId] = current.filter((id) => id !== discordId);
    await team.update({ taskProgress: progress });

    return team;
  },

  setTaskProgress: async (_, { eventId, teamId, taskId, value }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');
    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');
    const progress = { ...(team.numericTaskProgress ?? {}) };
    progress[taskId] = Math.max(0, value);
    await team.update({ numericTaskProgress: progress });
    return team;
  },

  markTaskComplete: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam, ClanWarsSubmission, ClanWarsItem } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    const approvedSubs = await ClanWarsSubmission.findAll({
      where: { eventId, teamId, taskId, status: 'APPROVED' },
    });

    const warChest = await getWarChest(teamId);
    const warChestData = warChest.map((i) => ({ name: i.name, slot: i.slot, rarity: i.rarity }));

    let skillerRewarded = approvedSubs.some((s) => s.role === 'SKILLER' && s.rewardItemId);

    for (const sub of approvedSubs) {
      if (sub.rewardItemId) continue;
      if (sub.rewardSlot === 'none') continue;

      let dropResult;
      if (sub.role === 'PVMER') {
        if (!sub.rewardSlot) continue;
        dropResult = rollPvmerDrop({
          slot: sub.rewardSlot,
          difficulty: sub.difficulty,
          warChest: warChestData,
        });
      } else {
        if (skillerRewarded) continue;
        dropResult = rollSkillerDrop({ difficulty: sub.difficulty, warChest: warChestData });
      }

      if (!dropResult.success) {
        logger.warn(
          `[ClanWars] markTaskComplete drop failed for sub ${sub.submissionId}: ${dropResult.reason}`
        );
        continue;
      }

      const item = dropResult.item;
      const slot = dropResult.slot ?? sub.rewardSlot;
      const createdItem = await ClanWarsItem.create({
        itemId: generateId('cwi'),
        teamId,
        eventId,
        name: item.name,
        slot,
        rarity: dropResult.rarity,
        itemSnapshot: item,
        sourceSubmissionId: sub.submissionId,
        earnedAt: new Date(),
        isEquipped: false,
        isUsed: false,
      });
      await sub.update({ rewardItemId: createdItem.itemId });
      if (sub.role === 'SKILLER') skillerRewarded = true;
    }

    const current = team.completedTaskIds ?? [];
    if (!current.includes(taskId)) {
      await team.update({ completedTaskIds: [...current, taskId] });
    }
    return team;
  },

  undoTaskComplete: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam, ClanWarsSubmission, ClanWarsItem } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    const current = team.completedTaskIds ?? [];
    await team.update({ completedTaskIds: current.filter((id) => id !== taskId) });

    const approvedSubs = await ClanWarsSubmission.findAll({
      where: { eventId, teamId, taskId, status: 'APPROVED' },
    });

    for (const sub of approvedSubs) {
      if (!sub.rewardItemId) continue;
      await ClanWarsItem.destroy({ where: { itemId: sub.rewardItemId } });
      await sub.update({ rewardItemId: null });
    }

    return team;
  },

  createClanWarsSubmission: async (_, { input }) => {
    const { ClanWarsSubmission, ClanWarsTask } = getModels();

    const event = await getEventOrThrow(input.eventId);
    if (event.status !== 'GATHERING') {
      throw new UserInputError('Event is not in GATHERING phase');
    }

    const task = await ClanWarsTask.findByPk(input.taskId);
    const taskLabel = task?.label ?? input.taskId;
    const difficulty = task?.difficulty ?? input.difficulty;
    const role = task?.role ?? input.role;

    const submission = await ClanWarsSubmission.create({
      submissionId: generateId('cws'),
      eventId: input.eventId,
      teamId: input.teamId,
      submittedBy: input.submittedBy,
      submittedUsername: input.submittedUsername ?? null,
      channelId: input.channelId ?? null,
      taskId: input.taskId,
      taskLabel,
      difficulty,
      role,
      screenshot: input.screenshot ?? null,
      status: 'PENDING',
      submittedAt: new Date(),
    });

    await pubsub.publish(`CLAN_WARS_SUBMISSION_ADDED_${input.eventId}`, {
      clanWarsSubmissionAdded: submission,
    });

    return submission;
  },

  reviewClanWarsSubmission: async (
    _,
    { submissionId, approved, reviewerId, rewardSlot, denialReason },
    { user }
  ) => {
    if (!user) throw new AuthenticationError('Not authenticated');

    const { ClanWarsSubmission } = getModels();
    const submission = await ClanWarsSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'PENDING') throw new UserInputError('Submission already reviewed');

    const event = await getEventOrThrow(submission.eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    const updates = {
      status: approved ? 'APPROVED' : 'DENIED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: denialReason ?? null,
    };

    if (approved) {
      if (submission.role === 'PVMER') {
        if (!rewardSlot) throw new UserInputError('rewardSlot required for PVMER submissions');
        updates.rewardSlot = rewardSlot;
      } else if (rewardSlot === 'none') {
        updates.rewardSlot = 'none';
      }
    }

    await submission.update(updates);

    await pubsub.publish(`CLAN_WARS_SUBMISSION_REVIEWED_${submission.eventId}`, {
      clanWarsSubmissionReviewed: submission,
    });

    const { sendClanWarsSubmissionResult } = require('../../../../utils/clanWarsNotifications');
    sendClanWarsSubmissionResult({
      discordId: submission.submittedBy,
      channelId: submission.channelId,
      taskLabel: submission.taskLabel,
      approved,
      denialReason,
      item: null,
    });

    return submission;
  },

  changeSubmissionRewardSlot: async (_, { submissionId, rewardSlot }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsSubmission, ClanWarsItem } = getModels();
    const submission = await ClanWarsSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'APPROVED')
      throw new UserInputError('Can only change reward slot on approved submissions');
    if (submission.role !== 'PVMER')
      throw new UserInputError('Reward slot only applies to PVMER submissions');
    const event = await getEventOrThrow(submission.eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');
    await submission.update({ rewardSlot });
    if (submission.rewardItemId) {
      const existingItem = await ClanWarsItem.findByPk(submission.rewardItemId);
      if (existingItem) {
        const warChest = await getWarChest(existingItem.teamId);
        const warChestData = warChest
          .filter((i) => i.itemId !== existingItem.itemId)
          .map((i) => ({ name: i.name, slot: i.slot, rarity: i.rarity }));
        const dropResult = rollPvmerDrop({
          slot: rewardSlot,
          difficulty: submission.difficulty,
          warChest: warChestData,
        });
        if (dropResult.success) {
          await existingItem.update({
            name: dropResult.item.name,
            slot: dropResult.slot ?? rewardSlot,
            rarity: dropResult.rarity,
            itemSnapshot: dropResult.item,
          });
        } else {
          await existingItem.update({ slot: rewardSlot });
        }
      }
    }
    return submission;
  },

  undoSubmissionApproval: async (_, { submissionId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsSubmission, ClanWarsItem } = getModels();
    const submission = await ClanWarsSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'APPROVED') throw new UserInputError('Submission is not approved');
    const event = await getEventOrThrow(submission.eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    if (submission.rewardItemId) {
      await ClanWarsItem.destroy({ where: { itemId: submission.rewardItemId } });
    }

    await submission.update({
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      rewardSlot: null,
      rewardItemId: null,
    });

    await pubsub.publish(`CLAN_WARS_SUBMISSION_REVIEWED_${submission.eventId}`, {
      clanWarsSubmissionReviewed: submission,
    });

    return submission;
  },

  createClanWarsPreScreenshot: async (_, args) => {
    const { ClanWarsPreScreenshot } = getModels();
    const event = await getEventOrThrow(args.eventId);
    if (event.status !== 'GATHERING') {
      throw new UserInputError('Event is not in GATHERING phase');
    }

    const preScreenshot = await ClanWarsPreScreenshot.create({
      preScreenshotId: generateId('cwps'),
      eventId: args.eventId,
      teamId: args.teamId ?? null,
      taskId: args.taskId,
      taskLabel: args.taskLabel ?? null,
      submittedBy: args.submittedBy,
      submittedUsername: args.submittedUsername ?? null,
      screenshotUrl: args.screenshotUrl ?? null,
      channelId: args.channelId ?? null,
      messageId: args.messageId ?? null,
      submittedAt: new Date(),
    });

    await pubsub.publish(`CLAN_WARS_PRESCREENSHOT_ADDED_${args.eventId}`, {
      clanWarsPreScreenshotAdded: preScreenshot,
    });

    return preScreenshot;
  },

  sendBattleEmote: async (_, { battleId, emote }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    await pubsub.publish(`BATTLE_EMOTE_${battleId}`, {
      battleEmoteReceived: { battleId, emote },
    });
    return true;
  },
};
