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
          {
            expiresIn: '3d',
          }
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

    loginUser: async (_, { username, password }, context) => {
      try {
        const user = await User.findOne({
          where: { username },
          include: [
            {
              model: BingoBoard,
              as: 'editorBoards',
              include: [
                { model: User, as: 'editors', required: false },
                { model: BingoTile, as: 'tiles' },
              ],
            },
          ],
        });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new ApolloError('Incorrect password', 'UNAUTHORIZED');
        }

        const token = jwt.sign({ userId: user.id, admin: user.admin }, context.jwtSecret, {
          expiresIn: '1d',
        });

        return {
          user,
          token,
        };
      } catch (error) {
        console.error('Error during login:', error);
        throw new ApolloError('Failed to log in user');
      }
    },

    updateUser: async (_, { id, input }) => {
      try {
        const user = await User.findByPk(id, {
          include: [
            {
              model: BingoBoard,
              as: 'editorBoards',
              include: [
                { model: User, as: 'editors', required: false },
                { model: BingoTile, as: 'tiles' },
              ],
            },
          ],
        });

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
        // Ensure the requester is authenticated and is an admin
        if (!context.user || !context.user.admin || context.user.id === id) {
          throw new ApolloError('Unauthorized to delete user', 'UNAUTHORIZED');
        }

        // Find the user to be deleted
        const user = await User.findByPk(id, {
          include: [
            { model: BingoBoard, as: 'bingoBoards', include: { model: BingoTile, as: 'tiles' } },
            { model: BingoBoard, as: 'editorBoards' },
          ],
        });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        // Delete all bingo boards created by the user, including their tiles
        if (user.bingoBoards && user.bingoBoards.length > 0) {
          for (const board of user.bingoBoards) {
            await BingoTile.destroy({ where: { board: board.id } }); // Delete tiles of the board
            await board.destroy(); // Delete the board itself
          }
        }

        // Delete the user
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
    getUser: async (_, { id }) => {
      try {
        const user = await User.findByPk(id, {
          include: [
            {
              model: BingoBoard,
              as: 'editorBoards',
              include: [
                { model: User, as: 'editors', required: false },
                { model: BingoTile, as: 'tiles' },
              ],
            },
          ],
        });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new ApolloError('Failed to fetch user');
      }
    },

    getUsers: async () => {
      try {
        return await User.findAll({
          include: [
            {
              model: BingoBoard,
              as: 'editorBoards',
              include: [
                { model: User, as: 'editors', required: false },
                { model: BingoTile, as: 'tiles' },
              ],
            },
          ],
        });
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

    searchUsersByIds: async (_, { ids }) => {
      if (!ids || ids.length === 0) {
        throw new ApolloError('No IDs provided', 'INVALID_INPUT');
      }

      try {
        return await User.findAll({
          where: {
            id: { [Op.in]: ids },
          },
        });
      } catch (error) {
        console.error('Error fetching users by IDs:', error);
        throw new ApolloError('Failed to fetch users by IDs');
      }
    },
  },
};
