import { Box, VStack, HStack, Text, Spinner, Center, Flex, Button, Collapse } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import {
  GET_MY_GROUP_ACTIVITY,
  GET_MY_GROUP_ASSOCIATIONS,
  GET_UNREAD_GROUP_NOTIFICATION_COUNT,
  MARK_GROUP_NOTIFICATIONS_READ,
  MUTE_GROUP_DASHBOARD,
  UNMUTE_GROUP_DASHBOARD,
  UNFOLLOW_GROUP_DASHBOARD,
} from '../graphql/groupDashboardOperations';
import usePageTitle from '../hooks/usePageTitle';

const TYPE_META = {
  event_started: { label: 'Event started', color: 'green', emoji: '🏁' },
  event_ended: { label: 'Event ended', color: 'gray', emoji: '🏆' },
  milestone_25: { label: '25% reached', color: 'yellow', emoji: '📊' },
  milestone_50: { label: '50% reached', color: 'yellow', emoji: '📊' },
  milestone_75: { label: '75% reached', color: 'orange', emoji: '🔥' },
  milestone_100: { label: 'Goal complete', color: 'green', emoji: '🎉' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtValue(v) {
  if (v == null) return null;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PILL_STYLES = {
  event_started: { bg: 'rgba(72,187,120,0.15)', color: '#68d391' },
  event_ended:   { bg: 'rgba(160,174,192,0.12)', color: '#a0aec0' },
  milestone_25:  { bg: 'rgba(236,201,75,0.12)', color: '#ecc94b' },
  milestone_50:  { bg: 'rgba(236,201,75,0.12)', color: '#ecc94b' },
  milestone_75:  { bg: 'rgba(237,137,54,0.15)', color: '#ed8936' },
  milestone_100: { bg: 'rgba(72,187,120,0.15)', color: '#68d391' },
};

function TypePill({ type, label }) {
  const { bg, color } = PILL_STYLES[type] ?? { bg: 'rgba(160,174,192,0.12)', color: '#a0aec0' };
  return (
    <Box
      as="span"
      display="inline-block"
      px="7px"
      py="2px"
      borderRadius="full"
      fontSize="10px"
      fontWeight="semibold"
      letterSpacing="0.02em"
      bg={bg}
      color={color}
      lineHeight="1.6"
      flexShrink={0}
    >
      {label}
    </Box>
  );
}

function ActivityItem({ item }) {
  const meta = TYPE_META[item.type] ?? { label: item.type, color: 'gray', emoji: '📌' };
  const isUnread = !item.readAt;
  const m = item.metadata ?? {};
  const isComplete = item.type === 'milestone_100';

  let title = null;
  let detail = null;

  if (item.type === 'event_started') {
    title = `${item.eventName} is now live.`;
    if (m.startDate && m.endDate) {
      detail = `${fmtDate(m.startDate)} to ${fmtDate(m.endDate)}`;
    }
  } else if (item.type === 'event_ended') {
    title = `${item.eventName} has ended.`;
    if (m.individualSummaries?.length) {
      const parts = m.individualSummaries.map(
        (s) => `${s.goalEmoji} ${s.goalName}: ${s.completedCount} member${s.completedCount !== 1 ? 's' : ''} completed`
      );
      detail = parts.join(' · ');
    } else if (m.endDate) {
      detail = `Ended ${fmtDate(m.endDate)}`;
    }
  } else if (item.type.startsWith('milestone_')) {
    const goalLabel = `${m.goalEmoji ?? '🎯'} ${m.goalName ?? 'A goal'}`;
    title = isComplete
      ? `${goalLabel} complete!`
      : `${goalLabel} hit ${m.percent}% in ${item.eventName}.`;
    if (m.current != null && m.target != null) {
      detail = `${fmtValue(m.current)} / ${fmtValue(m.target)}${isComplete ? ' (complete)' : ''}`;
    }
  }

  const linkTo = item.eventId
    ? `/group/${item.dashboardSlug}?tab=${item.eventId}`
    : `/group/${item.dashboardSlug}`;

  return (
    <Box
      as={RouterLink}
      to={linkTo}
      display="block"
      bg={isUnread ? 'gray.750' : 'gray.800'}
      border="1px solid"
      borderColor={isUnread ? 'purple.700' : 'gray.700'}
      borderRadius="lg"
      px={4}
      py={3}
      _hover={{ borderColor: 'purple.500', textDecoration: 'none' }}
      transition="border-color 0.15s"
    >
      <HStack spacing={3} align="flex-start">
        <Text fontSize="xl" lineHeight="1" mt="1px" flexShrink={0}>
          {meta.emoji}
        </Text>
        <VStack align="flex-start" spacing={0.5} flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="xs" fontWeight="semibold" color="gray.300">
              {item.dashboardName}
            </Text>
            <TypePill type={item.type} label={meta.label} />
            {isUnread && <Box w="6px" h="6px" borderRadius="full" bg="purple.400" flexShrink={0} />}
          </HStack>
          {title && (
            <Text fontSize="sm" color="gray.300">
              {title}
            </Text>
          )}
          {detail && (
            <Text fontSize="xs" color="gray.500">
              {detail}
            </Text>
          )}
          <Text fontSize="xs" color="gray.600">
            {timeAgo(item.createdAt)}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const ROLE_LABEL = { creator: 'Creator', admin: 'Admin', follower: 'Following' };
const ROLE_COLOR = { creator: '#b794f4', admin: '#76e4f7', follower: '#68d391' };

function PreferencesPanel() {
  const [open, setOpen] = useState(false);
  const refetchList = [
    { query: GET_MY_GROUP_ASSOCIATIONS },
    { query: GET_MY_GROUP_ACTIVITY },
    { query: GET_UNREAD_GROUP_NOTIFICATION_COUNT },
  ];

  const { data } = useQuery(GET_MY_GROUP_ASSOCIATIONS, { skip: !open });
  const [mute] = useMutation(MUTE_GROUP_DASHBOARD, { refetchQueries: refetchList });
  const [unmute] = useMutation(UNMUTE_GROUP_DASHBOARD, { refetchQueries: refetchList });
  const [unfollow] = useMutation(UNFOLLOW_GROUP_DASHBOARD, { refetchQueries: refetchList });

  const associations = data?.getMyGroupAssociations ?? [];

  return (
    <Box>
      <Button
        size="xs"
        variant="outline"
        color="gray.400"
        borderColor="gray.600"
        bg="gray.800"
        _hover={{ borderColor: 'gray.400', color: 'gray.200' }}
        rightIcon={
          <Text fontSize="9px" lineHeight="1" mt="1px">
            {open ? '▲' : '▼'}
          </Text>
        }
        onClick={() => setOpen((o) => !o)}
      >
        Group preferences
      </Button>
      <Collapse in={open} animateOpacity>
        <Box mt={2} bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="lg" overflow="hidden">
          {associations.length === 0 && (
            <Text fontSize="sm" color="gray.500" px={4} py={3}>No groups yet.</Text>
          )}
          {associations.map((a, i) => (
            <HStack
              key={a.dashboardId}
              px={4} py={3}
              borderTop={i > 0 ? '1px solid' : undefined}
              borderColor="gray.700"
              justify="space-between"
            >
              <HStack spacing={3} minW={0}>
                <Box
                  as="span"
                  fontSize="10px"
                  fontWeight="semibold"
                  px="6px" py="2px"
                  borderRadius="full"
                  color={ROLE_COLOR[a.role]}
                  bg={`${ROLE_COLOR[a.role]}18`}
                  flexShrink={0}
                >
                  {ROLE_LABEL[a.role]}
                </Box>
                <Text
                  as={RouterLink}
                  to={`/group/${a.dashboardSlug}`}
                  fontSize="sm"
                  color={a.isMuted ? 'gray.500' : 'gray.200'}
                  noOfLines={1}
                  _hover={{ color: 'white' }}
                >
                  {a.dashboardName}
                </Text>
                {a.isMuted && (
                  <Text fontSize="xs" color="gray.600">muted</Text>
                )}
              </HStack>
              <HStack spacing={2} flexShrink={0}>
                {a.isMuted ? (
                  <Button size="xs" variant="ghost" color="gray.400" _hover={{ color: 'gray.200' }}
                    onClick={() => unmute({ variables: { dashboardId: a.dashboardId } })}>
                    Unmute
                  </Button>
                ) : (
                  <Button size="xs" variant="ghost" color="gray.400" _hover={{ color: 'gray.200' }}
                    onClick={() => mute({ variables: { dashboardId: a.dashboardId } })}>
                    Mute
                  </Button>
                )}
                {a.role === 'follower' && (
                  <Button size="xs" variant="ghost" color="red.400" _hover={{ color: 'red.300' }}
                    onClick={() => unfollow({ variables: { dashboardId: a.dashboardId } })}>
                    Unfollow
                  </Button>
                )}
              </HStack>
            </HStack>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function GroupDashboardActivityPage() {
  usePageTitle('My Groups');
  const { user } = useAuth();
  const [showOlder, setShowOlder] = useState(false);

  const { data, loading } = useQuery(GET_MY_GROUP_ACTIVITY, {
    skip: !user,
    fetchPolicy: 'network-only',
  });

  const [markRead] = useMutation(MARK_GROUP_NOTIFICATIONS_READ, {
    refetchQueries: [
      { query: GET_UNREAD_GROUP_NOTIFICATION_COUNT },
      { query: GET_MY_GROUP_ACTIVITY },
    ],
  });

  const items = data?.getMyGroupActivity ?? [];
  const hasUnread = items.some((i) => !i.readAt);

  // Mark all as read when page loads and there's anything unread
  useEffect(() => {
    if (hasUnread) markRead();
  }, [hasUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  const cutoff = Date.now() - WEEK_MS;
  const recentItems = items.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
  const olderItems = items.filter((i) => new Date(i.createdAt).getTime() < cutoff);
  const visibleItems = showOlder ? items : recentItems;

  if (!user) {
    return (
      <Center h="60vh">
        <Text color="gray.400">Log in to see your group activity.</Text>
      </Center>
    );
  }

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      justifyContent="flex-start"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingBottom={['72px', '112px']}
      paddingTop={['56px', '72px']}
    >
      <Box maxW="700px" w="100%">
        <VStack spacing={6} align="stretch">
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="gray.100">
              Group Activity Feed
            </Text>
            <Text fontSize="sm" color="gray.500">
              Activity from groups you follow or manage.
            </Text>
            <PreferencesPanel />
          </VStack>

          {loading && (
            <Center py={12}>
              <Spinner size="lg" color="purple.400" />
            </Center>
          )}

          {!loading && items.length === 0 && (
            <Box bg="gray.800" borderRadius="xl" p={8} textAlign="center">
              <Text color="gray.400">No activity yet.</Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Follow a group dashboard or create your own to get started.
              </Text>
            </Box>
          )}

          {!loading && items.length > 0 && recentItems.length === 0 && (
            <Box bg="gray.800" borderRadius="xl" p={8} textAlign="center">
              <Text color="gray.400">No activity in the last 7 days.</Text>
            </Box>
          )}

          {visibleItems.length > 0 && (
            <VStack spacing={2} align="stretch">
              {visibleItems.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </VStack>
          )}

          {!showOlder && olderItems.length > 0 && (
            <Center>
              <Button
                variant="ghost"
                size="sm"
                color="gray.400"
                _hover={{ color: 'gray.200' }}
                onClick={() => setShowOlder(true)}
              >
                Load older activity ({olderItems.length})
              </Button>
            </Center>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
