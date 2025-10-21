import {
  Flex,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Badge,
  SimpleGrid,
  useDisclosure,
  useColorMode,
  Icon,
  Image,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  theme,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import CreateEventModal from '../organisms/TreasureHunt/CreateTreasureEventModal';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import GemTitle from '../atoms/GemTitle';
import { MdOutlineArrowBack } from 'react-icons/md';
import Section from '../atoms/Section';
import ExampleTreasure from '../assets/exampletreasure.png';
import { DELETE_TREASURE_EVENT } from '../graphql/mutations';
import { useState } from 'react';
import { useRef } from 'react';
import { useToastContext } from '../providers/ToastProvider';
import EventCreationGuide from '../organisms/TreasureHunt/TreasureHuntEventCreationGuide';

const TreasureHuntDashboard = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, refetch } = useQuery(GET_ALL_TREASURE_EVENTS, {
    variables: { userId: user?.id },
    skip: !user,
  });

  const [deleteEventId, setDeleteEventId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const cancelRef = useRef();
  const { showToast } = useToastContext();

  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_TREASURE_EVENT, {
    onCompleted: () => {
      showToast('Event deleted successfully', 'success');
      refetch();
      setIsDeleteOpen(false);
      setDeleteEventId(null);
    },
    onError: (error) => {
      showToast(`Error deleting event: ${error.message}`, 'error');
    },
  });

  const handleDeleteClick = (e, eventId) => {
    e.stopPropagation(); // Prevent card click
    setDeleteEventId(eventId);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteEventId) {
      await deleteEvent({
        variables: { eventId: deleteEventId },
      });
    }
  };

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  const events = data?.getAllTreasureEvents || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return currentColors.green.base;
      case 'DRAFT':
        return currentColors.sapphire.base;
      case 'COMPLETED':
        return currentColors.turquoise.base;
      case 'ARCHIVED':
        return currentColors.purple.base;
      default:
        return currentColors.sapphire.base;
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/treasure-hunt/${eventId}`);
  };

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
      width="100%"
    >
      <Flex flexDirection="column" maxWidth="1200px" width="100%">
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
            <Link to={`/`}> Home</Link>
          </Text>
        </Flex>
        <VStack spacing={8} align="stretch">
          {loading ? (
            <Text color={currentColors.textColor}>Loading events...</Text>
          ) : events.length === 0 ? (
            <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
              <Section bg="rgba(0, 200, 200, 0.5)">
                {/* Hero Section */}
                <VStack spacing={4} textAlign="center" py={8}>
                  <GemTitle size="lg" gemColor="yellow">
                    Welcome to Treasure Hunt!
                  </GemTitle>
                  <Text fontSize="lg" color="white">
                    Create competitive clan events where teams race through OSRS challenges to claim
                    the prize
                  </Text>
                  <Image
                    m="0 auto"
                    alt="Example Old School RuneScape bingo board, some tiles are complete and some are not."
                    backgroundColor={theme.colors.gray[900]}
                    borderRadius="8px"
                    maxHeight="300px"
                    maxWidth="300px"
                    padding="8px"
                    src={ExampleTreasure}
                    loading="lazy"
                  />
                </VStack>
              </Section>

              {/* How It Works */}
              <Card
                bg={currentColors.cardBg}
                borderWidth={2}
                borderColor={currentColors.turquoise.base}
              >
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md" color={currentColors.textColor}>
                      How It Works
                    </Heading>

                    {/* Step 1 */}
                    <HStack align="start" spacing={4}>
                      <Badge
                        fontSize="lg"
                        bg={currentColors.purple.base}
                        color="white"
                        borderRadius="full"
                        w="40px"
                        h="40px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        1
                      </Badge>
                      <VStack align="start" flex={1} spacing={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          Create an Event
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Set up your treasure hunt with a prize pool, team size, difficulty, and
                          duration. The system generates a unique map with objectives tailored to
                          your settings.
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Step 2 */}
                    <HStack align="start" spacing={4}>
                      <Badge
                        fontSize="lg"
                        bg={currentColors.turquoise.base}
                        color="white"
                        borderRadius="full"
                        w="40px"
                        h="40px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        2
                      </Badge>
                      <VStack align="start" flex={1} spacing={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          Teams Complete Objectives
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Teams navigate through nodes on the map, completing OSRS objectives like
                          boss kills, XP gains, and item collections. Each node rewards GP and keys.
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Step 3 */}
                    <HStack align="start" spacing={4}>
                      <Badge
                        fontSize="lg"
                        bg={currentColors.green.base}
                        color="white"
                        borderRadius="full"
                        w="40px"
                        h="40px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        3
                      </Badge>
                      <VStack align="start" flex={1} spacing={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          Race to the Finish
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          The team with the highest GP pot at the end wins! Trade keys at Inns for
                          bonus treasures, unlock powerful buffs to reduce future objectives, and
                          strategize your path to victory.
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Key Features */}
              <SimpleGrid columns={{ base: 1, md: 3 }} opacity="0.8" spacing={4}>
                <Card bg={currentColors.cardBg} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={2}>
                      <Text fontSize="3xl">⚔️</Text>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={currentColors.textColor}
                        textAlign="center"
                      >
                        Dynamic Objectives
                      </Text>
                      <Text
                        fontSize="xs"
                        color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        textAlign="center"
                      >
                        Boss KC, skilling, item collection, and more
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={currentColors.cardBg} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={2}>
                      <Text fontSize="3xl">✨</Text>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={currentColors.textColor}
                        textAlign="center"
                      >
                        Strategic Buffs
                      </Text>
                      <Text
                        fontSize="xs"
                        color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        textAlign="center"
                      >
                        Earn buffs to reduce future objective requirements
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={currentColors.cardBg} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={2}>
                      <Text fontSize="3xl">🏠</Text>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={currentColors.textColor}
                        textAlign="center"
                      >
                        Inn Checkpoints
                      </Text>
                      <Text
                        fontSize="xs"
                        color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        textAlign="center"
                      >
                        Trade keys for bonus treasures at safe havens
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Example Stats */}
              {/* <Card
                bg={currentColors.cardBg}
                borderWidth={1}
                borderColor={currentColors.sapphire.base}
              >
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="sm" color={currentColors.textColor}>
                      📊 Typical Event
                    </Heading>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color={currentColors.purple.base}>
                          10
                        </Text>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Teams
                        </Text>
                      </VStack>
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color={currentColors.turquoise.base}>
                          5
                        </Text>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Players/Team
                        </Text>
                      </VStack>
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color={currentColors.green.base}>
                          5B
                        </Text>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Prize Pool
                        </Text>
                      </VStack>
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color={currentColors.sapphire.base}>
                          2wk
                        </Text>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Duration
                        </Text>
                      </VStack>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card> */}

              {/* CTA */}
              <VStack spacing={4} py={4}>
                <Button
                  size="lg"
                  leftIcon={<AddIcon />}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{ bg: currentColors.purple.light, transform: 'translateY(-2px)' }}
                  onClick={onOpen}
                  boxShadow="lg"
                >
                  Create Your First Event
                </Button>
                <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}>
                  The map generates automatically based on your settings
                </Text>
              </VStack>
            </VStack>
          ) : (
            <>
              <HStack justify="space-between" flexWrap="wrap">
                <GemTitle size="xl" color={currentColors.textColor} gemColor="yellow">
                  Your Treasure Hunt Events
                </GemTitle>
                <Button
                  leftIcon={<AddIcon />}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{ bg: currentColors.purple.light }}
                  onClick={onOpen}
                >
                  Create New Event
                </Button>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {events.map((event) => (
                  <Card
                    key={event.eventId}
                    cursor="pointer"
                    bg={currentColors.cardBg}
                    _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                    transition="all 0.2s"
                    onClick={() => handleEventClick(event.eventId)}
                    position="relative"
                    role="group" // This enables group-hover for children
                  >
                    {/* Delete Button - Shows on hover */}
                    <IconButton
                      icon={<DeleteIcon />}
                      position="absolute"
                      bottom={2}
                      right={2}
                      size="sm"
                      colorScheme="red"
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      transition="opacity 0.2s"
                      onClick={(e) => handleDeleteClick(e, event.eventId)}
                      aria-label="Delete event"
                      zIndex={1}
                    />

                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md" color={currentColors.textColor}>
                          {event.eventName}
                        </Heading>
                        <Badge
                          bg={getStatusColor(event.status)}
                          color="white"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {event.status}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack>
                          <Text
                            fontSize="sm"
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                          >
                            Start:
                          </Text>
                          <Text fontSize="sm" color={currentColors.textColor}>
                            {new Date(event.startDate).toLocaleDateString()}
                          </Text>
                        </HStack>
                        <HStack>
                          <Text
                            fontSize="sm"
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                          >
                            End:
                          </Text>
                          <Text fontSize="sm" color={currentColors.textColor}>
                            {new Date(event.endDate).toLocaleDateString()}
                          </Text>
                        </HStack>
                        <HStack>
                          <Text
                            fontSize="sm"
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                          >
                            Teams:
                          </Text>
                          <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                            {event.teams.length}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </>
          )}
          <hr />
          <EventCreationGuide colorMode={colorMode} currentColors={currentColors} />
        </VStack>
      </Flex>

      <CreateEventModal isOpen={isOpen} onClose={onClose} onSuccess={refetch} />
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={currentColors.cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={currentColors.textColor}>
              Delete Event
            </AlertDialogHeader>

            <AlertDialogBody color={currentColors.textColor}>
              Are you sure you want to delete this event? This will permanently delete:
              <VStack align="start" mt={2} ml={4} spacing={1}>
                <Text>• All teams and their progress</Text>
                <Text>• All nodes and map data</Text>
                <Text>• All submissions and history</Text>
              </VStack>
              <Text mt={2} fontWeight="bold" color="red.500">
                This action cannot be undone!
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleting}>
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
};

export default TreasureHuntDashboard;
