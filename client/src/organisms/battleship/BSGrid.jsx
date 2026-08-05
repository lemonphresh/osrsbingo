import React from 'react';
import { Box, Grid, Text, HStack, VStack } from '@chakra-ui/react';

// ── Constants ─────────────────────────────────────────────────────────────

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_COUNT = 10;
const COL_COUNT = 10;

const CELL_BG = {
  ocean: '#060f0a',
  ship: '#1a4028',
  miss: '#6b9e78',
  hit: '#c0392b',
  done: '#1a6b3c',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getCellState(tile, showShips) {
  if (!tile) return 'ocean';
  if (tile.isShot) {
    if (!tile.shipType) return 'miss';
    if (tile.taskCompleted || tile.skipped) return 'done';
    return 'hit';
  }
  if (showShips && tile.shipType) return 'ship';
  return 'ocean';
}

function getCellBg(state) {
  return CELL_BG[state] ?? CELL_BG.ocean;
}

// Build a lookup map from "row-col" to tile object for O(1) access
function buildTileMap(tiles) {
  const map = {};
  if (!tiles) return map;
  for (const tile of tiles) {
    map[`${tile.row}-${tile.col}`] = tile;
  }
  return map;
}

// ── Sub-components ────────────────────────────────────────────────────────

function GridLabel({ children, isHeader }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      w={isHeader ? '28px' : '28px'}
      h={isHeader ? '20px' : '28px'}
      flexShrink={0}
    >
      <Text
        fontFamily="mono"
        fontSize="10px"
        fontWeight="bold"
        color="#6b9e78"
        letterSpacing="wider"
        textTransform="uppercase"
      >
        {children}
      </Text>
    </Box>
  );
}

function MissX() {
  return (
    <Text
      fontFamily="mono"
      fontSize="13px"
      fontWeight="bold"
      color="#4a5568"
      lineHeight="1"
      userSelect="none"
    >
      X
    </Text>
  );
}

function GridCell({ tile, row, col, showShips, isHighlighted, isRadar, canFire, onCellClick }) {
  const state = getCellState(tile, showShips);
  const bg = getCellBg(state);
  const isClickable = !!onCellClick && canFire && state === 'ocean';

  const handleClick = () => {
    if (isClickable) onCellClick(row, col);
  };

  let borderColor = '#1a4028';
  if (isHighlighted && canFire) borderColor = '#22c55e';
  if (state === 'hit') borderColor = '#e74c3c';
  if (state === 'done') borderColor = '#27ae60';
  if (isRadar) borderColor = '#f97316';

  let boxShadow = 'none';
  if (isHighlighted && canFire) boxShadow = '0 0 0 1px #22c55e inset';

  return (
    <Box
      w="28px"
      h="28px"
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor={isClickable ? 'crosshair' : 'default'}
      onClick={handleClick}
      boxShadow={boxShadow}
      transition="background 0.1s, border-color 0.1s"
      position="relative"
      zIndex={isRadar ? 1 : undefined}
      _hover={
        isClickable
          ? { bg: '#091a10', borderColor: '#4ade80' }
          : {}
      }
      title={`${COL_LABELS[col]}${row + 1}`}
      sx={isRadar ? {
        '@keyframes radarPulse': {
          '0%,100%': { boxShadow: '0 0 6px 3px rgba(249,115,22,0.8)', borderColor: '#f97316' },
          '50%': { boxShadow: '0 0 14px 6px rgba(249,115,22,0.2)', borderColor: '#fb923c' },
        },
        animation: 'radarPulse 1.4s ease-in-out infinite',
      } : undefined}
    >
      {state === 'miss' && <MissX />}
    </Box>
  );
}

function LegendDot({ color, label }) {
  return (
    <HStack spacing={1} align="center">
      <Box w="10px" h="10px" bg={color} border="1px solid #1a4028" flexShrink={0} />
      <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wide">
        {label}
      </Text>
    </HStack>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────

export default function BSGrid({
  tiles = [],
  showShips = false,
  onCellClick,
  canFire = false,
  highlightedCell,
  radarCell,
}) {
  const tileMap = buildTileMap(tiles);

  return (
    <VStack spacing={0} align="flex-start">
      {/* Column headers */}
      <HStack spacing={0} pl="28px">
        {COL_LABELS.map((label) => (
          <GridLabel key={label} isHeader>
            {label}
          </GridLabel>
        ))}
      </HStack>

      {/* Grid rows */}
      {Array.from({ length: ROW_COUNT }, (_, rowIdx) => (
        <HStack key={rowIdx} spacing={0}>
          <GridLabel>{rowIdx + 1}</GridLabel>
          {Array.from({ length: COL_COUNT }, (_, colIdx) => {
            const tile = tileMap[`${rowIdx}-${colIdx}`];
            const isHighlighted =
              highlightedCell &&
              highlightedCell.row === rowIdx &&
              highlightedCell.col === colIdx;
            const isRadar =
              radarCell &&
              radarCell.row === rowIdx &&
              radarCell.col === colIdx;
            return (
              <GridCell
                key={colIdx}
                tile={tile}
                row={rowIdx}
                col={colIdx}
                showShips={showShips}
                isHighlighted={isHighlighted}
                isRadar={isRadar}
                canFire={canFire}
                onCellClick={onCellClick}
              />
            );
          })}
        </HStack>
      ))}

      {/* Legend */}
      <HStack spacing={3} pt={3} flexWrap="wrap">
        <LegendDot color={CELL_BG.ocean} label="Ocean" />
        <LegendDot color={CELL_BG.miss} label="Miss" />
        <LegendDot color={CELL_BG.hit} label="Hit" />
        <LegendDot color={CELL_BG.done} label="Completed" />
        {showShips && <LegendDot color={CELL_BG.ship} label="Ship" />}
      </HStack>
    </VStack>
  );
}
