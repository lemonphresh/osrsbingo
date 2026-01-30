// server/graphql/resolvers/User.js
const { ApolloError, AuthenticationError, UserInputError } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { BingoBoard, BingoTile, User } = require('../../db/models');
const { Op } = require('sequelize');

module.exports = {
  Mutation: {
    createUser: async (_, { displayName, username, password, rsn, permissions }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const jwtSecret = process.env.JWTSECRETKEY;

        const newUser = await User.create({
          displayName,
          username,
          password: hashedPassword,
          rsn,
          permissions,
        });

        const token = jwt.sign(
          { userId: newUser.id, admin: newUser.admin, username: newUser.username },
          jwtSecret,
          { expiresIn: '7d' }
        );

        return {
          id: newUser.id,
          displayName: newUser.displayName,
          username: newUser.username,
          token,
        };
      } catch (error) {
        console.error('Error creating user.');
        throw new ApolloError('Failed to create user');
      }
    },

    linkDiscordAccount: async (_, { userId, discordUserId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const isOwnAccount = context.user.id === parseInt(userId);
      const isAdmin = context.user.admin;

      if (!isOwnAccount && !isAdmin) {
        throw new AuthenticationError('Not authorized to link this account');
      }

      try {
        const user = await User.findByPk(userId);
        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        const existingLink = await User.findOne({ where: { discordUserId } });
        if (existingLink && existingLink.id !== parseInt(userId)) {
          throw new ApolloError(
            'This Discord account is already linked to another user',
            'ALREADY_LINKED'
          );
        }

        user.discordUserId = discordUserId;
        await user.save();

        return user;
      } catch (error) {
        console.error('Error linking Discord account:', error);
        throw error;
      }
    },

    unlinkDiscordAccount: async (_, { userId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const isOwnAccount = context.user.id === parseInt(userId);
      const isAdmin = context.user.admin;

      if (!isOwnAccount && !isAdmin) {
        throw new AuthenticationError('Not authorized to unlink this account');
      }

      try {
        const user = await User.findByPk(userId);
        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        user.discordUserId = null;
        await user.save();

        return user;
      } catch (error) {
        console.error('Error unlinking Discord account:', error);
        throw error;
      }
    },

    loginUser: async (_, { username, password }, context) => {
      try {
        // ✅ SIMPLIFIED: Just fetch user, field resolvers handle editorBoards
        const user = await User.findOne({ where: { username } });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new ApolloError('Incorrect password', 'UNAUTHORIZED');
        }

        const token = jwt.sign({ userId: user.id, admin: user.admin }, context.jwtSecret, {
          expiresIn: '7d',
        });

        return { user, token };
      } catch (error) {
        console.error('Error during login:', error);
        throw new ApolloError('Failed to log in user');
      }
    },

    updateUser: async (_, { id, input }) => {
      try {
        // ✅ SIMPLIFIED: Just fetch user, field resolvers handle editorBoards
        const user = await User.findByPk(id);

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        const allowedFields = ['displayName', 'admin', 'username', 'email', 'rsn', 'team'];
        const validFields = Object.keys(input).reduce((acc, key) => {
          if (allowedFields.includes(key)) {
            acc[key] = input[key];
          }
          return acc;
        }, {});

        user.set(validFields);
        await user.save();
        await user.reload();

        return user.toJSON();
      } catch (error) {
        console.error('Error updating user:', error);
        throw new ApolloError('Failed to update user');
      }
    },

    deleteUser: async (_, { id }, context) => {
      try {
        if (!context.user || !context.user.admin || context.user.id === id) {
          throw new ApolloError('Unauthorized to delete user', 'UNAUTHORIZED');
        }

        const user = await User.findByPk(id, {
          include: [
            { model: BingoBoard, as: 'bingoBoards', include: { model: BingoTile, as: 'tiles' } },
            { model: BingoBoard, as: 'editorBoards' },
          ],
        });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        if (user.bingoBoards && user.bingoBoards.length > 0) {
          for (const board of user.bingoBoards) {
            await BingoTile.destroy({ where: { board: board.id } });
            await board.destroy();
          }
        }

        await user.destroy();

        return {
          success: true,
          message: `User with ID ${id} and their associated bingo boards were deleted successfully.`,
        };
      } catch (error) {
        console.error('Error deleting user:', error);
        throw new ApolloError('Failed to delete user');
      }
    },
  },

  Query: {
    // ✅ SIMPLIFIED: Just fetch user, field resolvers handle editorBoards
    getUser: async (_, { id }) => {
      try {
        const user = await User.findByPk(id);

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new ApolloError('Failed to fetch user');
      }
    },

    getUserByDiscordId: async (_, { discordUserId }) => {
      try {
        const user = await User.findOne({
          where: { discordUserId },
          attributes: ['id', 'displayName', 'username', 'rsn', 'discordUserId'],
        });

        return user;
      } catch (error) {
        console.error('Error fetching user by Discord ID:', error);
        throw new ApolloError('Failed to fetch user by Discord ID');
      }
    },

    // ✅ SIMPLIFIED: Just fetch users, field resolvers handle editorBoards
    getUsers: async () => {
      try {
        return await User.findAll();
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new ApolloError('Failed to fetch users');
      }
    },

    searchUsers: async (_, { search }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to perform this action.');
      }

      if (!search || search.trim().length < 2) {
        throw new UserInputError('Search term must be at least 2 characters long.');
      }

      try {
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { displayName: { [Op.iLike]: `%${search}%` } },
              { rsn: { [Op.iLike]: `%${search}%` } },
            ],
          },
          limit: 10,
          attributes: ['id', 'displayName', 'username', 'rsn'],
        });

        return users;
      } catch (error) {
        console.error('Error searching users:', error);
        throw new ApolloError('An error occurred while searching for users.');
      }
    },
    searchUsersByDiscord: async (_, { query, limit = 10 }) => {
      const users = await User.findAll({
        where: {
          discordUserId: { [Op.ne]: null },
          [Op.or]: [
            { username: { [Op.iLike]: `%${query}%` } },
            { displayName: { [Op.iLike]: `%${query}%` } },
            { rsn: { [Op.iLike]: `%${query}%` } },
            { discordUsername: { [Op.iLike]: `%${query}%` } },
            ...(query.match(/^\d{17,19}$/) ? [{ discordUserId: query }] : []),
          ],
        },
        limit,
        order: [['displayName', 'ASC']],
      });

      return users;
    },

    searchUsersByIds: async (_, { ids }) => {
      if (!ids || ids.length === 0) {
        throw new ApolloError('No IDs provided', 'INVALID_INPUT');
      }

      try {
        return await User.findAll({
          where: { id: { [Op.in]: ids } },
        });
      } catch (error) {
        console.error('Error fetching users by IDs:', error);
        throw new ApolloError('Failed to fetch users by IDs');
      }
    },
  },
};
