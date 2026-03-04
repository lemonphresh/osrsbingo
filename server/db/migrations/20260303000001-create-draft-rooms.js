'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DraftRooms', {
      roomId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      organizerUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      roomName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('LOBBY', 'DRAFTING', 'REVEALED', 'COMPLETED'),
        defaultValue: 'LOBBY',
        allowNull: false,
      },
      draftFormat: {
        type: Sequelize.ENUM('SNAKE', 'LINEAR', 'AUCTION'),
        allowNull: false,
      },
      numberOfTeams: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      teams: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      statCategories: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      tierFormula: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      pickTimeSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 60,
      },
      currentPickIndex: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      currentPickStartedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      auctionState: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      roomPin: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('DraftRooms', ['organizerUserId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('DraftRooms');
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_DraftRooms_status; DROP TYPE IF EXISTS enum_DraftRooms_draftFormat;"
    );
  },
};
