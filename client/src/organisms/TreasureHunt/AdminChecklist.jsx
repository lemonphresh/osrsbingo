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
  useColorMode,
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
  const { colorMode } = useColorMode();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  // Calculate checklist status
  const checks = useMemo(() => {
    if (!event) return {};
    console.log({ event });
    const hasMap = event.nodes && event.nodes.length > 0;
    const teamCount = event.teams?.length || 0;
    const requiredTeamCount = event.eventConfig?.num_of_teams || event.numberOfTeams || 2;
    const hasEnoughTeams = teamCount >= requiredTeamCount;
    const teamsWithoutMembers =
      event.teams?.filter((team) => !team.members || team.members.length === 0) || [];
    const allTeamsHaveMembers = teamCount > 0 && teamsWithoutMembers.length === 0;

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
          ? `${teamCount}/${requiredTeamCount} teams created ✓`
          : `${teamCount}/${requiredTeamCount} teams (need ${requiredTeamCount - teamCount} more)`,
        icon: FaUsers,
        action: onAddTeam,
        actionLabel: 'Add Team',
        required: true,
      },
      // NEW: Team members check
      teamMembers: {
        done: allTeamsHaveMembers,
        label: 'Team Members',
        description: allTeamsHaveMembers
          ? `All teams have members assigned`
          : `${teamsWithoutMembers.length} team${
              teamsWithoutMembers.length !== 1 ? 's' : ''
            } missing members`,
        icon: FaUserFriends,
        action: null, // We'll handle this with expandable details
        actionLabel: null,
        required: true,
        // Extra data for this check
        teamsWithoutMembers,
        expandable: !allTeamsHaveMembers && teamsWithoutMembers.length > 0,
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

  // Don't render if event is already ACTIVE or beyond
  if (!event || event.status !== 'DRAFT') {
    return null;
  }

  const colors = {
    dark: {
      bg: 'gray.800',
      cardBg: 'gray.700',
      text: 'white',
      subtext: 'gray.300',
      success: 'green.400',
      warning: 'orange.400',
      error: 'red.400',
      pending: 'gray.500',
      border: 'purple.500',
    },
    light: {
      bg: 'white',
      cardBg: 'gray.50',
      text: 'gray.800',
      subtext: 'gray.600',
      success: 'green.500',
      warning: 'orange.500',
      error: 'red.500',
      pending: 'gray.400',
      border: 'purple.500',
    },
  };

  const c = colors[colorMode];

  const completedCount = Object.values(checks).filter((check) => check.done).length;
  const totalCount = Object.values(checks).length;
  const allComplete = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  const ChecklistItem = ({ check, checkKey }) => (
    <Box>
      <HStack
        p={3}
        bg={check.done ? `${c.success}15` : c.cardBg}
        borderRadius="md"
        borderLeft="3px solid"
        borderLeftColor={check.done ? c.success : check.required ? c.warning : c.pending}
        spacing={3}
        justify="space-between"
      >
        <HStack spacing={3} flex={1}>
          <Icon
            as={check.done ? CheckCircleIcon : check.icon}
            color={check.done ? c.success : c.warning}
            boxSize={5}
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack>
              <Text fontWeight="semibold" color={c.text} fontSize="sm">
                {check.label}
              </Text>
              {check.required && !check.done && (
                <Badge colorScheme="red" fontSize="xs">
                  Required
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color={check.done ? c.subtext : c.warning}>
              {check.description}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={2}>
          {/* Expandable toggle for team members */}
          {check.expandable && (
            <IconButton
              icon={showTeamDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="xs"
              variant="ghost"
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

          {check.done && <Icon as={CheckCircleIcon} color={c.success} boxSize={5} />}
        </HStack>
      </HStack>

      {/* Expandable team details */}
      {checkKey === 'teamMembers' && check.expandable && (
        <Collapse in={showTeamDetails} animateOpacity>
          <Box
            ml={8}
            mt={2}
            p={3}
            bg={colorMode === 'dark' ? 'red.900' : 'red.50'}
            borderRadius="md"
            borderLeft="2px solid"
            borderLeftColor={c.error}
          >
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Icon as={WarningIcon} color={c.error} boxSize={4} />
                <Text fontSize="xs" fontWeight="bold" color={c.text}>
                  Teams without members cannot participate:
                </Text>
              </HStack>
              {check.teamsWithoutMembers?.map((team) => (
                <HStack
                  key={team.teamId}
                  justify="space-between"
                  p={2}
                  bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'white'}
                  borderRadius="sm"
                >
                  <Text fontSize="xs" color={c.text}>
                    {team.teamName}
                  </Text>
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
              ))}
              <Text fontSize="xs" color={c.subtext} mt={1}>
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
      bg={c.bg}
      borderRadius="lg"
      boxShadow="2xl"
      border="2px solid"
      borderColor={allComplete ? 'green.400' : c.border}
      overflow="hidden"
      transition="all 0.3s ease"
    >
      {/* Header */}
      <HStack
        p={3}
        bg={allComplete ? 'green.500' : 'purple.600'}
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
          bg={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
        />
      )}

      {/* Content */}
      <Collapse in={!isMinimized} animateOpacity>
        <VStack p={4} spacing={3} align="stretch">
          {/* Status Banner */}
          <HStack
            p={2}
            bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100'}
            borderRadius="md"
            justify="center"
          >
            <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
              DRAFT MODE
            </Badge>
            <Tooltip label="Your event is only visible to admins until you launch it" hasArrow>
              <InfoIcon color={c.subtext} boxSize={4} cursor="help" />
            </Tooltip>
          </HStack>

          {/* Checklist Items */}
          {Object.entries(checks).map(([key, check]) => (
            <ChecklistItem key={key} check={check} checkKey={key} />
          ))}

          {/* Warning if not all complete */}
          {!allComplete && (
            <Alert status="warning" borderRadius="md" fontSize="xs">
              <AlertIcon boxSize={4} />
              <Text color="gray.600">Complete all required steps before launching your event.</Text>
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
              <Box w={3} h={3} borderRadius="full" bg={check.done ? c.success : c.warning} />
            </Tooltip>
          ))}
        </HStack>
      )}
    </Box>
  );
};

export default AdminLaunchChecklist;
