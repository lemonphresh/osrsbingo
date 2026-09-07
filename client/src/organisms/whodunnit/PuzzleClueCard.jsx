import React, { useState } from 'react';
import {
  Box,
  Text,
  Input,
  Button,
  HStack,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import HintDialog from './HintDialog';
import { formatInline } from './StoryBlocks';
import {
  WD_COLORS,
  WD_FONTS,
  PAPER_CARD_SX,
  paperRotation,
} from './whodunnitTheme';

// A single clue view. Rendered as a piece of case-file paper on the desk.
// Paper bg, typewriter labels, ink-toned prompt text, cream fill-in-the-
// blank input. Slight deterministic rotation so a stack of clues doesn't
// sit perfectly aligned.
const PuzzleClueCard = ({
  clue,
  submittedAnswer,       // string or null
  isCorrect,             // boolean — server-verified
  hintUsed,              // boolean
  hintText,              // string or null — server-provided when hint is used
  onSubmit,              // (answerString) => Promise
  onUseHint,             // () => Promise
  disabled,              // boolean — campaign is complete
}) => {
  const [draft, setDraft] = useState(submittedAnswer || '');
  const [showFeedback, setShowFeedback] = useState(false);
  const [busy, setBusy] = useState(false);
  const hintDialog = useDisclosure();
  const [hintRevealed, setHintRevealed] = useState(hintUsed);
  // Hint appears only after an attempted answer (or if a prior submission
  // exists from a teammate).
  const [attempted, setAttempted] = useState(Boolean(submittedAnswer));

  // null while nothing has been submitted, true/false after server verdict.
  const correct = submittedAnswer ? Boolean(isCorrect) : null;
  const rot = paperRotation(clue.id, 1.2);

  const submit = async () => {
    if (!draft.trim() || busy || disabled) return;
    setBusy(true);
    setShowFeedback(false);
    try {
      await onSubmit(draft.trim());
      setAttempted(true);
      setShowFeedback(true);
    } finally {
      setBusy(false);
    }
  };

  const confirmHint = async () => {
    hintDialog.onClose();
    await onUseHint();
    setHintRevealed(true);
  };

  return (
    <Box
      sx={PAPER_CARD_SX}
      p={5}
      transform={`rotate(${rot}deg)`}
      borderColor={correct ? WD_COLORS.fountain : WD_COLORS.paperShadow}
      borderWidth={correct ? '2px' : '1px'}
    >
      <VStack align="stretch" spacing={4} position="relative" zIndex={1}>
        <HStack spacing={3}>
          <Box
            bg={WD_COLORS.ink}
            color={WD_COLORS.paper}
            px={2.5}
            py={0.5}
            fontFamily={WD_FONTS.typewriter}
            fontSize="2xs"
            letterSpacing="0.15em"
            textTransform="uppercase"
            borderRadius="1px"
          >
            {clue.label}
          </Box>
          {correct === true && (
            <HStack
              spacing={1}
              color={WD_COLORS.fountain}
              fontFamily={WD_FONTS.typewriter}
              fontSize="2xs"
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              <CheckCircleIcon w={3} h={3} />
              <Text>Recorded</Text>
            </HStack>
          )}
          {hintUsed && (
            <Text
              color={WD_COLORS.brassDeep}
              fontFamily={WD_FONTS.typewriter}
              fontSize="2xs"
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              🔍 Hint used
            </Text>
          )}
        </HStack>

        <Text
          color={WD_COLORS.ink}
          fontFamily={WD_FONTS.typewriter}
          fontStyle="italic"
          whiteSpace="pre-wrap"
          lineHeight="1.65"
        >
          {formatInline(clue.prompt)}
        </Text>

        {(hintRevealed || hintUsed) && (
          <Box
            bg="rgba(255, 220, 130, 0.35)"
            p={3}
            borderLeft="3px solid"
            borderLeftColor={WD_COLORS.brass}
            borderRadius="sm"
          >
            <Text
              fontSize="2xs"
              color={WD_COLORS.brassDeep}
              fontWeight="bold"
              mb={1}
              textTransform="uppercase"
              letterSpacing="0.15em"
              fontFamily={WD_FONTS.typewriter}
            >
              Hint
            </Text>
            <Text color={WD_COLORS.ink} fontFamily={WD_FONTS.typewriter}>
              {hintText || '(hint loading…)'}
            </Text>
          </Box>
        )}

        <HStack>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Your answer..."
            bg="rgba(255,255,255,0.5)"
            color={WD_COLORS.ink}
            borderColor={WD_COLORS.paperShadow}
            fontFamily={WD_FONTS.typewriter}
            _placeholder={{ color: WD_COLORS.inkPencil, fontStyle: 'italic' }}
            _focus={{
              borderColor: WD_COLORS.wax,
              boxShadow: `0 0 0 1px ${WD_COLORS.wax}`,
            }}
            isDisabled={disabled || correct === true}
          />
          <Button
            onClick={submit}
            isLoading={busy}
            isDisabled={disabled || !draft.trim() || correct === true}
            bg={WD_COLORS.wax}
            color={WD_COLORS.paper}
            _hover={{ bg: WD_COLORS.waxHighlight }}
            _disabled={{ bg: WD_COLORS.paperShadow, color: WD_COLORS.inkPencil, cursor: 'not-allowed' }}
            fontFamily={WD_FONTS.typewriter}
            letterSpacing="0.05em"
          >
            Submit
          </Button>
        </HStack>

        {showFeedback && correct === false && (
          <HStack color={WD_COLORS.wax} spacing={2}>
            <WarningIcon />
            <Text fontSize="sm" fontFamily={WD_FONTS.typewriter} fontStyle="italic">
              Watson would like you to check your answer again.
            </Text>
          </HStack>
        )}

        {attempted && !hintUsed && !hintRevealed && correct !== true && (
          <Button
            size="sm"
            onClick={hintDialog.onOpen}
            alignSelf="flex-start"
            isDisabled={disabled}
            variant="outline"
            borderColor={WD_COLORS.brass}
            color={WD_COLORS.brassDeep}
            bg="rgba(163, 122, 45, 0.1)"
            _hover={{ bg: 'rgba(163, 122, 45, 0.2)', borderColor: WD_COLORS.brassDeep }}
            fontFamily={WD_FONTS.typewriter}
            leftIcon={<Text as="span">🔍</Text>}
          >
            Need a hint?
          </Button>
        )}
      </VStack>

      <HintDialog isOpen={hintDialog.isOpen} onCancel={hintDialog.onClose} onConfirm={confirmHint} />
    </Box>
  );
};

export default PuzzleClueCard;
