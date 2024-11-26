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
    updateBingoBoard: async (_, { id, input }, context) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id);

        if (!bingoBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        const isEditor = bingoBoard.editors.includes(context.user.id);

        if (!isEditor) {
          throw new ApolloError('Unauthorized to update this BingoBoard', 'UNAUTHORIZED');
        }

        Object.keys(input).forEach((key) => {
          if (key in bingoBoard) {
            bingoBoard[key] = input[key];
          }
        });

        await bingoBoard.save();

        return bingoBoard;
      } catch (error) {
        console.error('Error updating BingoBoard:', error);
        throw new ApolloError('Failed to update BingoBoard');
      }
    },
    duplicateBingoBoard: async (_, { boardId }, context) => {
      try {
        const originalBoard = await BingoBoard.findByPk(boardId, {
          include: [{ model: BingoTile, as: 'tiles' }],
        });

        if (!originalBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        const duplicatedBoard = await BingoBoard.create({
          description: originalBoard.description,
          name: `${originalBoard.name} (Copy)`,
          type: originalBoard.type,
          isPublic: false,
          editors: [context.user.id],
          team: null,
          bonusSettings: originalBoard.bonusSettings,
          layout: [],
          userId: context.user.id,
          totalValue: originalBoard.totalValue,
          totalValueCompleted: originalBoard.totalValueCompleted,
        });

        const newTiles = originalBoard.tiles.map((tile) => ({
          icon: tile.icon,
          name: tile.name,
          isComplete: false, // reset completion
          value: tile.value,
          board: duplicatedBoard.id,
        }));

        const createdTiles = await BingoTile.bulkCreate(newTiles, { returning: true });

        const layout = [];
        for (let row of originalBoard.layout) {
          layout.push(
            row.map((tileId) => {
              const originalTile = originalBoard.tiles.find((tile) => tile.id === tileId);
              return createdTiles.find((newTile) => newTile.name === originalTile.name).id;
            })
          );
        }
        duplicatedBoard.tiles = createdTiles;
        duplicatedBoard.layout = layout;
        await duplicatedBoard.save();

        return duplicatedBoard;
      } catch (error) {
        console.error('Error duplicating BingoBoard:', error);
        throw new ApolloError('Failed to duplicate BingoBoard');
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
