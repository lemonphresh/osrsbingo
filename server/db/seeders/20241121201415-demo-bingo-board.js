'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const board = await queryInterface.bulkInsert(
      'BingoBoards',
      [
        {
          type: 'FIVE', // 'FIVE' for 5x5 board or 'SEVEN' for 7x7 board
          isPublic: true,
          editors: '{1}',
          name: 'Awesome Board',
          layout: JSON.stringify([]),
          team: 1,
          totalValue: 100,
          totalValueCompleted: 0,
          bonusSettings: JSON.stringify({
            allowDiagonals: true,
            horizontalBonus: 10,
            verticalBonus: 10,
            diagonalBonus: 20,
            blackoutBonus: 50,
          }),
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: true }
    );

    const boardId = board[0].id;

    const size = 5;
    const tiles = [];
    const layout = [];

    for (let row = 0; row < size; row++) {
      const layoutRow = [];
      for (let col = 0; col < size; col++) {
        const index = row * size + col + 1;

        const tile = {
          name: `Tile ${index}`,
          isComplete: false,
          value: 0,
          icon:
            index % 3 === 0
              ? 'https://oldschool.runescape.wiki/images/Gnome_child_backpack.png?cbd04'
              : null,
          board: boardId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        tiles.push(tile);
        layoutRow.push(null); // placeholder for tile IDs, populated below
      }
      layout.push(layoutRow);
    }

    // insert the tiles into the database
    const createdTiles = await queryInterface.bulkInsert('BingoTiles', tiles, {
      returning: true,
    });

    // update the layout with the created tile IDs
    for (let i = 0; i < createdTiles.length; i++) {
      const tile = createdTiles[i];
      const row = Math.floor(i / size);
      const col = i % size;
      layout[row][col] = tile.id;
    }

    // update the board with the populated layout
    await queryInterface.bulkUpdate(
      'BingoBoards',
      { layout: JSON.stringify(layout) },
      { id: boardId }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BingoTiles', null, {});
    await queryInterface.bulkDelete('BingoBoards', null, {});
  },
};
