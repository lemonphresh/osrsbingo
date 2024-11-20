const User = require('../db/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      return User.findByPk(id);
    },
    getUsers: async () => {
      try {
        // Fetch all users
        const users = await User.findAll(); // This should work if User is defined correctly
        return users;
      } catch (err) {
        console.error('Error fetching users:', err);
        throw new Error('Failed to fetch users');
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
        throw new Error('Failed to create user');
      }
    },
    loginUser: async (_, { username, password }, { jwtSecret }) => {
      let user;
      console.log({ jwtSecret });
      try {
        user = await User.findOne({ where: { username } });
      } catch (error) {
        console.error('Error during Sequelize query:', error);
      }

      if (!user) {
        throw new Error('User not found');
      }

      console.log(password, user.password);

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error('Incorrect password');
      }

      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1d' });

      return {
        user,
        token,
      };
    },
  },
};

module.exports = resolvers;
