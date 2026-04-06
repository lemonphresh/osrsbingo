import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Center,
  Flex,
  Button,
  Image,
  Tooltip,
  Skeleton,
  SimpleGrid,
} from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useState, useEffect } from 'react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import {
  GET_GROUP_DASHBOARD,
  GET_GROUP_DASHBOARD_PROGRESS,
  REFRESH_GROUP_GOAL_DATA,
} from '../graphql/groupDashboardOperations';
import GroupDashboardHeader from '../organisms/GroupDashboard/GroupDashboardHeader';
import GroupGoalCard from '../organisms/GroupDashboard/GroupGoalCard';
import usePageTitle from '../hooks/usePageTitle';

function formatRelativeTime(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function GoalCardSkeleton() {
  return (
    <Box
      bg="gray.800"
      border="2px solid"
      borderColor="gray.700"
      borderRadius="lg"
      overflow="hidden"
    >
      <HStack px={5} pt={4} pb={3} justify="space-between">
        <HStack spacing={3}>
          <Skeleton w="28px" h="28px" borderRadius="md" startColor="gray.700" endColor="gray.600" />
          <Skeleton
            h="18px"
            w="160px"
            borderRadius="sm"
            startColor="gray.700"
            endColor="gray.600"
          />
        </HStack>
        <Skeleton h="28px" w="56px" borderRadius="md" startColor="gray.700" endColor="gray.600" />
      </HStack>
      <Box px={5} pb={4}>
        <Skeleton h="14px" borderRadius={6} mb={2} startColor="gray.700" endColor="gray.600" />
        <HStack justify="space-between">
          <Skeleton h="11px" w="80px" borderRadius="sm" startColor="gray.700" endColor="gray.600" />
          <Skeleton h="11px" w="80px" borderRadius="sm" startColor="gray.700" endColor="gray.600" />
        </HStack>
      </Box>
      <SimpleGrid
        columns={3}
        bg="gray.700"
        borderTop="1px solid"
        borderColor="gray.600"
        px={5}
        py={4}
        gap={6}
      >
        {[0, 1, 2].map((i) => (
          <VStack key={i} align="flex-start" spacing={1.5}>
            <Skeleton
              h="10px"
              w="52px"
              borderRadius="sm"
              startColor="gray.600"
              endColor="gray.500"
            />
            <Skeleton
              h="26px"
              w="72px"
              borderRadius="sm"
              startColor="gray.600"
              endColor="gray.500"
            />
          </VStack>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function EventProgressPanel({ event, accentColor, isAdmin }) {
  const { data, loading, refetch } = useQuery(GET_GROUP_DASHBOARD_PROGRESS, {
    variables: { eventId: event.id },
    pollInterval: 300_000,
  });

  const [forceRefresh, { loading: refreshing }] = useMutation(REFRESH_GROUP_GOAL_DATA, {
    variables: { eventId: event.id },
    onCompleted: () => refetch(),
  });

  const handleRefresh = isAdmin ? forceRefresh : refetch;
  const isRefreshing = loading || refreshing;

  const progressMap = {};
  (data?.getGroupDashboardProgress ?? []).forEach((p) => {
    progressMap[p.goalId] = p;
  });

  const enabledGoals = (event.goals ?? []).filter((g) => g.enabled !== false);

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="flex-end" spacing={2}>
        {event.lastSyncedAt && (
          <Text fontSize="xs" color="gray.400">
            Synced {formatRelativeTime(event.lastSyncedAt)}
          </Text>
        )}
        <Button
          size="xs"
          variant="ghost"
          colorScheme="purple"
          onClick={handleRefresh}
          isLoading={isRefreshing}
        >
          Refresh
        </Button>
      </HStack>

      {!loading && enabledGoals.length === 0 && (
        <Text color="gray.500" textAlign="center" py={8}>
          No goals configured for this event.
        </Text>
      )}

      <VStack spacing={4} align="stretch">
        {loading && !data
          ? enabledGoals.map((goal) => <GoalCardSkeleton key={goal.goalId} />)
          : enabledGoals.map((goal) => (
              <GroupGoalCard
                key={goal.goalId}
                goalConfig={goal}
                progress={progressMap[goal.goalId]}
                accentColor={accentColor}
                eventStartDate={event.startDate}
              />
            ))}
      </VStack>
    </VStack>
  );
}

export default function GroupDashboardPage() {
  const { slug } = useParams();
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_GROUP_DASHBOARD, {
    variables: { slug },
  });

  const dashboard = data?.getGroupDashboard;
  usePageTitle(dashboard?.groupName ?? 'Group Dashboard');

  const theme = dashboard?.theme ?? {};
  const accentColor = theme.accentColor ?? '#43AA8B';

  // Visible events: start <= now <= end + 5 days
  const visibleEvents = (dashboard?.events ?? []).filter((e) => e.isVisible);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const activeEvent = visibleEvents[activeTabIdx] ?? null;

  // Reset tab if events change
  useEffect(() => {
    setActiveTabIdx(0);
  }, [dashboard?.id]);

  const isAdmin =
    user &&
    dashboard &&
    (dashboard.creatorId === user.id || (dashboard.adminIds ?? []).includes(user.id));

  if (loading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }

  if (error || !dashboard) {
    return (
      <Center h="60vh">
        <Text color="gray.400">Dashboard not found.</Text>
      </Center>
    );
  }

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingBottom={['72px', '112px']}
      paddingTop={['56px', '72px']}
    >
      <Box maxW="900px" w="100%" textAlign="center" mb={12}>
        {' '}
        <VStack spacing={6} align="stretch">
          {/* Banner */}
          {theme.bannerUrl && (
            <Box borderRadius="xl" overflow="hidden" maxH="180px">
              <Image src={theme.bannerUrl} alt="" w="full" objectFit="cover" />
            </Box>
          )}

          {/* Header */}
          <HStack justify="space-between" align="flex-start">
            <GroupDashboardHeader dashboard={dashboard} activeEvent={activeEvent} />
            {isAdmin && (
              <Tooltip label="Manage dashboard">
                <Button
                  as={RouterLink}
                  to={`/group/${slug}/manage`}
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                  rightIcon={<ExternalLinkIcon />}
                  flexShrink={0}
                >
                  Manage
                </Button>
              </Tooltip>
            )}
          </HStack>

          {/* No visible events */}
          {visibleEvents.length === 0 && (
            <Box bg="gray.800" borderRadius="xl" p={8} textAlign="center">
              <Text color="gray.400">No active events right now.</Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Events appear here during their active window and for 5 days after.
              </Text>
            </Box>
          )}

          {/* Event tabs */}
          {visibleEvents.length > 0 && (
            <Tabs
              index={activeTabIdx}
              onChange={setActiveTabIdx}
              variant="line"
              colorScheme="purple"
            >
              {visibleEvents.length > 1 && (
                <TabList mb={4} flexWrap="wrap" gap={2}>
                  {visibleEvents.map((e) => (
                    <Tab key={e.id} fontSize="sm">
                      {e.eventName}
                    </Tab>
                  ))}
                </TabList>
              )}
              <TabPanels>
                {visibleEvents.map((e) => (
                  <TabPanel key={e.id} p={0}>
                    <EventProgressPanel event={e} accentColor={accentColor} isAdmin={isAdmin} />
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
