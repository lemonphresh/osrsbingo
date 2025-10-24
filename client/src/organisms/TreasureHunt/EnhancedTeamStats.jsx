import React, { useMemo } from 'react';
import {
  Box,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Image,
  HStack,
  VStack,
  Badge,
  Text,
  Progress,
  Icon,
  Tooltip,
  Button,
  useColorMode,
  Skeleton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Flex,
} from '@chakra-ui/react';
import { InfoIcon, WarningIcon } from '@chakra-ui/icons';
import { FaFire, FaTrophy, FaHome } from 'react-icons/fa';
import Key from '../../assets/Key.png';
import Gold from '../../assets/gold.png';
import AdventurePath from '../../assets/adventurepath.png';

/**
 * Enhanced Team Stats Component
 * Shows GP, nodes completed, and keys with context and actionable insights
 */
export const EnhancedTeamStats = ({
  team,
  allTeams = [],
  totalNodes = 0,
  availableInns = [],
  onVisitInn,
  loading = false,
}) => {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      yellow: { base: '#F4D35E' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      statBg: '#1A202C',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      yellow: { base: '#F4D35E' },
      textColor: '#171923',
      cardBg: 'white',
      statBg: '#F7FAFC',
    },
  };

  const currentColors = colors[colorMode];

  // Calculate team rank
  const teamRank = useMemo(() => {
    if (!allTeams.length) return null;
    const sorted = [...allTeams].sort((a, b) => b.currentPot - a.currentPot);
    return sorted.findIndex((t) => t.teamId === team.teamId) + 1;
  }, [allTeams, team]);

  // Find next team to beat
  const nextTeam = useMemo(() => {
    if (!allTeams.length) return null;
    return allTeams
      .filter((t) => t.currentPot > team.currentPot)
      .sort((a, b) => a.currentPot - b.currentPot)[0];
  }, [allTeams, team]);

  const gpToNextRank = nextTeam ? nextTeam.currentPot - team.currentPot : 0;

  // Calculate completion percentage
  const completionRate = totalNodes > 0 ? (team.completedNodes?.length / totalNodes) * 100 : 0;

  // Check for recent activity (nodes completed in last 24h)
  const hasRecentActivity = useMemo(() => {
    if (!team.completedNodes?.length) return false;
    // This would need actual timestamp data - placeholder logic
    return team.completedNodes.some((node) => {
      // Check if node was completed recently
      return true; // Placeholder
    });
  }, [team.completedNodes]);

  // Total keys count
  const totalKeys = team.keysHeld?.reduce((sum, k) => sum + k.quantity, 0) || 0;

  // Format GP helper
  const formatGP = (gp) => {
    if (gp >= 1000000) return `${(gp / 1000000).toFixed(1)}M`;
    if (gp >= 1000) return `${(gp / 1000).toFixed(1)}K`;
    return gp.toString();
  };

  if (loading) {
    return (
      <StatGroup
        alignSelf="center"
        maxWidth="740px"
        w="100%"
        justifyContent="space-between"
        flexDirection={['column', 'column', 'row']}
        gap={4}
      >
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height="140px" borderRadius="md" flex={1} />
        ))}
      </StatGroup>
    );
  }

  return (
    <StatGroup
      alignSelf="center"
      maxWidth="740px"
      w="100%"
      justifyContent="space-between"
      flexDirection={['column', 'column', 'row']}
      gap={4}
    >
      {/* GP Stat with Rank Context */}
      <Stat
        bg={currentColors.cardBg}
        p={4}
        borderRadius="md"
        minH="130px"
        position="relative"
        textAlign="center"
        overflow="hidden"
        borderWidth={teamRank === 1 ? 2 : 1}
        borderColor={teamRank === 1 ? 'yellow.400' : 'transparent'}
        transition="all 0.3s"
        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      >
        {/* Rank badge */}
        {teamRank && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme={teamRank === 1 ? 'yellow' : teamRank <= 3 ? 'purple' : 'gray'}
            fontSize="xs"
          >
            {teamRank === 1 && '👑 '}#{teamRank}
          </Badge>
        )}

        <StatLabel color={currentColors.textColor} fontSize="sm" mb={1}>
          Current Pot
        </StatLabel>

        <HStack justifyContent="center" textAlign="center" w="100%" spacing={2} mb={2}>
          <Image h="32px" src={Gold} alt="Gold" />
          <StatNumber color={currentColors.green.base} fontSize="2xl">
            {formatGP(team.currentPot)}
          </StatNumber>
        </HStack>

        {/* Contextual help text */}
        <StatHelpText fontSize="xs" color="gray.500" mb={0}>
          {teamRank === 1 ? (
            <HStack spacing={1}>
              <Icon as={FaTrophy} color="yellow.400" />
              <Text>Leading the pack! 🎉</Text>
            </HStack>
          ) : gpToNextRank > 0 ? (
            <HStack spacing={1}>
              <StatArrow type="increase" />
              <Text>
                {formatGP(gpToNextRank)} to rank #{teamRank - 1}
              </Text>
            </HStack>
          ) : (
            <Text>Keep grinding for GP!</Text>
          )}
        </StatHelpText>

        {/* Progress bar to next rank */}
        {gpToNextRank > 0 && nextTeam && (
          <Popover trigger="hover" placement="top">
            <PopoverTrigger>
              <Box mt={2} cursor="pointer">
                <Progress
                  value={(team.currentPot / nextTeam.currentPot) * 100}
                  size="xs"
                  colorScheme="green"
                  borderRadius="full"
                  bg={colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.200'}
                />
              </Box>
            </PopoverTrigger>
            <PopoverContent w="auto">
              <PopoverArrow />
              <PopoverBody fontSize="xs">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Next Team: {nextTeam.teamName}</Text>
                  <Text color="gray.500">
                    {formatGP(nextTeam.currentPot)} GP ({formatGP(gpToNextRank)} ahead)
                  </Text>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )}
      </Stat>

      {/* Nodes Completed with Progress */}
      <Stat
        bg={currentColors.cardBg}
        p={4}
        minH="130px"
        borderRadius="md"
        position="relative"
        transition="all 0.3s"
        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      >
        {/* Activity indicator */}
        {hasRecentActivity && (
          <HStack
            position="absolute"
            top={2}
            right={2}
            spacing={1}
            bg="orange.500"
            px={2}
            py={1}
            borderRadius="full"
          >
            <Icon as={FaFire} color="white" boxSize={3} />
            <Text fontSize="xs" color="white" fontWeight="bold">
              Active
            </Text>
          </HStack>
        )}

        <StatLabel color={currentColors.textColor} fontSize="sm" mb={1}>
          Nodes Completed
        </StatLabel>

        <HStack justifyContent="center" textAlign="center" w="100%" spacing={2} mb={2}>
          <Image h="32px" src={AdventurePath} alt="Path" />
          <StatNumber color={currentColors.textColor} fontSize="2xl">
            {team.completedNodes?.length || 0}
            <Text as="span" fontSize="md" color="gray.500" ml={1}>
              / {totalNodes}
            </Text>
          </StatNumber>
        </HStack>

        {/* Completion progress */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <StatHelpText fontSize="xs" color="gray.500" mb={0}>
              {completionRate.toFixed(0)}% complete
            </StatHelpText>
            <Tooltip label="Your progress through the event" placement="top">
              <Icon as={InfoIcon} boxSize={3} color="gray.400" />
            </Tooltip>
          </HStack>
          <Progress
            value={completionRate}
            size="sm"
            colorScheme={completionRate > 75 ? 'green' : completionRate > 50 ? 'blue' : 'purple'}
            borderRadius="full"
            hasStripe
            isAnimated={completionRate > 0}
          />
        </Box>
      </Stat>

      {/* Keys with Inn CTA */}
      <Stat
        bg={currentColors.cardBg}
        p={4}
        minH="130px"
        borderRadius="md"
        position="relative"
        transition="all 0.3s"
        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      >
        {/* Warning if keys but no inn visits */}
        {totalKeys > 0 && availableInns.length > 0 && (
          <Tooltip label="You have keys ready to trade at the Inn!" placement="top">
            <Icon
              as={WarningIcon}
              position="absolute"
              top={2}
              right={2}
              color="yellow.500"
              boxSize={4}
              animation="pulse 2s infinite"
            />
          </Tooltip>
        )}

        <StatLabel color={currentColors.textColor} fontSize="sm" mb={1}>
          Keys Held
        </StatLabel>

        <HStack
          justifyContent="center"
          textAlign="center"
          w="100%"
          spacing={2}
          mb={2}
          align="center"
        >
          <Image h="32px" src={Key} alt="Key" />
          <StatNumber color={currentColors.textColor} fontSize="2xl">
            {totalKeys}
          </StatNumber>
        </HStack>

        {/* Key breakdown or empty state */}
        {totalKeys === 0 ? (
          <StatHelpText textAlign="center" fontSize="xs" color="gray.500" mb={0}>
            Complete nodes to earn keys
          </StatHelpText>
        ) : (
          <VStack align="stretch" spacing={2}>
            {/* Key badges */}
            <HStack spacing={1} flexWrap="wrap">
              {team.keysHeld?.map((key) => (
                <Tooltip key={key.color} label={`${key.color} key`} placement="top">
                  <Badge colorScheme={key.color} fontSize="xs" px={2}>
                    {key.quantity}
                  </Badge>
                </Tooltip>
              ))}
            </HStack>
          </VStack>
        )}
      </Stat>
      {/* Inn CTA if keys available */}
      <Flex justifyContent="flex-end" w="full">
        {availableInns.length > 0 && (
          <Button
            size="xs"
            colorScheme="pink"
            leftIcon={<Icon as={FaHome} />}
            onClick={onVisitInn}
            minW="235px"
            variant="solid"
          >
            Trade at Inn ({availableInns.length} available)
          </Button>
        )}
      </Flex>
    </StatGroup>
  );
};

export default EnhancedTeamStats;
