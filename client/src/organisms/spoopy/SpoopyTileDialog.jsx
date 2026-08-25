import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import { useSpoopyTheme } from './useSpoopyTheme';
import { MockDevButton, MockDevChoiceButtons } from './SpoopyStartModal';
import SpoopyCommandCopy from './SpoopyCommandCopy';

// Trick-or-treat dialog for a house tile. Renders the prompt + two options
// (labels only — outcomes are hidden until choice is locked, per the
// "no take-backsies" rule).
//
// The options are *not* clickable — the choice is always locked in via the
// Discord bot so the whole team can debate together before committing.
// The DiscordChoiceHint below spells out the commands.
//
// If `choiceMade` is set (the team already picked from Discord), the dialog
// shows the resolved task instead (via `resolvedTaskNode`). This lets us
// keep the dialog open post-choice while the team works on the task.
//
// Props:
//   isOpen, onClose
//   dialog          { prompt, options: { a: { label, ... }, b: { label, ... } } }
//   choiceMade      null | 'a' | 'b'
//   resolvedTaskNode  ReactNode — usually a <SpoopyTaskCard />
//   tileId          the tile's id — used to render tile-specific discord commands
export default function SpoopyTileDialog({
  isOpen,
  onClose,
  dialog,
  choiceMade = null,
  resolvedTaskNode = null,
  tileId = null,
  onMockSubmit = null,
  mockSubmitting = false,
  onMockChoose = null,
  mockChoosingLetter = null,
}) {
  const options = dialog?.options ?? {};
  const chosenOption = choiceMade ? options[choiceMade] : null;
  const { surfaceBg, surfaceInk, surfaceEdge, surfaceRecessed } = useSpoopyTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.75)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={surfaceBg}
        color={surfaceInk}
        border="3px solid"
        borderColor={surfaceEdge}
        boxShadow={`0 20px 0 ${surfaceRecessed}, 0 30px 60px rgba(0,0,0,0.6)`}
        backgroundImage="radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        transform="rotate(-0.5deg)"
      >
        <ModalCloseButton color={surfaceInk} />
        <ModalBody py={8} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            <Heading
              size="md"
              fontFamily={SPOOPY_FONTS.heading}
              color={SPOOPY_COLORS.pumpkinDeep}
              letterSpacing="wider"
              textAlign="center"
            >
              🎃 trick or treat
            </Heading>

            <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" lineHeight={1.5}>
              {dialog?.prompt}
            </Text>

            {!choiceMade ? (
              <VStack spacing={3} align="stretch" pt={2}>
                <OptionCard label={options.a?.label} optionLetter="a" />
                <OptionCard label={options.b?.label} optionLetter="b" />
                <Text fontSize="xs" opacity={0.65} textAlign="center" pt={1}>
                  once you pick, there's no take-backsies
                </Text>
                {tileId && <DiscordChoiceHint tileId={tileId} />}
                {onMockChoose && (
                  <MockDevChoiceButtons
                    onChoose={onMockChoose}
                    loading={Boolean(mockChoosingLetter)}
                    disabledLetter={mockChoosingLetter}
                  />
                )}
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch" pt={1}>
                <Box
                  bg={surfaceRecessed}
                  color={surfaceInk}
                  p={3}
                  borderRadius="md"
                  opacity={0.9}
                >
                  <HStack spacing={2} mb={1}>
                    <Badge
                      bg={SPOOPY_COLORS.night}
                      color={SPOOPY_COLORS.paper}
                      textTransform="lowercase"
                    >
                      option {choiceMade}
                    </Badge>
                    <OutcomeBadge outcome={chosenOption?.outcome} />
                  </HStack>
                  <Text fontFamily={SPOOPY_FONTS.hand}>{chosenOption?.label}</Text>
                </Box>
                {resolvedTaskNode}
                {tileId && <DiscordSubmitHint tileId={tileId} />}
                {onMockSubmit && <MockDevButton onClick={onMockSubmit} loading={mockSubmitting} />}
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// Read-only option display. The team commits their choice through Discord —
// see DiscordChoiceHint for the commands. Keeps the paper-sticker card look
// but drops the hover-lift / press-down so it doesn't read as a button.
function OptionCard({ label, optionLetter }) {
  return (
    <Box
      py={4}
      px={4}
      bg={SPOOPY_COLORS.paper}
      color={SPOOPY_COLORS.paperInk}
      border="2px solid"
      borderColor={SPOOPY_COLORS.paperEdge}
      borderRadius="md"
      boxShadow="0 3px 0 rgba(0,0,0,0.12)"
    >
      <HStack align="start" spacing={3} width="100%">
        <Badge
          bg={SPOOPY_COLORS.pumpkin}
          color={SPOOPY_COLORS.paper}
          fontSize="md"
          px={2}
          py={0.5}
          borderRadius="md"
          fontFamily={SPOOPY_FONTS.hand}
        >
          {optionLetter}
        </Badge>
        <Text fontFamily={SPOOPY_FONTS.hand} fontWeight="500">
          {label}
        </Text>
      </HStack>
    </Box>
  );
}

function OutcomeBadge({ outcome }) {
  if (outcome !== 'trick' && outcome !== 'treat') return null;
  const isTreat = outcome === 'treat';
  return (
    <Badge
      bg={isTreat ? SPOOPY_COLORS.green : SPOOPY_COLORS.ember}
      color={SPOOPY_COLORS.paper}
      textTransform="lowercase"
    >
      {isTreat ? '🍬 treat' : '👻 trick'}
    </Badge>
  );
}

// Rendered under the option cards when no choice is locked yet — the only
// way to actually commit a choice. Encourages team-wide discussion so the
// pick isn't made by whoever happened to click first.
function DiscordChoiceHint({ tileId }) {
  return (
    <Box
      bg={SPOOPY_COLORS.night}
      color={SPOOPY_COLORS.paper}
      p={3}
      borderRadius="md"
      fontSize="sm"
      mt={1}
    >
      <Text fontFamily={SPOOPY_FONTS.hand} mb={2}>
        discuss with the gang which option to pick, and send your choice via discord with one of
        these commands:
      </Text>
      <VStack align="stretch" spacing={2}>
        <Box>
          <Text fontSize="10px" opacity={0.7} mb={1} letterSpacing="wider" textTransform="uppercase">
            option A
          </Text>
          <SpoopyCommandCopy command={`!spoopya ${tileId}`} size="sm" />
        </Box>
        <Box>
          <Text fontSize="10px" opacity={0.7} mb={1} letterSpacing="wider" textTransform="uppercase">
            option B
          </Text>
          <SpoopyCommandCopy command={`!spoopyb ${tileId}`} size="sm" />
        </Box>
      </VStack>
    </Box>
  );
}

// Rendered post-choice — the team knows the task, needs to submit proof.
function DiscordSubmitHint({ tileId }) {
  return (
    <Box
      bg={SPOOPY_COLORS.night}
      color={SPOOPY_COLORS.paper}
      p={3}
      borderRadius="md"
      fontSize="sm"
      mt={1}
    >
      <Text fontFamily={SPOOPY_FONTS.hand} mb={2}>
        📸 submit from discord
      </Text>
      <VStack align="stretch" spacing={2}>
        <Box>
          <Text fontSize="10px" opacity={0.7} mb={1} letterSpacing="wider" textTransform="uppercase">
            pre-screenshot baseline
          </Text>
          <SpoopyCommandCopy command={`!spoopypre ${tileId}`} size="sm" />
        </Box>
        <Box>
          <Text fontSize="10px" opacity={0.7} mb={1} letterSpacing="wider" textTransform="uppercase">
            completion proof
          </Text>
          <SpoopyCommandCopy command={`!spoopysubmit ${tileId}`} size="sm" />
        </Box>
      </VStack>
      <Text fontSize="xs" opacity={0.6} mt={1}>
        include the event password visible in your screenshot.
      </Text>
    </Box>
  );
}
