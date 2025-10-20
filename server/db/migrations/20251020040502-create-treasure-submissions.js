'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TreasureSubmissions', {
      submissionId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'TreasureTeams',
          key: 'teamId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nodeId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      submittedBy: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      proofUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING_REVIEW', 'APPROVED', 'DENIED'),
        defaultValue: 'PENDING_REVIEW',
        allowNull: false,
      },
      reviewedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('TreasureSubmissions', ['teamId']);
    await queryInterface.addIndex('TreasureSubmissions', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TreasureSubmissions');
  },
};
