import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Center,
  SimpleGrid,
} from '@chakra-ui/react';
import { GET_ALL_BS_EVENTS } from '../../graphql/bsOperations';
import usePageTitle from '../../hooks/usePageTitle';

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  DRAFT: 'gray',
  PLACEMENT: 'yellow',
  ACTIVE: 'teal',
  COMPLETED: 'gray',
  ARCHIVED: 'gray',
};

const STATUS_LABEL = {
  DRAFT: 'Draft',
  PLACEMENT: 'Placement',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

// ── Sub-components ────────────────────────────────────────────────────────

function TeamColorDot({ color }) {
  const bg = color === 'RED' ? 'red.400' : 'cyan.400';
  return <Box w="8px" h="8px" borderRadius="full" bg={bg} flexShrink={0} />;
}

function EventCard({ event }) {
  const teams = event.teams ?? [];

  return (
    <Box
      bg="#0d2137"
      border="1px solid"
      borderColor="#1e4976"
      borderRadius="md"
      p={5}
      display="flex"
      flexDirection="column"
      gap={3}
      transition="all 0.15s"
      _hover={{ borderColor: '#0ea5e9', transform: 'translateY(-2px)' }}
    >
      <HStack justify="space-between" align="flex-start">
        <Text
          fontWeight="bold"
          fontSize="md"
          color="#e2e8f0"
          letterSpacing="wide"
          textTransform="uppercase"
          noOfLines={2}
          flex={1}
          mr={2}
          fontFamily="mono"
        >
          {event.eventName}
        </Text>
        <Badge
          colorScheme={STATUS_COLOR[event.status] ?? 'gray'}
          fontSize="xs"
          flexShrink={0}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {STATUS_LABEL[event.status] ?? event.status}
        </Badge>
      </HStack>

      {teams.length > 0 && (
        <VStack align="stretch" spacing={1}>
          {teams.map((team) => (
            <HStack key={team.teamId} spacing={2} align="center">
              <TeamColorDot color={team.color} />
              <Text fontFamily="mono" fontSize="xs" color="#94a3b8" noOfLines={1}>
                {team.teamName}
              </Text>
            </HStack>
          ))}
        </VStack>
      )}

      <Box mt="auto" pt={1}>
        <RouterLink to={`/battleship/${event.eventId}`}>
          <Button
            size="sm"
            colorScheme="cyan"
            variant="outline"
            borderColor="#1e4976"
            color="#38bdf8"
            fontFamily="mono"
            fontSize="xs"
            letterSpacing="wider"
            textTransform="uppercase"
            _hover={{ bg: '#0d2137', borderColor: '#38bdf8' }}
            w="full"
          >
            Enter
          </Button>
        </RouterLink>
      </Box>
    </Box>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────

export default function BattleshipDashboard() {
  usePageTitle('Battleship');

  const { data, loading, error } = useQuery(GET_ALL_BS_EVENTS);

  const events = data?.getAllBSEvents ?? [];

  return (
    <Box flex="1" minH="100vh" bg="#071523">
      {/* Hero Header */}
      <Box
        bg="#071523"
        borderBottom="1px solid"
        borderColor="#1e4976"
        position="relative"
        overflow="hidden"
      >
        {/* Subtle grid overlay */}
        <Box
          position="absolute"
          inset={0}
          opacity={0.04}
          backgroundImage="repeating-linear-gradient(0deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px)"
          pointerEvents="none"
        />

        <Box maxW="1200px" mx="auto" px={[4, 6, 8]} py={[12, 16, 20]} position="relative" zIndex={1}>
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            <VStack align="flex-start" spacing={3}>
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
              <Text
                fontFamily="mono"
                fontSize={['xs', 'sm']}
                color="#94a3b8"
                letterSpacing="wider"
                textTransform="uppercase"
              >
                A strategic OSRS naval warfare event
              </Text>
              <HStack spacing={2} mt={2}>
                <Box w="32px" h="1px" bg="#0ea5e9" />
                <Box w="8px" h="1px" bg="#1e4976" />
                <Box w="4px" h="1px" bg="#1e4976" />
              </HStack>
            </VStack>
            <RouterLink to="/battleship/create">
              <Button
                size="sm"
                variant="outline"
                colorScheme="cyan"
                borderColor="#1e4976"
                color="#38bdf8"
                fontFamily="mono"
                fontSize="10px"
                letterSpacing="widest"
                textTransform="uppercase"
                _hover={{ bg: '#0d2137', borderColor: '#38bdf8' }}
                mt={[0, 2]}
              >
                New Campaign
              </Button>
            </RouterLink>
          </HStack>
        </Box>
      </Box>

      {/* Events section */}
      <Box maxW="1200px" mx="auto" px={[4, 6, 8]} py={[8, 10, 12]}>
        {loading && (
          <Center py={20}>
            <Spinner size="xl" color="cyan.500" thickness="3px" speed="0.8s" emptyColor="#1e4976" />
          </Center>
        )}

        {error && (
          <Center py={20}>
            <Text fontFamily="mono" fontSize="sm" color="red.400" letterSpacing="wide">
              FAILED TO LOAD — CHECK CONNECTION
            </Text>
          </Center>
        )}

        {!loading && !error && events.length === 0 && (
          <Center py={20}>
            <VStack spacing={4} align="center">
              <Box
                w="60px"
                h="60px"
                border="1px solid"
                borderColor="#1e4976"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box w="24px" h="24px" border="2px solid" borderColor="#0ea5e9" opacity={0.4} />
              </Box>
              <Text
                fontFamily="mono"
                fontSize="sm"
                color="#94a3b8"
                letterSpacing="wider"
                textTransform="uppercase"
                textAlign="center"
              >
                No active campaigns. The seas are calm.
              </Text>
            </VStack>
          </Center>
        )}

        {!loading && !error && events.length > 0 && (
          <VStack align="stretch" spacing={6}>
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="#94a3b8"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Active Campaigns — {events.length} found
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {events.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </SimpleGrid>
          </VStack>
        )}
      </Box>
    </Box>
  );
}
