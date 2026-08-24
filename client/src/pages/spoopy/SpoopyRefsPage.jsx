import React from 'react';
import { useQuery } from '@apollo/client';
import { Box, Center, Spinner, Text, Heading, VStack } from '@chakra-ui/react';
import { useAuth } from '../../providers/AuthProvider';
import { GET_ACTIVE_SPOOPY_EVENT } from '../../graphql/spoopyOperations';
import { SPOOPY_COLORS, SPOOPY_FONTS } from '../../organisms/spoopy/spoopyTheme';

// /spoopy-event/refs — staff-only submissions queue. Full SubmissionsProvider
// wire-up lands in a follow-up; for now this validates the page renders and
// gates behind login. Auth on the server (spoopySubmissions query) will reject
// non-admins even if the page renders for them.

export default function SpoopyRefsPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth();
  const { data, loading } = useQuery(GET_ACTIVE_SPOOPY_EVENT, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  if (isCheckingAuth) return <Shell><Center py={20}><Spinner size="xl" color={SPOOPY_COLORS.pumpkin} /></Center></Shell>;
  if (!isAuthenticated) {
    return <Shell><Center py={20}><Text>log in to view the submission queue</Text></Center></Shell>;
  }
  if (loading && !data) {
    return <Shell><Center py={20}><Spinner size="xl" color={SPOOPY_COLORS.pumpkin} /></Center></Shell>;
  }

  const event = data?.getActiveSpoopyEvent;

  if (!event) {
    return (
      <Shell>
        <Center py={20}>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="xl">no active spoopy event to review</Text>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell>
      <Center py={20}>
        <VStack spacing={3} maxW="md" textAlign="center">
          <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>refs queue</Heading>
          <Text opacity={0.75} fontSize="sm">
            reviewing submissions for <strong>{event.eventName}</strong>.
          </Text>
          <Text opacity={0.6} fontSize="xs">
            the live submission queue (via SubmissionsProvider) drops in here in the next phase.
          </Text>
        </VStack>
      </Center>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <Box minHeight="calc(100vh - 60px)" bg={SPOOPY_COLORS.nightDeep} color={SPOOPY_COLORS.paper}>
      <Box borderBottom="2px solid" borderColor={SPOOPY_COLORS.nightMist} py={3} px={6}>
        <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
          🕯️ spoopy refs
        </Heading>
      </Box>
      {children}
    </Box>
  );
}
