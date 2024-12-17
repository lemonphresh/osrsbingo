'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add the column with allowNull: true
    await queryInterface.addColumn('Users', 'displayName', {
      type: Sequelize.STRING,
      allowNull: true, // Allow null temporarily
    });

    // Step 2: Populate the 'displayName' column with 'username' values
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET "displayName" = "username";
    `);

    // Step 3: Change the column to allowNull: false
    await queryInterface.changeColumn('Users', 'displayName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the 'displayName' column if rolling back the migration
    await queryInterface.removeColumn('Users', 'displayName');
  },
};
