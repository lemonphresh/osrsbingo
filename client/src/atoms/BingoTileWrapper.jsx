import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Box } from '@chakra-ui/react';
import BingoTile from '../organisms/BingoTile';

const TILE_TYPE = 'BINGO_TILE';

const BingoTileWrapper = ({
  tile,
  rowIndex,
  colIndex,
  onTileSwap,
  completedPatterns,
  isEditor,
  themeName,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [draggedOver, setDraggedOver] = useState(false);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: TILE_TYPE,
      item: { id: tile.id, row: rowIndex, col: colIndex },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [isEditor]
  );

  const [, drop] = useDrop({
    accept: TILE_TYPE,
    hover: () => {
      if (isEditor) {
        setDraggedOver(true);
        setTimeout(() => setDraggedOver(false), 300);
      }
    },
    drop: (draggedItem) => {
      setIsOver(false);
      if (isEditor && (draggedItem.row !== rowIndex || draggedItem.col !== colIndex)) {
        onTileSwap(
          { row: draggedItem.row, col: draggedItem.col },
          { row: rowIndex, col: colIndex }
        );
      }
    },
    collect: (monitor) => {
      setIsOver(monitor.isOver());
    },
  });

  return (
    <Box
      backgroundColor={isOver && isEditor ? 'rgba(255,255,255, 0.7)' : 'transparent'}
      borderRadius={isOver && isEditor ? ['6px', '16px'] : ['8px', '12px']}
      boxShadow={isOver && isEditor ? '0px 0px 10px 2px  rgba(255,255,255, 0.7)' : 'none'}
      opacity={isDragging ? 0.5 : 1}
      ref={(node) => {
        if (isEditor) {
          drag(drop(node));
        } else {
          drop(node);
        }
      }}
      transform={draggedOver ? 'scale(1.1)' : 'scale(1)'}
      transition="all 0.3s ease"
    >
      <BingoTile
        colIndex={colIndex}
        completedPatterns={completedPatterns}
        isEditor={isEditor}
        themeName={themeName}
        tile={tile}
      />
    </Box>
  );
};

export default BingoTileWrapper;
