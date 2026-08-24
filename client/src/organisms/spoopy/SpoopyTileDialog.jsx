import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Box, Button, Text, VStack, HStack, Heading, Badge,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';

// Trick-or-treat dialog for a house tile. Renders the prompt + two options
// (labels only — outcomes are hidden until choice is locked, per the
// "no take-backsies" rule).
//
// If `choiceMade` is set (the team already picked), the dialog shows the
// resolved task instead (via `resolvedTaskNode`). This lets us keep the
// dialog open post-choice while the team works on the task.
//
// Props:
//   isOpen, onClose
//   dialog          { prompt, options: { a: { label, ... }, b: { label, ... } } }
//   choiceMade      null | 'a' | 'b'
//   onChoose        fn(option 'a'|'b')
//   resolvedTaskNode  ReactNode — usually a <SpoopyTaskCard />
//   locked          if true, disables the option buttons (submission in flight)
export default function SpoopyTileDialog({
  isOpen,
  onClose,
  dialog,
  choiceMade = null,
  onChoose,
  resolvedTaskNode = null,
  locked = false,
}) {
  const options = dialog?.options ?? {};
  const chosenOption = choiceMade ? options[choiceMade] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.75)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={SPOOPY_COLORS.paper}
        color={SPOOPY_COLORS.paperInk}
        border="3px solid"
        borderColor={SPOOPY_COLORS.paperEdge}
        boxShadow={`0 20px 0 ${SPOOPY_COLORS.paperShadow}, 0 30px 60px rgba(0,0,0,0.6)`}
        backgroundImage="radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        transform="rotate(-0.5deg)"
      >
        <ModalCloseButton color={SPOOPY_COLORS.paperInk} />
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
                <OptionButton
                  label={options.a?.label}
                  onClick={() => onChoose?.('a')}
                  disabled={locked}
                  optionLetter="a"
                />
                <OptionButton
                  label={options.b?.label}
                  onClick={() => onChoose?.('b')}
                  disabled={locked}
                  optionLetter="b"
                />
                <Text fontSize="xs" opacity={0.65} textAlign="center" pt={1}>
                  once you pick, there's no take-backsies
                </Text>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch" pt={1}>
                <Box
                  bg={SPOOPY_COLORS.paperShadow}
                  color={SPOOPY_COLORS.paperInk}
                  p={3}
                  borderRadius="md"
                  opacity={0.9}
                >
                  <HStack spacing={2} mb={1}>
                    <Badge bg={SPOOPY_COLORS.night} color={SPOOPY_COLORS.paper} textTransform="lowercase">
                      option {choiceMade}
                    </Badge>
                    <OutcomeBadge outcome={chosenOption?.outcome} />
                  </HStack>
                  <Text fontFamily={SPOOPY_FONTS.hand}>{chosenOption?.label}</Text>
                </Box>
                {resolvedTaskNode}
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function OptionButton({ label, onClick, disabled, optionLetter }) {
  return (
    <Button
      onClick={onClick}
      isDisabled={disabled}
      justifyContent="flex-start"
      whiteSpace="normal"
      textAlign="left"
      height="auto"
      py={4}
      px={4}
      bg={SPOOPY_COLORS.paper}
      color={SPOOPY_COLORS.paperInk}
      border="2px solid"
      borderColor={SPOOPY_COLORS.paperEdge}
      borderRadius="md"
      boxShadow="0 3px 0 rgba(0,0,0,0.12)"
      _hover={{
        bg: SPOOPY_COLORS.paperShadow,
        transform: 'translateY(-1px)',
        boxShadow: '0 5px 0 rgba(0,0,0,0.14)',
      }}
      _active={{ transform: 'translateY(1px)', boxShadow: '0 1px 0 rgba(0,0,0,0.1)' }}
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
    </Button>
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
