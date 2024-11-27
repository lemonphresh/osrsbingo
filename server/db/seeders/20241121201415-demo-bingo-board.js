'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const boards = await queryInterface.bulkInsert(
      'BingoBoards',
      [
        {
          type: 'FIVE', // 'FIVE' for 5x5 board
          isPublic: true,
          editors: '{1}',
          name: 'Awesome 5x5 Board',
          layout: JSON.stringify([]),
          team: 1,
          description: 'This is a description for this awesome 5x5 board',
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
        {
          type: 'SEVEN', // 'SEVEN' for 7x7 board
          isPublic: true,
          editors: '{1}',
          name: 'Awesome 7x7 Board',
          layout: JSON.stringify([]),
          team: 1,
          description: 'This is a description for this awesome 7x7 board',
          totalValue: 200,
          totalValueCompleted: 0,
          bonusSettings: JSON.stringify({
            allowDiagonals: true,
            horizontalBonus: 15,
            verticalBonus: 15,
            diagonalBonus: 30,
            blackoutBonus: 100,
          }),
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: true }
    );

    const [fiveBoardId, sevenBoardId] = boards.map((board) => board.id);

    const createTilesAndLayout = async (boardId, size) => {
      const tiles = [];
      const layout = [];

      for (let row = 0; row < size; row++) {
        const layoutRow = [];
        for (let col = 0; col < size; col++) {
          const index = row * size + col + 1;

          const tile = {
            name: `Tile ${index}`,
            isComplete: false,
            value: Math.floor(Math.random() * 10), // random values for fun
            icon:
              index % 3 === 0
                ? 'https://oldschool.runescape.wiki/images/Gnome_child_backpack.png?cbd04'
                : null,
            board: boardId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          tiles.push(tile);
          layoutRow.push(null); // populating this below
        }
        layout.push(layoutRow);
      }

      const createdTiles = await queryInterface.bulkInsert('BingoTiles', tiles, {
        returning: true,
      });

      // updating layout
      for (let i = 0; i < createdTiles.length; i++) {
        const tile = createdTiles[i];
        const row = Math.floor(i / size);
        const col = i % size;
        layout[row][col] = tile.id;
      }

      await queryInterface.bulkUpdate(
        'BingoBoards',
        { layout: JSON.stringify(layout) },
        { id: boardId }
      );
    };

    await createTilesAndLayout(fiveBoardId, 5); // 5x5 board
    await createTilesAndLayout(sevenBoardId, 7); // 7x7 board
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BingoTiles', null, {});
    await queryInterface.bulkDelete('BingoBoards', null, {});
  },
};
