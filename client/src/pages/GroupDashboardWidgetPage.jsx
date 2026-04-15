import { Box, VStack, HStack, Text, Spinner, Center } from '@chakra-ui/react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import {
  GET_GROUP_DASHBOARD,
  GET_GROUP_DASHBOARD_PROGRESS,
} from '../graphql/groupDashboardOperations';
import GroupGoalCard from '../organisms/GroupDashboard/GroupGoalCard';

function fmt(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v?.toLocaleString() ?? '0';
}

function GoalProgressPanel({ event, accentColor }) {
  const { data, loading } = useQuery(GET_GROUP_DASHBOARD_PROGRESS, {
    variables: { eventId: event.id },
    pollInterval: 3_600_000,
  });

  const progressMap = {};
  (data?.getGroupDashboardProgress ?? []).forEach((p) => {
    progressMap[p.goalId] = p;
  });

  const enabledGoals = (event.goals ?? []).filter((g) => g.enabled !== false);

  if (loading && !data) {
    return (
      <Center py={8}>
        <Spinner size="lg" color="purple.400" />
      </Center>
    );
  }

  if (enabledGoals.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={6} fontSize="sm">
        No goals configured for this event.
      </Text>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {enabledGoals.map((goal) => (
        <GroupGoalCard
          key={goal.goalId}
          goalConfig={goal}
          progress={progressMap[goal.goalId]}
          accentColor={accentColor}
          eventStartDate={event.startDate}
        />
      ))}
    </VStack>
  );
}

export default function GroupDashboardWidgetPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event');

  const { data, loading, error } = useQuery(GET_GROUP_DASHBOARD, {
    variables: { slug },
  });

  const dashboard = data?.getGroupDashboard;
  const theme = dashboard?.theme ?? {};
  const accentColor = theme.accentColor ?? '#43AA8B';

  const allEvents = dashboard?.events ?? [];
  const visibleEvents = allEvents.filter((e) => e.isVisible);

  const activeEvent = eventIdParam
    ? visibleEvents.find((e) => String(e.id) === eventIdParam) ?? visibleEvents[0] ?? null
    : visibleEvents[0] ?? null;

  // Let the parent frame know our height so it can resize the iframe
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: 'osrsbingo-widget-resize', height: document.body.scrollHeight },
        '*'
      );
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <Center h="200px" bg="gray.900">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }

  if (error || !dashboard) {
    return (
      <Center h="200px" bg="gray.900">
        <Text color="gray.500" fontSize="sm">
          Dashboard not found.
        </Text>
      </Center>
    );
  }

  if (!activeEvent) {
    return (
      <Box bg="gray.900" p={6} minH="100px">
        <Text color="gray.500" fontSize="sm" textAlign="center">
          No active events right now.
        </Text>
      </Box>
    );
  }

  const startStr = new Date(activeEvent.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = new Date(activeEvent.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Box bg="gray.900" p={4} minH="100vh">
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="flex-start">
          <VStack align="flex-start" spacing={0}>
            <HStack spacing={2} align="center">
              <Box w="3px" h="14px" bg={accentColor} borderRadius="full" />
              <Text fontWeight="bold" color="white" fontSize="md" lineHeight="1.2">
                {dashboard.groupName}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.400" mt={0.5} ml="11px">
              {activeEvent.eventName} · {startStr} – {endStr}
            </Text>
          </VStack>
        </HStack>

        {/* Goal cards */}
        <GoalProgressPanel event={activeEvent} accentColor={accentColor} />

        {/* Footer */}
        <Text fontSize="10px" color="gray.600" textAlign="right">
          via{' '}
          <a
            href="https://www.osrsbingohub.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#805ad5', textDecoration: 'none' }}
          >
            osrsbingohub.com
          </a>
        </Text>
      </VStack>
    </Box>
  );
}
