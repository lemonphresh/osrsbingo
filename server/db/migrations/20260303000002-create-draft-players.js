'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DraftPlayers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'DraftRooms', key: 'roomId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rsn: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alias: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      womData: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      tierBadge: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      teamIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      pickOrder: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('DraftPlayers', ['roomId']);
    await queryInterface.addIndex('DraftPlayers', ['roomId', 'teamIndex']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('DraftPlayers');
  },
};
