import React, { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import { playSpoopySound } from '../../utils/spoopy/spoopyAudio';

export function getSpoopyRulesKey(eventId) {
  return `spoopy_rules_seen_${eventId}`;
}

function SectionLabel({ children }) {
  return (
    <Text
      fontFamily={SPOOPY_FONTS.hand}
      fontSize="10px"
      fontWeight="bold"
      color={SPOOPY_COLORS.pumpkinLight}
      letterSpacing="widest"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

function RuleRow({ badge, color, children }) {
  return (
    <Box
      as="fieldset"
      border="2px solid"
      borderColor={color}
      borderRadius="md"
      px={4}
      pt={1}
      pb={3}
      bg="rgba(255,255,255,0.22)"
    >
      <Badge
        as="legend"
        bg={color}
        color={SPOOPY_COLORS.paper}
        fontFamily={SPOOPY_FONTS.hand}
        fontSize="10px"
        textTransform="lowercase"
        letterSpacing="wide"
        borderRadius="sm"
        mx={2}
        px={2.5}
        py={1}
      >
        {badge}
      </Badge>
      <Text fontSize="sm" lineHeight="1.65" mt={1}>
        {children}
      </Text>
    </Box>
  );
}

function RuleCard({ children, borderColor = SPOOPY_COLORS.paperEdge }) {
  return (
    <Box
      bg="rgba(255,255,255,0.38)"
      border="2px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
    >
      {children}
    </Box>
  );
}

export default function SpoopyRulesModal({
  isOpen,
  onClose,
  onAccept,
  eventId,
  curfewEnd,
  requiresAcceptance = true,
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setChecked(false);
    setScrolledToBottom(false);
    const frame = requestAnimationFrame(() => {
      const body = bodyRef.current;
      if (body && body.scrollHeight <= body.clientHeight + 10) setScrolledToBottom(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) setScrolledToBottom(true);
  };

  const handleAccept = () => {
    try {
      localStorage.setItem(getSpoopyRulesKey(eventId), 'true');
    } catch (_) {}
    playSpoopySound('intro');
    onAccept();
  };

  const curfewLabel = curfewEnd ? new Date(curfewEnd).toLocaleString() : 'the posted deadline';

  return (
    <Modal
      isOpen={isOpen}
      onClose={requiresAcceptance ? () => {} : onClose}
      closeOnEsc={!requiresAcceptance}
      closeOnOverlayClick={!requiresAcceptance}
      isCentered
      size="lg"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="rgba(20,12,26,0.92)" backdropFilter="blur(5px)" />
      <ModalContent
        bg={SPOOPY_COLORS.paper}
        color={SPOOPY_COLORS.paperInk}
        border="3px solid"
        borderColor={SPOOPY_COLORS.paperEdge}
        boxShadow={`0 18px 0 ${SPOOPY_COLORS.paperShadow}, 0 30px 70px rgba(0,0,0,0.65)`}
        maxH="88vh"
        overflow="hidden"
        transform="rotate(-0.25deg)"
      >
        {!requiresAcceptance && <ModalCloseButton color={SPOOPY_COLORS.paperInk} />}
        <Box
          px={6}
          pt={6}
          pb={5}
          bg={SPOOPY_COLORS.night}
          color={SPOOPY_COLORS.paper}
          borderBottom="3px solid"
          borderColor={SPOOPY_COLORS.pumpkin}
          flexShrink={0}
        >
          <Text
            fontFamily={SPOOPY_FONTS.heading}
            fontSize={{ base: 'xl', md: '2xl' }}
            color={SPOOPY_COLORS.slime}
            letterSpacing="wider"
          >
            you've stumbled into a spoopy situation
          </Text>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="sm" mt={1} opacity={0.85}>
            read the rules before your team heads into the fog
          </Text>
        </Box>

        <ModalBody
          ref={bodyRef}
          overflowY="auto"
          onScroll={handleScroll}
          px={6}
          py={5}
          css={{
            '&::-webkit-scrollbar': { width: '7px' },
            '&::-webkit-scrollbar-thumb': {
              background: SPOOPY_COLORS.purpleLight,
              borderRadius: '10px',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: `${SPOOPY_COLORS.purpleLight} transparent`,
          }}
        >
          <VStack align="stretch" spacing={5} pb={2} fontFamily={SPOOPY_FONTS.body}>
            <RuleCard borderColor={SPOOPY_COLORS.pumpkin}>
              <SectionLabel>The goal</SectionLabel>
              <Text fontSize="sm" lineHeight="1.7">
                Move through the haunted neighborhood, complete tasks, and gather as much candy as
                your team can. Before curfew, finish at the scary house and cash out. If your team
                has not cashed out when curfew arrives, all unclaimed candy is forfeited.
              </Text>
            </RuleCard>

            <Box>
              <SectionLabel>Getting started and moving</SectionLabel>
              <VStack align="stretch" spacing={2.5}>
                <RuleRow badge="ready up" color={SPOOPY_COLORS.green}>
                  Begin with the starter task on the first tile. Follow the tile's Discord command
                  and wait for a ref to mark it complete.
                </RuleRow>
                <RuleRow badge="follow paths" color={SPOOPY_COLORS.purple}>
                  Completing a tile can unlock connected tiles, and sometimes side streets. Your
                  team can choose its route and may have several active tasks at once.
                </RuleRow>
                <RuleRow badge="tile details" color={SPOOPY_COLORS.pumpkin}>
                  Select any unlocked tile to read its task, progress, accepted drops, and exact
                  submission commands.
                </RuleRow>
              </VStack>
            </Box>

            <Box>
              <SectionLabel>Trick or treat houses</SectionLabel>
              <Text fontSize="sm" lineHeight="1.7" mb={3}>
                A house offers two mystery responses. Discuss them with your team, then lock in
                option A or B through Discord. The result and task are revealed only after the
                choice is made.
              </Text>
              <VStack align="stretch" spacing={2.5}>
                <RuleRow badge="no take-backs" color={SPOOPY_COLORS.ember}>
                  Choices are final. You cannot switch options after one is locked in.
                </RuleRow>
                <RuleRow badge="trick or treat" color={SPOOPY_COLORS.pumpkin}>
                  Either choice may reveal a trick or a treat. Complete the revealed task to finish
                  the house and bank any reward it grants.
                </RuleRow>
              </VStack>
            </Box>

            <RuleCard>
              <SectionLabel>Proof and WOM tracking</SectionLabel>
              <Text fontSize="sm" lineHeight="1.7" mb={3}>
                Task proof is submitted in your team's Discord channel. For XP and KC tasks, take
                the pre-screenshot first so refs have a baseline.
              </Text>
              <Text fontSize="sm" lineHeight="1.7">
                Submit completion proof with the command shown on the tile. A ref reviews it and
                marks the task complete. Some of these house tasks are unique, to say the least --
                ask questions about submission preferences if you're unsure, but please be patient
                and do not spam the volunteer refs.
              </Text>
            </RuleCard>

            <Box>
              <SectionLabel>The scary house and curfew</SectionLabel>
              <VStack align="stretch" spacing={2.5}>
                <RuleRow badge="final stop" color={SPOOPY_COLORS.ember}>
                  The scary house is your cash-out destination. Entering its final sequence commits
                  your team to ending the run, so decide together before going in.
                </RuleRow>
                <RuleRow badge="cash out" color={SPOOPY_COLORS.green}>
                  Complete its task to secure your candy and any displayed bonus.
                </RuleRow>
                <RuleRow badge="curfew" color={SPOOPY_COLORS.emberDeep}>
                  Your deadline is {curfewLabel}. Missing it without cashing out wipes the team's
                  unclaimed haul.
                </RuleRow>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          flexDir="column"
          gap={3}
          px={6}
          py={4}
          borderTop="2px solid"
          borderColor={SPOOPY_COLORS.paperEdge}
          bg="#e7dcc2"
        >
          {requiresAcceptance ? (
            <>
              {!scrolledToBottom && (
                <Text fontSize="xs" opacity={0.65} fontFamily={SPOOPY_FONTS.hand}>
                  scroll to the bottom to continue
                </Text>
              )}
              <Box
                w="full"
                p={3}
                bg="rgba(255,255,255,0.5)"
                border="2px solid"
                borderColor={scrolledToBottom ? SPOOPY_COLORS.pumpkin : SPOOPY_COLORS.paperShadow}
                borderRadius="md"
              >
                <Checkbox
                  isChecked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                  isDisabled={!scrolledToBottom}
                  colorScheme="orange"
                  size="lg"
                  alignItems="flex-start"
                  w="full"
                  iconColor={SPOOPY_COLORS.paper}
                  _disabled={{ opacity: 0.75, cursor: 'not-allowed' }}
                  sx={{
                    '.chakra-checkbox__control': {
                      bg: '#fffaf0',
                      border: '3px solid',
                      borderColor: SPOOPY_COLORS.pumpkinDeep,
                      boxShadow: `2px 2px 0 ${SPOOPY_COLORS.paperShadow}`,
                    },
                    '.chakra-checkbox__control[data-checked]': {
                      bg: SPOOPY_COLORS.pumpkin,
                      borderColor: SPOOPY_COLORS.pumpkinDeep,
                    },
                    '.chakra-checkbox__label': {
                      marginInlineStart: '12px',
                    },
                  }}
                >
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    lineHeight="1.5"
                    fontFamily={SPOOPY_FONTS.hand}
                  >
                    i understand the rules, the cash-out requirement, and the curfew risk
                  </Text>
                </Checkbox>
              </Box>
              <Button
                w="full"
                isDisabled={!scrolledToBottom || !checked}
                onClick={handleAccept}
                bg={SPOOPY_COLORS.pumpkin}
                color={SPOOPY_COLORS.paper}
                fontFamily={SPOOPY_FONTS.hand}
                letterSpacing="wider"
                _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
                _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
              >
                let's go trick-or-treating
              </Button>
            </>
          ) : (
            <Button
              w="full"
              onClick={onClose}
              bg={SPOOPY_COLORS.purple}
              color={SPOOPY_COLORS.paper}
              fontFamily={SPOOPY_FONTS.hand}
              _hover={{ bg: SPOOPY_COLORS.purpleDeep }}
            >
              close rules
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
