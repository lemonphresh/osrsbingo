const { ApolloError } = require('apollo-server-express');
const User = require('../db/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/*
    todo: pull resolvers into specific files, like User.js, BingoBoard.js, 
        etc and import + spread here
*/

const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      return User.findByPk(id);
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
        user = await User.findOne({ where: { username } });
      } catch (error) {
        console.error('Error during Sequelize query:', error);
      }

      console.log({ id: user.id });

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
    updateUser: async (_, { id, fields }) => {
      try {
        const user = await User.findByPk(id);
        user.set({
          ...fields,
        });
        await user.save();
        const updatedUser = user.reload();
        return updatedUser;
      } catch (error) {
        throw new Error('Failed to update user');
      }
    },
  },
};

module.exports = resolvers;
