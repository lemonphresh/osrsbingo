'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'admin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.sequelize.query(`
      UPDATE "Users" SET "admin" = true WHERE "username" = 'demoUser';
      UPDATE "Users" SET "admin" = true WHERE "username" = 'buttlid';
      UPDATE "Users" SET "admin" = true WHERE "username" = 'Cealsha';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'admin');
  },
};
