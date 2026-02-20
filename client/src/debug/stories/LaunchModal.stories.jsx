import React, { useRef } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  Text,
  VStack,
  useDisclosure,
  PopoverBody,
  PopoverHeader,
  PopoverArrow,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@chakra-ui/react';
import { FaRocket, FaDiscord, FaQuestionCircle } from 'react-icons/fa';
import { StoryLayout } from '../StoryLayout';

// ─── Updated member shape to match TreasureTeamMember ────────────────────────
const makeMember = (discordUserId, discordUsername, discordAvatar = null, username = null) => ({
  discordUserId,
  discordUsername,
  discordAvatar,
  username,
});

const MEMBERS_REGISTERED = [
  makeMember('760302537001271336', 'Fruitlord', 'abc123', 'fruitlord'),
  makeMember('111111111111111111', 'DragonSlayer', 'def456', 'dragonslayer'),
  makeMember('222222222222222222', 'ZulrahKing', 'ghi789', 'zulrahking'),
  makeMember('333333333333333333', 'IronMaiden', 'jkl012', 'ironmaiden'),
  makeMember('444444444444444444', 'GWDHero', 'mno345', 'gwdhero'),
];

const MEMBERS_UNREGISTERED = [
  makeMember('555555555555555555', 'PureNoob', null, null),
  makeMember('666666666666666666', 'SkillPure', null, null),
  makeMember('777777777777777777', null, null, null),
];

const MEMBERS_MIXED = [...MEMBERS_REGISTERED, ...MEMBERS_UNREGISTERED];

// ─── Mock events ─────────────────────────────────────────────────────────────
const BASE_EVENT = {
  eventId: 'event_debug_001',
  eventName: 'Summer Gielinor Rush 2025',
  startDate: '2025-06-01T00:00:00Z',
  endDate: '2025-06-14T00:00:00Z',
  nodes: Array.from({ length: 42 }, (_, i) => ({ nodeId: `node_${i}` })),
  discordConfig: { confirmed: true },
};

const MOCK_EVENTS = {
  all_good: {
    ...BASE_EVENT,
    teams: [
      { teamId: 'team_001', teamName: 'Dragon Slayers', members: MEMBERS_REGISTERED },
      { teamId: 'team_002', teamName: 'Iron Legends', members: MEMBERS_MIXED },
    ],
  },
  large_teams: {
    ...BASE_EVENT,
    teams: [
      {
        teamId: 'team_001',
        teamName: 'Dragon Slayers',
        members: [
          ...MEMBERS_REGISTERED,
          makeMember('888888888888888881', 'Vorkath_Pro', 'aaa', 'vorkathpro'),
          makeMember('888888888888888882', 'Inferno_Chad', 'bbb', 'infernocahd'),
          makeMember('888888888888888883', 'AlchemyBot', 'ccc', 'alchemybot'),
          makeMember('888888888888888884', 'BarrowsBoss', 'ddd', 'barrowsboss'),
          makeMember('888888888888888885', 'SerpHelmGang', 'eee', 'serphelmgang'),
          makeMember('888888888888888886', 'CoxSweater', 'fff', 'coxsweater'),
          makeMember('888888888888888887', null, null, null),
        ],
      },
      { teamId: 'team_002', teamName: 'Iron Legends', members: MEMBERS_MIXED },
      {
        teamId: 'team_003',
        teamName: 'Skillers United',
        members: [
          makeMember('999999999999999991', 'WoodcutQueen', 'zzz', 'woodcutqueen'),
          makeMember('999999999999999992', 'FishingMaster', null, null),
        ],
      },
    ],
  },
  no_discord: {
    ...BASE_EVENT,
    discordConfig: { confirmed: false },
    teams: [{ teamId: 'team_001', teamName: 'Dragon Slayers', members: MEMBERS_REGISTERED }],
  },
  empty_members: {
    ...BASE_EVENT,
    teams: [{ teamId: 'team_001', teamName: 'No Members Yet', members: [] }],
  },
  no_nodes: {
    ...BASE_EVENT,
    nodes: [],
    teams: [{ teamId: 'team_001', teamName: 'Dragon Slayers', members: MEMBERS_REGISTERED }],
  },
};

// ─── Single member row ────────────────────────────────────────────────────────
function MemberRow({ member, index }) {
  const displayName = member.discordUsername ?? `Unknown (…${member.discordUserId.slice(-6)})`;
  const isRegistered = !!member.username;
  const avatarSrc = member.discordAvatar
    ? `https://cdn.discordapp.com/avatars/${member.discordUserId}/${member.discordAvatar}.png`
    : undefined;

  return (
    <HStack
      px={3}
      py={2}
      bg={index % 2 === 0 ? 'gray.750' : 'gray.700'}
      _first={{ borderTopRadius: 'md' }}
      _last={{ borderBottomRadius: 'md' }}
      spacing={3}
    >
      <Avatar size="xs" name={displayName} src={avatarSrc} bg="blue.600" color="white" />
      <VStack align="start" spacing={0} flex={1} minW={0}>
        <HStack spacing={2}>
          <Icon as={FaDiscord} color="blue.300" boxSize={3} />
          <Text fontSize="sm" color="white" fontWeight="medium" isTruncated>
            {displayName}
          </Text>
        </HStack>
        {member.username && (
          <Text fontSize="xs" color="gray.400" isTruncated>
            @{member.username}
          </Text>
        )}
      </VStack>
      <Badge colorScheme={isRegistered ? 'green' : 'yellow'} fontSize="2xs" flexShrink={0}>
        {isRegistered ? 'Registered' : 'Unregistered'}
      </Badge>
    </HStack>
  );
}

// ─── Teams accordion ──────────────────────────────────────────────────────────
function TeamsAccordion({ teams }) {
  if (!teams?.length) {
    return (
      <Text fontSize="sm" color="red.400">
        ⚠️ No teams created
      </Text>
    );
  }

  return (
    <Accordion allowMultiple>
      {teams.map((team) => {
        const memberCount = team.members?.length ?? 0;
        const hasMembers = memberCount > 0;
        const unregisteredCount = team.members?.filter((m) => !m.username).length ?? 0;

        return (
          <AccordionItem key={team.teamId} border="none" mb={2}>
            {({ isExpanded }) => (
              <>
                <AccordionButton
                  bg="gray.700"
                  borderRadius={isExpanded ? '8px 8px 0 0' : 'md'}
                  borderLeft="3px solid"
                  borderLeftColor={hasMembers ? 'blue.400' : 'red.400'}
                  _hover={{ bg: 'gray.650' }}
                  px={3}
                  py={2.5}
                >
                  <HStack flex={1} spacing={3} minW={0}>
                    <Text fontWeight="semibold" color="white" fontSize="sm" isTruncated>
                      {team.teamName}
                    </Text>
                    <Badge colorScheme={hasMembers ? 'blue' : 'red'} fontSize="2xs" flexShrink={0}>
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </Badge>
                    {unregisteredCount > 0 && (
                      <Popover trigger="hover" placement="top" isLazy>
                        <PopoverTrigger>
                          <Badge
                            colorScheme="yellow"
                            fontSize="2xs"
                            flexShrink={0}
                            cursor="help"
                            display="inline-flex"
                            alignItems="center"
                            gap={1}
                          >
                            {unregisteredCount} unregistered
                            <Icon as={FaQuestionCircle} boxSize="2.5" />
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent
                          bg="gray.700"
                          borderColor="yellow.600"
                          color="white"
                          maxW="260px"
                          fontSize="xs"
                          _focus={{ outline: 'none' }}
                        >
                          <PopoverArrow bg="gray.700" />
                          <PopoverHeader
                            fontWeight="bold"
                            color="yellow.300"
                            borderBottomColor="gray.600"
                            fontSize="xs"
                          >
                            What does unregistered mean?
                          </PopoverHeader>
                          <PopoverBody>
                            <VStack align="start" spacing={2}>
                              <Text>
                                These players are in your Discord but haven't created an{' '}
                                <Text as="span" color="yellow.300" fontWeight="semibold">
                                  OSRS Bingo Hub
                                </Text>{' '}
                                account and linked it to their Discord yet.
                              </Text>
                              <Text>
                                They can still play via Discord commands, but they{' '}
                                <Text as="span" color="red.300" fontWeight="semibold">
                                  won't be able to access their team page
                                </Text>{' '}
                                on the website.
                              </Text>
                              <Box
                                p={2}
                                bg="gray.800"
                                borderRadius="md"
                                borderLeft="2px solid"
                                borderLeftColor="blue.400"
                              >
                                <HStack spacing={1.5} mb={1}>
                                  <Icon as={FaDiscord} color="blue.300" boxSize={3} />
                                  <Text fontWeight="bold" color="blue.300">
                                    How to register
                                  </Text>
                                </HStack>
                                <Text color="gray.300">
                                  Ask them to sign up here at{' '}
                                  <Text as="span" color="white" fontWeight="semibold">
                                    osrsbingohub.com
                                  </Text>
                                  , then link their Discord in account settings. It's quick and
                                  keeps their credentials safe; we never store passwords or share
                                  data.
                                </Text>
                              </Box>
                            </VStack>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                    )}
                  </HStack>
                  <AccordionIcon color="gray.400" ml={2} />
                </AccordionButton>

                <AccordionPanel
                  p={0}
                  bg="gray.750"
                  borderRadius="0 0 8px 8px"
                  borderLeft="3px solid"
                  borderLeftColor={hasMembers ? 'blue.400' : 'red.400'}
                  overflow="hidden"
                >
                  {hasMembers ? (
                    <VStack spacing={0} align="stretch">
                      {team.members.map((member, idx) => (
                        <MemberRow key={member.discordUserId ?? idx} member={member} index={idx} />
                      ))}
                    </VStack>
                  ) : (
                    <Box px={3} py={2}>
                      <Text fontSize="xs" color="red.400">
                        ⚠️ No members added to this team yet.
                      </Text>
                    </Box>
                  )}
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ─── Reusable modal content ───────────────────────────────────────────────────
function LaunchModalContent({ event, onClose, cancelRef }) {
  return (
    <AlertDialogContent
      bg="gray.800"
      maxH="85vh"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
        🚀 Ready to Launch?
      </AlertDialogHeader>

      <AlertDialogBody color="white" overflowY="auto" flex="1">
        <VStack align="stretch" spacing={4}>
          {/* Event Overview */}
          <Box
            p={3}
            bg="gray.700"
            borderRadius="md"
            borderLeft="3px solid"
            borderLeftColor="purple.400"
          >
            <Text fontWeight="bold" color="purple.300" fontSize="sm" mb={2}>
              📋 Event Details
            </Text>
            <VStack align="stretch" spacing={1} fontSize="sm">
              <HStack justify="space-between">
                <Text color="gray.400">Name</Text>
                <Text fontWeight="bold" color="white">
                  {event.eventName}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.400">Nodes</Text>
                <Text color="white">{event.nodes?.length ?? 0} nodes on the map</Text>
              </HStack>
              {event.startDate && event.endDate && (
                <HStack justify="space-between">
                  <Text color="gray.400">Dates</Text>
                  <Text color="white">
                    {new Date(event.startDate).toLocaleDateString()} →{' '}
                    {new Date(event.endDate).toLocaleDateString()}
                  </Text>
                </HStack>
              )}
              <HStack justify="space-between">
                <Text color="gray.400">Discord</Text>
                <Badge colorScheme={event.discordConfig?.confirmed ? 'green' : 'red'} fontSize="xs">
                  {event.discordConfig?.confirmed ? '✓ Confirmed' : 'Not confirmed'}
                </Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Teams */}
          <Box>
            <Text fontWeight="bold" color="white" fontSize="sm" mb={2}>
              👥 Teams ({event.teams?.length ?? 0})
            </Text>
            <TeamsAccordion teams={event.teams} />
          </Box>

          {/* What happens next */}
          <Box
            p={3}
            bg="green.900"
            borderRadius="md"
            borderLeft="3px solid"
            borderLeftColor="green.400"
          >
            <Text fontWeight="bold" color="green.300" fontSize="sm" mb={2}>
              ✅ What happens when you launch
            </Text>
            <VStack align="start" spacing={1} fontSize="xs" color="green.200">
              <Text>• Teams can view their maps and objectives</Text>
              <Text>• Players can submit completions via Discord</Text>
              <Text>• Discord commands become active</Text>
              <Text>
                • Event overview page can be accessed by admins, spectators and participants alike
              </Text>
            </VStack>
          </Box>

          {/* Warning */}
          <Box
            p={3}
            bg="orange.900"
            borderRadius="md"
            borderLeft="3px solid"
            borderLeftColor="orange.400"
          >
            <Text fontSize="xs" color="orange.300">
              ⚠️ The map cannot be regenerated once the event is live. Double-check your teams,
              their members, node tasks, duration, etc. above before launching.
            </Text>
          </Box>
        </VStack>
      </AlertDialogBody>

      <AlertDialogFooter borderTop="1px solid" borderTopColor="gray.600">
        <Button
          ref={cancelRef}
          onClick={onClose}
          variant="ghost"
          color="white"
          _hover={{ bg: 'whiteAlpha.200' }}
        >
          Cancel
        </Button>
        <Button colorScheme="green" ml={3} leftIcon={<Icon as={FaRocket} />} onClick={onClose}>
          Launch Event!
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

// ─── Individual scenario ──────────────────────────────────────────────────────
function LaunchModalScenario({ label, description, eventKey }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const event = MOCK_EVENTS[eventKey];

  return (
    <StoryLayout title={label} description={description}>
      <Button colorScheme="green" leftIcon={<Icon as={FaRocket} />} onClick={onOpen} size="sm">
        Open Launch Modal
      </Button>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size="xl">
        <AlertDialogOverlay>
          <LaunchModalContent event={event} onClose={onClose} cancelRef={cancelRef} />
        </AlertDialogOverlay>
      </AlertDialog>
    </StoryLayout>
  );
}

// ─── Exported story collection ────────────────────────────────────────────────
export default function LaunchModalStories() {
  return (
    <VStack spacing={6} align="stretch">
      <LaunchModalScenario
        label="All Good — Ready to Launch"
        description="Two teams, all members registered, discord confirmed, nodes generated."
        eventKey="all_good"
      />
      <LaunchModalScenario
        label="Large Teams (10+ members)"
        description="Three teams, one with 12 members including unregistered users (shows ID fallback)."
        eventKey="large_teams"
      />
      <LaunchModalScenario
        label="Discord Not Confirmed"
        description="Everything else is fine but discord badge shows red."
        eventKey="no_discord"
      />
      <LaunchModalScenario
        label="Team With No Members"
        description="Team exists but has no members added yet."
        eventKey="empty_members"
      />
      <LaunchModalScenario
        label="No Nodes Generated"
        description="Teams exist but map hasn't been generated."
        eventKey="no_nodes"
      />
    </VStack>
  );
}
