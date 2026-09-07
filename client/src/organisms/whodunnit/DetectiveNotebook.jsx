import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Divider,
  Button,
  useDisclosure,
  Collapse,
} from '@chakra-ui/react';
import { getNode, getClue } from '../../utils/whodunnit/storyEngine';
import { WD_COLORS, WD_FONTS } from './whodunnitTheme';

// Detective's Notebook sidebar. Rendered as a leather-bound pocket book
// with aged paper inside. Any team member can log a Prime Suspect; the
// value + history persist on the campaign and propagate live to every
// team member via subscription.
const DetectiveNotebook = ({ story, campaign, onUpdatePrimeSuspect }) => {
  const [suspectDraft, setSuspectDraft] = useState(campaign.primeSuspect || '');
  const { isOpen: isCollapsed, onToggle } = useDisclosure({ defaultIsOpen: true });

  useEffect(() => {
    setSuspectDraft(campaign.primeSuspect || '');
  }, [campaign.primeSuspect]);

  const commitSuspect = () => {
    const trimmed = suspectDraft.trim();
    if (!trimmed) return;
    if (trimmed !== (campaign.primeSuspect || '')) {
      onUpdatePrimeSuspect(trimmed);
    }
  };

  const answers = campaign.answers || [];
  const sortedAnswers = [...answers].sort(
    (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt),
  );

  const suspectHistory = campaign.suspectHistory || [];
  const sortedSuspects = [...suspectHistory].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  );
  const isPendingChange =
    suspectDraft.trim() && suspectDraft.trim() !== (campaign.primeSuspect || '');

  return (
    <Box position="sticky" top={4}>
      {/* Leather spine + edges as an outer wrapper */}
      <Box
        bg={WD_COLORS.deskDeep}
        p={2}
        borderRadius="4px"
        boxShadow="0 6px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
        border="1px solid"
        borderColor={WD_COLORS.deskEdge}
      >
        {/* Paper pages inside */}
        <Box
          bg={WD_COLORS.paper}
          color={WD_COLORS.ink}
          p={4}
          borderRadius="2px"
          boxShadow="inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.08)"
          position="relative"
        >
          <HStack justify="space-between" mb={3} align="center">
            <Text
              fontFamily={WD_FONTS.heading}
              fontStyle="italic"
              fontSize="lg"
              color={WD_COLORS.ink}
              lineHeight="1"
            >
              Detective's Notebook
            </Text>
            <Button
              size="xs"
              onClick={onToggle}
              variant="outline"
              borderColor={WD_COLORS.paperShadow}
              color={WD_COLORS.inkFaded}
              bg="rgba(0,0,0,0.03)"
              _hover={{ bg: 'rgba(0,0,0,0.08)', borderColor: WD_COLORS.inkFaded }}
              fontFamily={WD_FONTS.typewriter}
            >
              {isCollapsed ? 'Hide' : 'Show'}
            </Button>
          </HStack>

          <Collapse in={isCollapsed}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text
                  fontSize="2xs"
                  color={WD_COLORS.brassDeep}
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                  fontFamily={WD_FONTS.typewriter}
                  mb={1}
                >
                  Prime Suspect
                </Text>
                <HStack>
                  <Input
                    value={suspectDraft}
                    onChange={(e) => setSuspectDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitSuspect()}
                    placeholder="Who did it?"
                    size="sm"
                    bg="rgba(255,255,255,0.5)"
                    color={WD_COLORS.ink}
                    borderColor={WD_COLORS.paperShadow}
                    fontFamily={WD_FONTS.typewriter}
                    _placeholder={{ color: WD_COLORS.inkPencil, fontStyle: 'italic' }}
                    _focus={{
                      borderColor: WD_COLORS.wax,
                      boxShadow: `0 0 0 1px ${WD_COLORS.wax}`,
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={commitSuspect}
                    isDisabled={!isPendingChange}
                    bg={WD_COLORS.wax}
                    color={WD_COLORS.paper}
                    _hover={{ bg: WD_COLORS.waxHighlight }}
                    _disabled={{
                      bg: WD_COLORS.paperShadow,
                      color: WD_COLORS.inkPencil,
                      cursor: 'not-allowed',
                    }}
                    fontFamily={WD_FONTS.typewriter}
                  >
                    Log
                  </Button>
                </HStack>
                {campaign.primeSuspect && (
                  <Text
                    fontSize="lg"
                    color={WD_COLORS.wax}
                    mt={2}
                    fontFamily={WD_FONTS.hand}
                    lineHeight="1"
                  >
                    Current: {campaign.primeSuspect}
                  </Text>
                )}
              </Box>

              {sortedSuspects.length > 0 && (
                <Box>
                  <Text
                    fontSize="2xs"
                    color={WD_COLORS.brassDeep}
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.15em"
                    fontFamily={WD_FONTS.typewriter}
                    mb={2}
                  >
                    Suspects logged ({sortedSuspects.length})
                  </Text>
                  <VStack align="stretch" spacing={1} maxH="140px" overflowY="auto">
                    {sortedSuspects.map((s, i) => (
                      <HStack key={s.id} justify="space-between" fontSize="sm" spacing={2}>
                        <HStack spacing={2} minW="0" flex="1">
                          {i === 0 && (
                            <Box
                              bg={WD_COLORS.wax}
                              color={WD_COLORS.paper}
                              px={1.5}
                              py={0.5}
                              fontFamily={WD_FONTS.typewriter}
                              fontSize="2xs"
                              letterSpacing="0.1em"
                              textTransform="uppercase"
                              borderRadius="1px"
                              flexShrink={0}
                            >
                              Now
                            </Box>
                          )}
                          <Text
                            fontFamily={WD_FONTS.hand}
                            fontSize="lg"
                            color={WD_COLORS.ink}
                            lineHeight="1"
                            isTruncated
                            title={s.suspect}
                          >
                            {s.suspect}
                          </Text>
                        </HStack>
                        <Text
                          fontFamily={WD_FONTS.typewriter}
                          fontSize="2xs"
                          color={WD_COLORS.inkPencil}
                          flexShrink={0}
                        >
                          {s.updatedBy?.rsn || s.updatedBy?.username || '?'}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}

              <Divider borderColor={WD_COLORS.paperShadow} />

              <Box>
                <Text
                  fontSize="2xs"
                  color={WD_COLORS.brassDeep}
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                  fontFamily={WD_FONTS.typewriter}
                  mb={2}
                >
                  Answers logged ({sortedAnswers.length})
                </Text>
                {sortedAnswers.length === 0 ? (
                  <Text
                    fontSize="sm"
                    color={WD_COLORS.inkPencil}
                    fontStyle="italic"
                    fontFamily={WD_FONTS.typewriter}
                  >
                    No answers yet. Watson is patient. Sort of.
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={1} maxH="400px" overflowY="auto">
                    {sortedAnswers.map((a) => {
                      const node = getNode(story, a.nodeId);
                      const nodeIndex = node?.index ?? '—';
                      // Show the submitted answer with the clue's subject
                      // noun (when defined) so numeric answers read as
                      // "7 red stools" or "2500 gp — Tortugan Shield"
                      // instead of "7" / "2500". The canonical answer is
                      // server-only now, so we render what the team typed.
                      const clue = getClue(story, a.clueId);
                      const display = clue?.subject
                        ? `${a.answer} ${clue.subject}`
                        : a.answer;
                      return (
                        <HStack key={a.id} justify="space-between" fontSize="xs">
                          <HStack spacing={2} minW="0" flex="1">
                            <Box
                              bg={WD_COLORS.ink}
                              color={WD_COLORS.paper}
                              px={1.5}
                              py={0.5}
                              fontFamily={WD_FONTS.typewriter}
                              fontSize="2xs"
                              letterSpacing="0.1em"
                              borderRadius="1px"
                              flexShrink={0}
                            >
                              {a.clueId}
                            </Box>
                            <Text
                              color={WD_COLORS.ink}
                              fontFamily={WD_FONTS.typewriter}
                              isTruncated
                              title={display}
                            >
                              {display}
                            </Text>
                          </HStack>
                          <Text
                            fontFamily={WD_FONTS.typewriter}
                            fontSize="2xs"
                            color={WD_COLORS.inkPencil}
                            flexShrink={0}
                          >
                            #{nodeIndex}
                          </Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            </VStack>
          </Collapse>
        </Box>
      </Box>
    </Box>
  );
};

export default DetectiveNotebook;
