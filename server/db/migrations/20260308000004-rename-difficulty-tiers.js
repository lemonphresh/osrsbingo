'use strict';

module.exports = {
  async up(queryInterface) {
    // ClanWarsTasks.difficulty: easy → initiate, medium → adept, hard → master
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_ClanWarsTasks_difficulty" RENAME VALUE 'easy'   TO 'initiate';
      ALTER TYPE "enum_ClanWarsTasks_difficulty" RENAME VALUE 'medium' TO 'adept';
      ALTER TYPE "enum_ClanWarsTasks_difficulty" RENAME VALUE 'hard'   TO 'master';
    `);

    // ClanWarsSubmissions.difficulty: same rename
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_ClanWarsSubmissions_difficulty" RENAME VALUE 'easy'   TO 'initiate';
      ALTER TYPE "enum_ClanWarsSubmissions_difficulty" RENAME VALUE 'medium' TO 'adept';
      ALTER TYPE "enum_ClanWarsSubmissions_difficulty" RENAME VALUE 'hard'   TO 'master';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_ClanWarsTasks_difficulty" RENAME VALUE 'initiate' TO 'easy';
      ALTER TYPE "enum_ClanWarsTasks_difficulty" RENAME VALUE 'adept'    TO 'medium';
      ALTER TYPE "enum_ClanWarsTasks_difficulty" RENAME VALUE 'master'   TO 'hard';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_ClanWarsSubmissions_difficulty" RENAME VALUE 'initiate' TO 'easy';
      ALTER TYPE "enum_ClanWarsSubmissions_difficulty" RENAME VALUE 'adept'    TO 'medium';
      ALTER TYPE "enum_ClanWarsSubmissions_difficulty" RENAME VALUE 'master'   TO 'hard';
    `);
  },
};
