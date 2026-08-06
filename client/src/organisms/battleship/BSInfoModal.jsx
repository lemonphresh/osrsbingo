import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Icon,
  Button,
} from '@chakra-ui/react';
import {
  FaCog,
  FaShip,
  FaCrosshairs,
  FaTrophy,
  FaUser,
  FaGavel,
  FaUsers,
  FaBook,
} from 'react-icons/fa';

const NAVY = '#071523';
const BORDER = '#1e4976';
const CYAN = '#38bdf8';
const DIM = '#94a3b8';

const PHASES = [
  {
    num: '01',
    icon: FaCog,
    label: 'Setup',
    color: '#a78bfa',
    border: '#6d28d9',
    desc: 'The event creator configures the campaign: team names, ship templates, cooldown timers, and the task pool. Refs are assigned, teams are formed, and the ship placement phase is opened.',
  },
  {
    num: '02',
    icon: FaShip,
    label: 'Placement',
    color: '#38bdf8',
    border: '#0369a1',
    desc: "Each team secretly arranges their fleet on a 10x10 grid. Once all ships are placed and locked, the game begins. Neither team can see the other's board.",
  },
  {
    num: '03',
    icon: FaCrosshairs,
    label: 'Battle',
    color: '#4ade80',
    border: '#15803d',
    desc: 'Teams vote on where to fire. When a proposal reaches the vote threshold it fires. A hit means that team must complete an OSRS task assigned to that ship cell before they can fire again. Refs verify proof screenshots.',
  },
  {
    num: '04',
    icon: FaTrophy,
    label: 'Victory',
    color: '#fbbf24',
    border: '#b45309',
    desc: "The first team to sink all five enemy ships wins. A ship is sunk when every hit cell's task is completed and verified by a ref.",
  },
];

const ROLES = [
  {
    icon: FaUser,
    label: 'Event Creator',
    color: '#f472b6',
    points: [
      'Creates the event and configures all settings',
      'Assigns refs and manages the event lifecycle',
      'Starts placement and battle phases',
      'Has full access to the refs panel',
    ],
  },
  {
    icon: FaGavel,
    label: 'Refs',
    color: '#38bdf8',
    points: [
      'Review pre-screenshot baselines submitted by players',
      'Approve or deny completion screenshots',
      'Mark tasks complete once proof is verified',
      'Can update tile progress and skip ocean tasks',
    ],
  },
  {
    icon: FaUsers,
    label: 'Participants',
    color: '#4ade80',
    points: [
      'Placed on a team by the event creator',
      'Vote on where to fire each shot',
      'Submit pre-screenshots and completion proof via Discord',
      'Use skip tokens to bypass ocean (miss) tasks',
    ],
  },
];

function Section({ title, children }) {
  return (
    <Box mb={8}>
      <Text
        fontFamily="mono"
        fontSize="xs"
        color={CYAN}
        letterSpacing="widest"
        textTransform="uppercase"
        mb={4}
        borderBottom="1px solid"
        borderColor={BORDER}
        pb={2}
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

function BSInfoContent({ embedded = false }) {
  return (
    <Box bg={NAVY} color="#e2e8f0" fontFamily="mono" p={embedded ? 0 : [5, 8]}>
      {!embedded && (
        <Box position="relative" mx={-8} mt={-8} mb={8} px={8} pt={8} pb={6} overflow="hidden">
          <Box
            position="absolute"
            inset={0}
            opacity={0.04}
            pointerEvents="none"
            backgroundImage="repeating-linear-gradient(0deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px)"
          />
          <VStack align="flex-start" spacing={2} position="relative" zIndex={1}>
            <Text
              fontSize={['2xl', '3xl']}
              fontWeight="bold"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              BATTLESHIP
            </Text>
            <Text fontSize="sm" color={DIM} letterSpacing="wide">
              A strategic OSRS naval warfare event. Sink the enemy fleet by completing in-game tasks.
            </Text>
            <HStack spacing={2} pt={1}>
              <Box w="32px" h="1px" bg={CYAN} />
              <Box w="8px" h="1px" bg={BORDER} />
              <Box w="4px" h="1px" bg={BORDER} />
            </HStack>
          </VStack>
        </Box>
      )}

      <Section title="The Four Phases">
        <SimpleGrid columns={[1, 2]} spacing={4}>
          {PHASES.map((p) => (
            <Box
              key={p.num}
              bg="#0d2137"
              border="1px solid"
              borderColor={p.border}
              borderRadius="md"
              p={4}
            >
              <HStack mb={2}>
                <Icon as={p.icon} color={p.color} boxSize={3} />
                <Text fontSize="9px" color={DIM} letterSpacing="widest" textTransform="uppercase">
                  Phase {p.num}
                </Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color={p.color} mb={2}>
                {p.label}
              </Text>
              <Text fontSize="xs" color={DIM} lineHeight="1.8">
                {p.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Section>

      <Section title="Roles">
        <VStack align="stretch" spacing={3}>
          {ROLES.map((r) => (
            <Box
              key={r.label}
              bg="#0d2137"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="md"
              p={4}
            >
              <HStack mb={2}>
                <Icon as={r.icon} color={r.color} boxSize={3} />
                <Text fontSize="sm" fontWeight="bold" color={r.color} letterSpacing="wide">
                  {r.label}
                </Text>
              </HStack>
              <VStack align="stretch" spacing={1}>
                {r.points.map((pt) => (
                  <HStack key={pt} align="flex-start" spacing={2}>
                    <Text fontSize="xs" color={CYAN} flexShrink={0}>
                      ›
                    </Text>
                    <Text fontSize="xs" color={DIM} lineHeight="1.7">
                      {pt}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      </Section>

      <Section title="Key Rules">
        <VStack align="stretch" spacing={2}>
          {[
            'Each team has five ships hidden on a 10x10 grid. Ships range from 2 to 5 cells.',
            'To fire, your team votes on a coordinate. Once the vote threshold is met, the shot fires automatically.',
            'A hit reveals a task. Your team cannot fire again until a ref marks that task complete.',
            'A miss also reveals a task, but ocean tasks can be skipped using skip tokens.',
            'All proof must be submitted via Discord. A ref reviews the screenshot before marking it done.',
            'The cooldown timer starts after each shot, regardless of hit or miss.',
            'The game ends when one team has all their ship cells shot and every task completed.',
          ].map((rule, i) => (
            <HStack key={i} align="flex-start" spacing={3}>
              <Text fontSize="xs" color={CYAN} flexShrink={0} fontWeight="bold">
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text fontSize="xs" color={DIM} lineHeight="1.8">
                {rule}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Section>

      <Box
        bg="#0d2137"
        border="1px solid"
        borderColor={BORDER}
        borderRadius="md"
        p={4}
        textAlign="center"
      >
        <Text fontSize="xs" color={DIM} mb={2}>
          Want the full breakdown for refs and participants?
        </Text>
        <RouterLink to="/battleship/guide">
          <HStack justify="center" spacing={2}>
            <Icon as={FaBook} color={CYAN} boxSize={3} />
            <Text fontSize="sm" color={CYAN} _hover={{ textDecoration: 'underline' }}>
              Read the Full Game Guide
            </Text>
          </HStack>
        </RouterLink>
      </Box>
    </Box>
  );
}

export function BSLanding() {
  return (
    <Box flex="1" minH="100vh" bg={NAVY}>
      {/* Hero */}
      <Box borderBottom="1px solid" borderColor={BORDER} position="relative" overflow="hidden">
        <Box
          position="absolute"
          inset={0}
          opacity={0.04}
          pointerEvents="none"
          backgroundImage="repeating-linear-gradient(0deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px)"
        />
        <Box maxW="1200px" mx="auto" px={[4, 6, 8]} py={[12, 16, 20]} position="relative" zIndex={1}>
          <VStack align="flex-start" spacing={4}>
            <Text
              fontFamily="mono"
              fontSize={['3xl', '5xl', '6xl']}
              fontWeight="bold"
              color="#e2e8f0"
              letterSpacing="widest"
              textTransform="uppercase"
              lineHeight="1"
            >
              BATTLESHIP
            </Text>
            <Text fontFamily="mono" fontSize={['xs', 'sm']} color={DIM} letterSpacing="wider" textTransform="uppercase">
              A strategic OSRS naval warfare event
            </Text>
            <HStack spacing={2} pt={1}>
              <Box w="32px" h="1px" bg={CYAN} />
              <Box w="8px" h="1px" bg={BORDER} />
              <Box w="4px" h="1px" bg={BORDER} />
            </HStack>
            <HStack spacing={3} pt={2} flexWrap="wrap">
              <RouterLink to="/login">
                <Button
                  size="sm"
                  colorScheme="cyan"
                  fontFamily="mono"
                  fontSize="xs"
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  Log In to Get Started
                </Button>
              </RouterLink>
              <RouterLink to="/battleship/guide">
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={BORDER}
                  color={CYAN}
                  fontFamily="mono"
                  fontSize="xs"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  _hover={{ bg: '#0d2137', borderColor: CYAN }}
                >
                  Full Guide
                </Button>
              </RouterLink>
            </HStack>
          </VStack>
        </Box>
      </Box>

      {/* Info content */}
      <Box maxW="1200px" mx="auto" px={[4, 6, 8]} py={[8, 10, 12]}>
        <BSInfoContent embedded />
      </Box>
    </Box>
  );
}

export function BSInfoModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent
        bg={NAVY}
        maxH="90vh"
        borderRadius="xl"
        border="1px solid"
        borderColor={BORDER}
        overflow="hidden"
      >
        <ModalCloseButton color={DIM} size="lg" top={3} right={4} zIndex={10} />
        <ModalBody p={0} overflowY="auto">
          <BSInfoContent />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
