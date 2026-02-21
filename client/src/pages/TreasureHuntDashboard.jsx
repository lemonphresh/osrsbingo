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
  Image,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  Collapse,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  AddIcon,
  DeleteIcon,
  SearchIcon,
  QuestionIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import CreateEventModal from '../organisms/TreasureHunt/CreateTreasureEventModal';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import GemTitle from '../atoms/GemTitle';
import { MdMoreVert } from 'react-icons/md';
import ExampleGR from '../assets/exampleGR2.png';
import { DELETE_TREASURE_EVENT } from '../graphql/mutations';
import { useState, useMemo, useRef } from 'react';
import { useToastContext } from '../providers/ToastProvider';
import EventCreationGuide from '../organisms/TreasureHunt/TreasureHuntEventCreationGuide';
import AuthRequiredModal from '../molecules/AuthRequiredModal';
import EternalGem from '../assets/gemoji.png';
import { formatDisplayDate } from '../utils/dateUtils';
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled } from '../config/featureFlags';
import TreasureHuntSummary from '../molecules/TreasureHunt/TreasureHuntSummary';

const colors = {
  dark: {
    purple: { base: '#7D5FFF', light: '#9B84FF', dark: '#6348CC' },
    green: { base: '#43AA8B' },
    sapphire: { base: '#19647E' },
    turquoise: { base: '#28AFB0' },
    textColor: '#F7FAFC',
    cardBg: '#2D3748',
    red: '#FF4B5C',
  },
  light: {
    purple: { base: '#7D5FFF', light: '#9B84FF', dark: '#6348CC' },
    green: { base: '#43AA8B' },
    sapphire: { base: '#19647E' },
    turquoise: { base: '#28AFB0' },
    textColor: '#171923',
    cardBg: 'white',
    red: '#FF4B5C',
  },
};

const HOW_IT_WORKS = [
  { label: 'Set Parameters', desc: 'Choose map size, difficulty, teams, content, and time frame.' },
  {
    label: 'Generate Map',
    desc: 'A unique map is created with objectives, buffs, and checkpoints.',
  },
  {
    label: 'Teams Compete',
    desc: 'Teams navigate the map, complete objectives, and race to the treasure.',
  },
];

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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('startDate');
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clickedEventId, setClickedEventId] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const cancelRef = useRef();
  const { showToast } = useToastContext();

  const { data, loading, refetch } = useQuery(GET_ALL_TREASURE_EVENTS, {
    variables: { userId: user?.id },
    skip: !user,
  });

  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_TREASURE_EVENT, {
    onCompleted: () => {
      showToast('Event deleted successfully', 'success');
      refetch();
      setIsDeleteOpen(false);
      setDeleteEventId(null);
    },
    onError: (err) => showToast(`Error deleting event: ${err.message}`, 'error'),
  });

  const c = colors[colorMode];

  const events = useMemo(() => data?.getAllTreasureEvents || [], [data]);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;
    if (searchQuery)
      filtered = filtered.filter((e) =>
        e.eventName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (statusFilter !== 'ALL') filtered = filtered.filter((e) => e.status === statusFilter);
    return [...filtered].sort((a, b) => {
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
  }, [events, searchQuery, statusFilter, sortBy]);

  const getStatusColor = (status) =>
    ({
      ACTIVE: c.green.base,
      DRAFT: c.red,
      COMPLETED: c.turquoise.base,
      ARCHIVED: c.purple.base,
    }[status] ?? c.sapphire.base);

  const handleCreateEventClick = () => {
    if (!isGielinorRushEnabled()) return;
    if (!user?.id) onAuthModalOpen();
    else onOpen();
  };

  const handleCreateSuccess = () => {
    showToast('Event created successfully!', 'success');
    refetch();
  };
  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteEventId(id);
    setIsDeleteOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (deleteEventId) await deleteEvent({ variables: { eventId: deleteEventId } });
  };
  const handleEventClick = (id) => {
    setClickedEventId(id);
    setTimeout(() => navigate(`/gielinor-rush/${id}`), 150);
  };

  usePageTitle('Gielinor Rush Dashboard');

  // ── Skeletons ──
  if (loading)
    return (
      <Flex flex="1" flexDirection="column" px={['16px', '24px', '64px']} py="72px">
        <HStack justify="space-between" mb={6}>
          <Skeleton height="40px" width="300px" />
          <Skeleton height="40px" width="180px" borderRadius="md" />
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[1, 2, 3].map((i) => (
            <Card key={i} bg={c.cardBg}>
              <CardHeader>
                <Skeleton height="24px" width="150px" />
              </CardHeader>
              <CardBody>
                <VStack spacing={3}>
                  <SkeletonText noOfLines={3} w="100%" />
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Flex>
    );

  // ── Feature disabled ──
  if (!isGielinorRushEnabled())
    return (
      <Flex flex="1" flexDirection="column" px={['16px', '24px', '64px']} py="72px">
        <TreasureHuntSummary />
      </Flex>
    );

  const renderEventCard = (event) => (
    <Card
      key={event.eventId}
      cursor="pointer"
      bg={c.cardBg}
      borderWidth="1px"
      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
      _hover={{ transform: 'translateY(-4px)', shadow: 'xl', borderColor: c.purple.base }}
      _focus={{ outline: '2px solid', outlineColor: c.purple.base, outlineOffset: '2px' }}
      transition="all 0.2s ease-in-out"
      onClick={() => handleEventClick(event.eventId)}
      position="relative"
      overflow="hidden"
      role="group"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEventClick(event.eventId);
        }
      }}
    >
      <Image
        src={EternalGem}
        alt=""
        aria-hidden
        position="absolute"
        right="-15px"
        top="15px"
        width="100px"
        height="100px"
        opacity={0.25}
        pointerEvents="none"
      />
      {clickedEventId === event.eventId && (
        <Flex
          position="absolute"
          inset={0}
          bg={colorMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          zIndex={10}
        >
          <Spinner size="xl" color={c.purple.base} thickness="4px" />
        </Flex>
      )}
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
        <MenuList bg={c.cardBg} borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}>
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
      <CardHeader pb={2}>
        <Heading size="md" color={c.textColor} noOfLines={2} pr={8} mb={2}>
          {event.eventName}
        </Heading>
      </CardHeader>
      <CardBody pt={0} display="flex" flexDirection="column" flex="1">
        <VStack align="stretch" spacing={2} flex="1">
          {[
            ['Start', formatDisplayDate(event.startDate)],
            ['End', formatDisplayDate(event.endDate)],
          ].map(([label, val]) => (
            <HStack key={label}>
              <Text
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                minW="45px"
              >
                {label}:
              </Text>
              <Text fontSize="sm" color={c.textColor} fontWeight="medium">
                {val}
              </Text>
            </HStack>
          ))}
          <Box flex="1" />
          <HStack justify="space-between" align="center">
            <HStack>
              <Text
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                minW="45px"
              >
                Teams:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color={c.purple.base}>
                {event.teams.length}
              </Text>
            </HStack>
            <Badge
              bg={getStatusColor(event.status)}
              color="white"
              px={2}
              py={1}
              borderRadius="md"
              fontWeight="semibold"
              textTransform="uppercase"
              fontSize="xs"
            >
              {event.status}
            </Badge>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // ── Empty / onboarding state ──
  if (events.length === 0)
    return (
      <Flex
        flex="1"
        flexDirection="column"
        alignItems="center"
        px={['16px', '24px', '64px']}
        pt="64px"
        pb="48px"
      >
        <VStack spacing={6} maxW="640px" w="100%" textAlign="center">
          <GemTitle gemColor="purple">Gielinor Rush</GemTitle>
          <Text color="gray.300" fontSize="md">
            Create competitive clan events where teams race through OSRS challenges to claim the
            prize.
          </Text>

          <Box
            w="100%"
            borderRadius="10px"
            overflow="hidden"
            boxShadow="0 20px 60px rgba(0,0,0,0.5)"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
          >
            {/* Browser chrome bar */}
            <HStack px={3} py={2} bg="gray.800" spacing={2} flexShrink={0}>
              <Box w="10px" h="10px" borderRadius="full" bg="red.400" />
              <Box w="10px" h="10px" borderRadius="full" bg="yellow.400" />
              <Box w="10px" h="10px" borderRadius="full" bg="green.400" />
              <Box flex={1} bg="gray.700" borderRadius="4px" h="18px" mx={2} />
            </HStack>
            {/* Screenshot — scrollable so the full tall image is accessible */}
            <Box
              maxH="320px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                },
              }}
            >
              <Image
                src={ExampleGR}
                alt="Example Gielinor Rush event page"
                w="100%"
                display="block"
                loading="lazy"
              />
            </Box>
          </Box>

          {/* How it works — compact steps inline */}
          <SimpleGrid columns={3} spacing={3} w="100%">
            {HOW_IT_WORKS.map(({ label, desc }, i) => (
              <Box key={label} bg={c.cardBg} borderRadius="8px" p={3} textAlign="center">
                <Box
                  bg={c.purple.base}
                  color="white"
                  borderRadius="full"
                  w="26px"
                  h="26px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  fontWeight="bold"
                  mx="auto"
                  mb={2}
                >
                  {i + 1}
                </Box>
                <Text fontSize="xs" fontWeight="bold" color={c.textColor} mb={1}>
                  {label}
                </Text>
                <Text
                  fontSize="xs"
                  color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                  lineHeight="1.5"
                >
                  {desc}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          <Button
            size="lg"
            leftIcon={<AddIcon />}
            bg={c.purple.base}
            color="white"
            w="100%"
            _hover={{ bg: c.purple.light, transform: 'translateY(-2px)', shadow: 'lg' }}
            _active={{ bg: c.purple.dark }}
            onClick={handleCreateEventClick}
            transition="all 0.2s"
          >
            Create Your First Event
          </Button>

          {/* Collapsible guide */}
          <Box
            w="100%"
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            borderRadius="8px"
            overflow="hidden"
          >
            <HStack
              px={4}
              py={3}
              cursor="pointer"
              justify="space-between"
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
              onClick={() => setGuideOpen((o) => !o)}
              _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.100' }}
            >
              <Text fontSize="sm" fontWeight="semibold" color={c.textColor}>
                📋 Detailed Setup Guide
              </Text>
              {guideOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </HStack>
            <Collapse in={guideOpen} animateOpacity>
              <Box p={4}>
                <EventCreationGuide colorMode={colorMode} currentColors={c} />
              </Box>
            </Collapse>
          </Box>
        </VStack>

        <CreateEventModal isOpen={isOpen} onClose={onClose} onSuccess={handleCreateSuccess} />
        <AuthRequiredModal
          isOpen={isAuthModalOpen}
          onClose={onAuthModalClose}
          feature="create Gielinor Rush events"
        />
      </Flex>
    );

  // ── Has events state ──
  return (
    <Flex flex="1" flexDirection="column" px={['16px', '24px', '64px']} pt="64px" pb="48px">
      <Flex maxW="900px" w="100%" mx="auto" flexDirection="column" gap={5}>
        {/* Header row */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <GemTitle size="xl" gemColor="yellow">
            Your Events
          </GemTitle>
          <HStack>
            <Tooltip label="Setup guide" hasArrow>
              <IconButton
                icon={<QuestionIcon />}
                size="sm"
                variant="solid"
                aria-label="Toggle setup guide"
                onClick={() => setGuideOpen((o) => !o)}
              />
            </Tooltip>
            <Button
              leftIcon={<AddIcon />}
              bg={c.purple.base}
              color="white"
              size={isMobile ? 'sm' : 'md'}
              _hover={{ bg: c.purple.light, transform: 'translateY(-2px)', shadow: 'lg' }}
              _active={{ bg: c.purple.dark }}
              onClick={handleCreateEventClick}
              transition="all 0.2s"
            >
              New Event
            </Button>
          </HStack>
        </HStack>

        {/* Collapsible guide */}
        <Collapse in={guideOpen} animateOpacity>
          <Box
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            borderRadius="8px"
            p={4}
          >
            <EventCreationGuide colorMode={colorMode} currentColors={c} />
          </Box>
        </Collapse>

        {/* Inline filter bar */}
        <HStack spacing={3} flexWrap="wrap">
          <InputGroup flex={2} minW="180px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={c.cardBg}
              borderColor="gray.600"
              _focus={{ borderColor: c.purple.base, boxShadow: `0 0 0 1px ${c.purple.base}` }}
            />
          </InputGroup>
          <Select
            flex={1}
            minW="130px"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            bg={c.cardBg}
            borderColor="gray.600"
            color="gray.600"
            _focus={{ borderColor: c.purple.base, boxShadow: `0 0 0 1px ${c.purple.base}` }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select
            flex={1}
            minW="130px"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            bg={c.cardBg}
            color="gray.600"
            borderColor="gray.600"
            _focus={{ borderColor: c.purple.base, boxShadow: `0 0 0 1px ${c.purple.base}` }}
          >
            <option value="name">Sort: Name</option>
            <option value="startDate">Sort: Start Date</option>
            <option value="endDate">Sort: End Date</option>
            <option value="teams">Sort: Teams</option>
          </Select>
        </HStack>

        {(searchQuery || statusFilter !== 'ALL') && (
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.400">
              Showing {filteredAndSortedEvents.length} of {events.length} events
            </Text>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Clear filters
            </Button>
          </HStack>
        )}

        {/* Events grid */}
        {filteredAndSortedEvents.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color={c.textColor} fontSize="lg" fontWeight="medium" mb={2}>
              No events found
            </Text>
            <Text color="gray.400" fontSize="sm">
              Try adjusting your search or filters
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredAndSortedEvents.map(renderEventCard)}
          </SimpleGrid>
        )}
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
          <AlertDialogContent bg={c.cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={c.textColor}>
              Delete Event
            </AlertDialogHeader>
            <AlertDialogBody color={c.textColor}>
              Are you sure? This will permanently delete all teams, progress, nodes, and submission
              history.
              <Text mt={2} fontWeight="bold" color="red.500">
                This cannot be undone.
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
