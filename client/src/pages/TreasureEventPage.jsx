import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Box,
  Flex,
  Container,
  Heading,
  Image,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  IconButton,
  Tooltip,
  Spinner,
  TableContainer,
  useDisclosure,
  useToast,
  Icon,
  Switch,
} from '@chakra-ui/react';
import {
  AddIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_ALL_SUBMISSIONS } from '../graphql/queries';
import useSubmissionNotifications from '../hooks/useSubmissionNotifications';
import {
  REVIEW_SUBMISSION,
  GENERATE_TREASURE_MAP,
  ADMIN_COMPLETE_NODE,
} from '../graphql/mutations';
import { useToastContext } from '../providers/ToastProvider';
import Section from '../atoms/Section';
import theme from '../theme';
import GemTitle from '../atoms/GemTitle';
import CreateTeamModal from '../organisms/TreasureHunt/CreateTreasureTeamModal';
import EditEventModal from '../organisms/TreasureHunt/EditTreasureEventModal';
import EditTeamModal from '../organisms/TreasureHunt/EditTreasureTeamModal';
import MultiTeamTreasureMap from '../organisms/TreasureHunt/MultiTeamTreasureMapVisualization';
import EventAdminManager from '../organisms/TreasureHunt/TreasureAdminManager';
import { useAuth } from '../providers/AuthProvider';
import { MdOutlineArrowBack } from 'react-icons/md';
import DiscordSetupModal from '../molecules/TreasureHunt/DiscordSetupModal';
import GameRulesTab from '../organisms/TreasureHunt/TreasureHuntGameRulesTab';
import { OBJECTIVE_TYPES } from '../utils/treasureHuntHelpers';
import { FaCog } from 'react-icons/fa';
import Gold from '../assets/gold.png';
import Dossier from '../assets/dossier.png';
import Clan from '../assets/clan.png';
import ScrollableTableContainer from '../atoms/ScrollableTableContainer';
import DenialReasonModal from '../organisms/TreasureHunt/DenialReasonModal';

const TreasureEventView = () => {
  const { colorMode } = useColorMode();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { user } = useAuth();
  const {
    isOpen: isEditTeamOpen,
    onOpen: onEditTeamOpen,
    onClose: onEditTeamClose,
  } = useDisclosure();

  const {
    isOpen: isCreateTeamOpen,
    onOpen: onCreateTeamOpen,
    onClose: onCreateTeamClose,
  } = useDisclosure();
  const {
    isOpen: isEditEventOpen,
    onOpen: onEditEventOpen,
    onClose: onEditEventClose,
  } = useDisclosure();
  const {
    isOpen: isRegenerateOpen,
    onOpen: onRegenerateOpen,
    onClose: onRegenerateClose,
  } = useDisclosure();
  const {
    isOpen: isDiscordSetupOpen,
    onOpen: onDiscordSetupOpen,
    onClose: onDiscordSetupClose,
  } = useDisclosure();
  const {
    isOpen: isDenialModalOpen,
    onOpen: onDenialModalOpen,
    onClose: onDenialModalClose,
  } = useDisclosure();

  const [submissionToDeny, setSubmissionToDeny] = useState(null);

  const cancelRef = React.useRef();
  const [nodeToComplete, setNodeToComplete] = useState(null);
  const cancelCompleteRef = React.useRef();

  const [showAllNodesToggle, setShowAllNodesToggle] = useState(true);

  const {
    data: eventData,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useQuery(GET_TREASURE_EVENT, {
    variables: { eventId },
  });

  const { data: submissionsData, refetch: refetchSubmissions } = useQuery(GET_ALL_SUBMISSIONS, {
    variables: { eventId },
  });

  const [generateMap, { loading: generateLoading }] = useMutation(GENERATE_TREASURE_MAP, {
    refetchQueries: ['GetTreasureEvent', 'GetAllSubmissions'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      showToast('Map generated successfully!', 'success');
      onRegenerateClose();
    },
    onError: (error) => {
      showToast(`Error generating map: ${error.message}`, 'error');
    },
  });

  const handleGenerateMap = () => {
    if (event.nodes && event.nodes.length > 0) {
      onRegenerateOpen();
    } else {
      generateMap({ variables: { eventId } });
    }
  };

  const [reviewSubmission] = useMutation(REVIEW_SUBMISSION, {
    onCompleted: () => {
      showToast('Submission reviewed!', 'success');
      refetchSubmissions();
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  });

  const [adminCompleteNode, { loading: completing }] = useMutation(ADMIN_COMPLETE_NODE, {
    refetchQueries: ['GetTreasureEvent', 'GetAllSubmissions'],
    onError: (error) => {
      // Error is already handled in the onClick, this is just a fallback
      console.error('Error completing node:', error);
    },
  });

  const toast = useToast();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      turquoise: { base: '#28AFB0' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      orange: '#FF914D',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      turquoise: { base: '#28AFB0' },
      textColor: '#171923',
      cardBg: 'white',
      orange: '#FF914D',
    },
  };

  const currentColors = colors[colorMode];

  const event = eventData?.getTreasureEvent;
  const teams = event?.teams || [];
  const allSubmissions = submissionsData?.getAllSubmissions || [];
  const allPendingSubmissions = allSubmissions.filter((s) => s.status === 'PENDING_REVIEW');
  const allPendingIncompleteSubmissionsCount = allPendingSubmissions.filter((submission) => {
    const team = teams.find((t) => t.teamId === submission.teamId);

    return !team?.completedNodes?.includes(submission.nodeId);
  }).length;

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const handleReviewSubmission = async (submissionId, approved, denialReason = null) => {
    try {
      await reviewSubmission({
        variables: {
          submissionId,
          approved,
          reviewerId: user?.username || 'admin',
          denialReason, // NEW!
        },
      });
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  const handleDenyWithReason = async (submissionId, denialReason) => {
    await handleReviewSubmission(submissionId, false, denialReason);
  };

  const formatObjectiveAmount = (node) => {
    if (!node?.objective) return '—';
    const q = node.objective.quantity ?? 0;

    switch (node.objective.type) {
      case 'xp_gain':
        return `${q.toLocaleString()} XP`;
      case 'boss_kc':
        return `${q} KC`;
      case 'kills':
        return `${q} kills`;
      case 'minigame':
        return `${q} runs`;
      case 'item_collection':
        return `${q} collected`;
      case 'clue_scrolls':
        return `${q} clues`;
      default:
        return `${q}`;
    }
  };

  const isEventAdmin =
    user && event && (user.id === event.creatorId || event.adminIds?.includes(user.id));

  const {
    isSupported: notificationsSupported,
    notificationsEnabled,
    permission: notificationPermission,
    requestPermission: requestNotificationPermission,
    disableNotifications,
  } = useSubmissionNotifications(
    allSubmissions.filter((s) => s.status === 'PENDING_REVIEW'),
    isEventAdmin,
    event?.eventName || 'Event',
    refetchSubmissions, // pass the refetch function from useQuery
    10000, // Poll every 10 seconds
    event?.id,
    allPendingIncompleteSubmissionsCount
  );

  if (eventLoading) {
    return (
      <Container
        display="flex"
        alignItems="center"
        justifyContent="center"
        flex="1"
        maxW="container.xl"
        w="100%"
        py={8}
      >
        <Spinner size="xl" />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color={currentColors.textColor}>Event not found</Text>
      </Container>
    );
  }

  if (eventLoading) {
    return (
      <Container
        display="flex"
        alignItems="center"
        justifyContent="center"
        flex="1"
        maxW="container.xl"
        w="100%"
        py={8}
      >
        {' '}
        <Spinner flex="1" size="xl" />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color={currentColors.textColor}>Event not found</Text>
      </Container>
    );
  }

  // Check if event is draft and user is not admin
  if (event.status === 'DRAFT' && !isEventAdmin) {
    return (
      <Flex
        alignItems="center"
        flex="1"
        flexDirection="column"
        height="100%"
        paddingY={['40px', '56px']}
        marginX={['12px', '36px']}
      >
        <Flex
          alignItems="center"
          flexDirection={['column', 'row', 'row']}
          justifyContent="space-between"
          marginBottom="16px"
          maxWidth="1200px"
          width="100%"
        >
          <Text
            alignItems="center"
            display="inline-flex"
            _hover={{
              borderBottom: '1px solid white',
              marginBottom: '0px',
            }}
            fontWeight="bold"
            justifyContent="center"
            marginBottom="1px"
          >
            <Icon as={MdOutlineArrowBack} marginRight="8px" />
            <Link to={`/treasure-hunt`}> Back to Events</Link>
          </Text>
        </Flex>

        <Section maxWidth="600px" width="100%" py={8}>
          <VStack spacing={6} align="center" textAlign="center">
            <Box fontSize="6xl">🔒</Box>

            <VStack spacing={2}>
              <Heading size="lg" color={currentColors.white}>
                Event Not Available...Yet!
              </Heading>
              <Text color={currentColors.white} fontSize="lg">
                This event is currently in draft mode
              </Text>
            </VStack>

            <Box p={4} bg="whiteAlpha.400" borderRadius="md" width="100%">
              <Text fontSize="sm" color={currentColors.white}>
                This Treasure Hunt event is still being set up by the event organizers. It will
                become visible once the admins publish it.
              </Text>
            </Box>
          </VStack>
        </Section>
      </Flex>
    );
  }

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
      marginX={['12px', '36px']}
    >
      <Flex
        alignItems="center"
        flexDirection={['column', 'row', 'row']}
        justifyContent="space-between"
        marginBottom="16px"
        maxWidth="1200px"
        width="100%"
      >
        <Text
          alignItems="center"
          display="inline-flex"
          _hover={{
            borderBottom: '1px solid white',
            marginBottom: '0px',
          }}
          fontWeight="bold"
          justifyContent="center"
          marginBottom="1px"
        >
          <Icon as={MdOutlineArrowBack} marginRight="8px" />
          <Link to={`/treasure-hunt`}> Your Events</Link>
        </Text>
      </Flex>
      <Section maxWidth="1200px" width="100%" py={8}>
        <VStack spacing={8} align="stretch" width="100%">
          <VStack position="relative" align="center" spacing={1}>
            <GemTitle size="xl" mb="0" color={currentColors.textColor}>
              {event.eventName}
            </GemTitle>

            <HStack>
              <Badge
                bg={event.status === 'DRAFT' ? currentColors.red : currentColors.green.base}
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="md"
              >
                {event.status}
              </Badge>
              <Text color={theme.colors.gray[300]}>
                {new Date(event.startDate).toLocaleDateString()} -{' '}
                {new Date(event.endDate).toLocaleDateString()}
              </Text>
            </HStack>
            <Tooltip label="Click to copy Event ID" hasArrow>
              <HStack
                spacing={2}
                px={3}
                py={1}
                mt={2}
                bg="whiteAlpha.100"
                borderRadius="md"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: 'whiteAlpha.400' }}
                onClick={() => {
                  navigator.clipboard.writeText(event.eventId);
                  toast({
                    title: 'Event ID Copied!',
                    description: `Event ID: ${event.eventId}`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                }}
              >
                <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
                  ID: {event.eventId}
                </Text>
                <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
              </HStack>
            </Tooltip>
            <Tooltip label="Click to copy shareable URL" hasArrow>
              <HStack
                spacing={2}
                px={3}
                py={1}
                mt={2}
                bg="whiteAlpha.100"
                borderRadius="md"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: 'whiteAlpha.400' }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: 'Shareable URL Copied!',
                    description: `URL: ${window.location.href}`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                }}
              >
                <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
                  URL: {window.location.href}
                </Text>
                <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
              </HStack>
            </Tooltip>

            {/* Banner when no nodes exist */}
            {(!event.nodes || event.nodes.length === 0) && event.status === 'DRAFT' && (
              <Box
                w="full"
                mt={4}
                p={4}
                bg="orange.500"
                borderRadius="md"
                borderWidth={2}
                borderColor="orange.600"
                boxShadow="lg"
                animation="gentlePulse 2s ease-in-out infinite"
                sx={{
                  '@keyframes gentlePulse': {
                    '0%, 100%': {
                      boxShadow: '0 0 20px rgba(237, 137, 54, 0.5)',
                      transform: 'scale(1)',
                    },
                    '50%': {
                      boxShadow: '0 0 30px rgba(237, 137, 54, 0.8)',
                      transform: 'scale(1.01)',
                    },
                  },
                }}
              >
                <HStack justify="center" spacing={3}>
                  <Text fontSize="2xl">⚠️</Text>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg" color="white">
                      Map Not Generated Yet
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.900">
                      Generate your treasure map in Event Settings below before participants can
                      start
                    </Text>
                  </VStack>
                  <Text fontSize="2xl">⚠️</Text>
                </HStack>
              </Box>
            )}
          </VStack>
          {isEventAdmin && (
            <>
              <Button
                position="absolute"
                alignSelf="end"
                display={['none', 'none', 'block']}
                bg={currentColors.purple.base}
                color="white"
                _hover={{ bg: currentColors.purple.light }}
                onClick={onEditEventOpen}
              >
                Edit Event
              </Button>
              <IconButton
                display={['block', 'block', 'none']}
                icon={<EditIcon />}
                bg={currentColors.purple.base}
                color="white"
                _hover={{ bg: currentColors.purple.light }}
                onClick={onEditEventOpen}
                aria-label="Edit Event"
              />
            </>
          )}

          <StatGroup
            alignSelf="center"
            alignItems="center"
            maxWidth="740px"
            w="100%"
            justifyContent={['center', 'center', 'space-between']}
            flexDirection={['column', 'column', 'row']}
            gap={4}
          >
            <Stat
              bg={currentColors.cardBg}
              py="6px"
              minW={['216px', '216px', 'auto']}
              textAlign="center"
              borderRadius="md"
            >
              <StatLabel mb={2} color={currentColors.textColor}>
                Total Prize Pool
              </StatLabel>
              <Image h="32px" m="0 auto" src={Gold} />
              <StatNumber color={currentColors.green.base}>
                {event.eventConfig ? formatGP(event.eventConfig.prize_pool_total) : 'N/A'}
              </StatNumber>
            </Stat>
            <Stat
              bg={currentColors.cardBg}
              py="6px"
              minW={['216px', '216px', 'auto']}
              textAlign="center"
              borderRadius="md"
            >
              <StatLabel mb={2} color={currentColors.textColor}>
                Total Teams
              </StatLabel>
              <Image h="32px" m="0 auto" src={Clan} />
              <StatNumber color={currentColors.textColor}>{teams.length}</StatNumber>
            </Stat>
            <Stat
              bg={currentColors.cardBg}
              py="6px"
              minW={['216px', '216px', 'auto']}
              textAlign="center"
              borderRadius="md"
            >
              <StatLabel mb={2} color={currentColors.textColor}>
                Pending Submissions
              </StatLabel>
              <Image h="32px" m="0 auto" src={Dossier} />
              <StatNumber color={currentColors.textColor}>
                {allPendingIncompleteSubmissionsCount}
              </StatNumber>
            </Stat>
          </StatGroup>

          {event.nodes && event.nodes.length > 0 && (
            <Box width="100%">
              {isEventAdmin && event.status !== 'DRAFT' && (
                <Card mb={4} bg={currentColors.cardBg} borderRadius="md">
                  <CardBody>
                    <HStack justify="space-between" align="center">
                      <HStack>
                        <Icon as={FaCog} boxSize={10} mr={2} color={currentColors.purple.base} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" color={currentColors.textColor}>
                            Admin Map Controls
                          </Text>
                          <Text fontSize="sm" color={currentColors.textColor} opacity={0.7}>
                            Toggle to show/hide locked nodes on the map (for you only)
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack spacing={3}>
                        <Text fontSize="sm" color={currentColors.textColor}>
                          Show All Nodes
                        </Text>
                        <Switch
                          size="lg"
                          colorScheme="purple"
                          isChecked={showAllNodesToggle}
                          onChange={(e) => setShowAllNodesToggle(e.target.checked)}
                        />
                      </HStack>
                    </HStack>
                  </CardBody>
                </Card>
              )}
              <MultiTeamTreasureMap
                nodes={event.nodes}
                teams={teams}
                event={event}
                showAllNodes={isEventAdmin && showAllNodesToggle}
              />
            </Box>
          )}

          <Tabs
            size="sm"
            position="relative"
            variant="soft-rounded"
            maxW="100%"
            defaultIndex={teams.length === 0 ? 2 : undefined}
          >
            <TabList
              pb="6px"
              overflowY="hidden"
              overflowX="scroll"
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                '-ms-overflow-style': 'none',
                'scrollbar-width': 'none',
              }}
            >
              <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                Leaderboard
              </Tab>
              {isEventAdmin && (
                <Tab whiteSpace="nowrap" color={theme.colors.gray[400]} position="relative">
                  Submissions ({allPendingIncompleteSubmissionsCount} Pending)
                  {allPendingIncompleteSubmissionsCount > 0 && (
                    <Box
                      position="absolute"
                      top="4px"
                      right="8px"
                      w="8px"
                      h="8px"
                      bg="tomato"
                      borderRadius="full"
                      boxShadow="0 0 0 2px white"
                      animation="pulse 2s infinite"
                      sx={{
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                        },
                      }}
                    />
                  )}
                </Tab>
              )}
              {isEventAdmin && (
                <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                  Event Settings
                </Tab>
              )}
              <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                Game Rules & Info
              </Tab>
              {isEventAdmin && event.nodes && event.nodes.length > 0 && (
                <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                  All Nodes
                </Tab>
              )}
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Box bg={currentColors.cardBg} borderRadius="8px" padding="8px">
                  <TableContainer width="100%">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th color={currentColors.textColor}>Rank</Th>
                          <Th color={currentColors.textColor}>Team Name</Th>
                          <Th isNumeric color={currentColors.textColor}>
                            Current Pot
                          </Th>
                          <Th isNumeric color={currentColors.textColor}>
                            Nodes Completed
                          </Th>
                          <Th color={currentColors.textColor}>Keys Held</Th>
                          <Th color={currentColors.textColor}>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {[...teams]
                          .sort((a, b) => {
                            // Sort by currentPot descending (highest first)
                            const potA = Number(a.currentPot || 0);
                            const potB = Number(b.currentPot || 0);
                            if (potA > potB) return -1;
                            if (potA < potB) return 1;
                            // If pots are equal, sort by nodes completed
                            return (
                              (b.completedNodes?.length || 0) - (a.completedNodes?.length || 0)
                            );
                          })
                          .map((team, idx) => (
                            <Tr key={team.teamId}>
                              <Td fontWeight="bold" color={currentColors.textColor}>
                                #{idx + 1}
                              </Td>
                              <Td color={currentColors.textColor} whiteSpace="nowrap">
                                {team.teamName}
                              </Td>
                              <Td
                                isNumeric
                                fontWeight="bold"
                                color={currentColors.green.base}
                                whiteSpace="nowrap"
                              >
                                {formatGP(team.currentPot)}
                              </Td>
                              <Td isNumeric color={currentColors.textColor}>
                                {team.completedNodes?.length || 0}
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  {team.keysHeld && team.keysHeld.length > 0 ? (
                                    team.keysHeld.map((key) => (
                                      <Badge key={key.color} colorScheme={key.color}>
                                        {key.quantity}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Text fontSize="sm" color="gray.500">
                                      None
                                    </Text>
                                  )}
                                </HStack>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  {event.nodes && event.nodes.length > 0 && (
                                    <Button
                                      size="sm"
                                      bg={currentColors.purple.base}
                                      color="white"
                                      _hover={{ bg: currentColors.purple.light }}
                                      onClick={() =>
                                        navigate(
                                          `/treasure-hunt/${event.eventId}/team/${team.teamId}`
                                        )
                                      }
                                      whiteSpace="nowrap"
                                    >
                                      View Map
                                    </Button>
                                  )}
                                  {isEventAdmin && (
                                    <IconButton
                                      size="sm"
                                      icon={<EditIcon />}
                                      bg={currentColors.turquoise.base}
                                      color="white"
                                      _hover={{ opacity: 0.8 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTeam(team);
                                        onEditTeamOpen();
                                      }}
                                      aria-label="Edit team"
                                    />
                                  )}
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </TabPanel>
              {isEventAdmin && (
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Instructions */}
                    <Box bg={currentColors.turquoise.base} color="white" p={3} borderRadius="md">
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        📋 Submission Review Workflow
                      </Text>
                      <Text fontSize="xs">
                        1. Review and approve/deny individual submissions below
                        <br />
                        2. Track progress toward node objectives
                        <br />
                        3. When cumulative goal is met, complete the node to grant rewards and
                        unlock next nodes
                      </Text>
                    </Box>

                    {(() => {
                      // Group ALL submissions (pending + approved) by nodeId and teamId
                      const groupedSubmissions = {};

                      allSubmissions.forEach((submission) => {
                        const key = `${submission.nodeId}_${submission.team?.teamId}`;
                        if (!groupedSubmissions[key]) {
                          groupedSubmissions[key] = [];
                        }
                        groupedSubmissions[key].push(submission);
                      });

                      // Filter to only show nodes that have pending submissions
                      const relevantGroups = Object.entries(groupedSubmissions).filter(([, subs]) =>
                        subs.some((s) => s.status === 'PENDING_REVIEW' || s.status === 'APPROVED')
                      );

                      if (relevantGroups.length === 0) {
                        return (
                          <Text color={currentColors.textColor} textAlign="center" py={8}>
                            No pending submissions
                          </Text>
                        );
                      }

                      const sortedGroups = [...relevantGroups].sort((a, b) => {
                        const [, subsA] = a;
                        const [, subsB] = b;

                        const nodeIdA = subsA[0].nodeId;
                        const teamIdA = subsA[0].team?.teamId;
                        const teamA = event.teams?.find((t) => t.teamId === teamIdA);
                        const isCompletedA = teamA?.completedNodes?.includes(nodeIdA);

                        const nodeIdB = subsB[0].nodeId;
                        const teamIdB = subsB[0].team?.teamId;
                        const teamB = event.teams?.find((t) => t.teamId === teamIdB);
                        const isCompletedB = teamB?.completedNodes?.includes(nodeIdB);

                        // 1) Incomplete first
                        if (isCompletedA !== isCompletedB) return isCompletedA ? 1 : -1;

                        // 2) More pending first
                        const pendA = subsA.filter((s) => s.status === 'PENDING_REVIEW').length;
                        const pendB = subsB.filter((s) => s.status === 'PENDING_REVIEW').length;
                        if (pendA !== pendB) return pendB - pendA;

                        // 3) Newest activity first
                        const latestA = Math.max(
                          ...subsA.map((s) => new Date(s.submittedAt || 0).getTime())
                        );
                        const latestB = Math.max(
                          ...subsB.map((s) => new Date(s.submittedAt || 0).getTime())
                        );
                        return latestB - latestA;
                      });

                      return (
                        <Accordion allowMultiple>
                          {sortedGroups.map(([key, submissions]) => {
                            const nodeId = submissions[0].nodeId;
                            const node = event.nodes?.find((n) => n.nodeId === nodeId);
                            const nodeTitle = node ? node.title : nodeId;
                            const nodeType = node ? node.nodeType : 'STANDARD';
                            const teamId = submissions[0].team?.teamId;
                            const team = event.teams?.find((t) => t.teamId === teamId);
                            const isCompleted = team?.completedNodes?.includes(nodeId);

                            const pendingSubmissions = submissions.filter(
                              (s) => s.status === 'PENDING_REVIEW'
                            );
                            const approvedSubmissions = submissions.filter(
                              (s) => s.status === 'APPROVED'
                            );
                            const deniedSubmissions = submissions.filter(
                              (s) => s.status === 'DENIED'
                            );

                            return (
                              <AccordionItem
                                key={key}
                                border="1px solid"
                                borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                                borderRadius="md"
                                mb={2}
                                bg={currentColors.cardBg}
                                opacity={isCompleted ? 0.75 : 1}
                              >
                                <h2>
                                  <AccordionButton
                                    _hover={{
                                      bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                                    }}
                                    py={4}
                                  >
                                    <HStack justify="space-between" align="start" flex={1}>
                                      <VStack align="start" spacing={1} flex={1}>
                                        <HStack>
                                          <AccordionIcon color={currentColors.textColor} />
                                          <Text
                                            fontWeight="bold"
                                            fontSize="lg"
                                            color={currentColors.textColor}
                                          >
                                            {nodeType === 'INN' ? '🏠 ' : ''}
                                            {nodeTitle}
                                          </Text>
                                          <Badge
                                            bg={
                                              nodeType === 'INN'
                                                ? theme.colors.yellow.base
                                                : nodeType === 'START'
                                                ? currentColors.purple.base
                                                : currentColors.turquoise.base
                                            }
                                            color="white"
                                          >
                                            {nodeType}
                                          </Badge>
                                          {isCompleted && (
                                            <Badge colorScheme="green">✅ COMPLETED</Badge>
                                          )}
                                        </HStack>
                                        <HStack ml={6}>
                                          <Badge bg={currentColors.purple.base} color="white">
                                            {submissions[0].team?.teamName || 'Unknown Team'}
                                          </Badge>
                                          {pendingSubmissions > 0 && (
                                            <Badge colorScheme="orange">
                                              {pendingSubmissions} pending
                                            </Badge>
                                          )}
                                          {approvedSubmissions.length > 0 && (
                                            <Badge colorScheme="green">
                                              {approvedSubmissions.length} approved
                                            </Badge>
                                          )}
                                          {deniedSubmissions.length > 0 && (
                                            <Badge colorScheme="red">
                                              {deniedSubmissions.length} denied
                                            </Badge>
                                          )}
                                        </HStack>
                                        <Text ml={6} fontSize="xs" color="gray.500">
                                          Node ID: {nodeId}
                                        </Text>
                                      </VStack>

                                      {/* Button to complete node */}
                                      {!isCompleted && approvedSubmissions.length > 0 && (
                                        <VStack
                                          spacing={1}
                                          align="end"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Button
                                            size="sm"
                                            colorScheme="green"
                                            leftIcon={<CheckIcon />}
                                            onClick={() => {
                                              setNodeToComplete({
                                                nodeId,
                                                teamId,
                                                nodeTitle,
                                                teamName: submissions[0].team?.teamName,
                                              });
                                            }}
                                          >
                                            Complete Node
                                          </Button>
                                          <Text fontSize="xs" color="gray.500">
                                            Grant rewards
                                          </Text>
                                        </VStack>
                                      )}
                                    </HStack>
                                  </AccordionButton>
                                </h2>

                                <AccordionPanel pb={4}>
                                  <VStack align="stretch" spacing={3}>
                                    {/* Show node objective if available */}
                                    {node?.objective && (
                                      <Box
                                        p={2}
                                        bg={
                                          colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'
                                        }
                                        borderRadius="md"
                                      >
                                        <Text
                                          fontSize="xs"
                                          fontWeight="bold"
                                          color={currentColors.textColor}
                                        >
                                          Objective:
                                        </Text>
                                        <Text
                                          fontSize="xs"
                                          color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                        >
                                          {OBJECTIVE_TYPES[node.objective.type]}:{' '}
                                          {node.objective.quantity} {node.objective.target}
                                        </Text>
                                        {node.objective.appliedBuff && (
                                          <Badge colorScheme="blue" fontSize="xs" mt={1}>
                                            ✨ Buff Applied: -
                                            {(node.objective.appliedBuff.reduction * 100).toFixed(
                                              0
                                            )}
                                            %
                                          </Badge>
                                        )}
                                      </Box>
                                    )}

                                    {isCompleted && (
                                      <Box
                                        p={2}
                                        bg={currentColors.green.base}
                                        color="white"
                                        borderRadius="md"
                                      >
                                        <Text fontSize="xs" fontWeight="bold">
                                          ℹ️ This node is already completed. Submissions can still
                                          be reviewed for record-keeping.
                                        </Text>
                                      </Box>
                                    )}

                                    {/* Show each submission - sorted by status */}
                                    <VStack align="stretch" spacing={2}>
                                      {submissions
                                        .sort((a, b) => {
                                          const order = {
                                            PENDING_REVIEW: 0,
                                            APPROVED: 1,
                                            DENIED: 2,
                                          };
                                          return order[a.status] - order[b.status];
                                        })
                                        .map((submission) => (
                                          <Box
                                            key={submission.submissionId}
                                            p={3}
                                            bg={
                                              submission.status === 'APPROVED'
                                                ? colorMode === 'dark'
                                                  ? 'green.900'
                                                  : 'green.50'
                                                : submission.status === 'DENIED'
                                                ? colorMode === 'dark'
                                                  ? 'red.900'
                                                  : 'red.50'
                                                : colorMode === 'dark'
                                                ? '#1A202C'
                                                : '#F7FAFC'
                                            }
                                            borderRadius="md"
                                            borderWidth={submission.status === 'APPROVED' ? 2 : 1}
                                            borderColor={
                                              submission.status === 'APPROVED'
                                                ? currentColors.green.base
                                                : submission.status === 'DENIED'
                                                ? currentColors.red.base
                                                : 'transparent'
                                            }
                                          >
                                            <HStack justify="space-between" mb={2}>
                                              <VStack align="start" spacing={0}>
                                                <HStack>
                                                  <Text
                                                    fontSize="sm"
                                                    fontWeight="bold"
                                                    color={currentColors.textColor}
                                                  >
                                                    Submitted by {submission.submittedByUsername}{' '}
                                                    (ID: {submission.submittedBy})
                                                  </Text>
                                                  {submission.status !== 'PENDING_REVIEW' && (
                                                    <Badge
                                                      colorScheme={
                                                        submission.status === 'APPROVED'
                                                          ? 'green'
                                                          : 'red'
                                                      }
                                                      fontSize="xs"
                                                    >
                                                      {submission.status}
                                                    </Badge>
                                                  )}
                                                </HStack>
                                                <Text
                                                  fontSize="xs"
                                                  color={
                                                    colorMode === 'dark' ? 'gray.400' : 'gray.600'
                                                  }
                                                >
                                                  {new Date(
                                                    submission.submittedAt
                                                  ).toLocaleString()}
                                                </Text>
                                                {submission.reviewedAt && (
                                                  <Text
                                                    fontSize="xs"
                                                    color={
                                                      colorMode === 'dark' ? 'gray.500' : 'gray.600'
                                                    }
                                                  >
                                                    Reviewed:{' '}
                                                    {new Date(
                                                      submission.reviewedAt
                                                    ).toLocaleString()}
                                                  </Text>
                                                )}
                                              </VStack>
                                            </HStack>

                                            <HStack justify="space-between">
                                              <Button
                                                leftIcon={<ExternalLinkIcon />}
                                                size="sm"
                                                variant="outline"
                                                as="a"
                                                href={submission.proofUrl}
                                                target="_blank"
                                                color={currentColors.textColor}
                                              >
                                                View Proof
                                              </Button>

                                              {submission.status === 'PENDING_REVIEW' && (
                                                <HStack>
                                                  <Tooltip label="Deny Submission">
                                                    <IconButton
                                                      icon={<CloseIcon />}
                                                      bg={currentColors.red.base}
                                                      color="white"
                                                      size="sm"
                                                      _hover={{ opacity: 0.8 }}
                                                      onClick={() => {
                                                        setSubmissionToDeny(submission);
                                                        onDenialModalOpen();
                                                      }}
                                                    />
                                                  </Tooltip>
                                                  <Tooltip label="Approve Submission">
                                                    <IconButton
                                                      icon={<CheckIcon />}
                                                      bg={currentColors.green.base}
                                                      color="white"
                                                      size="sm"
                                                      _hover={{ opacity: 0.8 }}
                                                      onClick={() =>
                                                        handleReviewSubmission(
                                                          submission.submissionId,
                                                          true
                                                        )
                                                      }
                                                    />
                                                  </Tooltip>
                                                </HStack>
                                              )}
                                            </HStack>
                                          </Box>
                                        ))}
                                    </VStack>
                                  </VStack>
                                </AccordionPanel>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      );
                    })()}
                  </VStack>
                </TabPanel>
              )}
              {isEventAdmin && (
                <TabPanel>
                  <Card bg={currentColors.cardBg}>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md" color={currentColors.textColor}>
                          Event Configuration
                        </Heading>

                        {notificationsSupported && (
                          <Card bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}>
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between" align="start">
                                  <VStack align="start" spacing={2} flex={1}>
                                    <HStack>
                                      <Text fontSize="2xl">
                                        {notificationsEnabled ? '🔔' : '🔕'}
                                      </Text>
                                      <Heading size="sm" color={currentColors.textColor}>
                                        Submission Notifications
                                      </Heading>
                                      {notificationsEnabled && (
                                        <Badge colorScheme="green" fontSize="xs">
                                          ACTIVE
                                        </Badge>
                                      )}{' '}
                                      <HStack
                                        borderLeft="1px solid gray"
                                        paddingLeft={3}
                                        marginLeft={2}
                                        spacing={2}
                                      >
                                        {notificationsEnabled ? (
                                          <>
                                            <Button
                                              size="sm"
                                              colorScheme="blue"
                                              variant="outline"
                                              onClick={() => {
                                                // Send test notification with sound
                                                if (Notification.permission === 'granted') {
                                                  // Play sound
                                                  if (
                                                    localStorage.getItem(
                                                      'treasureHunt_sound_enabled'
                                                    ) !== 'false'
                                                  ) {
                                                    const audioContext = new (window.AudioContext ||
                                                      window.webkitAudioContext)();
                                                    const playTone = (
                                                      frequency,
                                                      duration,
                                                      startTime
                                                    ) => {
                                                      const oscillator =
                                                        audioContext.createOscillator();
                                                      const gainNode = audioContext.createGain();
                                                      oscillator.connect(gainNode);
                                                      gainNode.connect(audioContext.destination);
                                                      oscillator.frequency.value = frequency;
                                                      oscillator.type = 'sine';
                                                      gainNode.gain.setValueAtTime(0, startTime);
                                                      gainNode.gain.linearRampToValueAtTime(
                                                        0.3,
                                                        startTime + 0.01
                                                      );
                                                      gainNode.gain.exponentialRampToValueAtTime(
                                                        0.01,
                                                        startTime + duration
                                                      );
                                                      oscillator.start(startTime);
                                                      oscillator.stop(startTime + duration);
                                                    };
                                                    const now = audioContext.currentTime;
                                                    playTone(800, 0.1, now);
                                                    playTone(600, 0.15, now + 0.1);
                                                  }

                                                  // Show notification
                                                  const testNotif = new Notification(
                                                    'Test Notification',
                                                    {
                                                      body: 'If you can see this, notifications are working!',
                                                      icon: '/favicon.ico',
                                                      tag: 'manual-test',
                                                      silent: true, // We play our own sound
                                                    }
                                                  );
                                                  testNotif.onclick = () => {
                                                    window.focus();
                                                    testNotif.close();
                                                  };
                                                }
                                              }}
                                            >
                                              Send Test
                                            </Button>
                                            <Button
                                              size="sm"
                                              colorScheme="red"
                                              variant="outline"
                                              onClick={disableNotifications}
                                            >
                                              Disable
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            size="sm"
                                            colorScheme="green"
                                            onClick={requestNotificationPermission}
                                            isDisabled={notificationPermission === 'denied'}
                                          >
                                            Enable Notifications
                                          </Button>
                                        )}
                                      </HStack>
                                    </HStack>
                                    <Text
                                      fontSize="sm"
                                      color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                    >
                                      {notificationsEnabled
                                        ? "You'll receive browser notifications when new submissions arrive"
                                        : 'Enable notifications to get alerts for new submissions'}
                                    </Text>
                                    {notificationPermission === 'denied' && (
                                      <Text fontSize="xs" color="red.500">
                                        ⚠️ Notifications are blocked. Please enable them in your
                                        browser settings.
                                      </Text>
                                    )}
                                    {notificationPermission === 'default' &&
                                      !notificationsEnabled && (
                                        <Text
                                          fontSize="xs"
                                          color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                                        >
                                          Click "Enable Notifications" and allow permission when
                                          prompted
                                        </Text>
                                      )}

                                    {/* Sound toggle - only show when notifications are enabled */}
                                    {notificationsEnabled && (
                                      <HStack
                                        p={2}
                                        bg={
                                          colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'
                                        }
                                        borderRadius="md"
                                        w="full"
                                      >
                                        <Text fontSize="2xl">🔊</Text>
                                        <VStack align="start" spacing={0} flex={1}>
                                          <Text
                                            fontSize="sm"
                                            fontWeight="bold"
                                            color={currentColors.textColor}
                                          >
                                            Notification Sound
                                          </Text>
                                          <Text
                                            fontSize="xs"
                                            color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                          >
                                            Play a sound when new submissions arrive
                                          </Text>
                                        </VStack>
                                        <Switch
                                          colorScheme="purple"
                                          defaultChecked={
                                            localStorage.getItem('treasureHunt_sound_enabled') !==
                                            'false'
                                          }
                                          onChange={(e) => {
                                            localStorage.setItem(
                                              'treasureHunt_sound_enabled',
                                              e.target.checked.toString()
                                            );
                                            if (e.target.checked) {
                                              // Play test sound
                                              const audioContext = new (window.AudioContext ||
                                                window.webkitAudioContext)();
                                              const playTone = (frequency, duration, startTime) => {
                                                const oscillator = audioContext.createOscillator();
                                                const gainNode = audioContext.createGain();
                                                oscillator.connect(gainNode);
                                                gainNode.connect(audioContext.destination);
                                                oscillator.frequency.value = frequency;
                                                oscillator.type = 'sine';
                                                gainNode.gain.setValueAtTime(0, startTime);
                                                gainNode.gain.linearRampToValueAtTime(
                                                  0.3,
                                                  startTime + 0.01
                                                );
                                                gainNode.gain.exponentialRampToValueAtTime(
                                                  0.01,
                                                  startTime + duration
                                                );
                                                oscillator.start(startTime);
                                                oscillator.stop(startTime + duration);
                                              };
                                              const now = audioContext.currentTime;
                                              playTone(800, 0.1, now);
                                              playTone(600, 0.15, now + 0.1);
                                            }
                                          }}
                                        />
                                      </HStack>
                                    )}
                                  </VStack>
                                </HStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        )}

                        <hr />
                        {event.status === 'DRAFT' && (
                          <HStack gap={4}>
                            <Button
                              colorScheme="green"
                              onClick={handleGenerateMap}
                              isLoading={generateLoading}
                              animation={
                                !event.nodes || event.nodes.length === 0
                                  ? 'flashButton 1.5s ease-in-out infinite'
                                  : 'none'
                              }
                              sx={{
                                '@keyframes flashButton': {
                                  '0%, 100%': {
                                    boxShadow: '0 0 0 0 rgba(72, 187, 120, 0.7)',
                                    transform: 'scale(1)',
                                  },
                                  '50%': {
                                    boxShadow: '0 0 20px 5px rgba(72, 187, 120, 0.9)',
                                    transform: 'scale(1.05)',
                                  },
                                },
                              }}
                            >
                              {event.nodes && event.nodes.length > 0
                                ? 'Regenerate Map'
                                : 'Generate Map'}
                            </Button>
                            )
                            <Button
                              leftIcon={<AddIcon />}
                              bg={currentColors.turquoise.base}
                              color="white"
                              _hover={{ opacity: 0.8 }}
                              onClick={onCreateTeamOpen}
                            >
                              Add Team
                            </Button>
                          </HStack>
                        )}

                        <Card bg={currentColors.purple.base} color="white" borderRadius="md">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack>
                                <Icon as={InfoIcon} boxSize={5} />
                                <Heading size="sm">Discord Integration</Heading>
                              </HStack>
                              <Text fontSize="sm">
                                Connect your Discord server to let teams interact with the Treasure
                                Hunt directly from Discord. They can view progress, submit
                                completions, and use buffs!
                              </Text>
                              <Button
                                size="sm"
                                colorScheme="whiteAlpha"
                                variant="solid"
                                onClick={onDiscordSetupOpen}
                                leftIcon={<InfoIcon />}
                              >
                                View Setup Instructions
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                        <hr />
                        <EventAdminManager
                          event={event}
                          onUpdate={() => {
                            window.location.reload();
                          }}
                        />
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              )}
              <TabPanel px={0}>
                <GameRulesTab colorMode={colorMode} currentColors={currentColors} event={event} />
              </TabPanel>
              {isEventAdmin && (
                <TabPanel px={0}>
                  <Box bg={currentColors.cardBg} borderRadius="8px" overflow="hidden">
                    <ScrollableTableContainer width="100%">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th color={currentColors.textColor}>ID</Th>
                            <Th color={currentColors.textColor}>Title</Th>
                            <Th color={currentColors.textColor}>Type</Th>
                            <Th color={currentColors.textColor}>Difficulty</Th>
                            <Th color={currentColors.textColor}>Location / Path</Th>
                            <Th isNumeric color={currentColors.textColor}>
                              GP
                            </Th>
                            <Th color={currentColors.textColor}>Keys</Th>
                            <Th color={currentColors.textColor}>Buffs</Th>
                            <Th color={currentColors.textColor}>Objective</Th>
                            <Th isNumeric>Amount</Th>
                            <Th isNumeric color={currentColors.textColor}>
                              Prereqs
                            </Th>
                            <Th isNumeric color={currentColors.textColor}>
                              Unlocks
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {[...(event.nodes || [])]
                            .sort((a, b) => {
                              // Sort: START first, then INN, then STANDARD; within type by title asc
                              const order = { START: 0, INN: 1, STANDARD: 2, TREASURE: 3 };
                              const ta = order[a.nodeType] ?? 99;
                              const tb = order[b.nodeType] ?? 99;
                              if (ta !== tb) return ta - tb;
                              return (a.title || '').localeCompare(b.title || '');
                            })
                            .map((node) => {
                              const diffMap = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };
                              const diffBadgeScheme =
                                node.difficultyTier === 5
                                  ? 'red'
                                  : node.difficultyTier === 3
                                  ? 'orange'
                                  : node.difficultyTier === 1
                                  ? 'green'
                                  : 'gray';

                              const gp = node.rewards?.gp || 0;
                              const keys = node.rewards?.keys || [];
                              const buffs = node.rewards?.buffs || [];

                              const objective = node.objective ? ` ${node.objective.target}` : '—';

                              return (
                                <Tr key={node.nodeId}>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Tooltip label="Copy Node ID">
                                        <IconButton
                                          aria-label="Copy Node ID"
                                          icon={<CopyIcon />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => navigator.clipboard.writeText(node.nodeId)}
                                        />
                                      </Tooltip>
                                      <Text
                                        color={currentColors.textColor}
                                        fontSize="xs"
                                        fontFamily="mono"
                                      >
                                        {node.nodeId}
                                      </Text>
                                    </HStack>
                                  </Td>
                                  <Td color={currentColors.textColor} maxW="280px" isTruncated>
                                    {node.title || '—'}
                                  </Td>
                                  <Td>
                                    <Badge
                                      bg={
                                        node.nodeType === 'INN'
                                          ? 'yellow.300'
                                          : node.nodeType === 'START'
                                          ? currentColors.purple.base
                                          : currentColors.turquoise.base
                                      }
                                      color="white"
                                    >
                                      {node.nodeType}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    {node.nodeType === 'STANDARD' ? (
                                      <Badge colorScheme={diffBadgeScheme}>
                                        {diffMap[node.difficultyTier] || '—'}
                                      </Badge>
                                    ) : (
                                      <Badge colorScheme="gray">—</Badge>
                                    )}
                                  </Td>
                                  <Td color={currentColors.textColor}>
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm">{node.mapLocation || '—'}</Text>
                                    </VStack>
                                  </Td>
                                  <Td isNumeric color={currentColors.green.base}>
                                    {gp ? formatGP(gp) : '0.0M'}
                                  </Td>
                                  <Td>
                                    <HStack spacing={1} wrap="wrap">
                                      {keys.length > 0 ? (
                                        keys.map((k, i) => (
                                          <Badge key={i} colorScheme={k.color}>
                                            {k.quantity} {k.color}
                                          </Badge>
                                        ))
                                      ) : (
                                        <Text fontSize="xs" color="gray.500">
                                          —
                                        </Text>
                                      )}
                                    </HStack>
                                  </Td>
                                  <Td>
                                    {buffs.length > 0 ? (
                                      <Badge colorScheme="purple">{buffs.length}</Badge>
                                    ) : (
                                      <Text fontSize="xs" color="gray.500">
                                        —
                                      </Text>
                                    )}
                                  </Td>
                                  <Td color={currentColors.textColor} maxW="320px" isTruncated>
                                    {objective}
                                  </Td>
                                  <Td color={currentColors.textColor} isNumeric>
                                    {node?.objective?.appliedBuff ? (
                                      <Tooltip
                                        hasArrow
                                        label={`Reduced from ${(
                                          node.objective.originalQuantity ?? node.objective.quantity
                                        ).toLocaleString()}`}
                                      >
                                        <HStack justify="flex-end" spacing={2}>
                                          <Text>{formatObjectiveAmount(node)}</Text>
                                          <Badge colorScheme="blue">
                                            -
                                            {(node.objective.appliedBuff.reduction * 100).toFixed(
                                              0
                                            )}
                                            %
                                          </Badge>
                                        </HStack>
                                      </Tooltip>
                                    ) : (
                                      formatObjectiveAmount(node)
                                    )}
                                  </Td>
                                  <Td isNumeric color={currentColors.textColor}>
                                    {node.prerequisites?.length || 0}
                                  </Td>
                                  <Td isNumeric color={currentColors.textColor}>
                                    {node.unlocks?.length || 0}
                                  </Td>
                                </Tr>
                              );
                            })}
                        </Tbody>
                      </Table>
                    </ScrollableTableContainer>
                  </Box>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </VStack>
      </Section>
      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={onCreateTeamClose}
        eventId={eventId}
        onSuccess={async () => {
          await refetchEvent();
          await refetchSubmissions();
        }}
      />
      <EditEventModal
        isOpen={isEditEventOpen}
        onClose={onEditEventClose}
        event={event}
        onSuccess={async () => {
          await refetchEvent();
        }}
      />
      <EditTeamModal
        isOpen={isEditTeamOpen}
        onClose={onEditTeamClose}
        team={selectedTeam}
        eventId={eventId}
        onSuccess={async () => {
          await refetchEvent();
          await refetchSubmissions();
        }}
      />
      <DiscordSetupModal
        isOpen={isDiscordSetupOpen}
        onClose={onDiscordSetupClose}
        eventId={eventId}
      />
      <DenialReasonModal
        isOpen={isDenialModalOpen}
        onClose={onDenialModalClose}
        onDeny={handleDenyWithReason}
        submissionId={submissionToDeny?.submissionId}
        submittedBy={submissionToDeny?.submittedByUsername || submissionToDeny?.submittedBy}
      />
      <AlertDialog
        isOpen={isRegenerateOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRegenerateClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={currentColors.cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={currentColors.textColor}>
              Regenerate Map
            </AlertDialogHeader>

            <AlertDialogBody color={currentColors.textColor}>
              Are you sure you want to regenerate the map? This will delete all existing nodes and
              reset all team progress. This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRegenerateClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => generateMap({ variables: { eventId } })}
                ml={3}
                isLoading={generateLoading}
              >
                Regenerate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {nodeToComplete && (
        <AlertDialog
          isOpen={!!nodeToComplete}
          leastDestructiveRef={cancelCompleteRef}
          onClose={() => setNodeToComplete(null)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={currentColors.cardBg}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={currentColors.textColor}>
                Complete Node
              </AlertDialogHeader>

              <AlertDialogBody color={currentColors.textColor}>
                <VStack align="stretch" spacing={3}>
                  <Text>
                    Are you sure you want to complete{' '}
                    <Text as="span" fontWeight="bold">
                      "{nodeToComplete.nodeTitle}"
                    </Text>{' '}
                    for{' '}
                    <Text as="span" fontWeight="bold">
                      {nodeToComplete.teamName}
                    </Text>
                    ?
                  </Text>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor={currentColors.green.base}
                  >
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      This will:
                    </Text>
                    <VStack align="start" spacing={1} fontSize="sm">
                      <HStack>
                        <Text>✅</Text>
                        <Text>Mark the node as completed</Text>
                      </HStack>
                      <HStack>
                        <Text>💰</Text>
                        <Text>Grant GP rewards to team pot</Text>
                      </HStack>
                      <HStack>
                        <Text>🔑</Text>
                        <Text>Add any key rewards to inventory</Text>
                      </HStack>
                      <HStack>
                        <Text>✨</Text>
                        <Text>Grant any buff rewards</Text>
                      </HStack>
                      <HStack>
                        <Text>🔓</Text>
                        <Text>Unlock connected nodes</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    You can undo this later using Admin Mode if needed.
                  </Text>
                </VStack>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelCompleteRef} onClick={() => setNodeToComplete(null)}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={async () => {
                    try {
                      await adminCompleteNode({
                        variables: {
                          eventId,
                          teamId: nodeToComplete.teamId,
                          nodeId: nodeToComplete.nodeId,
                        },
                      });
                      await refetchSubmissions();
                      toast({
                        title: 'Node completed!',
                        description: `${nodeToComplete.nodeTitle} has been marked as complete`,
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      });
                      setNodeToComplete(null);
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: error.message,
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  }}
                  ml={3}
                  isLoading={completing}
                >
                  Complete Node
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Flex>
  );
};

export default TreasureEventView;
