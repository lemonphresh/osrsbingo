'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('BingoBoards', [
      {
        type: 'FIVE',
        layout: JSON.stringify([
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
          [16, 17, 18, 19, 20],
          [21, 22, 23, 24, 25],
        ]),
        isPublic: true,
        editors: [1],
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
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('BingoBoards', null, {});
  },
};
