import React, { useMemo } from 'react';
import {
  Box,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
} from '@chakra-ui/react';
import { InfoIcon, WarningIcon } from '@chakra-ui/icons';
import { FaFire, FaHome } from 'react-icons/fa';
import Key from '../../assets/Key.png';
import AdventurePath from '../../assets/adventurepath-small.webp';

/**
 * Enhanced Team Stats Component
 * Shows GP, nodes completed, and keys with context and actionable insights
 */
export const EnhancedTeamStats = ({
  team,
  allTeams = [],
  totalNodes = 0,
  maxCompletableNodes = 0,
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

  // // Calculate team rank
  // const teamRank = useMemo(() => {
  //   if (!allTeams.length) return null;
  //   const sorted = [...allTeams].sort((a, b) => b.currentPot - a.currentPot);
  //   return sorted.findIndex((t) => t.teamId === team.teamId) + 1;
  // }, [allTeams, team]);

  // // Find next team to beat
  // const nextTeam = useMemo(() => {
  //   if (!allTeams.length) return null;
  //   return allTeams
  //     .filter((t) => t.currentPot > team.currentPot)
  //     .sort((a, b) => a.currentPot - b.currentPot)[0];
  // }, [allTeams, team]);

  // const gpToNextRank = nextTeam ? nextTeam.currentPot - team.currentPot : 0;

  // Calculate completion percentage
  const completionRate =
    maxCompletableNodes > 0 ? (team.completedNodes?.length / maxCompletableNodes) * 100 : 0;

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
  // const formatGP = (gp) => {
  //   if (gp >= 1000000) return `${(gp / 1000000).toFixed(1)}M`;
  //   if (gp >= 1000) return `${(gp / 1000).toFixed(1)}K`;
  //   return gp.toString();
  // };

  if (loading) {
    return (
      <VStack w="100%" spacing={4} align="stretch" maxW="740px" alignSelf="center">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height="140px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  return (
    <VStack w="100%" spacing={4} align="stretch" maxW="740px" alignSelf="center">
      <StatGroup
        justifyContent="space-between"
        alignItems="center"
        flexDirection={['column', 'column', 'row']}
        gap={4}
      >
        {/* GP Stat with Rank Context */}
        {/* <Stat
          bg="blackAlpha.100"
          p={4}
          borderRadius="md"
          minH="130px"
          position="relative"
          textAlign="center"
          w={['100%', '75%', 'auto']}
          overflow="hidden"
          borderWidth={teamRank === 1 ? 2 : 1}
          borderColor={teamRank === 1 ? 'yellow.400' : 'transparent'}
          transition="all 0.3s"
          _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
        >
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

          <StatLabel fontWeight="semibold" color={currentColors.textColor} fontSize="sm" mb={1}>
            Current Pot
          </StatLabel>

          <HStack justifyContent="center" textAlign="center" w="100%" spacing={2} mb={2}>
            <Image h="32px" src={Gold} alt="Gold" />
            <StatNumber color={currentColors.green.base} fontSize="2xl">
              {formatGP(team.currentPot)}
            </StatNumber>
          </HStack>

          <StatHelpText fontSize="xs" color="gray.500" mb={0}>
            {teamRank === 1 ? (
              <HStack spacing={1} justify="center">
                <Icon as={FaTrophy} color="yellow.400" />
                <Text>Leading the pack! 🎉</Text>
              </HStack>
            ) : gpToNextRank > 0 ? (
              <HStack spacing={1} justify="center">
                <StatArrow type="increase" />
                <Text>
                  {formatGP(gpToNextRank)} to rank #{teamRank - 1}
                </Text>
              </HStack>
            ) : (
              <Text>Keep grinding for GP!</Text>
            )}
          </StatHelpText>

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
                    <Text fontWeight="semibold">Next Team: {nextTeam.teamName}</Text>
                    <Text color="gray.500">
                      {formatGP(nextTeam.currentPot)} GP ({formatGP(gpToNextRank)} ahead)
                    </Text>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
        </Stat> */}

        {/* Nodes Completed with Progress */}
        <Stat
          bg="blackAlpha.100"
          p={4}
          minH="130px"
          w={['100%', '75%', 'auto']}
          borderRadius="md"
          position="relative"
          transition="all 0.3s"
          _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
        >
          {/* Activity indicator */}
          {hasRecentActivity && (
            <HStack
              position="absolute"
              top={-2}
              right={-2}
              spacing={1}
              bg="orange.500"
              px={2}
              py={1}
              borderRadius="full"
            >
              <Icon as={FaFire} color="white" boxSize={3} />
              <Text fontSize="xs" color="white" fontWeight="semibold">
                Active
              </Text>
            </HStack>
          )}

          <StatLabel fontWeight="semibold" color={currentColors.textColor} fontSize="sm" mb={1}>
            Nodes Done
          </StatLabel>

          <HStack justifyContent="center" textAlign="center" w="100%" spacing={2} mb={2}>
            <Image h="32px" src={AdventurePath} alt="Path" />
            <StatNumber color={currentColors.textColor} fontSize="2xl">
              {team.completedNodes?.length || 0}
              <Text as="span" fontSize="md" color="gray.500" ml={1}>
                / {maxCompletableNodes}
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
          bg="blackAlpha.100"
          p={4}
          w={['100%', '75%', 'auto']}
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

          <StatLabel fontWeight="semibold" color={currentColors.textColor} fontSize="sm" mb={1}>
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
              <HStack spacing={1} flexWrap="wrap" justify="center">
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
      </StatGroup>

      {/* Inn CTA Button - Moved outside and below stats */}
      {availableInns.length > 0 && (
        <Button
          size="md"
          colorScheme="yellow"
          leftIcon={<Icon as={FaHome} />}
          onClick={onVisitInn}
          w="100%"
          variant="solid"
        >
          Trade at Inn ({availableInns.length} available)
        </Button>
      )}
    </VStack>
  );
};

export default EnhancedTeamStats;
