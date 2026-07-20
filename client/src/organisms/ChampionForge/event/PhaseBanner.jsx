import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import { Box, HStack, VStack, Text, Badge, Button } from '@chakra-ui/react';
import {
  GET_BATTLE_VIEWER_COUNT,
  BATTLE_VIEWERS_UPDATED,
} from '../../../graphql/clanWarsOperations';
import EventPasswordBadge from './EventPasswordBadge';

function calcCountdown(target) {
  if (!target) return null;
  const diff = new Date(target) - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
  if (h > 0) return `${h}h ${m}m ${s}s remaining`;
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}

function useCountdown(target) {
  const [label, setLabel] = useState(() => calcCountdown(target));
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setLabel(calcCountdown(target)), 1_000);
    return () => clearInterval(id);
  }, [target]);
  return label;
}

export default function PhaseBanner({ event, eventId }) {
  const navigate = useNavigate();
  const { status, gatheringEnd, outfittingEnd } = event;
  const gatheringCountdown = useCountdown(gatheringEnd);
  const outfittingCountdown = useCountdown(outfittingEnd);
  const { data: viewerData } = useQuery(GET_BATTLE_VIEWER_COUNT, {
    variables: { eventId },
    skip: status !== 'BATTLE',
    fetchPolicy: 'cache-and-network',
  });
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (viewerData?.getBattleViewerCount != null) setViewerCount(viewerData.getBattleViewerCount);
  }, [viewerData]);

  useSubscription(BATTLE_VIEWERS_UPDATED, {
    variables: { eventId },
    skip: status !== 'BATTLE',
    onData: ({ data }) => {
      if (data?.data?.battleViewersUpdated != null) setViewerCount(data.data.battleViewersUpdated);
    },
  });

  if (status === 'DRAFT') return null;

  if (status === 'GATHERING') {
    return (
      <Box bg="green.900" border="1px solid" borderColor="green.700" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontWeight="bold" color="green.200">
              ⚒️ Gathering Phase
            </Text>
            <Text fontSize="sm" color="green.400">
              Players are completing tasks to earn war chest items.
            </Text>
            {event.eventPassword && <EventPasswordBadge password={event.eventPassword} />}
          </VStack>
          {gatheringEnd && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              {gatheringCountdown}
            </Badge>
          )}
        </HStack>
      </Box>
    );
  }

  if (status === 'OUTFITTING') {
    return (
      <Box bg="blue.900" border="1px solid" borderColor="blue.700" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="blue.200">
              🛡️ Outfitting Phase
            </Text>
            <Text fontSize="sm" color="blue.400">
              Captains are locking in their team loadouts.
            </Text>
          </VStack>
          {outfittingEnd && (
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {outfittingCountdown}
            </Badge>
          )}
        </HStack>
      </Box>
    );
  }

  if (status === 'BATTLE') {
    return (
      <Box
        bg="red.900"
        border="2px solid"
        borderColor="red.500"
        borderRadius="lg"
        p={4}
        boxShadow="0 0 20px rgba(229,62,62,0.3)"
      >
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="red.200" fontSize="lg">
              ⚔️ Battle in Progress!
            </Text>
            <HStack spacing={2}>
              <Text fontSize="sm" color="red.300">
                Champions are locked in combat.
              </Text>
              <Badge colorScheme="gray" fontSize="xs" variant="subtle">
                👁 {viewerCount} watching
              </Badge>
            </HStack>
          </VStack>
          <Button
            colorScheme="red"
            size="sm"
            onClick={() => navigate(`/champion-forge/${eventId}/battle`)}
          >
            Watch the Battle →
          </Button>
        </HStack>
      </Box>
    );
  }

  if (status === 'COMPLETED') {
    const winner =
      event.bracket?.grandFinal?.winnerId ??
      event.bracket?.rounds?.slice(-1)[0]?.matches?.[0]?.winnerId;
    const winnerTeam = winner ? event.teams?.find((t) => t.teamId === winner) : null;

    return (
      <Box bg="teal.900" border="1px solid" borderColor="teal.600" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <HStack>
              <Text fontSize="xl">🏆</Text>
              <Text fontWeight="bold" color="teal.200">
                {winnerTeam ? `${winnerTeam.teamName} won!` : 'Event complete'}
              </Text>
            </HStack>
            <Text fontSize="sm" color="teal.400">
              The battle has concluded.
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  return null;
}
