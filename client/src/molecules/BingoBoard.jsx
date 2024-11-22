import { Flex } from '@chakra-ui/react';
import React from 'react';
import BingoTile from '../organisms/BingoTile';

const BingoBoard = ({ isEditor, layout }) => {
  return layout.map((row, rowIndex) => (
    <Flex key={rowIndex}>
      {row.map((tile, colIndex) => (
        <BingoTile colIndex={colIndex} isEditor={isEditor} key={colIndex + tile.name} tile={tile} />
      ))}
    </Flex>
  ));
};

export default BingoBoard;
