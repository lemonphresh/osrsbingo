import React from 'react';
import { Box, SimpleGrid } from '@chakra-ui/react';
import useBingoTileTheme from '../hooks/useBingoTileTheme';

const MiniBingoBoard = ({ grid, themeName = 'DEFAULT', boardPx }) => {
  const gridSize = grid?.length;
  const { backgroundColor, completeBackgroundColor } = useBingoTileTheme(themeName);

  const defaultBoardPx =
    gridSize === 5 ? ['calc(100px * 0.8)', '100px'] : ['calc(98px * 0.8)', '98px'];
  const defaultTilePx =
    gridSize === 5 ? ['calc(20px * 0.8)', '20px'] : ['calc(14px * 0.8)', '14px'];

  const toPx = (v) => (typeof v === 'number' ? `${v}px` : v);
  const toTile = (v) => `calc(${toPx(v)} / ${gridSize})`;

  const boardSize = boardPx ?? defaultBoardPx;
  const tileSize = boardPx
    ? Array.isArray(boardPx)
      ? boardPx.map(toTile)
      : toTile(boardPx)
    : defaultTilePx;

  return (
    <Box borderColor="gray.300" flexShrink={0} w={boardSize} h={boardSize}>
      <SimpleGrid columns={gridSize}>
        {grid.flat().map((tile) => (
          <Box
            key={tile.id}
            w={tileSize}
            h={tileSize}
            bg={tile.isComplete ? completeBackgroundColor : backgroundColor}
            borderRadius="2px"
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default MiniBingoBoard;
