import React, { useState } from 'react';
import {
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
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_PENDING_SUBMISSIONS } from '../graphql/queries';
import { REVIEW_SUBMISSION, GENERATE_TREASURE_MAP } from '../graphql/mutations';
import { useToastContext } from '../providers/ToastProvider';
import Section from '../atoms/Section';
import theme from '../theme';
import GemTitle from '../atoms/GemTitle';
import CreateTeamModal from '../organisms/CreateTreasureTeamModal';
import EditEventModal from '../organisms/EditTreasureEventModal';
import EditTeamModal from '../organisms/EditTreasureTeamModal';
import MultiTeamTreasureMap from '../organisms/MultiTeamTreasureMapVisualization';

const TreasureEventView = () => {
  const { colorMode } = useColorMode();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [selectedTeam, setSelectedTeam] = useState(null);
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
  const cancelRef = React.useRef();

  const { data: eventData, loading: eventLoading } = useQuery(GET_TREASURE_EVENT, {
    variables: { eventId },
  });

  const {
    data: submissionsData,
    loading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { eventId },
  });

  const [generateMap, { loading: generateLoading }] = useMutation(GENERATE_TREASURE_MAP, {
    onCompleted: () => {
      showToast('Map generated successfully!', 'success');
      onRegenerateClose();
      window.location.reload();
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

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      turquoise: { base: '#28AFB0' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      turquoise: { base: '#28AFB0' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  const event = eventData?.getTreasureEvent;
  const teams = event?.teams || [];
  const pendingSubmissions = submissionsData?.getPendingSubmissions || [];

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const handleReviewSubmission = async (submissionId, approved) => {
    try {
      await reviewSubmission({
        variables: {
          submissionId,
          approved,
          reviewerId: 'admin', // TODO: Use actual user ID
        },
      });
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  if (eventLoading) {
    return (
      <Container maxW="container.xl" py={8}>
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

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
      marginX={['12px', '36px']}
    >
      <Section maxWidth="1200px" width="100%" py={8}>
        <VStack spacing={8} align="stretch" width="100%">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <GemTitle size="xl" color={currentColors.textColor}>
                {event.eventName}
              </GemTitle>
              <HStack>
                <Badge
                  bg={currentColors.green.base}
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
            </VStack>
            <Button
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
          </HStack>

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
              <StatLabel color={currentColors.textColor}>Total Prize Pool</StatLabel>
              <StatNumber color={currentColors.textColor}>
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
              <StatLabel color={currentColors.textColor}>Total Teams</StatLabel>
              <StatNumber color={currentColors.textColor}>{teams.length}</StatNumber>
            </Stat>
            <Stat
              bg={currentColors.cardBg}
              py="6px"
              minW={['216px', '216px', 'auto']}
              textAlign="center"
              borderRadius="md"
            >
              <StatLabel color={currentColors.textColor}>Pending Submissions</StatLabel>
              <StatNumber color={currentColors.textColor}>{pendingSubmissions.length}</StatNumber>
            </Stat>
          </StatGroup>

          {event.nodes && event.nodes.length > 0 && (
            <Box width="100%">
              <Heading size="md" mb={4} color={currentColors.textColor}>
                Event Map Overview
              </Heading>
              <MultiTeamTreasureMap
                nodes={event.nodes}
                teams={teams}
                onNodeClick={(node) => {
                  // Optionally show node details modal
                  console.log('Clicked node:', node);
                }}
              />
            </Box>
          )}

          <Tabs size="sm" position="relative" variant="soft-rounded" maxW="100%">
            <TabList pb="6px" overflowY="hidden" overflowX="scroll">
              <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                Leaderboard
              </Tab>
              <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                Pending Submissions ({pendingSubmissions.length})
              </Tab>
              <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                Event Settings
              </Tab>
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
                        {teams.map((team, idx) => (
                          <Tr key={team.teamId}>
                            <Td fontWeight="bold" color={currentColors.textColor}>
                              {idx + 1}
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
                              {team.completedNodes.length}
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                {team.keysHeld.map((key) => (
                                  <Badge key={key.color} colorScheme={key.color}>
                                    {key.quantity}
                                  </Badge>
                                ))}
                              </HStack>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  bg={currentColors.purple.base}
                                  color="white"
                                  _hover={{ bg: currentColors.purple.light }}
                                  onClick={() =>
                                    navigate(`/treasure-hunt/${event.eventId}/team/${team.teamId}`)
                                  }
                                  whiteSpace="nowrap"
                                >
                                  View Map
                                </Button>
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
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </TabPanel>

              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  {pendingSubmissions.map((submission) => (
                    <Card key={submission.submissionId} bg={currentColors.cardBg} borderWidth={1}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" fontSize="lg" color={currentColors.textColor}>
                                {submission.nodeId}
                              </Text>
                              <HStack>
                                <Badge bg={currentColors.purple.base} color="white">
                                  {submission.team?.teamName || 'Unknown Team'}
                                </Badge>
                                <Text
                                  fontSize="sm"
                                  color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                >
                                  by {submission.submittedBy}
                                </Text>
                              </HStack>
                            </VStack>
                            <Text
                              fontSize="sm"
                              color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}
                            >
                              {new Date(submission.submittedAt).toLocaleString()}
                            </Text>
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
                            <HStack>
                              <Tooltip label="Deny Submission">
                                <IconButton
                                  icon={<CloseIcon />}
                                  bg={currentColors.red.base}
                                  color="white"
                                  size="sm"
                                  _hover={{ opacity: 0.8 }}
                                  onClick={() =>
                                    handleReviewSubmission(submission.submissionId, false)
                                  }
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
                                    handleReviewSubmission(submission.submissionId, true)
                                  }
                                />
                              </Tooltip>
                            </HStack>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              <TabPanel>
                <Card bg={currentColors.cardBg}>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md" color={currentColors.textColor}>
                        Event Configuration
                      </Heading>
                      <Button
                        leftIcon={<AddIcon />}
                        bg={currentColors.turquoise.base}
                        color="white"
                        _hover={{ opacity: 0.8 }}
                        onClick={onCreateTeamOpen}
                      >
                        Add Team
                      </Button>
                      <Button
                        colorScheme="green"
                        onClick={handleGenerateMap}
                        isLoading={generateLoading}
                      >
                        {event.nodes && event.nodes.length > 0 ? 'Regenerate Map' : 'Generate Map'}
                      </Button>
                      <Text color={currentColors.textColor}>
                        Event settings and configuration will go here.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Section>
      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={onCreateTeamClose}
        eventId={eventId}
        onSuccess={() => {
          // Refetch event data to show new team
          window.location.reload();
        }}
      />
      <EditEventModal
        isOpen={isEditEventOpen}
        onClose={onEditEventClose}
        event={event}
        onSuccess={() => {
          window.location.reload();
        }}
      />
      <EditTeamModal
        isOpen={isEditTeamOpen}
        onClose={onEditTeamClose}
        team={selectedTeam}
        eventId={eventId}
        onSuccess={() => {
          window.location.reload(); // or use refetch
        }}
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
    </Flex>
  );
};

export default TreasureEventView;
