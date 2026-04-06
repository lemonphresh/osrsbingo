import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Center,
  Flex,
  Button,
  Image,
  Tooltip,
  Skeleton,
  SimpleGrid,
} from '@chakra-ui/react';
import { useParams, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useState, useEffect } from 'react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import {
  GET_GROUP_DASHBOARD,
  GET_GROUP_DASHBOARD_PROGRESS,
  REFRESH_GROUP_GOAL_DATA,
  GET_GROUP_COMPETITIONS,
} from '../graphql/groupDashboardOperations';
import GroupDashboardHeader from '../organisms/GroupDashboard/GroupDashboardHeader';
import GroupGoalCard from '../organisms/GroupDashboard/GroupGoalCard';
import usePageTitle from '../hooks/usePageTitle';

const SYNC_TTL_MS = 60 * 60 * 1000; // 1 hour — must match server

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

function formatNextSync(dateStr) {
  if (!dateStr) return null;
  const msLeft = SYNC_TTL_MS - (Date.now() - new Date(dateStr).getTime());
  if (msLeft <= 0) return 'now';
  const mins = Math.ceil(msLeft / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.ceil(mins / 60)}h`;
}

function useTicker(intervalMs = 60000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
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
    pollInterval: 3_600_000,
  });

  const [forceRefresh, { loading: refreshing }] = useMutation(REFRESH_GROUP_GOAL_DATA, {
    variables: { eventId: event.id },
    onCompleted: () => refetch(),
  });

  const isRefreshing = loading || refreshing;
  useTicker();

  const progressMap = {};
  (data?.getGroupDashboardProgress ?? []).forEach((p) => {
    progressMap[p.goalId] = p;
  });

  const enabledGoals = (event.goals ?? []).filter((g) => g.enabled !== false);

  return (
    <VStack spacing={4} align="stretch">
      {event.lastSyncedAt && (
        <HStack justify="flex-end" spacing={2}>
          <Text fontSize="xs" color="gray.400">
            Synced {formatRelativeTime(event.lastSyncedAt)}
            {formatNextSync(event.lastSyncedAt) &&
              ` · next in ${formatNextSync(event.lastSyncedAt)}`}
          </Text>
          {isAdmin && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="purple"
              onClick={forceRefresh}
              isLoading={isRefreshing}
            >
              Refresh
            </Button>
          )}
        </HStack>
      )}

      {!loading && enabledGoals.length === 0 && (
        <Text color="gray.500" textAlign="center" py={8}>
          No goals configured for this event.
        </Text>
      )}

      <VStack spacing={4} align="stretch">
        {loading && !data && (
          <Box
            bg="gray.750"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="md"
            px={4}
            py={2.5}
            textAlign="center"
          >
            <Text fontSize="xs" color="gray.400">
              WOM queries can take a moment, so please don't spam refresh!
            </Text>
          </Box>
        )}
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

// ── Overview panel (shown when multiple events) ───────────────────────────────

function EventSummaryCard({ event, accentColor }) {
  const { data, loading } = useQuery(GET_GROUP_DASHBOARD_PROGRESS, {
    variables: { eventId: event.id },
    pollInterval: 3_600_000,
  });

  const progress = data?.getGroupDashboardProgress ?? [];
  const enabledGoals = (event.goals ?? []).filter((g) => g.enabled !== false);

  const startStr = new Date(event.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = new Date(event.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Box>
      <HStack mb={3} spacing={3}>
        <Text fontWeight="semibold" color="gray.100" fontSize="md">
          {event.eventName}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {startStr} to {endStr}
        </Text>
      </HStack>
      <VStack spacing={2} align="stretch">
        {loading && !data
          ? enabledGoals.map((g) => (
              <Skeleton
                key={g.goalId}
                h="52px"
                borderRadius="md"
                startColor="gray.700"
                endColor="gray.600"
              />
            ))
          : enabledGoals.map((goal) => {
              const prog = progress.find((p) => p.goalId === goal.goalId);
              const pct = Math.min(100, prog?.percent ?? 0);
              const isDone = pct >= 100;
              const barColor = isDone
                ? '#43aa8b'
                : pct >= 75
                ? '#f4a732'
                : pct >= 50
                ? '#f4d35e'
                : accentColor ?? '#7D5FFF';
              return (
                <Box
                  key={goal.goalId}
                  bg="gray.700"
                  borderRadius="md"
                  px={4}
                  py={3}
                  border="1px solid"
                  borderColor="gray.600"
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack spacing={2}>
                      <Text fontSize="md" lineHeight="1">
                        {goal.emoji ?? '🎯'}
                      </Text>
                      <Text fontSize="sm" color="gray.200">
                        {goal.displayName || goal.metric || 'Goal'}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="bold" color={isDone ? 'green.300' : 'gray.300'}>
                      {isDone ? '✓ Done' : `${Math.round(pct)}%`}
                    </Text>
                  </HStack>
                  <Box bg="#111" borderRadius={4} h="6px" overflow="hidden" border="1px solid #333">
                    <Box
                      h="full"
                      w={`${pct}%`}
                      bg={barColor}
                      borderRadius={4}
                      transition="width 0.4s ease"
                    />
                  </Box>
                </Box>
              );
            })}
      </VStack>
    </Box>
  );
}

function OverviewPanel({ events, accentColor }) {
  return (
    <VStack spacing={8} align="stretch">
      {events.map((e) => (
        <EventSummaryCard key={e.id} event={e} accentColor={accentColor} />
      ))}
    </VStack>
  );
}

// ── Tab navigation bar ────────────────────────────────────────────────────────

function EventTabBar({
  events,
  activeIdx,
  showOverview,
  accentColor,
  onSelectOverview,
  onSelectEvent,
}) {
  return (
    <Box borderBottom="1px solid" borderColor="gray.700" mb={4}>
      <HStack spacing={0} overflowX="auto">
        <Button
          size="sm"
          variant="unstyled"
          px={4}
          pb="10px"
          pt="6px"
          borderBottom={showOverview ? `2px solid ${accentColor}` : '2px solid transparent'}
          color={showOverview ? 'white' : 'gray.400'}
          fontWeight={showOverview ? 'semibold' : 'normal'}
          borderRadius={0}
          flexShrink={0}
          _hover={{ color: 'gray.200' }}
          onClick={onSelectOverview}
        >
          Overview
        </Button>
        {events.map((e, i) => {
          const isActive = !showOverview && i === activeIdx;
          return (
            <Button
              key={e.id}
              size="sm"
              variant="unstyled"
              px={4}
              pb="10px"
              pt="6px"
              borderBottom={isActive ? `2px solid ${accentColor}` : '2px solid transparent'}
              color={isActive ? 'white' : 'gray.400'}
              fontWeight={isActive ? 'semibold' : 'normal'}
              borderRadius={0}
              flexShrink={0}
              _hover={{ color: 'gray.200' }}
              onClick={() => onSelectEvent(i)}
            >
              {e.eventName}
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GroupDashboardPage() {
  const { slug } = useParams();
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_GROUP_DASHBOARD, {
    variables: { slug },
  });

  const { data: compData } = useQuery(GET_GROUP_COMPETITIONS, {
    variables: { slug },
    skip: !data?.getGroupDashboard,
  });
  const hasActiveCompetitions = (compData?.getGroupCompetitions ?? []).some(
    (c) => c.status === 'ongoing' || c.status === 'upcoming'
  );

  const dashboard = data?.getGroupDashboard;
  usePageTitle(dashboard?.groupName ?? 'Group Dashboard');

  const theme = dashboard?.theme ?? {};
  const accentColor = theme.accentColor ?? '#43AA8B';

  const [searchParams, setSearchParams] = useSearchParams();
  const visibleEvents = (dashboard?.events ?? []).filter((e) => e.isVisible);

  const tabParam = searchParams.get('tab');
  const defaultToOverview = !tabParam && visibleEvents.length > 1;
  const showOverview = tabParam === 'overview' || defaultToOverview;
  const activeTabIdx = tabParam && tabParam !== 'overview' ? parseInt(tabParam, 10) || 0 : 0;
  const activeEvent = visibleEvents[activeTabIdx] ?? null;

  const selectOverview = () => setSearchParams({ tab: 'overview' }, { replace: true });
  const selectTab = (i) => setSearchParams({ tab: String(i) }, { replace: true });

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

          {/* Competitions link */}
          {hasActiveCompetitions && (
            <Text fontSize="sm" color="gray.500" textAlign="left">
              <RouterLink
                to={`/group/${slug}/competitions`}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                View this group's WOM competitions →
              </RouterLink>
            </Text>
          )}

          {/* No visible events */}
          {visibleEvents.length === 0 && (
            <Box bg="gray.800" borderRadius="xl" p={8} textAlign="center">
              <Text color="gray.400">No active events right now.</Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Events appear here during their active window and for 5 days after.
              </Text>
            </Box>
          )}

          {/* Events */}
          {visibleEvents.length > 0 && (
            <>
              {/* Tab bar — only shown when 2+ events */}
              {visibleEvents.length > 1 && (
                <EventTabBar
                  events={visibleEvents}
                  activeIdx={activeTabIdx}
                  showOverview={showOverview}
                  accentColor={accentColor}
                  onSelectOverview={selectOverview}
                  onSelectEvent={selectTab}
                />
              )}

              {/* Content */}
              {showOverview && visibleEvents.length > 1 ? (
                <OverviewPanel events={visibleEvents} accentColor={accentColor} />
              ) : (
                activeEvent && (
                  <EventProgressPanel
                    event={activeEvent}
                    accentColor={accentColor}
                    isAdmin={isAdmin}
                  />
                )
              )}
            </>
          )}
        </VStack>
        {!showOverview && (
          <Box
            mt={10}
            p={5}
            borderRadius="xl"
            border="1px solid"
            borderColor="purple.800"
            bg="purple.950"
            textAlign="center"
          >
            <Text fontSize="sm" fontWeight="semibold" color="gray.200" mb={1}>
              Have you and your group found this useful?
            </Text>
            <Text fontSize="sm" color="gray.400">
              This is built and maintained by a solo dev. If you want to support the site, there's a link in the footer.
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
