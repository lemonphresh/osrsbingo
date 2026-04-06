import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Flex,
  Badge,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { AddIcon, ExternalLinkIcon, SettingsIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import { GET_MY_GROUP_DASHBOARDS } from '../graphql/groupDashboardOperations';
import usePageTitle from '../hooks/usePageTitle';

function DashboardCard({ dashboard }) {
  const now = new Date();
  const events = dashboard.events ?? [];
  const activeEvents = events.filter((e) => {
    const end = new Date(e.endDate);
    end.setDate(end.getDate() + 5);
    return now >= new Date(e.startDate) && now <= end;
  });
  const theme = dashboard.theme ?? {};
  const accent = theme.accentColor ?? '#43AA8B';

  return (
    <Box
      bg="gray.800"
      border="2px solid"
      borderColor={accent}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.15s"
      _hover={{ transform: 'translateY(-1px)' }}
    >
      <HStack px={5} pt={4} pb={3} justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={0.5} minW={0} flex={1}>
          <Text fontWeight="bold" color="white" fontSize="lg" noOfLines={1}>
            {dashboard.groupName}
          </Text>
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              WOM #{dashboard.womGroupId}
            </Text>
            <Text fontSize="xs" color="gray.600">
              ·
            </Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              /group/{dashboard.slug}
            </Text>
          </HStack>
        </VStack>
        {activeEvents.length > 0 && (
          <Badge colorScheme="green" fontSize="xs" flexShrink={0}>
            {activeEvents.length} active
          </Badge>
        )}
      </HStack>

      <Box px={5} pb={2}>
        <HStack spacing={4}>
          <Text fontSize="xs" color="gray.500">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </Text>
          {events.length > 0 && (
            <Text fontSize="xs" color="gray.600" noOfLines={1}>
              {events
                .slice()
                .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                .slice(0, 2)
                .map((e) => e.eventName)
                .join(', ')}
            </Text>
          )}
        </HStack>
      </Box>

      <HStack px={5} py={3} spacing={3} borderTop="1px solid" borderColor="gray.700" mt={1}>
        <Button
          as={RouterLink}
          to={`/group/${dashboard.slug}`}
          size="xs"
          variant="outline"
          colorScheme="purple"
          rightIcon={<ExternalLinkIcon />}
        >
          View
        </Button>
        <Button
          as={RouterLink}
          to={`/group/${dashboard.slug}/manage`}
          size="xs"
          variant="outline"
          colorScheme="blue"
          leftIcon={<SettingsIcon />}
        >
          Manage
        </Button>
      </HStack>
    </Box>
  );
}

export default function GroupDashboardListPage() {
  usePageTitle('My Group Dashboards');
  const { user } = useAuth();
  const { data, loading } = useQuery(GET_MY_GROUP_DASHBOARDS, { skip: !user });

  if (!user) {
    return (
      <Center h="60vh">
        <Text color="gray.400">You need to be logged in to view your dashboards.</Text>
      </Center>
    );
  }

  const dashboards = data?.getMyGroupDashboards ?? [];

  return (
    <Flex
      flex="1"
      flexDirection="column"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingBottom={['72px', '112px']}
      paddingTop={['56px', '72px']}
    >
      <Box maxW="800px" w="100%" mx="auto">
        <HStack justify="space-between" align="center" mb={8}>
          <VStack align="flex-start" spacing={0}>
            <Heading size="lg" color="gray.100">
              Group Dashboards
            </Heading>
            <Text fontSize="sm" color="gray.400">
              Dashboards you own or admin
            </Text>
          </VStack>
          <Button
            as={RouterLink}
            to="/group/new"
            colorScheme="purple"
            size="sm"
            leftIcon={<AddIcon />}
          >
            New Dashboard
          </Button>
        </HStack>

        {loading && (
          <Center py={12}>
            <Spinner color="purple.400" />
          </Center>
        )}

        {!loading && dashboards.length === 0 && (
          <Box bg="gray.800" borderRadius="xl" p={12} textAlign="center">
            <Text color="gray.400" mb={2}>
              You don't have any group dashboards yet.
            </Text>
            <Text fontSize="sm" color="gray.500" mb={6}>
              Create one to start tracking collective goals for your WOM group.
            </Text>
            <Button as={RouterLink} to="/group/new" colorScheme="purple" leftIcon={<AddIcon />}>
              Create Dashboard
            </Button>
          </Box>
        )}

        {!loading && dashboards.length > 0 && (
          <VStack spacing={4} align="stretch">
            {dashboards.map((d) => (
              <DashboardCard key={d.id} dashboard={d} />
            ))}
          </VStack>
        )}
      </Box>
    </Flex>
  );
}
