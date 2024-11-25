const { ApolloError } = require('apollo-server-express');
const { BingoBoard, BingoTile, User } = require('../../db/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  Mutation: {
    createBingoBoard: async (_, { type, isPublic, editors, team, bonusSettings }, context) => {
      try {
        const size = type === 'FIVE' ? 5 : 7;

        const newBingoBoard = await BingoBoard.create({
          type,
          isPublic,
          editors: editors || [context.user.id],
          team,
          bonusSettings,
          userId: context.user.id,
          layout: [],
        });

        // step 1: make le tiles
        const tiles = [];
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            tiles.push({
              name: `Tile ${row * size + col + 1}`,
              isComplete: false,
              value: 0,
              board: newBingoBoard.id,
            });
          }
        }
        const createdTiles = await BingoTile.bulkCreate(tiles, { returning: true });

        // step 2: make le layout
        const layout = [];
        for (let row = 0; row < size; row++) {
          layout.push(createdTiles.slice(row * size, (row + 1) * size).map((tile) => tile.id));
        }
        // step 3: update le board
        newBingoBoard.layout = layout;
        await newBingoBoard.save();

        return newBingoBoard;
      } catch (error) {
        console.error('Error creating BingoBoard:', error);
        throw new ApolloError('Failed to create BingoBoard');
      }
    },
    deleteBingoBoard: async (_, { id }, context) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id, {
          include: [{ model: BingoTile, as: 'tiles' }],
        });

        if (!bingoBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        console.log({ context });

        const isEditor = bingoBoard.editors.includes(context.user.id);

        if (!isEditor) {
          throw new ApolloError('Unauthorized to delete this BingoBoard', 'UNAUTHORIZED');
        }

        await BingoTile.destroy({ where: { board: id } });

        await BingoBoard.destroy({ where: { id } });

        return { success: true, message: 'Bingo board deleted successfully' };
      } catch (error) {
        console.error('Error deleting BingoBoard:', error);
        throw new ApolloError('Failed to delete BingoBoard');
      }
    },
  },
  Query: {
    getBingoBoard: async (_, { id }) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id, {
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'rsn'] },
            { model: BingoTile, as: 'tiles' },
          ],
        });

        if (bingoBoard) {
          return {
            ...bingoBoard.dataValues,
            layout: bingoBoard.layout, // Assuming it's stored as an array or raw JSON
          };
        }
        return bingoBoard;
      } catch (error) {
        console.error('Error fetching BingoBoard:', error);
        throw new ApolloError('Failed to fetch BingoBoard');
      }
    },
  },
};
