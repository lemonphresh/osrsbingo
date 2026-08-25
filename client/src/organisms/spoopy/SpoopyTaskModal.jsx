import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Box, Text, VStack, HStack, Heading, Badge,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS, TILE_META } from './spoopyTheme';
import { taskLine } from './SpoopyTaskCard';
import { MockDevButton } from './SpoopyStartModal';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.75)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={SPOOPY_COLORS.paper}
        color={SPOOPY_COLORS.paperInk}
        border="3px solid"
        borderColor={SPOOPY_COLORS.paperEdge}
        boxShadow={`0 20px 0 ${SPOOPY_COLORS.paperShadow}, 0 30px 60px rgba(0,0,0,0.55)`}
        backgroundImage="radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        transform="rotate(-0.4deg)"
      >
        <ModalCloseButton color={SPOOPY_COLORS.paperInk} />
        <ModalBody py={8} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading
                size="md"
                fontFamily={SPOOPY_FONTS.heading}
                letterSpacing="wider"
                color={meta.fillColor}
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
              bg={SPOOPY_COLORS.paperShadow}
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
              <Text fontFamily={SPOOPY_FONTS.hand} mb={1}>
                📸 submit from discord
              </Text>
              <Text fontSize="xs" opacity={0.85}>
                pre-screenshot baseline:{' '}
                <Text as="span" fontFamily="mono" color={SPOOPY_COLORS.pumpkinLight}>
                  !spoopypre {content.id}
                </Text>
              </Text>
              <Text fontSize="xs" opacity={0.85}>
                completion proof:{' '}
                <Text as="span" fontFamily="mono" color={SPOOPY_COLORS.pumpkinLight}>
                  !spoopysubmit {content.id}
                </Text>
              </Text>
              <Text fontSize="xs" opacity={0.6} mt={1}>
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
