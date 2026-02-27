import {
  Flex,
  VStack,
  HStack,
  Text,
  Box,
  Heading,
  Image,
  Spinner,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useMemo, useState, useEffect } from 'react';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';
import GemTitle from '../atoms/GemTitle';
import EternalGem from '../assets/gemoji.png';
import { formatDisplayDate } from '../utils/dateUtils';
import usePageTitle from '../hooks/usePageTitle';

const c = {
  purple: { base: '#7D5FFF' },
  green: { base: '#43AA8B' },
  textColor: '#F7FAFC',
  cardBg: '#2D3748',
  subText: '#A0AEC0',
};

const MEDALS = ['🥇', '🥈', '🥉'];

function formatGP(val) {
  const n = Number(val || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}

function formatCountdown(endDate, now) {
  const ms = new Date(endDate) - now;
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

const EventCard = ({ event, isCompleted, now, onClick, isLoading }) => {
  const sorted = [...(event.teams || [])].sort(
    (a, b) => Number(b.currentPot || 0) - Number(a.currentPot || 0)
  );
  const totalGP = Number(event.derivedValues?.max_reward_per_team || 0);
  const totalNodes =
    Math.round((event.nodes || []).filter((n) => n.nodeType === 'STANDARD').length / 3) +
    (event.nodes || []).filter((n) => n.nodeType === 'INN').length +
    (event.nodes || []).filter((n) => n.nodeType === 'START').length;
  const countdown = isCompleted ? null : formatCountdown(event.endDate, now);
  const isEndingSoon =
    !isCompleted &&
    new Date(event.endDate) - now > 0 &&
    new Date(event.endDate) - now < 3 * 3600000;

  return (
    <Box
      cursor="pointer"
      bg={c.cardBg}
      borderWidth="1px"
      borderColor="gray.600"
      borderRadius="xl"
      overflow="hidden"
      position="relative"
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'xl',
        borderColor: isCompleted ? 'gray.500' : c.purple.base,
      }}
      transition="all 0.2s ease-in-out"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Top accent bar */}
      <Box
        h="3px"
        bgGradient={
          isCompleted
            ? 'linear(to-r, teal.600, cyan.500)'
            : isEndingSoon
            ? 'linear(to-r, orange.500, yellow.400)'
            : 'linear(to-r, purple.500, cyan.400)'
        }
      />

      {/* Watermark gem */}
      <Image
        src={EternalGem}
        alt=""
        aria-hidden
        position="absolute"
        right="-8px"
        bottom="-8px"
        width="100px"
        height="100px"
        opacity={0.07}
        pointerEvents="none"
      />

      {/* Loading overlay */}
      {isLoading && (
        <Flex
          position="absolute"
          inset={0}
          bg="rgba(0,0,0,0.7)"
          alignItems="center"
          justifyContent="center"
          borderRadius="xl"
          zIndex={10}
        >
          <Spinner size="xl" color={c.purple.base} thickness="4px" />
        </Flex>
      )}

      <Box p={4}>
        {/* Status row */}
        <HStack justify="space-between" mb={3} minH="22px">
          {isCompleted ? (
            <Badge colorScheme="teal" fontSize="xs" px={2} py={0.5} borderRadius="full">
              COMPLETED
            </Badge>
          ) : (
            <HStack spacing={1.5}>
              <Box
                w="7px"
                h="7px"
                borderRadius="full"
                bg={c.green.base}
                boxShadow={`0 0 6px ${c.green.base}`}
                sx={{
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }}
              />
              <Text fontSize="xs" color={c.green.base} fontWeight="semibold">
                LIVE
              </Text>
            </HStack>
          )}
          {countdown && (
            <Text
              fontSize="xs"
              color={isEndingSoon ? 'orange.300' : 'gray.500'}
              fontFamily="mono"
              fontWeight={isEndingSoon ? 'bold' : 'normal'}
            >
              {isEndingSoon ? '⚠️ ' : '⏱ '}
              {countdown}
            </Text>
          )}
          {isCompleted && (
            <Text fontSize="xs" color="gray.500">
              Ended {formatDisplayDate(event.endDate)}
            </Text>
          )}
        </HStack>

        {/* Event name */}
        <Heading size="sm" color={c.textColor} mb={4} noOfLines={2} lineHeight="1.35">
          {event.eventName}
        </Heading>

        {/* Stats row */}
        <HStack spacing={0} mb={4} bg="whiteAlpha.50" borderRadius="lg" overflow="hidden">
          {[
            { label: 'GP pot', value: `${formatGP(totalGP)}`, color: 'yellow.400' },
            { label: 'locations', value: totalNodes, color: c.textColor },
            { label: 'teams', value: event.teams?.length ?? 0, color: c.purple.base },
          ].map(({ label, value, color }, i) => (
            <VStack
              key={label}
              flex={1}
              spacing={0}
              py={2}
              borderRight={i < 2 ? '1px solid' : 'none'}
              borderColor="whiteAlpha.100"
            >
              <Text fontSize="sm" fontWeight="semibold" color={color}>
                {value}
              </Text>
              <Text
                fontSize="10px"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                {label}
              </Text>
            </VStack>
          ))}
        </HStack>

        {/* Mini leaderboard */}
        {sorted.length > 0 ? (
          <VStack spacing={1.5} align="stretch">
            {sorted.slice(0, 3).map((team, i) => (
              <HStack key={team.teamId} justify="space-between">
                <HStack spacing={1.5} overflow="hidden">
                  <Text fontSize="sm" flexShrink={0}>
                    {MEDALS[i] ?? `${i + 1}.`}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={i === 0 ? c.textColor : 'gray.400'}
                    fontWeight={i === 0 ? 'semibold' : 'normal'}
                    noOfLines={1}
                  >
                    {team.teamName}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="yellow.400" fontFamily="mono" flexShrink={0}>
                  {formatGP(team.currentPot)} gp
                </Text>
              </HStack>
            ))}
            {sorted.length > 3 && (
              <Text fontSize="xs" color="gray.600" textAlign="right">
                +{sorted.length - 3} more
              </Text>
            )}
          </VStack>
        ) : (
          <Text fontSize="xs" color="gray.600" fontStyle="italic">
            No teams yet
          </Text>
        )}
      </Box>
    </Box>
  );
};

const TreasureHuntActiveEvents = () => {
  const navigate = useNavigate();
  const [clickedEventId, setClickedEventId] = useState(null);
  const [now, setNow] = useState(new Date());

  usePageTitle('Public Gielinor Rush Events');

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data, loading, error } = useQuery(GET_ALL_TREASURE_EVENTS);
  if (error) console.error('[TreasureHuntActiveEvents] query error:', error);

  const activeEvents = useMemo(
    () =>
      [...(data?.getAllTreasureEvents || [])]
        .filter((e) => e.status === 'PUBLIC')
        .sort((a, b) => {
          const lastActivity = (e) =>
            Math.max(...(e.teams || []).map((t) => new Date(t.updatedAt || 0).getTime()), 0);
          return lastActivity(b) - lastActivity(a);
        }),
    [data]
  );

  const completedEvents = useMemo(
    () =>
      [...(data?.getAllTreasureEvents || [])]
        .filter((e) => e.status === 'COMPLETED')
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate)),
    [data]
  );

  const handleEventClick = (id) => {
    setClickedEventId(id);
    setTimeout(() => navigate(`/gielinor-rush/${id}`), 150);
  };

  if (loading)
    return (
      <Flex flex="1" flexDirection="column" px={['16px', '24px', '64px']} py="72px">
        <Skeleton height="40px" width="300px" mb={8} startColor="gray.700" endColor="gray.600" />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {[1, 2, 3].map((i) => (
            <Box key={i} bg={c.cardBg} borderRadius="xl" overflow="hidden">
              <Box h="3px" bg="gray.600" />
              <Box p={4}>
                <Skeleton
                  height="16px"
                  width="120px"
                  mb={4}
                  startColor="gray.700"
                  endColor="gray.600"
                />
                <Skeleton
                  height="20px"
                  width="80%"
                  mb={4}
                  startColor="gray.700"
                  endColor="gray.600"
                />
                <Skeleton
                  height="52px"
                  mb={4}
                  startColor="gray.700"
                  endColor="gray.600"
                  borderRadius="lg"
                />
                <SkeletonText noOfLines={3} spacing={2} startColor="gray.700" endColor="gray.600" />
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Flex>
    );

  return (
    <Flex flex="1" flexDirection="column" px={['16px', '24px', '64px']} pt="64px" pb="48px">
      <Flex maxW="960px" w="100%" mx="auto" flexDirection="column" gap={10}>
        {/* Page header */}
        <VStack align="flex-start" spacing={2}>
          <GemTitle gemColor="green">Gielinor Rush</GemTitle>
          <Text color={c.subText} fontSize="sm" maxW="520px">
            Teams race across Gielinor completing nodes and fighting to get the most GP before the
            rush ends!
          </Text>
        </VStack>

        {/* Active events */}
        <Box>
          <HStack mb={4} spacing={3}>
            <Heading size="sm" color={c.textColor}>
              Live Now
            </Heading>
            {activeEvents.length > 0 && (
              <Badge colorScheme="green" fontSize="xs" borderRadius="full" px={2}>
                {activeEvents.length} live
              </Badge>
            )}
          </HStack>

          {activeEvents.length === 0 ? (
            <Box
              py={14}
              textAlign="center"
              borderWidth="1px"
              borderColor="gray.700"
              borderRadius="xl"
              bg={c.cardBg}
            >
              <Text fontSize="3xl" mb={3}>
                ⚔️
              </Text>
              <Text color={c.textColor} fontSize="lg" fontWeight="medium" mb={2}>
                No competitions underway
              </Text>
              <Text color={c.subText} fontSize="sm">
                Check back later or ask your clan to start an event!
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {activeEvents.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  now={now}
                  onClick={() => handleEventClick(event.eventId)}
                  isLoading={clickedEventId === event.eventId}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Completed events */}
        {completedEvents.length > 0 && (
          <Box>
            <HStack mb={4} spacing={3}>
              <Heading size="sm" color="gray.400">
                Past Events
              </Heading>
              <Badge colorScheme="gray" fontSize="xs" borderRadius="full" px={2}>
                {completedEvents.length}
              </Badge>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {completedEvents.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  isCompleted
                  now={now}
                  onClick={() => handleEventClick(event.eventId)}
                  isLoading={clickedEventId === event.eventId}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Flex>
    </Flex>
  );
};

export default TreasureHuntActiveEvents;
