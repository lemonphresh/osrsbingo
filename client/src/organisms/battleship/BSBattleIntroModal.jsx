import React, { useState } from 'react';
import { playBSSound } from '../../utils/battleship/bsAudio';
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

export function getBSBattleIntroKey(eventId) {
  return `bs_battle_intro_seen_${eventId}`;
}

export function BSBattleIntroModal({ isOpen, onClose, eventId, cooldownMinutes }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) setScrolledToBottom(true);
  };

  const handleConfirm = () => {
    localStorage.setItem(getBSBattleIntroKey(eventId), 'true');
    playBSSound('gogogo');
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
        <Box position="relative" px={6} pt={6} pb={5} overflow="hidden">
          <Box
            position="absolute"
            inset={0}
            opacity={0.04}
            pointerEvents="none"
            backgroundImage={`repeating-linear-gradient(0deg, ${CYAN} 0px, ${CYAN} 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, ${CYAN} 0px, ${CYAN} 1px, transparent 1px, transparent 40px)`}
          />
          <Box position="absolute" bottom={0} left={0} right={0} h="1px" bg={BORDER} />
          <VStack align="flex-start" spacing={1} position="relative" zIndex={1}>
            <Text
              fontFamily="mono"
              fontSize={['lg', 'xl']}
              fontWeight="bold"
              color="#e2e8f0"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Battle Phase
            </Text>
            <Text fontFamily="mono" fontSize="xs" color={DIM} letterSpacing="wide">
              Read through how the battle phase works before you begin.
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
                Sink all of the enemy team's ships before they sink yours. Every shot reveals a
                task. Your team completes it whether you hit a ship or open ocean. Land hits on all
                of a ship's cells and complete those tasks to sink it.
              </Text>
            </InfoCard>

            {/* Taking Shots */}
            <Box>
              <SectionLabel>Taking Shots</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7" mb={3}>
                Fire at any unrevealed cell on the enemy board. When the cell is revealed,{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  your team
                </Text>{' '}
                must complete the task shown. Every shot comes with a task.
              </Text>
              <VStack align="stretch" spacing={2}>
                <RuleRow badge="Ship Hit" scheme="red">
                  You hit a ship cell. Complete the task to score the hit and damage their fleet.
                </RuleRow>
                <RuleRow badge="Ocean Miss" scheme="gray">
                  You hit open water. Complete the task to earn your next shot.
                </RuleRow>
              </VStack>
            </Box>

            {/* Voting on Shots */}
            <Box>
              <SectionLabel>Voting on Shots</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7" mb={3}>
                You don't fire alone. Selecting a cell creates a{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  proposal
                </Text>
                . A popup appears showing the target on a mini-board and asking your teammates to
                approve or veto.
              </Text>
              <VStack align="stretch" spacing={2}>
                <RuleRow badge="Approve" scheme="green">
                  Vote yes. Once enough teammates approve, the shot is locked in and fires.
                </RuleRow>
                <RuleRow badge="Veto" scheme="red">
                  Any single teammate can veto. The shot is cancelled and your team proposes a new
                  target.
                </RuleRow>
                <RuleRow badge="Expire" scheme="yellow">
                  Proposals expire after{' '}
                  <Text as="span" fontWeight="bold" color="#e2e8f0">
                    2 minutes
                  </Text>
                  . If nobody acts in time, the proposal cancels automatically so your team isn't
                  stuck on an AFK teammate.
                </RuleRow>
              </VStack>
            </Box>

            {/* Skip Tokens */}
            <Box>
              <SectionLabel>Skip Tokens</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7" mb={3}>
                Your team starts with a limited number of{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  skip tokens
                </Text>
                . When you land an ocean miss and don't want to complete that task, you can propose
                a skip. Your team votes on it the same way as a shot proposal. If approved, one
                token is spent and the task is bypassed so you can fire again sooner.
              </Text>
              <VStack align="stretch" spacing={2}>
                <RuleRow badge="Ocean Only" scheme="yellow">
                  Skip tokens can only be used on ocean (miss) tiles, not ship hits.
                </RuleRow>
                <RuleRow badge="Team Vote" scheme="yellow">
                  The whole team votes before a skip is used. One veto cancels it and the token is
                  preserved.
                </RuleRow>
              </VStack>
            </Box>

            {/* Cooldown */}
            <InfoCard>
              <SectionLabel>Cooldown</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7">
                After each shot, your team must wait{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  {cooldownMinutes ?? '?'} minute{cooldownMinutes !== 1 ? 's' : ''}
                </Text>{' '}
                before firing again. Use this time to coordinate on your next target. The countdown
                is shown on the board.
              </Text>
            </InfoCard>

            {/* Submitting Evidence */}
            <Box>
              <SectionLabel>Submitting Evidence</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7">
                After firing, complete the revealed task and submit your screenshot via the Discord
                bot command shown on the tile. A ref will review and approve or deny it.
              </Text>
            </Box>

            {/* Refs notice */}
            <InfoCard accentColor={AMBER}>
              <SectionLabel>Be Patient With Refs</SectionLabel>
              <Text fontSize="sm" color="#fcd34d" lineHeight="1.7">
                Refs are volunteers reviewing submissions in their own time. They may not respond
                immediately. Do not spam or pressure them. If your submission has been waiting a
                long time, reach out politely to the event organiser.
              </Text>
            </InfoCard>

            {/* Sinking Ships */}
            <Box>
              <SectionLabel>Sinking a Ship</SectionLabel>
              <Text fontSize="sm" color={BODY} lineHeight="1.7">
                A ship is sunk once{' '}
                <Text as="span" fontWeight="bold" color="#e2e8f0">
                  every cell has been hit and the task for each hit approved
                </Text>
                . The first team to sink all of the enemy's ships wins the campaign.
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
              I understand how Battleship works and I'll be patient with the refs
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
            Battle Stations
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
