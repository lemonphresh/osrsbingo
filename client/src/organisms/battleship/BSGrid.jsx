import React from 'react';
import { Box, Text, HStack, VStack } from '@chakra-ui/react';

// ── Constants ─────────────────────────────────────────────────────────────

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_COUNT = 10;
const COL_COUNT = 10;

const CELL_BG = {
  ocean:    '#060f0a', // unrevealed
  ship:     '#1a4028', // own ship, unrevealed
  miss:     '#2d3748', // shot ocean
  hit:      '#c0392b', // shot ship, task pending
  hit_done: '#1a6b3c', // shot ship, task completed
};

const CELL_BG_CB = {
  ...CELL_BG,
  hit:      '#c2700a', // amber
  hit_done: '#1a55c8', // blue
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getCellState(tile, showShips) {
  if (!tile) return 'ocean';
  if (tile.isShot) {
    if (!tile.shipType) return 'miss';
    return (tile.taskCompleted || tile.skipped) ? 'hit_done' : 'hit';
  }
  if (showShips && tile.shipType) return 'ship';
  return 'ocean';
}

function getCellBg(state, cb) {
  const palette = cb ? CELL_BG_CB : CELL_BG;
  return palette[state] ?? palette.ocean;
}

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
      w="28px"
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
      color="#9ca3af"
      lineHeight="1"
      userSelect="none"
    >
      X
    </Text>
  );
}

function GridCell({ tile, row, col, showShips, isHighlighted, isRadar, canFire, onCellClick, colorblindMode }) {
  const state = getCellState(tile, showShips);
  const bg = getCellBg(state, colorblindMode);
  const isClickable = !!onCellClick && canFire && state === 'ocean';

  const handleClick = () => {
    if (isClickable) onCellClick(row, col);
  };

  let borderColor = '#1a4028';
  if (isHighlighted && canFire) borderColor = '#22c55e';
  if (state === 'hit')      borderColor = colorblindMode ? '#f59e0b' : '#e74c3c';
  if (state === 'hit_done') borderColor = colorblindMode ? '#60a5fa' : '#27ae60';
  if (state === 'miss')     borderColor = '#4b5563';
  if (isRadar) borderColor = '#f97316';

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
      boxShadow={isHighlighted && canFire ? '0 0 0 1px #22c55e inset' : 'none'}
      transition="background 0.1s, border-color 0.1s"
      position="relative"
      zIndex={isRadar ? 1 : undefined}
      _hover={isClickable ? { bg: '#091a10', borderColor: '#4ade80' } : {}}
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

function LegendDot({ color, label, borderColor, children }) {
  return (
    <HStack spacing={1} align="center">
      <Box
        w="10px"
        h="10px"
        bg={color}
        border="1px solid"
        borderColor={borderColor ?? '#1a4028'}
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {children}
      </Box>
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
  colorblindMode = false,
}) {
  const tileMap = buildTileMap(tiles);
  const palette = colorblindMode ? CELL_BG_CB : CELL_BG;

  return (
    <VStack spacing={0} align="flex-start">
      {/* Column headers */}
      <HStack spacing={0} pl="28px">
        {COL_LABELS.map((label) => (
          <GridLabel key={label} isHeader>{label}</GridLabel>
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
                colorblindMode={colorblindMode}
              />
            );
          })}
        </HStack>
      ))}

      {/* Legend */}
      <VStack spacing={1} pt={3} align="flex-start">
        <HStack spacing={3} flexWrap="wrap">
          <LegendDot color={palette.ocean} label="Ocean" />
          <LegendDot color={palette.miss} label="Miss" borderColor="#4b5563">
            <Text fontFamily="mono" fontSize="7px" color="#9ca3af" lineHeight="1" userSelect="none">x</Text>
          </LegendDot>
          <LegendDot color={palette.hit} label={colorblindMode ? 'Hit (amber)' : 'Hit'} borderColor={colorblindMode ? '#f59e0b' : '#e74c3c'} />
          <LegendDot color={palette.hit_done} label={colorblindMode ? 'Hit done (blue)' : 'Hit done'} borderColor={colorblindMode ? '#60a5fa' : '#27ae60'} />
          {showShips && <LegendDot color={palette.ship} label="Ship" />}
        </HStack>
        <HStack spacing={1} flexWrap="wrap">
          <Text fontFamily="mono" fontSize="10px" color="#475569" letterSpacing="wide" mr={1}>
            Radar:
          </Text>
          <LegendDot color={palette.miss} label="ocean" borderColor="#f97316" />
          <LegendDot color={palette.hit} label={colorblindMode ? 'ship (amber)' : 'ship'} borderColor="#f97316" />
        </HStack>
      </VStack>
    </VStack>
  );
}
