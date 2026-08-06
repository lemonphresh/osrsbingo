import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, HStack, Text, SimpleGrid, Button, Icon } from '@chakra-ui/react';
import { FaArrowLeft, FaExclamationTriangle, FaInfoCircle, FaLock } from 'react-icons/fa';
import usePageTitle from '../../hooks/usePageTitle';

const NAVY = '#071523';
const BORDER = '#1e4976';
const CYAN = '#38bdf8';
const DIM = '#94a3b8';
const GREEN = '#4ade80';
const AMBER = '#fbbf24';
const PINK = '#f472b6';
const RED = '#f87171';

const TABS = ['Participants', 'Refs'];

function SectionHeader({ children }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="xs"
      color={CYAN}
      letterSpacing="widest"
      textTransform="uppercase"
      mb={4}
      mt={8}
      borderBottom="1px solid"
      borderColor={BORDER}
      pb={2}
    >
      {children}
    </Text>
  );
}

function Step({ num, title, color = CYAN, children }) {
  return (
    <HStack align="flex-start" spacing={4} mb={4}>
      <Box
        flexShrink={0}
        w="28px"
        h="28px"
        border="1px solid"
        borderColor={color}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontFamily="mono" fontSize="xs" color={color} fontWeight="bold">
          {num}
        </Text>
      </Box>
      <Box>
        {title && (
          <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color={color} mb={1}>
            {title}
          </Text>
        )}
        <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.9">
          {children}
        </Text>
      </Box>
    </HStack>
  );
}

function Callout({ color = BORDER, icon, children }) {
  return (
    <Box
      bg="#0d2137"
      border="1px solid"
      borderLeftWidth="3px"
      borderColor={BORDER}
      borderLeftColor={color}
      borderRadius="md"
      p={4}
      mb={4}
    >
      <HStack align="flex-start" spacing={3}>
        {icon && <Icon as={icon} color={color} boxSize={3} mt="2px" flexShrink={0} />}
        <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.9">
          {children}
        </Text>
      </HStack>
    </Box>
  );
}

function ParticipantGuide() {
  return (
    <Box>
      <Callout color={GREEN} icon={FaInfoCircle}>
        You are on a team competing against another team. Your goal is to sink all five of the enemy
        ships by completing OSRS tasks, one hit at a time.
      </Callout>

      <SectionHeader>Before the Game Starts</SectionHeader>
      <Step num="1" title="Join your team" color={GREEN}>
        The event creator assigns you to a team. Make sure your Discord account is linked so your
        submissions are properly attributed.
      </Step>
      <Step num="2" title="Ship placement phase" color={GREEN}>
        Your team decides where to place your five ships on a 10x10 grid. Ships range from 2 to 5
        cells. The enemy cannot see your board.
      </Step>
      <Step num="3" title="Placement lock" color={GREEN}>
        Once your team is happy with the layout, leave it be until the Battle Phase begins.
      </Step>

      <SectionHeader>During the Battle</SectionHeader>
      <Step num="1" title="Vote on a shot" color={CYAN}>
        When it is time to fire, your team proposes coordinates to target on the enemy board. Once
        enough team members approve the proposal, the team member who proposed the shot must press
        "FIRE".
      </Step>
      <Step num="2" title="Hit — complete the task" color={CYAN}>
        If you hit an enemy ship cell, a task is revealed. Submit a pre-screenshot first if
        applicable, complete the task, then submit your completion screenshot(s).
      </Step>
      <Step num="3" title="Miss — skip or complete" color={CYAN}>
        If you hit ocean, a task still appears. Ocean tasks can be skipped using a skip token. Skip
        tokens are limited, so use them wisely. You can also just complete the task normally.
      </Step>
      <Step num="4" title="Wait for ref sign-off" color={CYAN}>
        Your team is locked from firing until a ref reviews your screenshot and marks the task
        complete. Check the event page to see when you are cleared.
      </Step>
      <Step num="5" title="Cooldown" color={CYAN}>
        After each shot there is a cooldown before your team can fire again. The timer is shown on
        the event page.
      </Step>
      <Step num="6" title="Getting hit" color={AMBER}>
        The enemy fires at your board too. If they hit one of your ship cells, you will get a
        Discord notification.
      </Step>

      <SectionHeader>Submissions</SectionHeader>
      <Callout color={CYAN} icon={FaInfoCircle}>
        All proof is submitted via Discord. Your team channel receives a notification when a task is
        assigned.
      </Callout>
      <Step num="1" title="Pre-screenshot (baseline)" color={CYAN}>
        Before doing the task, submit a screenshot showing your current state: collection log, total
        xp or kill count depending on the task. This establishes a verifiable starting point.
      </Step>
      <Step num="2" title="Completion screenshot" color={CYAN}>
        After completing the task, submit your proof. The ref compares it against your baseline and
        approves or denies.
      </Step>

      <SectionHeader>Skip Tokens</SectionHeader>
      <Callout color={AMBER} icon={FaExclamationTriangle}>
        Skip tokens let your team bypass an ocean (miss) task without completing it. The event
        creator sets the starting count. Use them strategically: save them for tasks that would take
        too long or when you need to fire quickly.
      </Callout>

      <SectionHeader>Winning</SectionHeader>
      <Callout color={GREEN} icon={FaInfoCircle}>
        You win when all five enemy ships are sunk. A ship is sunk when every cell has been hit and
        its task completed and verified by a ref.
      </Callout>
    </Box>
  );
}

function RefGuide() {
  return (
    <Box>
      <Callout color={PINK} icon={FaInfoCircle}>
        As a ref, you review submissions and keep the game moving. You have access to the refs panel
        for any event you are assigned to. The event creator has the same access plus the ability to
        manage event settings.
      </Callout>

      <SectionHeader>Your Responsibilities</SectionHeader>
      <Step num="1" title="Review pre-screenshots" color={PINK}>
        When a task is assigned after a shot fires, players must submit a baseline screenshot before
        doing the task. Check that it shows a credible starting state: kill count, starting xp, or
        collection log. Approve to confirm the baseline, or deny with a reason.
      </Step>
      <Step num="2" title="Review completion screenshots" color={PINK}>
        After a player submits their completion proof, compare it against the baseline. Did they
        complete the task from that starting point? Approve or deny with a clear reason and update
        the progress bar. This will also update the team's interface with their progress.
      </Step>
      <Step num="3" title="Mark tasks complete" color={PINK}>
        Once satisfied with the proof, explicitly mark the tile as complete on the refs panel. This
        is what unlocks the team to fire again. Approving a screenshot alone does not do this.
      </Step>

      <SectionHeader>The Refs Panel</SectionHeader>
      <Callout color={PINK} icon={FaInfoCircle}>
        Access the refs panel via the link on the event page. It shows all pending submissions
        grouped by tile, updating live as new ones come in. Reviewed submissions stay visible
        briefly so you can take follow-up actions before they filter away.
      </Callout>

      <SectionHeader>Submission Types</SectionHeader>
      <SimpleGrid columns={[1, 2]} spacing={4} mb={4}>
        <Box bg="#0d2137" border="1px solid" borderColor={BORDER} borderRadius="md" p={4}>
          <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color={CYAN} mb={2}>
            Pre-Screenshot
          </Text>
          <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.8">
            Submitted before the task starts. Establishes a baseline. Approve it to confirm you have
            seen a valid starting point. Deny if it looks invalid or staged.
          </Text>
        </Box>
        <Box bg="#0d2137" border="1px solid" borderColor={BORDER} borderRadius="md" p={4}>
          <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color={GREEN} mb={2}>
            Completion Screenshot
          </Text>
          <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.8">
            Submitted after completing the task. Compare against the baseline. If the gain is
            verified, approve and then mark the tile complete to unblock the team.
          </Text>
        </Box>
      </SimpleGrid>

      <SectionHeader>Discord Notifications</SectionHeader>
      <Callout color={AMBER} icon={FaInfoCircle}>
        Discord messages are sent automatically when you approve or deny a submission. Players are
        mentioned so they know the status immediately. You do not need to post manually in team
        channels.
      </Callout>

      <SectionHeader>What You Cannot Do</SectionHeader>
      <Callout color={RED} icon={FaLock}>
        Refs cannot create or delete events, add or remove teams, change event settings, or manage
        other refs. Those actions belong to the event creator only.
      </Callout>
    </Box>
  );
}

export default function BattleshipGuidePage() {
  usePageTitle('Battleship — Game Guide');
  const [tab, setTab] = useState(0);

  return (
    <Box flex="1" minH="100vh" bg={NAVY}>
      <Box borderBottom="1px solid" borderColor={BORDER} position="relative" overflow="hidden">
        <Box
          position="absolute"
          inset={0}
          opacity={0.04}
          backgroundImage="repeating-linear-gradient(0deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px)"
          pointerEvents="none"
        />
        <Box maxW="900px" mx="auto" px={[4, 6, 8]} py={[10, 14]} position="relative" zIndex={1}>
          <RouterLink to="/battleship">
            <HStack spacing={2} mb={4} color={DIM} _hover={{ color: CYAN }}>
              <Icon as={FaArrowLeft} boxSize={3} />
              <Text
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Back to Campaigns
              </Text>
            </HStack>
          </RouterLink>
          <Text
            fontFamily="mono"
            fontSize={['2xl', '4xl']}
            fontWeight="bold"
            color="#e2e8f0"
            letterSpacing="widest"
            textTransform="uppercase"
            lineHeight="1"
          >
            BATTLESHIP
          </Text>
          <Text fontFamily="mono" fontSize="sm" color={DIM} letterSpacing="wider" mt={2}>
            Game Guide
          </Text>
          <HStack spacing={2} mt={4}>
            <Box w="32px" h="1px" bg={CYAN} />
            <Box w="8px" h="1px" bg={BORDER} />
          </HStack>
        </Box>
      </Box>

      <Box borderBottom="1px solid" borderColor={BORDER} bg="#0a1c2e">
        <Box maxW="900px" mx="auto" px={[4, 6, 8]}>
          <HStack spacing={0}>
            {TABS.map((t, i) => (
              <Box
                key={t}
                px={5}
                py={3}
                cursor="pointer"
                borderBottom="2px solid"
                borderColor={tab === i ? CYAN : 'transparent'}
                onClick={() => setTab(i)}
                _hover={{ borderColor: tab === i ? CYAN : BORDER }}
              >
                <Text
                  fontFamily="mono"
                  fontSize="xs"
                  color={tab === i ? CYAN : DIM}
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  {t}
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>
      </Box>

      <Box maxW="900px" mx="auto" px={[4, 6, 8]} py={[8, 12]}>
        {tab === 0 ? <ParticipantGuide /> : <RefGuide />}

        <Box mt={12} pt={6} borderTop="1px solid" borderColor={BORDER}>
          <RouterLink to="/battleship">
            <Button
              size="sm"
              variant="outline"
              colorScheme="cyan"
              borderColor={BORDER}
              color={CYAN}
              fontFamily="mono"
              fontSize="xs"
              letterSpacing="widest"
              textTransform="uppercase"
              leftIcon={<Icon as={FaArrowLeft} boxSize={3} />}
              _hover={{ bg: '#0d2137', borderColor: CYAN }}
            >
              Back to Campaigns
            </Button>
          </RouterLink>
        </Box>
      </Box>
    </Box>
  );
}
