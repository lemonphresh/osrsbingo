const { ApolloError } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { BingoBoard, User } = require('../../db/models');
const { Op } = require('sequelize');

module.exports = {
  Mutation: {
    createUser: async (_, { username, password, rsn, permissions }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const jwtSecret = process.env.JWTSECRETKEY;
        const newUser = await User.create({
          username,
          password: hashedPassword,
          rsn,
          permissions,
        });

        const token = jwt.sign({ userId: newUser.id, username: newUser.username }, jwtSecret, {
          expiresIn: '3d',
        });

        return {
          id: newUser.id,
          username: newUser.username,
          token,
        };
      } catch (error) {
        console.error('Error creating user:', error);
        throw new ApolloError('Failed to create user');
      }
    },
    loginUser: async (_, { username, password }, context) => {
      let user;
      try {
        user = await User.findOne({
          where: { username },
          include: {
            model: BingoBoard,
            as: 'bingoBoards',
            include: {
              model: User,
              as: 'editors',
              required: false,
            },
          },
        });
      } catch (error) {
        console.error('Error during Sequelize query:', error);
      }

      if (!user) {
        throw new Error('User not found');
      }

      const sortedBoards = await BingoBoard.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
      });

      user.dataValues.bingoBoards = sortedBoards;

      user.save();

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error('Incorrect password');
      }

      const token = jwt.sign({ userId: user.id }, context.jwtSecret, { expiresIn: '1d' });

      return {
        user,
        token,
      };
    },
    updateUser: async (_, { id, input }) => {
      try {
        const user = await User.findByPk(id, {
          include: {
            model: BingoBoard,
            as: 'bingoBoards',
            include: {
              model: User,
              as: 'editors',
              required: false,
            },
          },
        });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        const sortedBoards = await BingoBoard.findAll({
          where: { userId: user.id },
          order: [['createdAt', 'DESC']],
        });

        user.dataValues.bingoBoards = sortedBoards;

        const allowedFields = ['username', 'email', 'rsn', 'team']; // list allowed fields
        const validFields = Object.keys(input).reduce((acc, key) => {
          if (allowedFields.includes(key)) {
            acc[key] = input[key];
          }
          return acc;
        }, {});

        user.set(validFields);
        await user.save();
        const updatedUser = user.reload();
        return updatedUser;
      } catch (error) {
        throw new Error('Failed to update user');
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
              as: 'bingoBoards',
              include: {
                model: User,
                as: 'editors',
                required: false,
              },
            },
          ],
        });

        if (!user) {
          throw new ApolloError('User not found', 'NOT_FOUND');
        }

        const sortedBoards = await BingoBoard.findAll({
          where: { userId: user.id },
          order: [['createdAt', 'DESC']],
        });

        user.dataValues.bingoBoards = sortedBoards;

        user.save();

        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new ApolloError('Failed to fetch user');
      }
    },
    getUsers: async () => {
      try {
        const users = await User.findAll();
        return users;
      } catch (err) {
        console.error('Error fetching users:', err);
        throw new ApolloError('Failed to fetch users');
      }
    },
    async searchUsers(_, { search }, context) {
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
              { username: { [Op.iLike]: `%${search}%` } },
              { rsn: { [Op.iLike]: `%${search}%` } },
            ],
          },
          limit: 10,
          attributes: ['id', 'username', 'rsn'],
        });

        return users.map((user) => ({
          id: user.id,
          username: user.username,
          rsn: user.rsn,
        }));
      } catch (err) {
        console.error(err);
        throw new ApolloError('An error occurred while searching for users.');
      }
    },
    searchUsersByIds: async (_, { ids }) => {
      if (!ids || ids.length === 0) {
        throw new Error('No IDs provided');
      }

      try {
        const users = await User.findAll({
          where: {
            id: {
              [Op.in]: ids,
            },
          },
        });

        return users;
      } catch (err) {
        console.error(err);
        throw new Error('Failed to fetch users by IDs');
      }
    },
  },
};
