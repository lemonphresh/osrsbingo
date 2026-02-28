import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Badge,
  Button,
  Collapse,
  Progress,
  Tooltip,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  InfoIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import {
  FaRocket,
  FaMap,
  FaUsers,
  FaDiscord,
  FaCalendarCheck,
  FaUserFriends,
} from 'react-icons/fa';
const AdminLaunchChecklist = ({
  event,
  onGenerateMap,
  onAddTeam,
  onOpenDiscordSetup,
  onLaunchEvent,
  onEditTeam,
  isGeneratingMap = false,
  mapGenCooldownLeft = 0,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  const checks = useMemo(() => {
    if (!event) return {};
    const hasMap = event.nodes && event.nodes.length > 0;
    const teamCount = event.teams?.length || 0;
    const requiredTeamCount = event.eventConfig?.num_of_teams || event.numberOfTeams || 2;
    const requiredPlayersPerTeam = event.eventConfig?.players_per_team || 1;
    const hasEnoughTeams = teamCount >= requiredTeamCount;

    const teamsWithInsufficientMembers =
      event.teams?.filter((team) => (team.members?.length || 0) < requiredPlayersPerTeam) || [];
    const allTeamsHaveEnoughMembers =
      teamCount > 0 && teamsWithInsufficientMembers.length === 0 && hasEnoughTeams;

    const hasDiscord = event.discordConfig?.confirmed === true && !!event.discordConfig?.guildId;
    const hasDates = !!event.startDate && !!event.endDate;

    return {
      map: {
        done: hasMap,
        label: 'Generate Map',
        description: hasMap ? `${event.nodes.length} nodes created` : 'Create the treasure map',
        icon: FaMap,
        action: onGenerateMap,
        actionLabel: hasMap ? 'Regenerate' : 'Generate Map',
        required: true,
      },
      teams: {
        done: hasEnoughTeams,
        label: 'Add Teams',
        description: hasEnoughTeams
          ? `${teamCount}/${requiredTeamCount} minimum teams created ✓`
          : `${teamCount}/${requiredTeamCount} teams (need ${requiredTeamCount - teamCount} more)`,
        icon: FaUsers,
        action: onAddTeam,
        actionLabel: 'Add Team',
        required: true,
      },
      teamMembers: {
        done: allTeamsHaveEnoughMembers,
        label: 'Team Members',
        description: allTeamsHaveEnoughMembers
          ? `All teams have ${requiredPlayersPerTeam}+ members ✓`
          : hasEnoughTeams
          ? `${teamsWithInsufficientMembers.length} team(s) need more members`
          : 'Finish adding teams first',
        icon: FaUserFriends,
        action: null,
        actionLabel: null,
        required: true,
        teamsWithInsufficientMembers,
        requiredPlayersPerTeam,
        expandable: !allTeamsHaveEnoughMembers && teamsWithInsufficientMembers.length > 0,
      },
      discord: {
        done: hasDiscord,
        label: 'Discord Integration',
        description: hasDiscord ? `Bot verified & connected ✓` : 'Connect and verify Discord bot',
        icon: FaDiscord,
        action: onOpenDiscordSetup,
        actionLabel: hasDiscord ? 'Reconfigure' : 'Setup Discord',
        required: true,
      },
      dates: {
        done: hasDates,
        label: 'Event Dates',
        description: hasDates
          ? `${new Date(event.startDate).toLocaleDateString()} - ${new Date(
              event.endDate
            ).toLocaleDateString()}`
          : 'Set start and end dates',
        icon: FaCalendarCheck,
        action: null,
        actionLabel: null,
        required: true,
      },
    };
  }, [event, onGenerateMap, onAddTeam, onOpenDiscordSetup]);

  if (!event || event.status !== 'DRAFT') return null;

  const completedCount = Object.values(checks).filter((c) => c.done).length;
  const totalCount = Object.values(checks).length;
  const allComplete = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  const ChecklistItem = ({ check, checkKey }) => (
    <Box>
      <HStack
        p={3}
        bg={check.done ? 'green.900' : 'gray.700'}
        borderRadius="md"
        borderLeft="3px solid"
        borderLeftColor={check.done ? 'green.400' : check.required ? 'orange.400' : 'gray.500'}
        spacing={3}
        justify="space-between"
      >
        <HStack spacing={3} flex={1}>
          <Icon
            as={check.done ? CheckCircleIcon : check.icon}
            color={check.done ? 'green.400' : 'orange.400'}
            boxSize={5}
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack>
              <Text fontWeight="semibold" color="white" fontSize="sm">
                {check.label}
              </Text>
              {check.required && !check.done && (
                <Badge colorScheme="red" fontSize="xs">
                  Required
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color={check.done ? 'green.300' : 'orange.300'}>
              {check.description}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={2}>
          {check.expandable && (
            <IconButton
              icon={showTeamDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              onClick={() => setShowTeamDetails(!showTeamDetails)}
              aria-label="Show details"
            />
          )}
          {check.action && (
            <Button
              size="xs"
              colorScheme={check.icon === FaDiscord ? 'purple' : 'blue'}
              onClick={check.action}
              isLoading={check.icon === FaMap && isGeneratingMap}
              isDisabled={check.icon === FaMap && mapGenCooldownLeft > 0}
            >
              {check.actionLabel}
              {check.icon === FaMap && mapGenCooldownLeft > 0 && ` (${mapGenCooldownLeft}s)`}
            </Button>
          )}
          {check.done && <Icon as={CheckCircleIcon} color="green.400" boxSize={5} />}
        </HStack>
      </HStack>

      {checkKey === 'teamMembers' && check.expandable && (
        <Collapse in={showTeamDetails} animateOpacity>
          <Box
            ml={8}
            mt={2}
            p={3}
            bg="red.900"
            borderRadius="md"
            borderLeft="2px solid"
            borderLeftColor="red.400"
          >
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Icon as={WarningIcon} color="red.400" boxSize={4} />
                <Text fontSize="xs" fontWeight="semibold" color="white">
                  Teams need at least {check.requiredPlayersPerTeam} member(s) each:
                </Text>
              </HStack>
              {check.teamsWithInsufficientMembers?.map((team) => {
                const current = team.members?.length || 0;
                const deficit = check.requiredPlayersPerTeam - current;
                return (
                  <HStack
                    key={team.teamId}
                    justify="space-between"
                    p={2}
                    bg="whiteAlpha.100"
                    borderRadius="sm"
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="white" fontWeight="medium">
                        {team.teamName}
                      </Text>
                      <Text fontSize="xs" color="red.300">
                        {current}/{check.requiredPlayersPerTeam} members (need {deficit} more)
                      </Text>
                    </VStack>
                    {onEditTeam && (
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => onEditTeam(team)}
                      >
                        Add Members
                      </Button>
                    )}
                  </HStack>
                );
              })}
            </VStack>
          </Box>
        </Collapse>
      )}
    </Box>
  );

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      zIndex={1000}
      width={isMinimized ? 'auto' : '400px'}
      maxW="calc(100vw - 32px)"
      bg="gray.800"
      borderRadius="lg"
      boxShadow="2xl"
      border="2px solid"
      borderColor={allComplete ? 'green.400' : 'purple.500'}
      overflow="hidden"
      transition="all 0.3s ease"
    >
      {/* Header */}
      <HStack
        p={3}
        bg={allComplete ? 'green.600' : 'purple.600'}
        justify="space-between"
        cursor="pointer"
        onClick={() => setIsMinimized(!isMinimized)}
        _hover={{ opacity: 0.9 }}
      >
        <HStack spacing={2}>
          <Icon as={FaRocket} color="white" />
          <Text fontWeight="semibold" color="white" fontSize="sm">
            {isMinimized
              ? `Launch Checklist (${completedCount}/${totalCount})`
              : 'Launch Checklist'}
          </Text>
        </HStack>
        <HStack spacing={2}>
          {!isMinimized && (
            <Badge colorScheme={allComplete ? 'green' : 'yellow'} fontSize="xs">
              {completedCount}/{totalCount}
            </Badge>
          )}
          <IconButton
            icon={isMinimized ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="xs"
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          />
        </HStack>
      </HStack>

      {/* Progress Bar */}
      {!isMinimized && (
        <Progress
          value={progressPercent}
          size="xs"
          colorScheme={allComplete ? 'green' : 'purple'}
          bg="gray.600"
        />
      )}

      {/* Content */}
      <Collapse in={!isMinimized} animateOpacity>
        <VStack p={4} spacing={3} align="stretch">
          <HStack p={2} bg="whiteAlpha.100" borderRadius="md" justify="center">
            <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
              DRAFT MODE
            </Badge>
            <Tooltip label="Your event is only visible to admins until you launch it" hasArrow>
              <InfoIcon color="gray.400" boxSize={4} cursor="help" />
            </Tooltip>
          </HStack>

          {Object.entries(checks).map(([key, check]) => (
            <ChecklistItem key={key} check={check} checkKey={key} />
          ))}

          {!allComplete && (
            <Alert status="warning" borderRadius="md" fontSize="xs" bg="orange.900">
              <AlertIcon boxSize={4} color="orange.300" />
              <Text color="orange.200">Complete all required steps before launching.</Text>
            </Alert>
          )}

          <Button
            mt={2}
            colorScheme="green"
            size="lg"
            width="100%"
            leftIcon={<FaRocket />}
            isDisabled={!allComplete}
            onClick={onLaunchEvent}
            _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            {allComplete ? 'Launch Event! 🎉' : 'Complete All Steps to Launch'}
          </Button>
        </VStack>
      </Collapse>

      {/* Minimized dots */}
      {isMinimized && !allComplete && (
        <HStack p={2} justify="center" spacing={1}>
          {Object.values(checks).map((check, idx) => (
            <Tooltip key={idx} label={check.label} hasArrow>
              <Box w={3} h={3} borderRadius="full" bg={check.done ? 'green.400' : 'orange.400'} />
            </Tooltip>
          ))}
        </HStack>
      )}
    </Box>
  );
};

export default AdminLaunchChecklist;
