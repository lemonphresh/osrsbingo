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
  onConfirmDiscord,
  onEditTeam,
  isGeneratingMap = false,
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
      event.teams?.filter((team) => {
        const memberCount = team.members?.length || 0;
        return memberCount < requiredPlayersPerTeam;
      }) || [];

    const allTeamsHaveEnoughMembers = teamCount > 0 && teamsWithInsufficientMembers.length === 0;

    const hasDiscord = event.discordConfig?.confirmed === true;
    const hasStartDate = !!event.startDate;
    const hasEndDate = !!event.endDate;
    const hasDates = hasStartDate && hasEndDate;

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
          : `${teamsWithInsufficientMembers.length} team${
              teamsWithInsufficientMembers.length !== 1 ? 's' : ''
            } need more members`,
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
        description: hasDiscord ? 'Setup confirmed ✓' : 'Connect Discord bot',
        icon: FaDiscord,
        action: hasDiscord ? null : onOpenDiscordSetup,
        actionLabel: 'Setup Discord',
        secondaryAction: hasDiscord ? null : onConfirmDiscord,
        secondaryActionLabel: "I've Set It Up",
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
  }, [event, onGenerateMap, onAddTeam, onOpenDiscordSetup, onConfirmDiscord]);

  if (!event || event.status !== 'DRAFT') {
    return null;
  }

  const completedCount = Object.values(checks).filter((check) => check.done).length;
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
            <Text fontSize="xs" color={check.done ? 'gray.300' : 'orange.300'}>
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

          {!check.done && (check.action || check.secondaryAction) && (
            <VStack spacing={1} align="end">
              {check.action && (
                <Button
                  size="xs"
                  colorScheme={check.icon === FaDiscord ? 'purple' : 'blue'}
                  onClick={check.action}
                  isLoading={check.icon === FaMap && isGeneratingMap}
                >
                  {check.actionLabel}
                </Button>
              )}
              {check.secondaryAction && (
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="green"
                  onClick={check.secondaryAction}
                >
                  {check.secondaryActionLabel}
                </Button>
              )}
            </VStack>
          )}

          {check.done && <Icon as={CheckCircleIcon} color="green.400" boxSize={5} />}
        </HStack>
      </HStack>

      {/* Expandable team details */}
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
                <Text fontSize="xs" fontWeight="bold" color="white">
                  Teams need at least {check.requiredPlayersPerTeam} member
                  {check.requiredPlayersPerTeam !== 1 ? 's' : ''} each:
                </Text>
              </HStack>
              {check.teamsWithInsufficientMembers?.map((team) => {
                const currentCount = team.members?.length || 0;
                const deficit = check.requiredPlayersPerTeam - currentCount;
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
                        {currentCount}/{check.requiredPlayersPerTeam} members (need {deficit} more)
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
              <Text fontSize="xs" color="gray.400" mt={1}>
                Add Discord User IDs to each team so players can submit completions and track
                progress.
              </Text>
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
      zIndex={1500}
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
          <Text fontWeight="bold" color="white" fontSize="sm">
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
          {/* Status Banner */}
          <HStack p={2} bg="whiteAlpha.100" borderRadius="md" justify="center">
            <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
              DRAFT MODE
            </Badge>
            <Tooltip label="Your event is only visible to admins until you launch it" hasArrow>
              <InfoIcon color="gray.400" boxSize={4} cursor="help" />
            </Tooltip>
          </HStack>

          {/* Checklist Items */}
          {Object.entries(checks).map(([key, check]) => (
            <ChecklistItem key={key} check={check} checkKey={key} />
          ))}

          {/* Warning if not all complete */}
          {!allComplete && (
            <Alert status="warning" borderRadius="md" fontSize="xs" bg="orange.900">
              <AlertIcon boxSize={4} color="orange.300" />
              <Text color="orange.200">
                Complete all required steps before launching your event.
              </Text>
            </Alert>
          )}

          {/* Launch Button */}
          <Button
            mt={2}
            colorScheme="green"
            size="lg"
            width="100%"
            leftIcon={<FaRocket />}
            isDisabled={!allComplete}
            onClick={onLaunchEvent}
            _disabled={{
              opacity: 0.6,
              cursor: 'not-allowed',
            }}
          >
            {allComplete ? 'Launch Event! 🎉' : 'Complete All Steps to Launch'}
          </Button>
        </VStack>
      </Collapse>

      {/* Minimized state - show quick status */}
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
