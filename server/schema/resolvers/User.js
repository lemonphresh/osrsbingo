const { ApolloError } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { BingoBoard, User } = require('../../db/models');

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
          },
        });
      } catch (error) {
        console.error('Error during Sequelize query:', error);
      }

      if (!user) {
        throw new Error('User not found');
      }

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
          },
        });
        const allowedFields = ['username', 'email', 'rsn', 'team']; // List allowed fields
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
          include: {
            model: BingoBoard,
            as: 'bingoBoards',
          },
        });
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
  },
};
