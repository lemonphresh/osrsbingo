'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BingoBoards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      layout: {
        type: Sequelize.JSON
      },
      isPublic: {
        type: Sequelize.BOOLEAN
      },
      team: {
        type: Sequelize.INTEGER
      },
      totalValue: {
        type: Sequelize.INTEGER
      },
      totalValueCompleted: {
        type: Sequelize.INTEGER
      },
      bonusSettings: {
        type: Sequelize.JSON
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BingoBoards');
  }
};