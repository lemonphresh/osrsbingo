// src/components/pages/StatsPage.jsx
import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  Skeleton,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { GET_SITE_STATS } from '../graphql/queries';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';
import {
  FaUsers,
  FaThLarge,
  FaCheckCircle,
  FaEye,
  FaCalendarWeek,
  FaGlobe,
  FaRandom,
  FaCoins,
} from 'react-icons/fa';
import { formatGP } from '../utils/treasureHuntHelpers';

const StatCard = ({ label, value, icon, helpText, color, isLoading, formatValue }) => {
  const displayValue = formatValue ? formatValue(value) : value?.toLocaleString();
  return (
    <Box
      bg={'gray.700'}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={'gray.600'}
      transition="all 0.2s"
      h="100%"
      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
    >
      <Stat>
        <HStack spacing={3} mb={2}>
          <Icon as={icon} color={color} boxSize={5} />
          <StatLabel color={'gray.400'}>{label}</StatLabel>
        </HStack>
        {isLoading ? (
          <Skeleton height="36px" width="80px" />
        ) : (
          <StatNumber fontSize="3xl" color={color}>
            {displayValue}
          </StatNumber>
        )}
        {helpText && <StatHelpText color={'gray.500'}>{helpText}</StatHelpText>}
      </Stat>
    </Box>
  );
};

const StatsPage = () => {
  usePageTitle('Site Stats');
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
          <Text color="gray.400">See what the OSRS Bingo Hub community has been up to!</Text>
        </VStack>

        {error && (
          <Box color="red.400" textAlign="center">
            Failed to load stats. Try refreshing!
          </Box>
        )}

        {/* Main Stats Grid */}
        <Flex flexWrap="wrap" justifyContent="center" alignItems="stretch" gap={6} w="100%">
          {[
            { label: 'Total Users', value: stats?.totalUsers, icon: FaUsers, color: 'purple.400' },
            {
              label: 'Boards Created',
              value: stats?.totalBoards,
              icon: FaThLarge,
              color: 'teal.400',
              helpText: `${stats?.publicBoards || 0} public`,
            },
            {
              label: 'Tiles Completed',
              value: stats?.completedTiles,
              icon: FaCheckCircle,
              color: 'green.400',
              helpText: `of ${stats?.totalTiles?.toLocaleString() || 0} total`,
            },
            {
              label: 'Total Visits Since Jan 2026',
              value: stats?.totalVisits,
              icon: FaEye,
              color: 'blue.400',
            },
            {
              label: 'New Boards This Week',
              value: stats?.boardsThisWeek,
              icon: FaCalendarWeek,
              color: 'orange.400',
            },
            {
              label: 'New Users This Week',
              value: stats?.usersThisWeek,
              icon: FaGlobe,
              color: 'pink.400',
            },
            {
              label: 'Blind Drafts Performed',
              value: stats?.totalBlindDrafts,
              icon: FaRandom,
              color: 'cyan.400',
            },
            {
              label: 'GP Won in Gielinor Rush Events',
              value: stats?.totalGpWon,
              icon: FaCoins,
              color: 'yellow.400',
              formatValue: (v) => formatGP(v ?? 0),
            },
          ].map((card) => (
            <Box
              key={card.label}
              flexBasis={{ base: '100%', sm: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' }}
              flexGrow={0}
              flexShrink={0}
            >
              <StatCard {...card} isLoading={loading} />
            </Box>
          ))}
        </Flex>

        {/* Fun Footer */}
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color={'gray.500'}>
            Stats refresh every 5 minutes. Keep grinding! 🎮
          </Text>
        </Box>
      </VStack>
    </Flex>
  );
};

export default StatsPage;
