import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Checkbox,
} from '@chakra-ui/react';

const NAVY = '#071523';
const CARD = '#0d2137';
const BORDER = '#1e4976';
const CYAN = '#0ea5e9';
const DIM = '#94a3b8';
const BODY = '#cbd5e1';
const AMBER = '#d97706';

function SectionLabel({ children }) {
  return (
    <Text
      fontSize="10px"
      fontWeight="bold"
      color={DIM}
      letterSpacing="widest"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

function RuleRow({ badge, scheme, children }) {
  return (
    <HStack align="flex-start" spacing={3}>
      <Badge
        colorScheme={scheme}
        fontFamily="mono"
        fontSize="10px"
        letterSpacing="wider"
        flexShrink={0}
        mt={0.5}
      >
        {badge}
      </Badge>
      <Text fontSize="sm" color={BODY} lineHeight="1.6">
        {children}
      </Text>
    </HStack>
  );
}

function InfoCard({ children, accentColor = BORDER }) {
  return (
    <Box bg={NAVY} border="1px solid" borderColor={accentColor} borderRadius="md" p={4}>
      {children}
    </Box>
  );
}

export function getBSPlacementIntroKey(eventId) {
  return `bs_placement_intro_seen_${eventId}`;
}

export function BSPlacementIntroModal({ isOpen, onClose, eventId, placementPhaseHours }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) setScrolledToBottom(true);
  };

  const handleConfirm = () => {
    localStorage.setItem(getBSPlacementIntroKey(eventId), 'true');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      closeOnOverlayClick={false}
      isCentered
      size="lg"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(4px)" />
      <ModalContent bg={CARD} border="1px solid" borderColor={BORDER} maxH="85vh" overflow="hidden">
        {/* Hero with grid background */}
        <Box
          position="relative"
          px={6}
          pt={6}
          pb={5}
          overflow="hidden"
          bg={CARD}
          borderBottom="1px solid"
          borderColor={BORDER}
          flexShrink={0}
        >
          <Box
            position="absolute"
            inset={0}
            opacity={0.04}
            pointerEvents="none"
            backgroundImage={`repeating-linear-gradient(0deg, ${CYAN} 0px, ${CYAN} 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, ${CYAN} 0px, ${CYAN} 1px, transparent 1px, transparent 40px)`}
          />
          <VStack align="flex-start" spacing={1} position="relative" zIndex={1}>
            <Text
              fontFamily="mono"
              fontSize={['lg', 'xl']}
              fontWeight="bold"
              color="#e2e8f0"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Placement Phase
            </Text>
            <Text fontFamily="mono" fontSize="xs" color={DIM} letterSpacing="wide">
              Read through how ship placement works before you begin.
            </Text>
            <HStack spacing={2} pt={1}>
              <Box w="24px" h="1px" bg={CYAN} />
              <Box w="8px" h="1px" bg={BORDER} />
            </HStack>
          </VStack>
        </Box>

        <ModalBody
          overflowY="auto"
          onScroll={handleScroll}
          px={6}
          py={5}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: BORDER, borderRadius: '10px' },
            scrollbarWidth: 'thin',
            scrollbarColor: `${BORDER} transparent`,
          }}
        >
          <VStack align="stretch" spacing={5} pb={2} fontFamily="mono">
            {/* Objective */}
            <InfoCard accentColor={CYAN}>
              <SectionLabel>Objective</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7">
                Each team plays with a single fleet layout. Everyone on your team designs a layout
                privately, then shares it as a suggestion for the team to vote on. Whichever
                suggestion has the most votes when placement ends becomes the team's fleet.
              </Text>
            </InfoCard>

            {/* Workshop */}
            <Box>
              <SectionLabel>Your Private Workshop</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7" mb={3}>
                Your workshop is a private draft board only you can see. Place every ship there,
                rotate them, and rearrange as much as you want. Nothing is shared with your team
                until you click{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  Share as Suggestion
                </Text>
                .
              </Text>
              <VStack align="stretch" spacing={2}>
                <RuleRow badge="Autosaves" scheme="cyan">
                  Your workshop saves to this browser automatically. Come back later on the same
                  device and pick up where you left off.
                </RuleRow>
                <RuleRow badge="Full Fleet" scheme="yellow">
                  You must place every ship in your workshop before you can share it.
                </RuleRow>
              </VStack>
            </Box>

            {/* Suggestions */}
            <Box>
              <SectionLabel>Sharing a Suggestion</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7" mb={3}>
                Sharing turns your workshop into a suggestion your teammates can see and vote on.
                You can un-share, edit, and re-share as often as you like during placement.
              </Text>
              <VStack align="stretch" spacing={2}>
                <RuleRow badge="One At A Time" scheme="cyan">
                  You can only have one active suggestion. Re-sharing replaces your previous one.
                </RuleRow>
                <RuleRow badge="Votes Reset" scheme="yellow">
                  Editing and re-sharing clears any votes your previous suggestion had picked up.
                  Only share when you're happy with the layout.
                </RuleRow>
              </VStack>
            </Box>

            {/* Voting */}
            <Box>
              <SectionLabel>Voting</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7" mb={3}>
                Every teammate gets{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  one vote
                </Text>
                . You can vote for any shared suggestion, including your own. You can change your
                vote at any time before placement ends.
              </Text>
              <VStack align="stretch" spacing={2}>
                <RuleRow badge="Winner" scheme="green">
                  The suggestion with the most votes when placement ends becomes the team fleet.
                </RuleRow>
                <RuleRow badge="Ties" scheme="yellow">
                  If two or more suggestions are tied, the winner is picked at random from the
                  tied set.
                </RuleRow>
                <RuleRow badge="No Votes" scheme="red">
                  If nobody on your team has shared a suggestion, the team enters battle without a
                  fleet and cannot be hit. Make sure someone shares.
                </RuleRow>
              </VStack>
            </Box>

            {/* Solo teams */}
            <InfoCard accentColor={AMBER}>
              <SectionLabel>Solo Teams</SectionLabel>
              <Text fontSize="sm" color="#fcd34d" lineHeight="1.7">
                If you're the only player on your team, whatever you share becomes the fleet by
                default. You still need to share a suggestion before placement ends.
              </Text>
            </InfoCard>

            {/* Deadline */}
            <InfoCard>
              <SectionLabel>Placement Window</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7">
                Placement lasts{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  {placementPhaseHours ?? '?'} hour{placementPhaseHours !== 1 ? 's' : ''}
                </Text>
                . When the timer runs out, votes are locked in, the winning suggestion becomes
                your team fleet, and the battle phase begins.
              </Text>
            </InfoCard>

            {/* Secrecy */}
            <Box>
              <SectionLabel>Secrecy</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7">
                Neither team can see the other's board. Suggestions and votes are visible only to
                your own teammates.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          flexDir="column"
          gap={3}
          borderTop="1px solid"
          borderColor={BORDER}
          px={6}
          py={4}
        >
          {!scrolledToBottom && (
            <Text
              fontSize="xs"
              color="#475569"
              fontFamily="mono"
              textAlign="center"
              w="full"
              letterSpacing="wide"
            >
              Scroll to continue
            </Text>
          )}
          <Checkbox
            isChecked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            isDisabled={!scrolledToBottom}
            colorScheme="cyan"
            alignItems="flex-start"
            w="full"
          >
            <Text fontSize="sm" color="#e2e8f0" fontFamily="mono">
              I understand how placement suggestions and voting work
            </Text>
          </Checkbox>
          <Button
            w="full"
            isDisabled={!scrolledToBottom || !checked}
            onClick={handleConfirm}
            fontFamily="mono"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="widest"
            textTransform="uppercase"
            bg={CYAN}
            color={NAVY}
            _hover={{ bg: '#38bdf8' }}
            _active={{ bg: '#0284c7' }}
            _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
          >
            Man the Shipyard
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
