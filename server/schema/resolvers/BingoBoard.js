const { ApolloError } = require('apollo-server-express');
const { BingoBoard, BingoTile, User } = require('../../db/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  Mutation: {
    createBingoBoard: async (_, { input }, context) => {
      const {
        name,
        description,
        type,
        isPublic,
        editors,
        team,
        bonusSettings,
        totalValue,
        totalValueCompleted,
        baseTileValue,
      } = input;

      try {
        const size = type === 'FIVE' ? 5 : 7;

        const newBingoBoard = await BingoBoard.create({
          name,
          description,
          type,
          isPublic,
          team,
          bonusSettings,
          totalValue,
          totalValueCompleted,
          userId: context.user.id,
          layout: [],
        });

        const editorsToAdd = [context.user.id, ...(editors || [])];

        await newBingoBoard.setEditors(editorsToAdd);

        // step 1: create the tiles
        const tiles = [];
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            tiles.push({
              name: `Tile ${row * size + col + 1}`,
              isComplete: false,
              value: baseTileValue || 0,
              board: newBingoBoard.id,
            });
          }
        }
        const createdTiles = await BingoTile.bulkCreate(tiles, { returning: true });

        // step 2: create the layout
        const layout = [];
        for (let row = 0; row < size; row++) {
          layout.push(createdTiles.slice(row * size, (row + 1) * size).map((tile) => tile.id));
        }

        // step 3: update the board with the layout
        newBingoBoard.layout = layout;
        await newBingoBoard.save();

        const populatedBingoBoard = await BingoBoard.findByPk(newBingoBoard.id, {
          include: [
            { model: BingoTile, as: 'tiles' },
            { model: User, as: 'editors' },
          ],
        });

        return populatedBingoBoard;
      } catch (error) {
        console.error('Error creating BingoBoard:', error);
        throw new ApolloError('Failed to create BingoBoard');
      }
    },
    updateBingoBoard: async (_, { id, input }, context) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id, {
          include: [
            { model: BingoTile, as: 'tiles' },
            { model: User, as: 'editors' },
          ],
        });

        if (!bingoBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        const isEditor = bingoBoard.editors?.some((editor) => editor.id === context.user?.id);

        if (!isEditor) {
          throw new ApolloError('Unauthorized to update this BingoBoard', 'UNAUTHORIZED');
        }

        const allowedFields = [
          'name',
          'description',
          'isPublic',
          'team',
          'bonusSettings',
          'totalValue',
          'totalValueCompleted',
        ];
        allowedFields.forEach((key) => {
          if (key in input) {
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
          team: null,
          bonusSettings: originalBoard.bonusSettings,
          layout: [],
          userId: context.user.id,
          totalValue: originalBoard.totalValue,
          totalValueCompleted: originalBoard.totalValueCompleted,
          createdAt: new Date(Date.now()).toISOString(),
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
        await duplicatedBoard.addEditors([context.user.id]);

        const populatedDuplicatedBoard = await BingoBoard.findByPk(duplicatedBoard.id, {
          include: [
            { model: BingoTile, as: 'tiles' },
            { model: User, as: 'editors' },
          ],
        });

        return populatedDuplicatedBoard;
      } catch (error) {
        console.error('Error duplicating BingoBoard:', error);
        throw new ApolloError('Failed to duplicate BingoBoard');
      }
    },
    deleteBingoBoard: async (_, { id }, context) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id, {
          include: [
            { model: BingoTile, as: 'tiles' },
            { model: User, as: 'editors' },
          ],
        });

        if (!bingoBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        const isEditor = bingoBoard.editors.some((editor) => editor.id === context.user?.id);

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
    updateBoardEditors: async (_, { boardId, editorIds }) => {
      const board = await BingoBoard.findByPk(boardId, {
        include: [{ model: User, as: 'editors' }],
      });

      if (!board) {
        throw new Error('Board not found');
      }

      const boardOwnerId = board.userId;

      // ensure all IDs are integers and unique
      const updatedEditorIds = [...new Set([boardOwnerId, ...editorIds])]
        .filter((id) => id !== null)
        .map((id) => {
          const parsedId = parseInt(id, 10);
          if (isNaN(parsedId)) {
            throw new Error(`Invalid ID: ${id}`);
          }
          return parsedId;
        });

      const editorsToAdd = await User.findAll({
        where: { id: updatedEditorIds },
      });

      if (editorsToAdd.length !== updatedEditorIds.length) {
        const missingIds = updatedEditorIds.filter(
          (id) => !editorsToAdd.some((editor) => editor.id === id)
        );

        if (missingIds.length > 0) {
          throw new Error(`Users not found for IDs: ${missingIds.join(', ')}`);
        }
      }

      await board.setEditors(editorsToAdd);

      const updatedBoard = await BingoBoard.findByPk(boardId, {
        include: [
          { model: User, as: 'editors' },
          { model: User, as: 'user', attributes: ['id', 'username', 'rsn'] },
          { model: BingoTile, as: 'tiles' },
        ],
      });

      return updatedBoard;
    },
  },
  Query: {
    getBingoBoard: async (_, { id }) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id, {
          include: [
            { model: User, as: 'editors', attributes: ['id', 'username', 'rsn'] },
            { model: User, as: 'user', attributes: ['id', 'username', 'rsn'] },
            { model: BingoTile, as: 'tiles' },
          ],
        });

        if (bingoBoard) {
          return {
            ...bingoBoard.dataValues,
            layout: bingoBoard.layout,
          };
        }
        return bingoBoard;
      } catch (error) {
        console.error('Error fetching BingoBoard:', error);
        throw new ApolloError('Failed to fetch BingoBoard');
      }
    },
    getPublicBoards: async (_, { limit, offset }) => {
      try {
        const totalCount = await BingoBoard.count({
          where: { isPublic: true },
        });

        const boards = await BingoBoard.findAll({
          where: { isPublic: true },
          attributes: ['id', 'createdAt', 'name', 'layout'],
          include: [
            {
              model: BingoTile,
              as: 'tiles',
              attributes: ['id', 'isComplete'],
            },
            { model: User, as: 'editors', attributes: ['id', 'username', 'rsn'] },
          ],
          order: [['createdAt', 'DESC']],
          limit,
          offset,
        });

        return {
          boards: boards || [],
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching public boards:', error);
        throw new ApolloError('Failed to fetch public boards');
      }
    },
  },
};
