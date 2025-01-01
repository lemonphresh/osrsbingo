import React from 'react';
import { DndProvider } from 'react-dnd';
import { Flex } from '@chakra-ui/react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import BingoTileWrapper from '../atoms/BingoTileWrapper';

const BingoBoard = ({ layout, completedPatterns, isEditor, themeName, onTileSwap }) => (
  <DndProvider backend={HTML5Backend}>
    {layout.map((row, rowIndex) => (
      <Flex key={rowIndex} position="relative">
        {row.map((tile, colIndex) => (
          <BingoTileWrapper
            key={tile.id}
            tile={tile}
            rowIndex={rowIndex}
            colIndex={colIndex}
            onTileSwap={onTileSwap}
            completedPatterns={completedPatterns}
            isEditor={isEditor}
            themeName={themeName}
          />
        ))}
      </Flex>
    ))}
  </DndProvider>
);

export default BingoBoard;
