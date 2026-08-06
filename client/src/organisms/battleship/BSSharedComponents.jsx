import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import BSGrid from './BSGrid';

export function SectionLabel({ children }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="10px"
      fontWeight="bold"
      color="#6b9e78"
      letterSpacing="widest"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

export function FieldLabel({ children }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="10px"
      fontWeight="bold"
      color="#6b9e78"
      letterSpacing="widest"
      textTransform="uppercase"
      mb={1}
    >
      {children}
    </Text>
  );
}

export function BoardPanel({
  title,
  tiles,
  showShips,
  onCellClick,
  canFire,
  highlightedCell,
  radarCell,
  colorblindMode,
}) {
  return (
    <Box
      bg="#091a10"
      border="1px solid"
      borderColor="#1a4028"
      borderRadius="md"
      p={[3, 4, 5]}
      display="flex"
      flexDirection="column"
      gap={3}
    >
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="bold"
        color="#6b9e78"
        letterSpacing="widest"
        textTransform="uppercase"
      >
        {title}
      </Text>
      <Box overflowX="auto">
        <BSGrid
          tiles={tiles}
          showShips={showShips}
          onCellClick={onCellClick}
          canFire={canFire}
          highlightedCell={highlightedCell}
          radarCell={radarCell}
          colorblindMode={colorblindMode}
        />
      </Box>
    </Box>
  );
}
