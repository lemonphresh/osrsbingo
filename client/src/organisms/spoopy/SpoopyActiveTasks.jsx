import React from 'react';
import { Box, Heading, HStack, SimpleGrid, Text, VStack, Badge } from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS, TILE_META } from './spoopyTheme';
import { taskLine } from './SpoopyTaskCard';
import { useSpoopyTheme } from './useSpoopyTheme';

// Panel that lives *below* the board on /spoopy-event and lists every tile
// currently in play (unlocked or awaiting review) with a progress bar. Gives
// the team a scannable "what's on our plate right now" view without having
// to hunt across the board for each tile.
//
// Props:
//   event         the full event (for board.tiles + contentById)
//   teamState     team board state ({ tiles: { [id]: { status, progress, choice, ... } } })
//   onTileClick   fn(tileId) — same handler the board uses so clicking a
//                 task card opens the same tile detail modal
export default function SpoopyActiveTasks({ event, teamState, onTileClick }) {
  const { surfaceBg, surfaceInk, surfaceEdge, surfaceRecessed } = useSpoopyTheme();

  // Build the list of active-task entries. A tile qualifies if:
  //   - team state has it as `unlocked` or `submitted`
  //   - it has a resolvable task (house tiles need a locked-in choice)
  // Ordered by row then col so the visual order maps to top-down board order.
  const entries = [];
  const boardTiles = event?.board?.tiles ?? [];
  const contentById = event?.contentById ?? {};
  const tileStates = teamState?.tiles ?? {};
  const sorted = [...boardTiles].sort((a, b) => {
    if (a.position.row !== b.position.row) return a.position.row - b.position.row;
    return a.position.col - b.position.col;
  });
  for (const tile of sorted) {
    const state = tileStates[tile.id];
    const status = state?.status;
    if (status !== 'unlocked' && status !== 'submitted') continue;
    // The candybag / spooky castle has its own dedicated modal + gauntlet
    // flow; it doesn't belong in the routine active-tasks scan.
    if (tile.tile_type === 'candybag') continue;
    const content = contentById[tile.id];
    let task = null;
    if (tile.tile_type === 'house') {
      const choice = state?.choice;
      task = choice ? content?.dialog?.options?.[choice]?.task ?? null : null;
    } else {
      task = content?.task ?? null;
    }
    entries.push({
      tileId: tile.id,
      tileType: tile.tile_type,
      status,
      progress: Math.max(0, Math.min(100, state?.progress ?? 0)),
      task,
      needsHouseChoice: tile.tile_type === 'house' && !state?.choice,
      position: tile.position,
    });
  }

  if (entries.length === 0) {
    return (
      <Box
        py={8}
        px={{ base: 4, md: 8 }}
        bg={SPOOPY_COLORS.nightDeep}
        color={surfaceInk}
        borderTop="1px solid"
        borderColor={SPOOPY_COLORS.nightMist}
      >
        <VStack maxW="800px" mx="auto" spacing={2} textAlign="center">
          <Heading
            size="md"
            fontFamily={SPOOPY_FONTS.heading}
            color={SPOOPY_COLORS.pumpkinLight}
            letterSpacing="wider"
          >
            active tasks
          </Heading>
          <Text opacity={0.7} fontFamily={SPOOPY_FONTS.hand}>
            nothing on your plate right now — go trick-or-treating 🎃
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      py={8}
      px={{ base: 4, md: 8 }}
      bg={SPOOPY_COLORS.nightDeep}
      color={surfaceInk}
      borderTop="1px solid"
      borderColor={SPOOPY_COLORS.nightMist}
    >
      <VStack maxW="1080px" mx="auto" align="stretch" spacing={4}>
        <HStack justify="space-between" align="baseline">
          <Heading
            size="md"
            fontFamily={SPOOPY_FONTS.heading}
            color={SPOOPY_COLORS.pumpkinLight}
            letterSpacing="wider"
          >
            active tasks
          </Heading>
          <Text fontSize="xs" opacity={0.6} fontFamily={SPOOPY_FONTS.hand}>
            {entries.length} in play
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {entries.map((entry) => (
            <ActiveTaskCard
              key={entry.tileId}
              entry={entry}
              onClick={onTileClick}
              surfaceBg={surfaceBg}
              surfaceInk={surfaceInk}
              surfaceEdge={surfaceEdge}
              surfaceRecessed={surfaceRecessed}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}

function ActiveTaskCard({ entry, onClick, surfaceBg, surfaceInk, surfaceEdge, surfaceRecessed }) {
  const meta = TILE_META[entry.tileType] ?? TILE_META.house;
  const positionLabel = entry.position
    ? `r${entry.position.row}-c${entry.position.col}`
    : entry.tileId;

  const statusMeta =
    entry.status === 'submitted'
      ? { label: 'awaiting review', bg: SPOOPY_COLORS.purpleLight }
      : { label: 'active', bg: SPOOPY_COLORS.pumpkin };

  const done = entry.progress >= 100;

  return (
    <Box
      as="button"
      onClick={onClick ? () => onClick(entry.tileId) : undefined}
      bg={surfaceBg}
      color={surfaceInk}
      border="2px solid"
      borderColor={surfaceEdge}
      borderRadius="md"
      textAlign="left"
      p={3}
      cursor={onClick ? 'pointer' : 'default'}
      transition="transform 120ms ease-out, border-color 120ms ease-out"
      _hover={onClick ? { transform: 'translateY(-1px)', borderColor: SPOOPY_COLORS.pumpkin } : undefined}
      _active={onClick ? { transform: 'translateY(1px)' } : undefined}
    >
      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between" align="center">
          <HStack spacing={2} minW={0}>
            <Text
              fontSize="10px"
              fontFamily="mono"
              color={SPOOPY_COLORS.pumpkinLight}
              fontWeight="bold"
              letterSpacing="wider"
              flexShrink={0}
            >
              {positionLabel}
            </Text>
            <Text
              fontFamily={SPOOPY_FONTS.hand}
              fontSize="sm"
              noOfLines={1}
            >
              {meta.label}
            </Text>
          </HStack>
          <Badge
            bg={statusMeta.bg}
            color={SPOOPY_COLORS.paper}
            fontFamily={SPOOPY_FONTS.hand}
            textTransform="lowercase"
            fontSize="10px"
          >
            {statusMeta.label}
          </Badge>
        </HStack>

        <Box
          bg={surfaceRecessed}
          color={surfaceInk}
          borderRadius="sm"
          px={3}
          py={2}
          fontFamily={SPOOPY_FONTS.hand}
          fontSize="sm"
          minH="36px"
        >
          {entry.needsHouseChoice
            ? 'trick or treat? pick an option to reveal the task.'
            : entry.task
            ? taskLine(entry.task)
            : '—'}
        </Box>

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text
              fontSize="10px"
              textTransform="uppercase"
              letterSpacing="wider"
              opacity={0.7}
              fontWeight="semibold"
            >
              progress
            </Text>
            <Text fontSize="10px" fontWeight="bold" color={done ? SPOOPY_COLORS.green : SPOOPY_COLORS.pumpkinLight}>
              {entry.progress}%
            </Text>
          </HStack>
          <Box h="6px" bg={SPOOPY_COLORS.nightMist} borderRadius="full" overflow="hidden">
            <Box
              h="100%"
              width={`${entry.progress}%`}
              bg={done ? SPOOPY_COLORS.green : SPOOPY_COLORS.pumpkin}
              transition="width 200ms ease-out"
            />
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
