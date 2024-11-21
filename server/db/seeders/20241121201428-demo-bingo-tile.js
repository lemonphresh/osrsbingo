'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('BingoTiles', [
      {
        isComplete: false,
        name: 'Gnome Backpack',
        icon: 'https://oldschool.runescape.wiki/images/thumb/Gnome_child_backpack_detail.png/800px-Gnome_child_backpack_detail.png?51cae',
        dateCompleted: null,
        completedBy: null,
        board: 1, // Assuming the BingoBoard with ID 1
        value: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        isComplete: false,
        name: 'Damp Egg',
        icon: 'https://oldschool.runescape.wiki/images/thumb/Damp_egg_detail.png/640px-Damp_egg_detail.png?0e2a0',
        dateCompleted: null,
        completedBy: null,
        board: 1, // Assuming the BingoBoard with ID 1
        value: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more tiles as needed...
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('BingoTiles', null, {});
  },
};
