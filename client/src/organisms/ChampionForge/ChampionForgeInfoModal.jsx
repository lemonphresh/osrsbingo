import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Flex,
  Image,
  SimpleGrid,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import CfGathering from '../../assets/cfgathering.webp';
import CfOutfitting from '../../assets/cfoutfittingpreview.webp';
import CfBattle from '../../assets/cfbattle.webp';
import CfDraft from '../../assets/cfdraft.webp';
import Infernal from '../../assets/infernal.png';
import theme from '../../theme';
import GemTitle from '../../atoms/GemTitle';
import usePageTitle from '../../hooks/usePageTitle';

const PHASES = [
  {
    number: '01',
    name: 'Draft',
    color: theme.colors.purple[400],
    borderColor: theme.colors.purple[600],
    icon: '📋',
    preview: CfDraft,
    desc: (
      <>
        Admins set up teams, configure event rules, and import rosters.{' '}
        <Link
          to="/blind-draft"
          style={{ color: theme.colors.pink[300], textDecoration: 'underline' }}
        >
          Blind draft
        </Link>{' '}
        support means captains pick players by stats alone, names hidden until selections are
        locked.
      </>
    ),
  },
  {
    number: '02',
    name: 'Gathering',
    color: theme.colors.green[400],
    borderColor: theme.colors.green[600],
    icon: '⛏️',
    preview: CfGathering,
    desc: 'Teams race to complete OSRS tasks: boss kills, collection log drops, skilling milestones. Each completion earns armor, weapons, consumables and more for your war chest. Discord submissions with screenshot proof keep it honest.',
  },
  {
    number: '03',
    name: 'Outfitting',
    color: theme.colors.blue[400],
    borderColor: theme.colors.blue[600],
    icon: '🛡️',
    preview: CfOutfitting,
    desc: 'Spend your war chest to build your champion. Allocate stats across Attack, Defense, HP, and Speed. Equip gear unlocked from gathering: weapons, armor, trinkets, and special abilities that define your fight style.',
  },
  {
    number: '04',
    name: 'Battle',
    color: theme.colors.red[400],
    borderColor: theme.colors.red[600],
    icon: '⚔️',
    preview: CfBattle,
    desc: 'Champions face off in a single or double elimination bracket. Turn-based combat plays out in real time with specials, consumables, bleed, lifesteal, and chain lightning. Watch replays of every fight after the dust settles.',
  },
];

const FEATURES = [
  {
    icon: '📡',
    label: 'Live Submissions',
    desc: 'Discord webhook integration for real-time screenshot submissions. Admins approve or deny via the panel; players get instant feedback with sound cues.',
    color: theme.colors.teal[400],
  },
  {
    icon: '⚡',
    label: 'Deep Combat',
    desc: 'Specials like Fortress, Chain Lightning, Barrage, Cleave, Ambush, and Lifesteal. Items that heal, debuff, or deal magic damage. Crits, bleed ticks, and full stat interaction.',
    color: theme.colors.yellow[400],
  },
  {
    icon: '🏆',
    label: 'Bracket Tournaments',
    desc: 'Single or double elimination. Matchups auto-seed by team performance. Replay every battle blow-by-blow after the fact.',
    color: theme.colors.orange[400],
  },
  {
    icon: '📊',
    label: 'Stat Building',
    desc: 'Each champion has ATK, DEF, HP, and SPD. Gear and specials modify these live. Outfitting phase is a mini-RPG before the main event.',
    color: theme.colors.purple[400],
  },
  {
    icon: '🎒',
    label: 'War Chest',
    desc: 'Completing gathering tasks earns crafting materials that go into your team war chest. What you earn determines what you can build in outfitting.',
    color: theme.colors.green[400],
  },
];

export function ChampionForgeLanding({ hideActions = false }) {
  usePageTitle('Champion Forge');

  return (
    <Flex flex="1" flexDirection="column" height="100%">
      {/* Hero */}
      <Box
        position="relative"
        overflow="hidden"
        minHeight={['280px', '360px', '420px']}
        backgroundImage={`linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.87) 100%), url(${Infernal})`}
        backgroundSize="cover"
        backgroundPosition="center"
      >
        {/* Decorative glow */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          width="600px"
          height="600px"
          borderRadius="50%"
          background="radial-gradient(circle, rgba(214,158,46,0.12) 0%, transparent 70%)"
          pointerEvents="none"
        />
        <Flex
          position="relative"
          zIndex={1}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight={['280px', '360px', '420px']}
          paddingX={['16px', '24px', '64px']}
          textAlign="center"
        >
          <Text fontSize={['3xl', '4xl', '5xl']} mb={2}>
            ⚔️
          </Text>
          <GemTitle gemColor="yellow">Champion Forge</GemTitle>
          <Text
            fontSize={['md', 'lg']}
            color="gray.300"
            maxWidth="560px"
            marginBottom="32px"
            marginTop="8px"
          >
            The full clan tournament experience for OSRS. Four phases. Real combat. One champion.
          </Text>
          {!hideActions && (
            <Badge
              fontSize="sm"
              px={4}
              py={2}
              borderRadius="full"
              bg={theme.colors.yellow[800]}
              color={theme.colors.yellow[200]}
              letterSpacing="wider"
            >
              COMING SOON
            </Badge>
          )}
        </Flex>
      </Box>

      {/* Content */}
      <Flex
        flexDirection="column"
        paddingX={['16px', '24px', '64px']}
        paddingBottom={['32px', '64px']}
        paddingTop="48px"
      >
        {/* What is it */}
        <Box
          marginBottom="48px"
          padding={['20px', '28px']}
          backgroundColor={theme.colors.teal[900]}
          borderRadius="12px"
          borderWidth="1px"
          borderColor={theme.colors.yellow[700]}
          borderLeftWidth="4px"
          borderLeftColor={theme.colors.yellow[400]}
        >
          <Text
            fontSize="lg"
            fontWeight="semibold"
            color={theme.colors.yellow[300]}
            marginBottom="12px"
          >
            What is Champion Forge?
          </Text>
          <Text fontSize="sm" color="gray.300" lineHeight="1.8">
            Champion Forge turns your OSRS clan into a full RPG tournament. Teams compete across
            four phases: team and event setup, completing in-game tasks to generously supply a war
            chest, outfitting a champion with gear and specials earned through tasks completed, and
            finally battling head-to-head in a live turn-based bracket. Everything ties back to what
            your team actually accomplished in Old School RuneScape.
          </Text>
        </Box>

        {/* Phases */}
        <Text
          fontSize="lg"
          fontWeight="semibold"
          textAlign="center"
          marginBottom="24px"
          color={theme.colors.yellow[300]}
        >
          The Four Phases
        </Text>
        <SimpleGrid columns={[1, 2, 2, 4]} spacing={4} marginBottom="48px">
          {PHASES.map((phase) => (
            <Box
              key={phase.number}
              padding={['18px', '24px']}
              backgroundColor={theme.colors.teal[900]}
              borderRadius="10px"
              borderWidth="2px"
              borderColor={phase.borderColor}
              display="flex"
              flexDirection="column"
            >
              {phase.preview && (
                <Image
                  src={phase.preview}
                  alt={phase.name}
                  borderRadius="6px"
                  mb={3}
                  w="100%"
                  objectFit="cover"
                  maxH="140px"
                />
              )}
              <HStack marginBottom="8px">
                <Text fontSize="xl">{phase.icon}</Text>
                <Text fontSize="xs" color="gray.500" letterSpacing="widest" fontWeight="semibold">
                  PHASE {phase.number}
                </Text>
              </HStack>
              <Text fontSize="md" fontWeight="bold" color={phase.color} marginBottom="10px">
                {phase.name}
              </Text>
              <Text fontSize="sm" color="gray.400" lineHeight="1.7">
                {phase.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Features */}
        <Text
          fontSize="lg"
          fontWeight="semibold"
          textAlign="center"
          marginBottom="24px"
          color={theme.colors.yellow[300]}
        >
          Built-In Features
        </Text>
        <SimpleGrid columns={[1, 2, 3]} spacing={4} marginBottom="48px">
          {FEATURES.map((f) => (
            <Flex
              key={f.label}
              padding="20px"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="8px"
              borderLeftWidth="3px"
              borderLeftColor={f.color}
              flexDirection="column"
            >
              <HStack marginBottom="8px">
                <Text fontSize="lg">{f.icon}</Text>
                <Text fontWeight="semibold" fontSize="sm" color={f.color}>
                  {f.label}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.400" lineHeight="1.6">
                {f.desc}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>

        {/* How a tournament runs */}
        <Box
          marginBottom="48px"
          padding={['20px', '28px']}
          backgroundColor={theme.colors.teal[900]}
          borderRadius="12px"
          borderWidth="1px"
          borderColor={theme.colors.teal[600]}
        >
          <Text
            fontSize="md"
            fontWeight="semibold"
            color={theme.colors.pink[300]}
            marginBottom="16px"
          >
            How a Tournament Runs
          </Text>
          <VStack align="stretch" spacing={3}>
            {[
              [
                '1.',
                'An admin creates the event, sets the gathering duration, task list, and team setup.',
              ],
              [
                '2.',
                'The gathering phase begins. Players post screenshot proof of completed tasks in a Discord channel. Admins review submissions in real time.',
              ],
              [
                '3.',
                "Completed tasks award armor, weapons, consumables and more to the team's war chest.",
              ],
              [
                '4.',
                'Outfitting opens. Captains and team members collaborate to spend their war chest to build and equip a team champion for the epic battle.',
              ],
              [
                '5.',
                'Battle phase launches the bracket. Champions fight turn-based battles that play out live. Spectators can watch. Replays are saved.',
              ],
              ['6.', 'The bracket closes and a winner is crowned.'],
            ].map(([num, text]) => (
              <HStack key={num} align="flex-start" spacing={3}>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={theme.colors.yellow[400]}
                  flexShrink={0}
                  minW="24px"
                >
                  {num}
                </Text>
                <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                  {text}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* CTA */}
        {!hideActions && (
          <Box
            textAlign="center"
            padding={['24px', '36px']}
            backgroundColor={theme.colors.gray[800]}
            borderRadius="12px"
            borderWidth="1px"
            borderColor={theme.colors.yellow[700]}
          >
            <Text
              fontSize="xl"
              fontWeight="semibold"
              color={theme.colors.yellow[300]}
              marginBottom="8px"
            >
              Champion Forge is coming soon.
            </Text>
            <Text fontSize="sm" color="gray.400" marginBottom="24px">
              We're putting the final touches on combat balance, bracket generation, and Discord
              integration. Sign up now so you're ready to run a tournament the moment it launches.
            </Text>
            <HStack justifyContent="center" spacing={4} flexWrap="wrap">
              <a href="/signup">
                <Button
                  backgroundColor={theme.colors.yellow[600]}
                  color={theme.colors.gray[900]}
                  height="48px"
                  paddingX="32px"
                  fontWeight="semibold"
                  _hover={{ backgroundColor: theme.colors.yellow[500] }}
                >
                  Create an Account
                </Button>
              </a>
              <a href="/boards">
                <Button
                  variant="outline"
                  borderColor={theme.colors.teal[500]}
                  color={theme.colors.teal[300]}
                  height="48px"
                  paddingX="28px"
                  _hover={{ backgroundColor: theme.colors.teal[900] }}
                >
                  Explore Bingo Boards
                </Button>
              </a>
            </HStack>
          </Box>
        )}
      </Flex>
    </Flex>
  );
}

export function ChampionForgeInfoModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="gray.900" maxH="90vh" borderRadius="xl">
        <ModalCloseButton color="gray.400" size="lg" top={3} right={4} zIndex={10} />
        <ModalBody p={0} overflowY="auto">
          <ChampionForgeLanding hideActions />
          <Box
            padding="20px 32px"
            borderTopWidth="1px"
            borderColor={theme.colors.gray[700]}
            textAlign="center"
          >
            <Link to="/champion-forge/guide" onClick={onClose}>
              <Text
                fontSize="sm"
                color={theme.colors.teal[400]}
                _hover={{ textDecoration: 'underline' }}
              >
                📖 Read the Full Event Guide
              </Text>
            </Link>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
