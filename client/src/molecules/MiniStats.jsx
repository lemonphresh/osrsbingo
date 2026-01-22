import { HStack, VStack, Text, Skeleton, useColorMode, Box, Flex, Icon } from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { GET_SITE_STATS } from '../graphql/queries';
import { Link } from 'react-router-dom';
import { FaUsers, FaThLarge, FaCheckCircle } from 'react-icons/fa';
import theme from '../theme';
import GemTitle from '../atoms/GemTitle';

const MiniStats = ({ showLink = true }) => {
  const { colorMode } = useColorMode();
  const { data, loading } = useQuery(GET_SITE_STATS);

  const stats = data?.getSiteStats;

  const StatItem = ({ value, label, icon, color }) => (
    <VStack spacing={1}>
      <Icon as={icon} color={color} boxSize={4} />
      {loading ? (
        <Skeleton height="28px" width="50px" borderRadius="md" />
      ) : (
        <Text fontWeight="bold" fontSize="2xl" color="white">
          {value?.toLocaleString()}
        </Text>
      )}
      <Text
        fontSize="xs"
        color={colorMode === 'dark' ? 'gray.200' : 'gray.300'}
        fontWeight="medium"
      >
        {label}
      </Text>
    </VStack>
  );

  return (
    <Flex
      flexDirection="column"
      align="center"
      bg={
        colorMode === 'dark'
          ? 'linear-gradient(145deg, rgba(128, 90, 213, 0.15) 0%, rgba(49, 130, 206, 0.3) 100%)'
          : 'linear-gradient(145deg, rgba(128, 90, 213, 0.08) 0%, rgba(49, 130, 206, 0.3) 100%)'
      }
      borderWidth="1px"
      borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200'}
      borderRadius="xl"
      px={8}
      py={5}
      gap={3}
    >
      <GemTitle size="sm" fontWeight="bold" color="white" gemColor="green">
        Community Stats
      </GemTitle>

      <HStack spacing={[6, 8, 10]} justify="center" flexWrap="wrap">
        <StatItem
          value={stats?.totalUsers}
          label="users"
          icon={FaUsers}
          color={theme.colors.purple[400]}
        />
        <Box height="40px" width="1px" bg={colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.300'} />
        <StatItem
          value={stats?.totalBoards}
          label="boards"
          icon={FaThLarge}
          color={theme.colors.teal[400]}
        />
        <Box height="40px" width="1px" bg={colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.300'} />
        <StatItem
          value={stats?.completedTiles}
          label="tiles completed"
          icon={FaCheckCircle}
          color={theme.colors.green[400]}
        />
      </HStack>

      {showLink && (
        <Link to="/stats">
          <Text
            fontSize="xs"
            color="yellow.400"
            fontWeight="medium"
            _hover={{ color: 'yellow.300', textDecoration: 'underline' }}
            transition="all 0.2s"
          >
            View all stats →
          </Text>
        </Link>
      )}
    </Flex>
  );
};

export default MiniStats;
