import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Box, Center, Spinner, Text } from '@chakra-ui/react';
import { GET_CLAN_WARS_EVENT } from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import usePageTitle from '../hooks/usePageTitle';

import AdminEventPanel from '../organisms/ChampionForge/AdminEventPanel';
import GatheringPhase   from '../organisms/ChampionForge/GatheringPhase';
import OutfittingScreen from '../organisms/ChampionForge/OutfittingScreen';
import BattlePhase      from '../organisms/ChampionForge/BattlePhase';
import PostBattleSummary from '../organisms/ChampionForge/PostBattleSummary';

export default function ChampionForgeEventPage() {
  const { eventId } = useParams();
  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  const event = data?.getClanWarsEvent;

  usePageTitle(event ? `${event.eventName} — Champion Forge` : 'Champion Forge');

  if (loading && !event) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Center h="60vh">
        <Text color="red.400">Event not found or failed to load.</Text>
      </Center>
    );
  }

  const isAdmin = user?.admin ||
    event.adminIds?.includes(String(user?.id)) ||
    event.creatorId === String(user?.id);

  const sharedProps = { event, isAdmin, refetch };

  const phaseContent = () => {
    switch (event.status) {
      case 'DRAFT':
        return <AdminEventPanel {...sharedProps} />;

      case 'GATHERING':
        return <GatheringPhase {...sharedProps} />;

      case 'OUTFITTING':
        return <OutfittingScreen {...sharedProps} />;

      case 'BATTLE':
        return <BattlePhase {...sharedProps} />;

      case 'COMPLETED':
      case 'ARCHIVED':
        return <PostBattleSummary {...sharedProps} />;

      default:
        return <Text>Unknown event status: {event.status}</Text>;
    }
  };

  return (
    <Box maxW="1200px" mx="auto" px={4} py={6}>
      {phaseContent()}
    </Box>
  );
}
