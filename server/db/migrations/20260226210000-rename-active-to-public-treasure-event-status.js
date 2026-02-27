'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_TreasureEvents_status" RENAME VALUE 'ACTIVE' TO 'PUBLIC'`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_TreasureEvents_status" RENAME VALUE 'PUBLIC' TO 'ACTIVE'`
    );
  },
};
