import React from 'react';
import { useQuery } from '@apollo/client';
import { Box, Center, Spinner, Text, Heading, VStack } from '@chakra-ui/react';
import { useAuth } from '../../providers/AuthProvider';
import { GET_SPOOPY_EVENTS } from '../../graphql/spoopyOperations';
import { SPOOPY_COLORS, SPOOPY_FONTS } from '../../organisms/spoopy/spoopyTheme';

// /spoopy-event/admin — site admin (user id 1) event management.
// Full CRUD + board/CSV upload flow lands in a follow-up. For now the page
// gates on login and lists what exists; server-side auth blocks non-admins
// from any mutations attempted.

export default function SpoopyAdminPage() {
  const { isAuthenticated, isCheckingAuth, user } = useAuth();
  const { data, loading } = useQuery(GET_SPOOPY_EVENTS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  if (isCheckingAuth) return <Shell><Center py={20}><Spinner size="xl" color={SPOOPY_COLORS.pumpkin} /></Center></Shell>;
  if (!isAuthenticated) return <Shell><Center py={20}><Text>log in required</Text></Center></Shell>;

  const events = data?.spoopyEvents ?? [];
  const isSiteAdmin = user?.admin === true;

  return (
    <Shell>
      <Center py={{ base: 10, md: 20 }} px={4}>
        <VStack spacing={6} maxW="2xl" width="100%">
          <VStack spacing={2} textAlign="center">
            <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>event management</Heading>
            <Text opacity={0.7} fontSize="sm">
              create events, schedule curfew, upload the board CSV, manage teams, and delete
              events. only site admins can persist changes.
            </Text>
          </VStack>

          {!isSiteAdmin && (
            <Box bg={SPOOPY_COLORS.emberDeep} color={SPOOPY_COLORS.paper} p={4} borderRadius="md" fontSize="sm" width="100%">
              you're logged in but not a site admin. the mutations on this page will be rejected
              server-side. this view is read-only for you.
            </Box>
          )}

          <VStack spacing={2} width="100%" align="stretch">
            <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg">existing events</Text>
            {loading && !events.length && <Spinner color={SPOOPY_COLORS.pumpkin} />}
            {!loading && events.length === 0 && (
              <Text opacity={0.6} fontSize="sm">no events yet.</Text>
            )}
            {events.map((event) => (
              <Box
                key={event.eventId}
                bg={SPOOPY_COLORS.night}
                border="1px solid"
                borderColor={SPOOPY_COLORS.nightMist}
                p={3}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="600">{event.eventName}</Text>
                  <Text fontSize="xs" opacity={0.6}>{event.eventId}</Text>
                </VStack>
                <Text fontSize="xs" opacity={0.7}>{event.status}</Text>
              </Box>
            ))}
          </VStack>

          <Text fontSize="xs" opacity={0.5} textAlign="center">
            the create-event form + CSV upload flow drops in here in the next phase.
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
          🎃 spoopy admin
        </Heading>
      </Box>
      {children}
    </Box>
  );
}
