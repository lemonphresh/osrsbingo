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
  Skeleton,
  SkeletonText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Box,
  Spinner,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import CreateEventModal from '../organisms/TreasureHunt/CreateTreasureEventModal';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import GemTitle from '../atoms/GemTitle';
import { MdOutlineArrowBack, MdMoreVert } from 'react-icons/md';
import Section from '../atoms/Section';
import ExampleTreasure from '../assets/exampletreasure.png';
import { DELETE_TREASURE_EVENT } from '../graphql/mutations';
import { useState, useMemo } from 'react';
import { useRef } from 'react';
import { useToastContext } from '../providers/ToastProvider';
import EventCreationGuide from '../organisms/TreasureHunt/TreasureHuntEventCreationGuide';
import AuthRequiredModal from '../molecules/AuthRequiredModal';
import Map from '../assets/osrsmap.png';
import Objective from '../assets/adventurepath-small.webp';
import Laidee from '../assets/laidee.png';
import HouseTab from '../assets/housetab.png';

const TreasureHuntDashboard = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAuthModalOpen,
    onOpen: onAuthModalOpen,
    onClose: onAuthModalClose,
  } = useDisclosure();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('startDate');

  const { data, loading, refetch } = useQuery(GET_ALL_TREASURE_EVENTS, {
    variables: { userId: user?.id },
    onCompleted: (data) => {
      if (!data.getAllTreasureEvents.some((event) => event.adminIds.includes(user?.id))) {
        showToast('You do not have admin access to any events.', 'warning');
      }
    },
    skip: !user,
  });

  const [deleteEventId, setDeleteEventId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clickedEventId, setClickedEventId] = useState(null);
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
    e.stopPropagation();
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

  const handleCreateEventClick = () => {
    if (!user || !user.id) {
      onAuthModalOpen();
    } else {
      onOpen();
    }
  };

  const handleCreateSuccess = () => {
    showToast('Event created successfully!', 'success');
    refetch();
  };

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#9B84FF', dark: '#6348CC' },
      green: { base: '#43AA8B' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      red: '#FF4B5C',
      hoverBg: '#3d4a5c',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#9B84FF', dark: '#6348CC' },
      green: { base: '#43AA8B' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#171923',
      cardBg: 'white',
      red: '#FF4B5C',
      hoverBg: '#f7fafc',
    },
  };

  const currentColors = colors[colorMode];

  const events = useMemo(() => data?.getAllTreasureEvents || [], [data]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((event) =>
        event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'startDate':
          return new Date(b.startDate) - new Date(a.startDate);
        case 'endDate':
          return new Date(b.endDate) - new Date(a.endDate);
        case 'name':
          return a.eventName.localeCompare(b.eventName);
        case 'teams':
          return b.teams.length - a.teams.length;
        default:
          return 0;
      }
    });

    return sorted;
  }, [events, searchQuery, statusFilter, sortBy]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return currentColors.green.base;
      case 'DRAFT':
        return currentColors.red;
      case 'COMPLETED':
        return currentColors.turquoise.base;
      case 'ARCHIVED':
        return currentColors.purple.base;
      default:
        return currentColors.sapphire.base;
    }
  };

  const handleEventClick = (eventId) => {
    setClickedEventId(eventId);
    // Small delay to show loading state
    setTimeout(() => {
      navigate(`/gielinor-rush/${eventId}`);
    }, 150);
  };

  const renderSkeletonCards = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {[1, 2, 3].map((i) => (
        <Card key={i} bg={currentColors.cardBg}>
          <CardHeader>
            <HStack justify="space-between">
              <Skeleton height="24px" width="150px" />
              <Skeleton height="24px" width="60px" borderRadius="md" />
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <SkeletonText noOfLines={1} />
              <SkeletonText noOfLines={1} />
              <SkeletonText noOfLines={1} />
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );

  const renderEventCard = (event) => (
    <Card
      key={event.eventId}
      cursor="pointer"
      bg={currentColors.cardBg}
      borderWidth="1px"
      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'xl',
        borderColor: currentColors.purple.base,
      }}
      _focus={{
        outline: '2px solid',
        outlineColor: currentColors.purple.base,
        outlineOffset: '2px',
      }}
      transition="all 0.2s ease-in-out"
      onClick={() => handleEventClick(event.eventId)}
      position="relative"
      role="group"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEventClick(event.eventId);
        }
      }}
    >
      {/* Loading overlay when card is clicked */}
      {clickedEventId === event.eventId && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={colorMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          zIndex={10}
        >
          <Spinner size="xl" color={currentColors.purple.base} thickness="4px" />
        </Flex>
      )}

      {/* Menu button (always visible on mobile, hover on desktop) */}
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<MdMoreVert />}
          position="absolute"
          top={2}
          right={2}
          size="sm"
          variant="ghost"
          opacity={isMobile ? 1 : 0}
          _groupHover={{ opacity: 1 }}
          _focus={{ opacity: 1 }}
          transition="opacity 0.2s"
          onClick={(e) => e.stopPropagation()}
          aria-label="Event options"
          zIndex={2}
        />
        <MenuList
          bg={currentColors.cardBg}
          borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
        >
          <MenuItem
            icon={<DeleteIcon />}
            onClick={(e) => handleDeleteClick(e, event.eventId)}
            color="red.500"
            _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'red.50' }}
          >
            Delete Event
          </MenuItem>
        </MenuList>
      </Menu>

      <CardHeader>
        <HStack justify="space-between" pr={8}>
          <Heading size="md" color={currentColors.textColor} noOfLines={1}>
            {event.eventName}
          </Heading>
          <Badge
            bg={getStatusColor(event.status)}
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontWeight="semibold"
          >
            {event.status}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="stretch" spacing={3}>
          <HStack>
            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} minW="45px">
              Start:
            </Text>
            <Text fontSize="sm" color={currentColors.textColor} fontWeight="medium">
              {new Date(event.startDate).toLocaleDateString()}
            </Text>
          </HStack>
          <HStack>
            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} minW="45px">
              End:
            </Text>
            <Text fontSize="sm" color={currentColors.textColor} fontWeight="medium">
              {new Date(event.endDate).toLocaleDateString()}
            </Text>
          </HStack>
          <HStack>
            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} minW="45px">
              Teams:
            </Text>
            <Text fontSize="sm" fontWeight="bold" color={currentColors.purple.base}>
              {event.teams.length}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

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
          flexDirection="row"
          justifyContent="space-between"
          marginBottom="24px"
          width="100%"
        >
          <Tooltip label="Return to home" placement="right">
            <Button
              as={Link}
              to="/"
              leftIcon={<Icon as={MdOutlineArrowBack} />}
              variant="ghost"
              color={currentColors.textColor}
              _hover={{
                bg: currentColors.hoverBg,
                transform: 'translateX(-2px)',
              }}
              _focus={{
                outline: '2px solid',
                outlineColor: currentColors.purple.base,
              }}
              transition="all 0.2s"
              size={isMobile ? 'sm' : 'md'}
            >
              Home
            </Button>
          </Tooltip>
        </Flex>

        <VStack spacing={8} align="stretch">
          {loading ? (
            <>
              <HStack justify="space-between" flexWrap="wrap">
                <Skeleton height="40px" width="300px" />
                <Skeleton height="40px" width="180px" borderRadius="md" />
              </HStack>
              {renderSkeletonCards()}
            </>
          ) : events.length === 0 ? (
            <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
              {/* CTA at the top */}
              <VStack spacing={4}>
                <Button
                  size="lg"
                  leftIcon={<AddIcon />}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{
                    bg: currentColors.purple.light,
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                  }}
                  _active={{
                    bg: currentColors.purple.dark,
                    transform: 'translateY(0)',
                  }}
                  _focus={{
                    outline: '2px solid',
                    outlineColor: currentColors.purple.light,
                    outlineOffset: '2px',
                  }}
                  onClick={handleCreateEventClick}
                  boxShadow="md"
                  transition="all 0.2s"
                >
                  Create Your First Event
                </Button>
              </VStack>

              <Section bg="rgba(0, 200, 200, 0.5)">
                {/* Hero Section */}
                <VStack spacing={4} textAlign="center" py={8}>
                  <GemTitle size="lg" gemColor="yellow">
                    Welcome to Gielinor Rush!
                  </GemTitle>
                  <Text fontSize="lg" color="white" maxW="600px">
                    Create competitive clan events where teams race through OSRS challenges to claim
                    the prize
                  </Text>
                  <Image
                    m="0 auto"
                    alt="Example Gielinor Rush game board showing a map with various challenge nodes and paths between them"
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
                      <Box
                        bg={currentColors.purple.base}
                        color="white"
                        fontWeight="bold"
                        borderRadius="full"
                        w="32px"
                        h="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        1
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          Set Event Parameters
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Choose map size, difficulty, number of teams, and time frame for your
                          event
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Step 2 */}
                    <HStack align="start" spacing={4}>
                      <Box
                        bg={currentColors.purple.base}
                        color="white"
                        fontWeight="bold"
                        borderRadius="full"
                        w="32px"
                        h="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        2
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          Generate Your Map
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          The system creates a unique treasure map with objectives, buffs, and
                          checkpoints
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Step 3 */}
                    <HStack align="start" spacing={4}>
                      <Box
                        bg={currentColors.purple.base}
                        color="white"
                        fontWeight="bold"
                        borderRadius="full"
                        w="32px"
                        h="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        3
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          Teams Compete
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Teams navigate the map, complete objectives, and race to reach the
                          treasure first
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Features Grid */}
              <Heading size="md" color={currentColors.textColor} textAlign="center">
                Key Features
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <Card bg={currentColors.cardBg} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={2}>
                      <Image
                        h="48px"
                        src={Map}
                        alt="OSRS map icon representing customizable adventure paths"
                      />
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={currentColors.textColor}
                        textAlign="center"
                      >
                        Dynamic Maps
                      </Text>
                      <Text
                        fontSize="xs"
                        color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        textAlign="center"
                      >
                        Procedurally generated paths with branching routes
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={currentColors.cardBg} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={2}>
                      <Image
                        h="48px"
                        src={Objective}
                        alt="Quest scroll icon representing diverse OSRS challenges"
                      />
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={currentColors.textColor}
                        textAlign="center"
                      >
                        Varied Objectives
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
                      <Image
                        h="48px"
                        src={Laidee}
                        alt="Gnome character icon representing strategic buff system"
                      />
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
                      <Image
                        h="48px"
                        src={HouseTab}
                        alt="POH teleport tab representing inn checkpoint system"
                      />
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

              <VStack spacing={4} py={4}>
                <Button
                  size="lg"
                  leftIcon={<AddIcon />}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{
                    bg: currentColors.purple.light,
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                  }}
                  _active={{
                    bg: currentColors.purple.dark,
                    transform: 'translateY(0)',
                  }}
                  _focus={{
                    outline: '2px solid',
                    outlineColor: currentColors.purple.light,
                    outlineOffset: '2px',
                  }}
                  onClick={handleCreateEventClick}
                  boxShadow="md"
                  transition="all 0.2s"
                >
                  Create Your First Event
                </Button>
                <Text fontSize="sm" color="gray.400" textAlign="center" maxW="500px">
                  When you generate the event's map on the next step, these settings will dictate
                  the layout and objectives.
                </Text>
              </VStack>
            </VStack>
          ) : (
            <>
              <HStack
                justify="space-between"
                flexWrap="wrap"
                maxW="800px"
                w="100%"
                m="0 auto"
                gap={4}
              >
                <GemTitle size="xl" color={currentColors.textColor} gemColor="yellow">
                  Your Gielinor Rush Events
                </GemTitle>
                <Button
                  leftIcon={<AddIcon />}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{
                    bg: currentColors.purple.light,
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                  }}
                  _active={{
                    bg: currentColors.purple.dark,
                    transform: 'translateY(0)',
                  }}
                  _focus={{
                    outline: '2px solid',
                    outlineColor: currentColors.purple.light,
                    outlineOffset: '2px',
                  }}
                  onClick={handleCreateEventClick}
                  transition="all 0.2s"
                  size={isMobile ? 'sm' : 'md'}
                >
                  Create New Event
                </Button>
              </HStack>

              {/* Search and Filter Controls */}
              <Card bg={theme.colors.teal[500]} borderWidth={1} maxW="800px" w="100%" m="0 auto">
                <CardBody>
                  <VStack spacing={4}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="teal.700" />
                      </InputLeftElement>
                      <Input
                        bg={theme.colors.teal[200]}
                        border={`1px solid ${theme.colors.teal[200]}`}
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        _hover={{
                          borderColor: currentColors.purple.base,
                        }}
                        _focus={{
                          borderColor: currentColors.purple.base,
                          boxShadow: `0 0 0 1px ${currentColors.purple.base}`,
                        }}
                      />
                    </InputGroup>
                    <HStack width="100%" spacing={4} flexWrap="wrap">
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        bg={theme.colors.teal[200]}
                        border={`1px solid ${theme.colors.teal[200]}`}
                        flex={1}
                        minW="150px"
                        _hover={{
                          borderColor: currentColors.purple.base,
                        }}
                        _focus={{
                          borderColor: currentColors.purple.base,
                          boxShadow: `0 0 0 1px ${currentColors.purple.base}`,
                        }}
                      >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                      </Select>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        bg={theme.colors.teal[200]}
                        border={`1px solid ${theme.colors.teal[200]}`}
                        flex={1}
                        minW="150px"
                        _hover={{
                          borderColor: currentColors.purple.base,
                        }}
                        _focus={{
                          borderColor: currentColors.purple.base,
                          boxShadow: `0 0 0 1px ${currentColors.purple.base}`,
                        }}
                      >
                        <option value="startDate">Start Date</option>
                        <option value="endDate">End Date</option>
                        <option value="name">Name</option>
                        <option value="teams">Team Count</option>
                      </Select>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Results count */}
              {(searchQuery || statusFilter !== 'ALL') && (
                <Text textAlign="center" fontSize="sm" color="gray.400">
                  Showing {filteredAndSortedEvents.length} of {events.length} events
                </Text>
              )}

              {/* Events Grid */}
              {filteredAndSortedEvents.length === 0 ? (
                <Card maxW="800px" w="100%" m="0 auto" bg={theme.colors.teal[500]} borderWidth={1}>
                  <CardBody>
                    <VStack spacing={4} py={8}>
                      <Text color={currentColors.textColor} fontSize="lg" fontWeight="medium">
                        No events found
                      </Text>
                      <Text color="gray.200" textAlign="center">
                        Try adjusting your search or filters
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                        }}
                        color={currentColors.textColor}
                      >
                        Clear filters
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ) : (
                <SimpleGrid
                  maxW="800px"
                  w="100%"
                  m="0 auto"
                  columns={{ base: 1, md: 2, lg: 3 }}
                  spacing={6}
                >
                  {filteredAndSortedEvents.map((event) => renderEventCard(event))}
                </SimpleGrid>
              )}
            </>
          )}
          <Box as="hr" borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.300'} my={8} />
          <EventCreationGuide colorMode={colorMode} currentColors={currentColors} />
        </VStack>
      </Flex>

      <CreateEventModal isOpen={isOpen} onClose={onClose} onSuccess={handleCreateSuccess} />

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={onAuthModalClose}
        feature="create Gielinor Rush events"
      />

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
              <Button
                ref={cancelRef}
                onClick={() => setIsDeleteOpen(false)}
                _focus={{
                  outline: '2px solid',
                  outlineColor: currentColors.purple.base,
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={deleting}
                _focus={{
                  outline: '2px solid',
                  outlineColor: 'red.500',
                }}
              >
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
