// src/components/pages/StatsPage.jsx
import {
  Box,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  Skeleton,
  useColorMode,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { GET_SITE_STATS } from '../graphql/queries';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';
import { FaUsers, FaThLarge, FaCheckCircle, FaEye, FaCalendarWeek, FaGlobe } from 'react-icons/fa';

const StatCard = ({ label, value, icon, helpText, color, isLoading }) => {
  const { colorMode } = useColorMode();

  return (
    <Box
      bg={colorMode === 'dark' ? 'gray.700' : 'white'}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
    >
      <Stat>
        <HStack spacing={3} mb={2}>
          <Icon as={icon} color={color} boxSize={5} />
          <StatLabel color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>{label}</StatLabel>
        </HStack>
        {isLoading ? (
          <Skeleton height="36px" width="80px" />
        ) : (
          <StatNumber fontSize="3xl" color={color}>
            {value?.toLocaleString()}
          </StatNumber>
        )}
        {helpText && (
          <StatHelpText color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};

const StatsPage = () => {
  usePageTitle('Site Stats');
  const { colorMode } = useColorMode();
  const { data, loading, error } = useQuery(GET_SITE_STATS);

  const stats = data?.getSiteStats;

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      minHeight="100vh"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
      width="100%"
    >
      <VStack spacing={8} maxW="1000px" w="100%">
        {/* Header */}
        <VStack spacing={2} textAlign="center">
          <GemTitle size="xl" gemColor="purple">
            Site Stats
          </GemTitle>
          <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            See what the OSRS Bingo Hub community has been up to
          </Text>
        </VStack>

        {error && (
          <Box color="red.400" textAlign="center">
            Failed to load stats. Try refreshing!
          </Box>
        )}

        {/* Main Stats Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} w="100%">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers}
            icon={FaUsers}
            color="purple.400"
            isLoading={loading}
          />
          <StatCard
            label="Boards Created"
            value={stats?.totalBoards}
            icon={FaThLarge}
            color="teal.400"
            helpText={`${stats?.publicBoards || 0} public`}
            isLoading={loading}
          />
          <StatCard
            label="Tiles Completed"
            value={stats?.completedTiles}
            icon={FaCheckCircle}
            color="green.400"
            helpText={`of ${stats?.totalTiles?.toLocaleString() || 0} total`}
            isLoading={loading}
          />
          <StatCard
            label="Total Visits Since Jan 2026"
            value={stats?.totalVisits}
            icon={FaEye}
            color="blue.400"
            isLoading={loading}
          />
          <StatCard
            label="New Boards This Week"
            value={stats?.boardsThisWeek}
            icon={FaCalendarWeek}
            color="orange.400"
            isLoading={loading}
          />
          <StatCard
            label="New Users This Week"
            value={stats?.usersThisWeek}
            icon={FaGlobe}
            color="pink.400"
            isLoading={loading}
          />
        </SimpleGrid>

        {/* Completion Rate */}
        {/* <Section bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} w="100%">
          <VStack spacing={4} py={6} px={4}>
            <Text
              fontWeight="bold"
              fontSize="lg"
              color={colorMode === 'dark' ? 'white' : 'gray.700'}
            >
              Global Tile Completion Rate
            </Text>
            {loading ? (
              <Skeleton height="24px" width="100%" maxW="400px" />
            ) : (
              <Box w="100%" maxW="400px">
                <Progress
                  value={stats?.completionRate || 0}
                  colorScheme="green"
                  size="lg"
                  borderRadius="full"
                  bg={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                />
                <Text textAlign="center" mt={2} fontWeight="bold" color="green.400">
                  {stats?.completionRate || 0}% of tiles completed
                </Text>
              </Box>
            )}
            <Text
              fontSize="sm"
              color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}
              textAlign="center"
            >
              That's {stats?.completedTiles?.toLocaleString() || 0} tiles completed across all
              boards!
            </Text>
          </VStack>
        </Section> */}

        {/* Fun Footer */}
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
            Stats refresh every 5 minutes. Keep grinding! 🎮
          </Text>
        </Box>
      </VStack>
    </Flex>
  );
};

export default StatsPage;
