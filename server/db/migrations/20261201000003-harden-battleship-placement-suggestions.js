'use strict';

module.exports = {
  async up(queryInterface) {
    // Keep the newest row if old race conditions produced more than one
    // suggestion for the same proposer/team before adding the invariant.
    await queryInterface.sequelize.query(`
      DELETE FROM "BattleshipPlacementSuggestions" AS older
      USING "BattleshipPlacementSuggestions" AS newer
      WHERE older."teamId" = newer."teamId"
        AND older."proposerDiscordId" = newer."proposerDiscordId"
        AND (
          older."createdAt" < newer."createdAt"
          OR (
            older."createdAt" = newer."createdAt"
            AND older."suggestionId" < newer."suggestionId"
          )
        )
    `);

    await queryInterface.addConstraint('BattleshipPlacementSuggestions', {
      fields: ['teamId', 'proposerDiscordId'],
      type: 'unique',
      name: 'uq_bs_placement_suggestion_team_proposer',
    });
    await queryInterface.addConstraint('BattleshipPlacementSuggestions', {
      fields: ['eventId'],
      type: 'foreign key',
      name: 'fk_bs_placement_suggestion_event',
      references: { table: 'BattleshipEvents', field: 'eventId' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('BattleshipPlacementSuggestions', {
      fields: ['teamId'],
      type: 'foreign key',
      name: 'fk_bs_placement_suggestion_team',
      references: { table: 'BattleshipTeams', field: 'teamId' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'BattleshipPlacementSuggestions',
      'fk_bs_placement_suggestion_team'
    );
    await queryInterface.removeConstraint(
      'BattleshipPlacementSuggestions',
      'fk_bs_placement_suggestion_event'
    );
    await queryInterface.removeConstraint(
      'BattleshipPlacementSuggestions',
      'uq_bs_placement_suggestion_team_proposer'
    );
  },
};
