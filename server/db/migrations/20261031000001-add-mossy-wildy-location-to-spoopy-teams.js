'use strict';

const LOCATION_COUNT = 12;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopyTeams', 'mossyWildyLocation', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Give existing teams a random, non-repeating clue within each event.
    // NULL remains valid for an event with more teams than available clues.
    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          "teamId",
          ROW_NUMBER() OVER (PARTITION BY "eventId" ORDER BY RANDOM()) AS location_number
        FROM "SpoopyTeams"
      )
      UPDATE "SpoopyTeams" AS teams
      SET "mossyWildyLocation" = ranked.location_number
      FROM ranked
      WHERE teams."teamId" = ranked."teamId"
        AND ranked.location_number <= ${LOCATION_COUNT}
    `);

    await queryInterface.addConstraint('SpoopyTeams', {
      fields: ['mossyWildyLocation'],
      type: 'check',
      where: {
        mossyWildyLocation: { [Sequelize.Op.between]: [1, LOCATION_COUNT] },
      },
      name: 'spoopy_teams_mossy_wildy_location_range',
    });
    await queryInterface.addIndex('SpoopyTeams', ['eventId', 'mossyWildyLocation'], {
      unique: true,
      name: 'spoopy_teams_event_mossy_wildy_location_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'SpoopyTeams',
      'spoopy_teams_event_mossy_wildy_location_unique',
    );
    await queryInterface.removeConstraint(
      'SpoopyTeams',
      'spoopy_teams_mossy_wildy_location_range',
    );
    await queryInterface.removeColumn('SpoopyTeams', 'mossyWildyLocation');
  },
};
