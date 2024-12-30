import { Flex } from '@chakra-ui/react';
import React from 'react';
import BingoTile from '../organisms/BingoTile';

const BingoBoard = ({ completedPatterns, isEditor, layout, themeName }) => {
  return (
    layout &&
    layout.map((row, rowIndex) => (
      <Flex key={rowIndex}>
        {row.map((tile, colIndex) => (
          <BingoTile
            colIndex={colIndex}
            completedPatterns={completedPatterns}
            isEditor={isEditor}
            key={rowIndex + colIndex}
            tile={tile}
            themeName={themeName}
          />
        ))}
      </Flex>
    ))
  );
};

export default BingoBoard;
