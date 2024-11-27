import React from 'react';
import { Box, SimpleGrid } from '@chakra-ui/react';

const MiniBingoBoard = ({ grid }) => {
  const gridSize = grid.length;
  const tileSize = gridSize === 5 ? ['calc(20px * 0.8)', '20px'] : ['calc(14px * 0.8)', '14px'];

  return (
    <Box
      borderColor="gray.300"
      flexShrink={0}
      w={gridSize === 5 ? ['calc(100px * 0.8)', '100px'] : ['calc(98px * 0.8)', '98px']}
      h={gridSize === 5 ? ['calc(100px * 0.8)', '100px'] : ['calc(98px * 0.8)', '98px']}
    >
      <SimpleGrid columns={gridSize}>
        {grid.flat().map((tile) => (
          <Box
            key={tile.id}
            w={tileSize}
            h={tileSize}
            bg={tile.isComplete ? 'green.400' : 'blue.600'}
            borderRadius="2px"
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default MiniBingoBoard;
