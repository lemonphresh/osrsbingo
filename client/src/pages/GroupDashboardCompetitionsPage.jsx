import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Center,
  Flex,
  Button,
  Badge,
} from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { GET_GROUP_DASHBOARD, GET_GROUP_COMPETITIONS } from '../graphql/groupDashboardOperations';
import usePageTitle from '../hooks/usePageTitle';

const PAGE_SIZE = 20;

const STATUS_COLOR = {
  ongoing: 'green',
  upcoming: 'yellow',
  finished: 'gray',
};

const TYPE_LABEL = {
  classic: 'Classic',
  team: 'Team',
};

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMetric(metric) {
  return metric
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function CompetitionRow({ comp, accentColor, isLeagues = false }) {
  const statusColor = STATUS_COLOR[comp.status] ?? 'gray';
  const isOngoing = comp.status === 'ongoing';
  const href = isLeagues
    ? `https://league.wiseoldman.net/competitions/${comp.id}`
    : `https://wiseoldman.net/competitions/${comp.id}`;

  return (
    <Box
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      display="block"
      bg="gray.800"
      border="1px solid"
      borderColor={isOngoing ? accentColor : 'gray.700'}
      borderRadius="lg"
      px={5}
      py={4}
      _hover={{ borderColor: accentColor, textDecoration: 'none' }}
      transition="border-color 0.15s"
    >
      <HStack justify="space-between" align="flex-start" spacing={4}>
        <VStack align="flex-start" spacing={1} flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme={statusColor} fontSize="10px" textTransform="capitalize">
              {comp.status}
            </Badge>
            <Badge variant="outline" colorScheme="gray" fontSize="10px">
              {TYPE_LABEL[comp.type] ?? comp.type}
            </Badge>
          </HStack>
          <Text fontWeight="semibold" color="gray.100" fontSize="sm" noOfLines={1}>
            {comp.title}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {formatMetric(comp.metric)} · {formatDate(comp.startsAt)} to {formatDate(comp.endsAt)}
          </Text>
        </VStack>
        <VStack align="flex-end" spacing={0} flexShrink={0}>
          <Text fontSize="lg" fontWeight="bold" color="gray.200" lineHeight="1.2">
            {comp.participantCount}
          </Text>
          <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="wide">
            players
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

export default function GroupDashboardCompetitionsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(0);

  const { data: dashData, loading: dashLoading } = useQuery(GET_GROUP_DASHBOARD, {
    variables: { slug },
  });

  const { data, loading } = useQuery(GET_GROUP_COMPETITIONS, {
    variables: { slug },
    pollInterval: 900_000,
  });

  const dashboard = dashData?.getGroupDashboard;

  usePageTitle(dashboard ? `${dashboard.groupName} — Competitions` : 'Competitions');

  const accentColor = dashboard?.theme?.accentColor ?? '#43AA8B';
  const competitions = data?.getGroupCompetitions ?? [];

  const totalPages = Math.ceil(competitions.length / PAGE_SIZE);
  const pageItems = competitions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (dashLoading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }

  if (!dashboard) {
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
      justifyContent="flex-start"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingBottom={['72px', '112px']}
      paddingTop={['56px', '72px']}
    >
      <Box maxW="900px" w="100%">
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="flex-start" spacing={0}>
              <Button
                as={RouterLink}
                to={`/group/${slug}`}
                variant="ghost"
                size="sm"
                leftIcon={<ChevronLeftIcon />}
                color="gray.400"
                px={0}
                _hover={{ color: 'gray.200' }}
              >
                {dashboard.groupName}
              </Button>
              <Text fontSize="xl" fontWeight="bold" color="gray.100">
                Competitions
              </Text>
            </VStack>
          </HStack>

          {loading && !data && (
            <Center py={12}>
              <Spinner size="lg" color="purple.400" />
            </Center>
          )}

          {!loading && competitions.length === 0 && (
            <Box bg="gray.800" borderRadius="xl" p={8} textAlign="center">
              <Text color="gray.400">No competitions found for this group.</Text>
            </Box>
          )}

          {pageItems.length > 0 && (
            <VStack spacing={3} align="stretch">
              {pageItems.map((comp) => (
                <CompetitionRow
                  key={`${comp.isLeagues ? 'leagues' : 'wom'}-${comp.id}`}
                  comp={comp}
                  accentColor={accentColor}
                  isLeagues={comp.isLeagues ?? false}
                />
              ))}
            </VStack>
          )}

          {totalPages > 1 && (
            <HStack justify="center" spacing={2}>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="purple"
                isDisabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Text fontSize="sm" color="gray.400">
                Page {page + 1} of {totalPages}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="purple"
                isDisabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
