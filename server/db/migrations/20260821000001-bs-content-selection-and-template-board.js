'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. contentSelections JSONB on events — null means "all content"
    await queryInterface.addColumn('BattleshipEvents', 'contentSelections', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });

    // 2. contentId on tasks — needed to map tasks back to registry entries for ocean pool filtering
    await queryInterface.addColumn('BattleshipTasks', 'contentId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 3. teamId on boards becomes nullable — the template board (created at event creation) has no team
    await queryInterface.changeColumn('BattleshipBoards', 'teamId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 4. row/col on tiles become nullable — pre-placement tiles have no grid position yet
    await queryInterface.changeColumn('BattleshipTiles', 'row', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('BattleshipTiles', 'col', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BattleshipEvents', 'contentSelections');
    await queryInterface.removeColumn('BattleshipTasks', 'contentId');
    await queryInterface.changeColumn('BattleshipBoards', 'teamId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('BattleshipTiles', 'row', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn('BattleshipTiles', 'col', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
