'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('ClanWarsBattles', ['eventId'], {
      name: 'idx_clan_wars_battles_event_id',
    });
    await queryInterface.addIndex('ClanWarsBattles', ['team1Id'], {
      name: 'idx_clan_wars_battles_team1_id',
    });
    await queryInterface.addIndex('ClanWarsBattles', ['team2Id'], {
      name: 'idx_clan_wars_battles_team2_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ClanWarsBattles', 'idx_clan_wars_battles_event_id');
    await queryInterface.removeIndex('ClanWarsBattles', 'idx_clan_wars_battles_team1_id');
    await queryInterface.removeIndex('ClanWarsBattles', 'idx_clan_wars_battles_team2_id');
  },
};
