import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Box, Text, VStack, HStack, Heading, Badge,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS, TILE_META } from './spoopyTheme';
import { useSpoopyTheme } from './useSpoopyTheme';
import { taskLine } from './SpoopyTaskCard';
import { MockDevButton } from './SpoopyStartModal';
import SpoopyCommandCopy from './SpoopyCommandCopy';

// Read-only team-facing modal for a non-house tile: shows the task, current
// progress (0-100% bar), status, and the discord submission commands. All
// interactions happen via the Discord bot — this modal is just informational
// (matches battleship's pattern where the team sees data but acts on Discord).
//
// Props:
//   isOpen, onClose
//   content     tile content object from event.contentById[tileId]
//   tileState   team state for this tile { status, progress, ... } from teamBoard
//   tileType    'pumpkin' | 'grave' | 'ghost' | 'black-cat' — used for header
export default function SpoopyTaskModal({
  isOpen,
  onClose,
  content,
  tileState,
  tileType,
  onMockSubmit,
  mockSubmitting = false,
}) {
  // Hooks have to be declared before any early-return branch — React
  // requires the same hook-call order on every render.
  const { darkMode, surfaceBg, surfaceInk, surfaceEdge, surfaceRecessed } = useSpoopyTheme();
  if (!content) return null;

  const meta = TILE_META[tileType] ?? TILE_META.house;
  const progress = Math.max(0, Math.min(100, tileState?.progress ?? 0));
  const status = tileState?.status ?? 'locked';
  const statusMeta = {
    locked:    { label: 'locked',    bg: SPOOPY_COLORS.nightMist },
    unlocked:  { label: 'active',    bg: SPOOPY_COLORS.pumpkin },
    submitted: { label: 'awaiting review', bg: SPOOPY_COLORS.purpleLight },
    complete:  { label: 'complete',  bg: SPOOPY_COLORS.green },
  }[status] ?? { label: status, bg: SPOOPY_COLORS.nightMist };
  const done = progress >= 100 || status === 'complete';
  // TILE_META.fillColor is designed for light-mode paper (dark ink on cream).
  // On the dark nightmist surface it disappears, so swap to a warm pumpkin
  // tone that stays legible while keeping the halloween palette.
  const headingColor = darkMode ? SPOOPY_COLORS.pumpkinLight : meta.fillColor;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.75)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={surfaceBg}
        color={surfaceInk}
        border="3px solid"
        borderColor={surfaceEdge}
        boxShadow={`0 20px 0 ${surfaceRecessed}, 0 30px 60px rgba(0,0,0,0.55)`}
        backgroundImage="radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        transform="rotate(-0.4deg)"
      >
        <ModalCloseButton color={surfaceInk} />
        <ModalBody py={8} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading
                size="md"
                fontFamily={SPOOPY_FONTS.heading}
                letterSpacing="wider"
                color={headingColor}
              >
                {meta.label}
              </Heading>
              <Badge
                bg={statusMeta.bg}
                color={SPOOPY_COLORS.paper}
                fontFamily={SPOOPY_FONTS.hand}
                textTransform="lowercase"
              >
                {statusMeta.label}
              </Badge>
            </HStack>

            {content.flavor_text && (
              <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md" fontStyle="italic" opacity={0.85}>
                {content.flavor_text}
              </Text>
            )}

            <Box
              bg={surfaceRecessed}
              color={darkMode ? SPOOPY_COLORS.paper : SPOOPY_COLORS.paperInk}
              borderLeft="4px solid"
              borderColor={SPOOPY_COLORS.pumpkin}
              p={4}
              borderRadius="md"
            >
              <Text
                fontSize="xs"
                opacity={0.7}
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                the task
              </Text>
              <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg">
                {taskLine(content.task)}
              </Text>
            </Box>

            {/* Progress bar — updated live by refs from /spoopy-event/refs */}
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  opacity={0.7}
                  fontWeight="semibold"
                >
                  progress
                </Text>
                <Text fontSize="sm" fontWeight="bold" color={done ? SPOOPY_COLORS.green : SPOOPY_COLORS.pumpkinDeep}>
                  {progress}%
                </Text>
              </HStack>
              <Box h="8px" bg={SPOOPY_COLORS.paperEdge} borderRadius="full" overflow="hidden">
                <Box
                  h="100%"
                  w={`${progress}%`}
                  bg={done ? SPOOPY_COLORS.green : SPOOPY_COLORS.pumpkin}
                  transition="width 0.4s ease"
                />
              </Box>
            </Box>

            <Box
              bg={SPOOPY_COLORS.night}
              color={SPOOPY_COLORS.paper}
              p={3}
              borderRadius="md"
              fontSize="sm"
              opacity={0.9}
            >
              <Text fontFamily={SPOOPY_FONTS.hand} mb={2}>
                📸 submit from discord
              </Text>
              <VStack align="stretch" spacing={2}>
                <Box>
                  <Text
                    fontSize="10px"
                    opacity={0.7}
                    mb={1}
                    letterSpacing="wider"
                    textTransform="uppercase"
                  >
                    pre-screenshot baseline
                  </Text>
                  <SpoopyCommandCopy command={`!spoopypre ${content.id}`} size="sm" />
                </Box>
                <Box>
                  <Text
                    fontSize="10px"
                    opacity={0.7}
                    mb={1}
                    letterSpacing="wider"
                    textTransform="uppercase"
                  >
                    completion proof
                  </Text>
                  <SpoopyCommandCopy command={`!spoopysubmit ${content.id}`} size="sm" />
                </Box>
              </VStack>
              <Text fontSize="xs" opacity={0.6} mt={2}>
                include the event password visible in your screenshot.
              </Text>
            </Box>

            {onMockSubmit && (
              <MockDevButton onClick={onMockSubmit} loading={mockSubmitting} />
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
