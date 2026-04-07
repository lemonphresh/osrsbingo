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
  Collapse,
} from '@chakra-ui/react';
import { useParams, Link as RouterLink, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useState, useEffect, useRef } from 'react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import {
  GET_GROUP_DASHBOARD,
  GET_GROUP_DASHBOARD_PROGRESS,
  REFRESH_GROUP_GOAL_DATA,
  GET_GROUP_COMPETITIONS,
  FOLLOW_GROUP_DASHBOARD,
  UNFOLLOW_GROUP_DASHBOARD,
} from '../graphql/groupDashboardOperations';
import GroupDashboardHeader from '../organisms/GroupDashboard/GroupDashboardHeader';
import GroupGoalCard from '../organisms/GroupDashboard/GroupGoalCard';
import usePageTitle from '../hooks/usePageTitle';
import PleaseEffect from '../atoms/PleaseEffect';

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
  if (msLeft <= 0) return null;
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

function EventCountdown({ event, accentColor }) {
  // Tick every second for the countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const msLeft = end - now;
  const totalMs = end - start;
  const elapsed = now - start;
  const eventPct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

  const isUpcoming = now < start;
  const isEnded = now > end;

  if (isEnded) return null;

  const msCountdown = isUpcoming ? start - now : msLeft;
  const days = Math.floor(msCountdown / 86400000);
  const hours = Math.floor((msCountdown % 86400000) / 3600000);
  const mins = Math.floor((msCountdown % 3600000) / 60000);
  const secs = Math.floor((msCountdown % 60000) / 1000);

  const units = days > 0
    ? [{ label: 'days', value: days }, { label: 'hrs', value: hours }, { label: 'min', value: mins }]
    : [{ label: 'hrs', value: hours }, { label: 'min', value: mins }, { label: 'sec', value: secs }];

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="lg"
      px={5}
      py={4}
      mb={2}
    >
      <HStack justify="space-between" align="center" mb={3}>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
          {isUpcoming ? 'Starts in' : 'Time remaining'}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {Math.round(eventPct)}% of event elapsed
        </Text>
      </HStack>
      <HStack spacing={4} mb={3} justify="center">
        {units.map(({ label, value }) => (
          <VStack key={label} spacing={0} align="center" minW="52px">
            <Text fontSize="3xl" fontWeight="black" color="white" lineHeight="1" fontVariantNumeric="tabular-nums">
              {String(value).padStart(2, '0')}
            </Text>
            <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="wider" mt={1}>
              {label}
            </Text>
          </VStack>
        ))}
      </HStack>
      {!isUpcoming && (
        <Box bg="gray.700" borderRadius="full" h="4px" overflow="hidden">
          <Box
            h="full"
            borderRadius="full"
            w={`${eventPct}%`}
            bg={accentColor ?? '#7D5FFF'}
            transition="width 1s linear"
          />
        </Box>
      )}
    </Box>
  );
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

function EventProgressPanel({ event, accentColor, isAdmin, userRsn }) {
  const { data, loading, refetch } = useQuery(GET_GROUP_DASHBOARD_PROGRESS, {
    variables: { eventId: event.id },
    pollInterval: 3_600_000,
  });

  const [forceRefresh, { loading: refreshing }] = useMutation(REFRESH_GROUP_GOAL_DATA, {
    variables: { eventId: event.id },
    onCompleted: () => refetch(),
  });

  const isRefreshing = loading || refreshing;
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef(null);
  useTicker();

  const progressMap = {};
  (data?.getGroupDashboardProgress ?? []).forEach((p) => {
    progressMap[p.goalId] = p;
  });

  const enabledGoals = (event.goals ?? []).filter((g) => g.enabled !== false);

  async function handleShare() {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#1a202c',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${event.eventName.replace(/\s+/g, '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      });
    } catch {
      setSharing(false);
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      <EventCountdown event={event} accentColor={accentColor} />
      {event.lastSyncedAt &&
        (() => {
          const nextIn = formatNextSync(event.lastSyncedAt);
          const isOverdue = !nextIn;
          return (
            <HStack justify="flex-end" spacing={2}>
              <Text fontSize="xs" color={isOverdue ? 'yellow.500' : 'gray.400'}>
                Synced {formatRelativeTime(event.lastSyncedAt)}
                {nextIn && ` · next in ${nextIn}`}
                {isOverdue && ' · data may be outdated, refresh the page.'}
              </Text>
              {isAdmin && (
                <Button
                  size="xs"
                  variant={isOverdue ? 'solid' : 'ghost'}
                  colorScheme="purple"
                  onClick={forceRefresh}
                  isLoading={isRefreshing}
                >
                  Refresh
                </Button>
              )}
            </HStack>
          );
        })()}

      <HStack justify="flex-end">
        <Button
          size="xs"
          variant="ghost"
          color="gray.500"
          _hover={{ color: 'gray.300' }}
          onClick={handleShare}
          isLoading={sharing}
          loadingText="Copying..."
        >
          Share image
        </Button>
      </HStack>

      {!loading && enabledGoals.length === 0 && (
        <Text color="gray.500" textAlign="center" py={8}>
          No goals configured for this event.
        </Text>
      )}

      <VStack spacing={4} align="stretch" ref={shareRef}>
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
                userRsn={userRsn}
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
      <HStack mb={3} justify="space-between" align="baseline">
        <Text fontWeight="semibold" color="gray.100" fontSize="md">
          {event.eventName}
        </Text>
        <Text fontSize="xs" color="gray.500" flexShrink={0}>
          {startStr} – {endStr}
        </Text>
      </HStack>
      <VStack spacing={2} align="stretch">
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

function PastEventsArchive({ events, accentColor, userRsn }) {
  const [open, setOpen] = useState(false);
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Box mt={4}>
      <Button
        size="sm"
        variant="ghost"
        color="gray.500"
        _hover={{ color: 'gray.300' }}
        onClick={() => setOpen((o) => !o)}
        rightIcon={<Text as="span" fontSize="10px">{open ? '▲' : '▼'}</Text>}
      >
        Past Events ({events.length})
      </Button>
      <Collapse in={open} animateOpacity>
        <VStack spacing={3} align="stretch" mt={3}>
          {events.map((e) => (
            <Box key={e.id} bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="lg" overflow="hidden">
              <HStack px={4} py={3} borderBottom="1px solid" borderColor="gray.700" justify="space-between">
                <Text fontWeight="semibold" color="gray.300" fontSize="sm">{e.eventName}</Text>
                <Text fontSize="xs" color="gray.500">{fmtDate(e.startDate)} – {fmtDate(e.endDate)}</Text>
              </HStack>
              <EventProgressPanel event={e} accentColor={accentColor} isAdmin={false} userRsn={userRsn} />
            </Box>
          ))}
        </VStack>
      </Collapse>
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
    <Box borderBottom="1px solid" borderColor="gray.700">
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
              onClick={() => onSelectEvent(e)}
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
  const allEvents = dashboard?.events ?? [];
  const visibleEvents = allEvents.filter((e) => e.isVisible);
  const pastEvents = allEvents
    .filter((e) => !e.isVisible && new Date(e.endDate) < new Date())
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

  const tabParam = searchParams.get('tab');
  const defaultToOverview = !tabParam && visibleEvents.length > 1;
  const showOverview = tabParam === 'overview' || defaultToOverview;
  const activeEvent =
    tabParam && tabParam !== 'overview'
      ? visibleEvents.find((e) => String(e.id) === tabParam) ?? visibleEvents[0] ?? null
      : visibleEvents[0] ?? null;
  const activeTabIdx = activeEvent ? visibleEvents.indexOf(activeEvent) : 0;

  const selectOverview = () => setSearchParams({ tab: 'overview' }, { replace: true });
  const selectTab = (e) => setSearchParams({ tab: String(e.id) }, { replace: true });

  const isAdmin =
    user &&
    dashboard &&
    (dashboard.creatorId === user.id || (dashboard.adminIds ?? []).includes(user.id));

  const [follow, { loading: following }] = useMutation(FOLLOW_GROUP_DASHBOARD, {
    variables: { dashboardId: dashboard?.id },
    refetchQueries: ['GetGroupDashboard'],
  });
  const [unfollow, { loading: unfollowing }] = useMutation(UNFOLLOW_GROUP_DASHBOARD, {
    variables: { dashboardId: dashboard?.id },
    refetchQueries: ['GetGroupDashboard'],
  });
  const isFollowing = dashboard?.isFollowing ?? false;
  const showFollowButton = user && !isAdmin;

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
            <GroupDashboardHeader
              dashboard={dashboard}
              activeEvent={showOverview ? null : activeEvent}
              subtitle={showOverview ? 'Overview' : null}
            />
            {showFollowButton && (
              <Button
                size="sm"
                variant={isFollowing ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => (isFollowing ? unfollow() : follow())}
                isLoading={following || unfollowing}
                flexShrink={0}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
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
                    userRsn={user?.rsn}
                  />
                )
              )}
            </>
          )}

          {/* Past events archive */}
          {pastEvents.length > 0 && (
            <PastEventsArchive events={pastEvents} accentColor={accentColor} userRsn={user?.rsn} />
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
              Have you and your group found this dashboard useful?
            </Text>
            <Text fontSize="sm" color="gray.400">
              This is built and maintained by a solo dev. If you want to{' '}
              <PleaseEffect direction="down">
                <Link
                  to="/support"
                  style={{
                    color: '#b794f4',
                    fontWeight: '600',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(183,148,244,0.4)',
                    textUnderlineOffset: '3px',
                  }}
                >
                  support the site
                </Link>
              </PleaseEffect>
              , they would really appreciate that.
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
