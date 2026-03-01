// server/graphql/resolvers/BingoBoard.js
const { ApolloError } = require('apollo-server-express');
const { BingoBoard, BingoTile, User } = require('../../db/models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

module.exports = {
  Mutation: {
    createBingoBoard: async (_, { input }, context) => {
      const {
        name,
        description,
        category,
        type,
        isPublic,
        editors,
        team,
        bonusSettings,
        totalValue,
        totalValueCompleted,
        baseTileValue,
        theme,
      } = input;

      try {
        const size = type === 'FIVE' ? 5 : 7;

        const newBingoBoard = await BingoBoard.create({
          name,
          category,
          description,
          type,
          isPublic,
          team,
          bonusSettings,
          totalValue,
          totalValueCompleted,
          userId: context.user.id,
          layout: [],
          theme,
        });

        const editorsToAdd = [context.user.id, ...(editors || [])];
        await newBingoBoard.setEditors(editorsToAdd);

        // Create tiles
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

        // Create layout
        const layout = [];
        for (let row = 0; row < size; row++) {
          layout.push(createdTiles.slice(row * size, (row + 1) * size).map((tile) => tile.id));
        }

        newBingoBoard.layout = layout;
        await newBingoBoard.save();

        // ✅ Return just the board - field resolvers handle tiles/editors
        return BingoBoard.findByPk(newBingoBoard.id);
      } catch (error) {
        logger.error('Error creating BingoBoard:', error);
        throw new ApolloError('Failed to create BingoBoard');
      }
    },

    updateBingoBoard: async (_, { id, input }, context) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id);

        if (!bingoBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        // ✅ Use loader to check editors
        const editors = context.loaders
          ? await context.loaders.editorsByBoardId.load(id.toString())
          : (await BingoBoard.findByPk(id, { include: [{ model: User, as: 'editors' }] }))
              ?.editors || [];

        const isEditor = editors.some((editor) => editor.id === context.user?.id);
        const isAdmin = context.user?.admin;

        if (!isAdmin && !isEditor) {
          throw new ApolloError('Unauthorized to update this BingoBoard', 'UNAUTHORIZED');
        }

        const allowedFields = [
          'name',
          'category',
          'description',
          'isPublic',
          'team',
          'layout',
          'bonusSettings',
          'totalValue',
          'totalValueCompleted',
          'theme',
        ];
        allowedFields.forEach((key) => {
          if (key in input) {
            bingoBoard[key] = input[key];
          }
        });

        await bingoBoard.save();
        return bingoBoard;
      } catch (error) {
        logger.error('Error updating BingoBoard:', error);
        throw new ApolloError('Failed to update BingoBoard');
      }
    },

    replaceLayout: async (_, { boardId, newType }, context) => {
      try {
        const board = await BingoBoard.findByPk(boardId);

        if (!board) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        const size = newType === 'FIVE' ? 5 : 7;

        // Remove old tiles
        await BingoTile.destroy({ where: { board: boardId } });

        // Create new tiles
        const tiles = [];
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            tiles.push({
              name: `Tile ${row * size + col + 1}`,
              isComplete: false,
              value: 0,
              board: board.id,
            });
          }
        }
        const createdTiles = await BingoTile.bulkCreate(tiles, { returning: true });

        // Create new layout
        const layout = [];
        for (let row = 0; row < size; row++) {
          layout.push(createdTiles.slice(row * size, (row + 1) * size).map((tile) => tile.id));
        }

        board.layout = layout;
        board.type = newType;
        await board.save();

        // ✅ Return just the board - field resolvers handle tiles/editors
        return board;
      } catch (error) {
        logger.error('Error replacing BingoBoard layout:', error);
        throw new ApolloError('Failed to replace BingoBoard layout');
      }
    },

    duplicateBingoBoard: async (_, { boardId }, context) => {
      try {
        const originalBoard = await BingoBoard.findByPk(boardId);

        if (!originalBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        // ✅ Use loader for tiles
        const originalTiles = context.loaders
          ? await context.loaders.tilesByBoardId.load(boardId.toString())
          : await BingoTile.findAll({ where: { board: boardId } });

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
          createdAt: new Date().toISOString(),
          theme: originalBoard.theme,
        });

        const newTiles = originalTiles.map((tile) => ({
          icon: tile.icon?.startsWith('data:') ? null : tile.icon,
          name: tile.name,
          isComplete: false,
          value: tile.value,
          board: duplicatedBoard.id,
        }));

        const createdTiles = await BingoTile.bulkCreate(newTiles, { returning: true });

        const layout = [];
        for (let row of originalBoard.layout) {
          layout.push(
            row.map((tileId) => {
              const originalTile = originalTiles.find((tile) => tile.id === tileId);
              return createdTiles.find((newTile) => newTile.name === originalTile.name).id;
            })
          );
        }

        duplicatedBoard.layout = layout;
        await duplicatedBoard.save();
        await duplicatedBoard.addEditors([context.user.id]);

        // ✅ Return just the board - field resolvers handle tiles/editors
        return duplicatedBoard;
      } catch (error) {
        logger.error('Error duplicating BingoBoard:', error);
        throw new ApolloError('Failed to duplicate BingoBoard');
      }
    },

    deleteBingoBoard: async (_, { id }, context) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id);

        if (!bingoBoard) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        // ✅ Use loader to check editors
        const editors = context.loaders
          ? await context.loaders.editorsByBoardId.load(id.toString())
          : (await BingoBoard.findByPk(id, { include: [{ model: User, as: 'editors' }] }))
              ?.editors || [];

        const isEditor = editors.some((editor) => editor.id === context.user?.id);
        const isAdmin = context.user?.admin;

        if (!isAdmin && !isEditor) {
          throw new ApolloError('Unauthorized to delete this BingoBoard', 'UNAUTHORIZED');
        }

        await BingoTile.destroy({ where: { board: id } });
        await BingoBoard.destroy({ where: { id } });

        return { success: true, message: 'Bingo board deleted successfully' };
      } catch (error) {
        logger.error('Error deleting BingoBoard:', error);
        throw new ApolloError('Failed to delete BingoBoard');
      }
    },

    updateBoardEditors: async (_, { boardId, editorIds }, context) => {
      const board = await BingoBoard.findByPk(boardId);

      if (!board) {
        throw new Error('Board not found');
      }

      const boardOwnerId = board.userId;

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

      // ✅ Return just the board - field resolvers handle tiles/editors/user
      return BingoBoard.findByPk(boardId);
    },

    shuffleBingoBoardLayout: async (_, { boardId }, context) => {
      try {
        const board = await BingoBoard.findByPk(boardId);

        if (!board) {
          throw new ApolloError('BingoBoard not found', 'NOT_FOUND');
        }

        // ✅ Use loader to check editors
        const editors = context.loaders
          ? await context.loaders.editorsByBoardId.load(boardId.toString())
          : (await BingoBoard.findByPk(boardId, { include: [{ model: User, as: 'editors' }] }))
              ?.editors || [];

        const isEditor = editors.some((editor) => editor.id === context.user?.id);
        const isAdmin = context.user?.admin;

        if (!isAdmin && !isEditor) {
          throw new ApolloError('Unauthorized to shuffle this BingoBoard', 'UNAUTHORIZED');
        }

        // Flatten, shuffle, and reconstruct layout
        const flattenedLayout = board.layout.flat();
        const shuffledIds = flattenedLayout
          .map((id) => ({ id, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ id }) => id);

        const size = board.layout.length;
        const shuffledLayout = [];
        for (let i = 0; i < size; i++) {
          shuffledLayout.push(shuffledIds.slice(i * size, (i + 1) * size));
        }

        board.layout = shuffledLayout;
        await board.save();

        // ✅ Return just the board - field resolvers handle tiles
        return board;
      } catch (error) {
        console.error('Error shuffling BingoBoard layout:', error);
        throw new ApolloError('Failed to shuffle BingoBoard layout');
      }
    },
  },

  Query: {
    // ✅ SIMPLIFIED: No includes - field resolvers handle nested data
    getBingoBoard: async (_, { id }) => {
      try {
        const bingoBoard = await BingoBoard.findByPk(id);

        if (!bingoBoard) {
          return null;
        }

        return bingoBoard;
      } catch (error) {
        console.error('Error fetching BingoBoard:', error);
        throw new ApolloError('Failed to fetch BingoBoard');
      }
    },

    getPublicBoards: async (_, { limit, offset, category, searchQuery = '' }) => {
      try {
        const categoryFilter = category ? { category } : { category: { [Op.ne]: 'Featured' } };

        const totalCount = await BingoBoard.count({
          where: { isPublic: true, name: { [Op.iLike]: `%${searchQuery}%` }, ...categoryFilter },
        });

        // ✅ Minimal attributes - field resolvers can add tiles/editors if requested
        const boards = await BingoBoard.findAll({
          where: { isPublic: true, name: { [Op.iLike]: `%${searchQuery}%` }, ...categoryFilter },
          attributes: ['id', 'createdAt', 'category', 'name', 'layout', 'theme'],
          order: [['createdAt', 'DESC']],
          limit: limit || 10,
          offset: offset || 0,
        });

        return { boards: boards || [], totalCount };
      } catch (error) {
        console.error('Error fetching public boards:', error);
        throw new ApolloError('Failed to fetch public boards');
      }
    },

    getAllBoards: async (_, { limit, offset, category, searchQuery = '' }) => {
      try {
        const categoryFilter = category ? { category } : { category: { [Op.ne]: 'Featured' } };

        const totalCount = await BingoBoard.count({
          where: { name: { [Op.iLike]: `%${searchQuery}%` }, ...categoryFilter },
        });

        const boards = await BingoBoard.findAll({
          where: { name: { [Op.iLike]: `%${searchQuery}%` }, ...categoryFilter },
          attributes: ['id', 'createdAt', 'category', 'name', 'layout', 'theme', 'isPublic'],
          order: [['createdAt', 'DESC']],
          limit: limit || 10,
          offset: offset || 0,
        });

        return { boards: boards || [], totalCount };
      } catch (error) {
        console.error('Error fetching boards:', error);
        throw new ApolloError('Failed to fetch boards');
      }
    },

    getFeaturedBoards: async (_, { limit, offset }) => {
      try {
        const totalCount = await BingoBoard.count({
          where: { isPublic: true, category: 'Featured' },
        });

        const boards = await BingoBoard.findAll({
          where: { isPublic: true, category: 'Featured' },
          attributes: ['id', 'createdAt', 'category', 'name', 'layout', 'theme'],
          order: [['createdAt', 'DESC']],
          limit,
          offset,
        });

        return { boards: boards || [], totalCount };
      } catch (error) {
        console.error('Error fetching featured boards:', error);
        throw new ApolloError('Failed to fetch featured boards');
      }
    },
  },
};
