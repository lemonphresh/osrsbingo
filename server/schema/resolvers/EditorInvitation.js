const { ApolloError } = require('apollo-server-express');
const { EditorInvitation, User, BingoBoard } = require('../../db/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

module.exports = {
  Mutation: {
    sendEditorInvitation: async (_, { boardId, invitedUserId }, context) => {
      const inviterUserId = context.user.id;

      // check if the inviter has permission to invite editors
      const board = await BingoBoard.findByPk(boardId);
      if (!board) throw new Error('Bingo board not found.');
      if (!board.editors.includes(inviterUserId) || !context.user.admin)
        throw new Error("You don't have permission.");

      // create invitation
      const invitation = await EditorInvitation.create({
        boardId,
        invitedUserId,
        inviterUserId,
        status: 'PENDING',
      });

      return invitation;
    },
    respondToInvitation: async (_, { invitationId, response }, context) => {
      const userId = context.user.id;

      // find the invitation
      const invitation = await EditorInvitation.findByPk(invitationId);
      if (!invitation) throw new Error('Invitation not found.');
      if (invitation.invitedUserId !== userId) throw new Error('Unauthorized.');

      // update the status
      if (!['ACCEPTED', 'DENIED'].includes(response.toUpperCase())) {
        throw new Error('Invalid response.');
      }

      invitation.status = response.toUpperCase();
      await invitation.save();

      // if accepted, add the user as an editor
      if (invitation.status === 'ACCEPTED') {
        const board = await BingoBoard.findByPk(invitation.boardId);
        await board.addEditor(userId);
      }

      return invitation;
    },
    sendEditorInvitations: async (_, { boardId, invitedUserIds }, context) => {
      try {
        const createdInvitations = [];

        for (const userId of invitedUserIds) {
          // check if there's already a pending invitation for this board and user
          const existingInvitation = await EditorInvitation.findOne({
            where: {
              boardId,
              invitedUserId: userId,
              status: 'PENDING',
            },
          });

          // if an invitation already exists, skip this user
          if (existingInvitation) {
            logger.info(`Skipping user ${userId}: Invitation already exists.`);
            continue;
          }

          // create a new invitation if no pending invitation exists
          const newInvitation = await EditorInvitation.create({
            boardId,
            invitedUserId: userId,
            inviterUserId: context.user.id,
            status: 'PENDING',
          });

          createdInvitations.push(newInvitation);
        }

        return {
          success: true,
          message: `${createdInvitations.length} invitations sent successfully.`,
        };
      } catch (error) {
        logger.error('Error sending invitations:', error);
        return {
          success: false,
          message: `Failed to send invitations to ${invitedUserIds.length} users.`,
        };
      }
    },
  },
  Query: {
    pendingInvitations: async (_, __, context) => {
      if (!context.user) return [];
      const userId = context.user.id;
      const invitations = await EditorInvitation.findAll({
        where: {
          invitedUserId: userId,
          status: 'PENDING',
        },
        include: [
          { model: User, as: 'inviterUser' },
          { model: BingoBoard, as: 'boardDetails' },
        ],
      });
      return invitations;
    },
  },
};
