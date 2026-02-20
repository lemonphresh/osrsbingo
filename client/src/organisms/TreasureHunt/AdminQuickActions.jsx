import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Badge,
  Collapse,
  Tooltip,
  Divider,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  SettingsIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import {
  FaCog,
  FaClipboardList,
  FaUsers,
  FaTrophy,
  FaExclamationTriangle,
  FaChartLine,
  FaDiscord,
  FaEyeSlash,
} from 'react-icons/fa';

const AdminQuickActionsPanel = ({
  event,
  teams = [],
  submissions = [],
  onNavigateToSubmissions,
  onNavigateToTeams,
  onOpenSettings,
  onOpenDiscordSetup,
  isEventAdmin = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const stats = useMemo(() => {
    if (!isEventAdmin || !event || event.status === 'DRAFT') {
      return {};
    }

    const pendingSubmissions = submissions.filter((s) => {
      if (s.status !== 'PENDING_REVIEW') return false;
      const team = teams.find((t) => t.teamId === s.teamId);
      if (team?.completedNodes?.includes(s.nodeId)) {
        return false;
      }
      return true;
    });

    const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');
    const deniedSubmissions = submissions.filter((s) => s.status === 'DENIED');
    const activeTeams = teams.filter((t) => t.completedNodes?.length > 0);
    const inactiveTeams = teams.filter((t) => !t.completedNodes || t.completedNodes.length === 0);
    const leadingTeam = [...teams].sort((a, b) => (b.currentPot || 0) - (a.currentPot || 0))[0];
    const teamsWithoutMembers = teams.filter((t) => !t.members || t.members.length === 0);

    return {
      pending: pendingSubmissions.length,
      approved: approvedSubmissions.length,
      denied: deniedSubmissions.length,
      totalSubmissions: submissions.length,
      activeTeams: activeTeams.length,
      inactiveTeams: inactiveTeams.length,
      totalTeams: teams.length,
      leadingTeam,
      teamsWithoutMembers: teamsWithoutMembers.length,
    };
  }, [event, isEventAdmin, submissions, teams]);

  if (!isEventAdmin || !event || event.status === 'DRAFT') {
    return null;
  }

  const hasUrgentItems = stats.pending > 0 || stats.teamsWithoutMembers > 0;

  const QuickStat = ({ label, value, icon, color, onClick, tooltip }) => (
    <Tooltip label={tooltip} hasArrow isDisabled={!tooltip}>
      <Box
        p={3}
        bg="gray.700"
        borderRadius="md"
        cursor={onClick ? 'pointer' : 'default'}
        onClick={onClick}
        transition="all 0.2s"
        _hover={onClick ? { transform: 'translateY(-2px)', shadow: 'md' } : {}}
        borderLeft="3px solid"
        borderLeftColor={color}
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {value}
            </Text>
            <Text fontSize="xs" color="gray.300">
              {label}
            </Text>
          </VStack>
          <Icon as={icon} boxSize={5} color={color} />
        </HStack>
      </Box>
    </Tooltip>
  );

  return (
    <Box
      position="fixed"
      bottom={4}
      left={4}
      zIndex={1500}
      width={isMinimized ? 'auto' : isExpanded ? '350px' : '280px'}
      maxW="calc(100vw - 32px)"
      bg="gray.800"
      borderRadius="lg"
      boxShadow="2xl"
      border="2px solid"
      borderColor={hasUrgentItems ? 'orange.400' : 'orange.500'}
      overflow="hidden"
      transition="all 0.3s ease"
    >
      {/* Header */}
      <HStack
        p={3}
        bg={hasUrgentItems ? 'orange.500' : 'orange.600'}
        justify="space-between"
        cursor="pointer"
        onClick={() => setIsMinimized(!isMinimized)}
        _hover={{ opacity: 0.9 }}
      >
        <HStack spacing={2}>
          <Icon as={FaCog} color="white" />
          <Text fontWeight="bold" color="white" fontSize="sm">
            Admin Panel
          </Text>
          {hasUrgentItems && !isMinimized && (
            <Badge colorScheme="red" fontSize="xs" variant="solid">
              {stats.pending > 0 ? `${stats.pending} pending` : 'Action needed'}
            </Badge>
          )}
        </HStack>

        <HStack spacing={1}>
          {!isMinimized && (
            <Tooltip
              label={isExpanded ? 'Show less details' : 'Show more details'}
              hasArrow
              placement="top"
            >
              <IconButton
                icon={isExpanded ? <FaEyeSlash /> : <ViewIcon />}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              />
            </Tooltip>
          )}
          <Tooltip label={isMinimized ? 'Expand panel' : 'Minimize panel'} hasArrow placement="top">
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
          </Tooltip>
        </HStack>
      </HStack>

      {/* Content */}
      <Collapse in={!isMinimized} animateOpacity>
        <VStack p={3} spacing={3} align="stretch">
          {/* Quick Stats Grid */}
          <SimpleGrid columns={2} spacing={2}>
            <QuickStat
              label="Pending"
              value={stats.pending}
              icon={FaClipboardList}
              color={stats.pending > 0 ? 'orange.400' : 'green.400'}
              onClick={onNavigateToSubmissions}
              tooltip="Click to review submissions"
            />
            <QuickStat
              label="Active Teams"
              value={`${stats.activeTeams}/${stats.totalTeams}`}
              icon={FaUsers}
              color="blue.400"
              onClick={onNavigateToTeams}
              tooltip="Teams that have started playing"
            />
          </SimpleGrid>

          {/* Expanded Stats */}
          <Collapse in={isExpanded} animateOpacity>
            <VStack spacing={2} align="stretch">
              <Divider borderColor="gray.600" />

              {/* Submission breakdown */}
              <Box p={2} bg="gray.700" borderRadius="md">
                <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={2}>
                  SUBMISSION STATS
                </Text>
                <HStack justify="space-between" fontSize="xs">
                  <HStack>
                    <Icon as={CheckIcon} color="green.400" boxSize={3} />
                    <Text color="white">Approved</Text>
                  </HStack>
                  <Text color="green.400" fontWeight="bold">
                    {stats.approved}
                  </Text>
                </HStack>
                <HStack justify="space-between" fontSize="xs" mt={1}>
                  <HStack>
                    <Icon as={CloseIcon} color="red.400" boxSize={3} />
                    <Text color="white">Denied</Text>
                  </HStack>
                  <Text color="red.400" fontWeight="bold">
                    {stats.denied}
                  </Text>
                </HStack>
              </Box>

              {/* Leading team */}
              {stats.leadingTeam && (
                <Box p={2} bg="gray.700" borderRadius="md">
                  <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                    LEADING TEAM
                  </Text>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaTrophy} color="yellow.400" boxSize={4} />
                      <Text fontSize="sm" fontWeight="bold" color="white">
                        {stats.leadingTeam.teamName}
                      </Text>
                    </HStack>
                    <Badge colorScheme="green">
                      {((stats.leadingTeam.currentPot || 0) / 1000000).toFixed(1)}M GP
                    </Badge>
                  </HStack>
                </Box>
              )}

              {/* Warnings */}
              {stats.teamsWithoutMembers > 0 && (
                <Box
                  p={2}
                  bg="orange.900"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderLeftColor="orange.400"
                >
                  <HStack>
                    <Icon as={FaExclamationTriangle} color="orange.400" boxSize={4} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" fontWeight="bold" color="white">
                        {stats.teamsWithoutMembers} team
                        {stats.teamsWithoutMembers !== 1 ? 's' : ''} without members
                      </Text>
                      <Text fontSize="xs" color="gray.300">
                        Players can't join these teams
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {stats.inactiveTeams > 0 && stats.inactiveTeams < stats.totalTeams && (
                <Box
                  p={2}
                  bg="blue.900"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderLeftColor="blue.400"
                >
                  <HStack>
                    <Icon as={FaChartLine} color="blue.400" boxSize={4} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" fontWeight="bold" color="white">
                        {stats.inactiveTeams} team{stats.inactiveTeams !== 1 ? 's' : ''} haven't
                        started
                      </Text>
                      <Text fontSize="xs" color="gray.300">
                        No completions yet
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </VStack>
          </Collapse>

          <Divider borderColor="gray.600" />

          {/* Quick Actions */}
          <HStack spacing={2} justify="center">
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<SettingsIcon />}
                size="sm"
                variant="outline"
                color="gray.300"
                borderColor="gray.500"
                _hover={{ bg: 'gray.600' }}
                aria-label="More actions"
              />
              <MenuList bg="gray.700" borderColor="gray.600">
                <MenuItem
                  icon={<FaUsers />}
                  onClick={onNavigateToTeams}
                  color="white"
                  bg="gray.700"
                  _hover={{ bg: 'gray.600' }}
                >
                  Manage Teams
                </MenuItem>
                <MenuItem
                  icon={<FaDiscord />}
                  color="white"
                  bg="gray.700"
                  onClick={onOpenDiscordSetup}
                  _hover={{ bg: 'gray.600' }}
                >
                  Discord Setup
                </MenuItem>
                <MenuItem
                  icon={<SettingsIcon />}
                  color="white"
                  bg="gray.700"
                  onClick={onOpenSettings}
                  _hover={{ bg: 'gray.600' }}
                >
                  Event Settings
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </VStack>
      </Collapse>

      {/* Minimized state - show urgent indicator */}
      {isMinimized && hasUrgentItems && (
        <HStack p={2} justify="center" spacing={2}>
          {stats.pending > 0 && (
            <Tooltip label={`${stats.pending} pending submissions`} hasArrow>
              <Badge colorScheme="orange" variant="solid">
                {stats.pending}
              </Badge>
            </Tooltip>
          )}
          {stats.teamsWithoutMembers > 0 && (
            <Tooltip label={`${stats.teamsWithoutMembers} teams without members`} hasArrow>
              <Icon as={FaExclamationTriangle} color="orange.400" boxSize={4} />
            </Tooltip>
          )}
        </HStack>
      )}
    </Box>
  );
};

export default AdminQuickActionsPanel;
