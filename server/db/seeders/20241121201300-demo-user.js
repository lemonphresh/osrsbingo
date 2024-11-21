'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('demoPassword123', 10);

    return queryInterface.bulkInsert('Users', [
      {
        username: 'demoUser',
        password: hashedPassword,
        rsn: 'DemoUserRSN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {});
  },
};
