import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Divider,
} from '@chakra-ui/react';
import StoryBlocks from './StoryBlocks';
import PuzzleClueCard from './PuzzleClueCard';
import {
  getNode,
  isNodeComplete,
  mergeFlavorForNode,
} from '../../utils/whodunnit/storyEngine';
import { WD_COLORS, WD_FONTS } from './whodunnitTheme';

// Dispatcher for a story node. Renders the right sub-view based on
// node.type and drives all the "next" mechanics (submit, hint, choice,
// advance, agency name input).
const NodeView = ({
  story,
  campaign,
  nodeId,
  onSubmitAnswer,
  onUseHint,
  onAdvance,
  onChoose,
  onSetAgencyName,
}) => {
  const node = getNode(story, nodeId);
  if (!node) {
    return <Text color="red.300">Unknown node: {nodeId}</Text>;
  }

  const isComplete = campaign.status === 'COMPLETE';
  const answersForNode = (campaign.answers || []).filter((a) => a.nodeId === nodeId);
  const progressForNode = (campaign.nodeProgress || []).find((p) => p.nodeId === nodeId);
  const hintUsedIds = new Set(progressForNode?.hintUsedClueIds || []);
  const revealedHintById = new Map(
    (progressForNode?.revealedHints || []).map((h) => [h.clueId, h.hint])
  );

  const merge = mergeFlavorForNode(story, nodeId, {
    choiceAPath: campaign.choiceAPath,
    choiceBPath: campaign.choiceBPath,
  });

  const nodeComplete = isNodeComplete(node, answersForNode);

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.1em" mb={1}>
          {node.type === 'choice' ? 'Choice point' : `Node ${node.index ?? '—'}`}
        </Text>
        <Heading size="lg" color="white">{node.title}</Heading>
      </Box>

      {merge && (
        <Box bg="rgba(120, 80, 200, 0.08)" borderLeft="3px solid" borderLeftColor="purple.400" p={3} borderRadius="md">
          <Text fontSize="xs" color="purple.200" fontWeight="bold" mb={1} textTransform="uppercase">
            Watson
          </Text>
          <Text color="purple.100">{merge}</Text>
        </Box>
      )}

      <StoryBlocks blocks={node.blocks} />

      {node.type === 'narrative' && (
        <NarrativeAdvance node={node} campaign={campaign} onAdvance={onAdvance} onSetAgencyName={onSetAgencyName} disabled={isComplete} />
      )}

      {(node.type === 'single_puzzle' || node.type === 'multi_puzzle') && (
        <>
          <Divider borderColor="#1e4976" />
          <VStack align="stretch" spacing={4}>
            {node.clues.map((clue) => {
              const existing = answersForNode.find((a) => a.clueId === clue.id);
              return (
                <PuzzleClueCard
                  key={clue.id}
                  clue={clue}
                  submittedAnswer={existing?.answer || null}
                  isCorrect={existing?.correct || false}
                  hintUsed={hintUsedIds.has(clue.id)}
                  hintText={revealedHintById.get(clue.id) || null}
                  onSubmit={(ans) => onSubmitAnswer(node.id || nodeId, clue.id, ans)}
                  onUseHint={() => onUseHint(nodeId, clue.id)}
                  disabled={isComplete}
                />
              );
            })}
          </VStack>
          <Divider borderColor="rgba(255,255,255,0.08)" />
          <HStack justify="flex-end">
            <Button
              onClick={() => onAdvance()}
              isDisabled={!nodeComplete || isComplete}
              bg={nodeComplete ? WD_COLORS.wax : 'transparent'}
              color={nodeComplete ? WD_COLORS.paper : WD_COLORS.brass}
              border="1px solid"
              borderColor={nodeComplete ? WD_COLORS.waxDeep : WD_COLORS.brassDeep}
              _hover={nodeComplete ? { bg: WD_COLORS.waxHighlight } : undefined}
              _disabled={{
                bg: 'transparent',
                color: WD_COLORS.brassDeep,
                borderColor: WD_COLORS.brassDeep,
                cursor: 'not-allowed',
                opacity: 0.7,
              }}
              fontFamily={WD_FONTS.typewriter}
              letterSpacing="0.05em"
            >
              {nodeComplete ? 'Advance to next node →' : 'Solve all clues first'}
            </Button>
          </HStack>
        </>
      )}

      {node.type === 'choice' && (
        <ChoiceButtons node={node} onChoose={onChoose} />
      )}

      {node.type === 'narrative_ending' && (
        <HStack justify="flex-end">
          <Button
            onClick={() => onAdvance()}
            isDisabled={isComplete}
            bg={WD_COLORS.wax}
            color={WD_COLORS.paper}
            _hover={{ bg: WD_COLORS.waxHighlight }}
            fontFamily={WD_FONTS.typewriter}
            letterSpacing="0.05em"
          >
            {node.advanceLabel || 'Finish'}
          </Button>
        </HStack>
      )}
    </VStack>
  );
};

function NarrativeAdvance({ node, campaign, onAdvance, onSetAgencyName, disabled }) {
  // Server defaults new campaigns to "Untitled Case" — treat that as
  // effectively empty in the intro input so the placeholder shows.
  const initialName =
    campaign.agencyName && campaign.agencyName !== 'Untitled Case' ? campaign.agencyName : '';
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const canAdvance = !node.input || Boolean(name.trim());

  const advance = async () => {
    if (node.input && name.trim() && name.trim() !== campaign.agencyName) {
      setSaving(true);
      await onSetAgencyName(name.trim());
      setSaving(false);
    }
    onAdvance();
  };

  return (
    <VStack align="stretch" spacing={4}>
      {node.input && (
        <Box>
          <Text
            fontSize="2xs"
            color={WD_COLORS.brassLight}
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontFamily={WD_FONTS.typewriter}
            mb={1}
          >
            {node.input.label}
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={node.input.placeholder}
            bg="rgba(239, 228, 201, 0.9)"
            color={WD_COLORS.ink}
            borderColor={WD_COLORS.paperShadow}
            fontFamily={WD_FONTS.typewriter}
            _placeholder={{ color: WD_COLORS.inkPencil, fontStyle: 'italic' }}
            _focus={{
              borderColor: WD_COLORS.wax,
              boxShadow: `0 0 0 1px ${WD_COLORS.wax}`,
            }}
            maxLength={60}
            isDisabled={disabled}
          />
        </Box>
      )}
      <HStack justify="flex-end">
        <Button
          onClick={advance}
          isDisabled={disabled || !canAdvance}
          isLoading={saving}
          bg={WD_COLORS.wax}
          color={WD_COLORS.paper}
          _hover={{ bg: WD_COLORS.waxHighlight }}
          _disabled={{ bg: WD_COLORS.paperShadow, color: WD_COLORS.inkPencil, cursor: 'not-allowed' }}
          fontFamily={WD_FONTS.typewriter}
          letterSpacing="0.05em"
        >
          {node.advanceLabel || 'Continue →'}
        </Button>
      </HStack>
    </VStack>
  );
}

function ChoiceButtons({ node, onChoose }) {
  return (
    <VStack align="stretch" spacing={3}>
      {node.options.map((opt) => (
        <Button
          key={opt.key}
          onClick={() => onChoose(node.choiceKey, opt.key)}
          size="lg"
          variant="outline"
          borderColor={WD_COLORS.brassDeep}
          bg="rgba(163, 122, 45, 0.08)"
          _hover={{ bg: 'rgba(163, 122, 45, 0.22)', borderColor: WD_COLORS.brass }}
          height="auto"
          py={4}
          whiteSpace="normal"
          textAlign="left"
          justifyContent="flex-start"
        >
          <VStack align="stretch" spacing={1} width="100%">
            <Text fontWeight="bold" color={WD_COLORS.brassLight} fontFamily={WD_FONTS.typewriter}>
              {opt.label}
            </Text>
            {opt.description && (
              <Text
                fontSize="sm"
                color={WD_COLORS.paperShadow}
                fontWeight="normal"
                fontFamily={WD_FONTS.typewriter}
                fontStyle="italic"
              >
                {opt.description}
              </Text>
            )}
          </VStack>
        </Button>
      ))}
    </VStack>
  );
}

export default NodeView;
