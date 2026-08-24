import React, { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import SpoopyTile from './SpoopyTile';
import { SPOOPY_COLORS, CONNECTOR_COLOR } from './spoopyTheme';

// Renders the event board — a paper-Mario-ish sheet of paper laid over a
// night background. Tiles are positioned as CSS-Grid cells and stickers.
// Connectors, if the stored board includes a `cells` matrix, get rendered
// as little dashes between adjacent tiles.
//
// Props:
//   board           { dimensions: {rows, cols}, tiles: [], cells?: [][] }
//   teamState       { tiles: { [tileId]: { status, choice, ... } } }  — optional
//   onTileClick     fn(tileId) — called when an unlocked tile is clicked
//   cellSize        px, defaults 64
export default function SpoopyBoard({
  board,
  teamState = null,
  onTileClick,
  cellSize = 64,
}) {
  const dims = board?.dimensions ?? { rows: 0, cols: 0 };
  const tiles = board?.tiles ?? [];
  const cells = board?.cells ?? null;

  const statusById = useMemo(() => {
    const m = {};
    if (teamState?.tiles) {
      for (const [id, s] of Object.entries(teamState.tiles)) {
        m[id] = s?.status ?? 'locked';
      }
    }
    return m;
  }, [teamState]);

  return (
    <Box
      // The dusty-night "stage" around the paper
      p={{ base: 4, md: 8 }}
      bg={SPOOPY_COLORS.nightDeep}
      minHeight="100%"
      display="flex"
      justifyContent="center"
    >
      {/* The "sheet of paper" the board is drawn on */}
      <Box
        position="relative"
        p={{ base: 4, md: 6 }}
        bg={SPOOPY_COLORS.paper}
        borderRadius="lg"
        boxShadow={`0 20px 0 ${SPOOPY_COLORS.paperShadow}, 0 30px 40px rgba(0,0,0,0.55)`}
        // Very subtle paper grain
        backgroundImage="radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        maxWidth="fit-content"
        overflowX="auto"
      >
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${dims.cols}, ${cellSize}px)`}
          gridTemplateRows={`repeat(${dims.rows}, ${cellSize}px)`}
          gap="0px"
        >
          {/* Connector cells (visual-only) */}
          {cells &&
            cells.flatMap((row, r) =>
              row.map((cell, c) =>
                cell?.kind === 'connector' ? (
                  <ConnectorCell key={`conn-${r}-${c}`} row={r} col={c} />
                ) : null,
              ),
            )}

          {/* Real tiles as paper stickers */}
          {tiles.map((tile) => {
            const status = statusById[tile.id] ?? 'locked';
            return (
              <Box
                key={tile.id}
                gridColumn={tile.position.col + 1}
                gridRow={tile.position.row + 1}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <SpoopyTile
                  tileId={tile.id}
                  tileType={tile.tile_type}
                  status={status}
                  size={Math.floor(cellSize * 0.88)}
                  onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// A single connector "dash" — dot-in-a-cell so it reads as a trail between
// tiles without competing with the sticker treatments.
function ConnectorCell({ row, col }) {
  return (
    <Box
      gridColumn={col + 1}
      gridRow={row + 1}
      display="flex"
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
    >
      <Box
        width="14px"
        height="14px"
        borderRadius="full"
        bg={CONNECTOR_COLOR}
        opacity={0.55}
      />
    </Box>
  );
}
