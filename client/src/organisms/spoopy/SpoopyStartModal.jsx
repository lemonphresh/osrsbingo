import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  Text,
  VStack,
  Heading,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import SpoopyCommandCopy from './SpoopyCommandCopy';

// Renders the ready-up dialog for the start tile: story intro + task
// description. Purely informational — actual submissions happen via the
// Discord bot (mirrors the battleship pattern). The team reads the task,
// then runs the discord submission command in their team channel.
//
// The story lives on the tile's content object with `{{password}}` and
// `{{command}}` / `{{passwordClause}}` placeholders — this component
// substitutes them so the copy adapts to whatever the admin configured on
// the event.
//
// Props:
//   isOpen, onClose
//   story          { intro, task, passwordClauseTemplate, command, footer }
//   eventPassword  string | null   — from event.eventPassword
export default function SpoopyStartModal({
  isOpen,
  onClose,
  story,
  eventPassword,
  onMockSubmit,
  mockSubmitting = false,
}) {
  if (!story) return null;
  const paragraphs = composeStoryParagraphs(story, eventPassword);
  const command = story.command;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.8)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={SPOOPY_COLORS.paper}
        color={SPOOPY_COLORS.paperInk}
        border="3px solid"
        borderColor={SPOOPY_COLORS.paperEdge}
        boxShadow={`0 20px 0 ${SPOOPY_COLORS.paperShadow}, 0 30px 60px rgba(0,0,0,0.55)`}
        backgroundImage="radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        transform="rotate(-0.5deg)"
      >
        <ModalCloseButton color={SPOOPY_COLORS.paperInk} />
        <ModalBody py={8} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading
                size="md"
                fontFamily={SPOOPY_FONTS.heading}
                color={SPOOPY_COLORS.pumpkinDeep}
                letterSpacing="wider"
              >
                🎃 ready up
              </Heading>
              <Badge
                bg={SPOOPY_COLORS.green}
                color={SPOOPY_COLORS.paper}
                textTransform="lowercase"
                fontFamily={SPOOPY_FONTS.hand}
              >
                start tile
              </Badge>
            </HStack>

            <VStack align="stretch" spacing={4}>
              {paragraphs.map((p, i) => (
                <Text
                  key={i}
                  fontFamily={SPOOPY_FONTS.hand}
                  fontSize={i === 0 ? 'lg' : 'md'}
                  lineHeight={1.55}
                >
                  {p}
                </Text>
              ))}
            </VStack>

            <Box
              bg={SPOOPY_COLORS.paperShadow}
              borderLeft="4px solid"
              borderColor={SPOOPY_COLORS.pumpkin}
              p={3}
              borderRadius="md"
            >
              <Text
                fontSize="xs"
                opacity={0.65}
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                the task
              </Text>
              <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
                in-game selfie (at least 50% of the team must submit one)
                {eventPassword ? (
                  <>
                    {' '}
                    with the event password{' '}
                    <Text as="span" fontFamily="mono" color={SPOOPY_COLORS.pumpkinDeep}>
                      "{eventPassword}"
                    </Text>{' '}
                    visible in the wom plugin overlay
                  </>
                ) : null}
              </Text>
              {command && (
                <Box mt={3}>
                  <Text fontSize="xs" opacity={0.65} mb={1}>
                    submit in your team's discord channel:
                  </Text>
                  <SpoopyCommandCopy command={command} size="sm" />
                </Box>
              )}
            </Box>

            {onMockSubmit && <MockDevButton onClick={onMockSubmit} loading={mockSubmitting} />}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// Rendered only when the parent hands us `onMockSubmit` (site admin + dev
// env only). Fires a mock PRE + FINAL submission for the current tile so
// testers don't need to run the discord bot to try the flow.
export function MockDevButton({ onClick, loading }) {
  return (
    <Box borderTop="1px dashed" borderColor="rgba(0,0,0,0.15)" pt={3} mt={2}>
      <Text fontSize="10px" opacity={0.55} textTransform="uppercase" letterSpacing="wider" mb={1}>
        dev shortcut (admin · local/staging only)
      </Text>
      <Button
        size="xs"
        onClick={onClick}
        isLoading={loading}
        variant="outline"
        borderColor="rgba(0,0,0,0.2)"
        color="rgba(0,0,0,0.7)"
        _hover={{ bg: 'rgba(0,0,0,0.05)' }}
      >
        🧪 send mock pre + submission
      </Button>
    </Box>
  );
}

// Two-button dev shortcut for locking in option A or B on a house tile
// without going through the discord bot. Same visual treatment as
// MockDevButton so it reads as an out-of-band admin-only affordance.
export function MockDevChoiceButtons({ onChoose, loading, disabledLetter }) {
  return (
    <Box borderTop="1px dashed" borderColor="rgba(0,0,0,0.15)" pt={3} mt={2}>
      <Text fontSize="10px" opacity={0.55} textTransform="uppercase" letterSpacing="wider" mb={1}>
        dev shortcut (admin · local/staging only)
      </Text>
      <Box display="flex" gap={2}>
        <Button
          size="xs"
          onClick={() => onChoose('a')}
          isLoading={loading && disabledLetter === 'a'}
          isDisabled={loading}
          variant="outline"
          borderColor="rgba(0,0,0,0.2)"
          color="rgba(0,0,0,0.7)"
          _hover={{ bg: 'rgba(0,0,0,0.05)' }}
        >
          🧪 lock option a
        </Button>
        <Button
          size="xs"
          onClick={() => onChoose('b')}
          isLoading={loading && disabledLetter === 'b'}
          isDisabled={loading}
          variant="outline"
          borderColor="rgba(0,0,0,0.2)"
          color="rgba(0,0,0,0.7)"
          _hover={{ bg: 'rgba(0,0,0,0.05)' }}
        >
          🧪 lock option b
        </Button>
      </Box>
    </Box>
  );
}

// Splits the story into: [intro paragraph, task line, footer]. Substitutes
// {{password}}, {{command}}, and {{passwordClause}} placeholders in the task
// line; omits the passwordClause entirely if no password is set.
export function composeStoryParagraphs(story, eventPassword) {
  const paragraphs = [];
  if (story.intro) paragraphs.push(story.intro);

  if (story.task) {
    const passwordClause =
      eventPassword && story.passwordClauseTemplate
        ? story.passwordClauseTemplate.replaceAll('{{password}}', eventPassword)
        : '';
    const taskLine = story.task
      .replaceAll('{{passwordClause}}', passwordClause)
      .replaceAll('{{command}}', story.command ?? '')
      .replaceAll('{{password}}', eventPassword ?? '');
    paragraphs.push(taskLine);
  }

  if (story.footer) paragraphs.push(story.footer);
  return paragraphs;
}
