import {
  Flex,
  Button,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  useDisclosure,
  useColorMode,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Skeleton,
  SkeletonText,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Box,
  Collapse,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import { AddIcon, QuestionIcon, SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import CreateEventModal from '../organisms/TreasureHunt/CreateTreasureEventModal';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import GemTitle from '../atoms/GemTitle';
import { DELETE_TREASURE_EVENT } from '../graphql/mutations';
import { useState, useMemo, useRef } from 'react';
import { useToastContext } from '../providers/ToastProvider';
import AuthRequiredModal from '../molecules/AuthRequiredModal';
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled } from '../config/featureFlags';
import TreasureHuntSummary from '../molecules/TreasureHunt/TreasureHuntSummary';
import EventCreationGuide from '../organisms/TreasureHunt/TreasureHuntEventCreationGuide';
import EventCard from '../organisms/TreasureHunt/EventCard';
import DashboardEmptyState from '../organisms/TreasureHunt/DashboardEmptyState';

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

  const handleCreateEventClick = () => {
    if (!isGielinorRushEnabled(user)) return;
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
  if (!isGielinorRushEnabled(user))
    return (
      <Flex flex="1" flexDirection="column" px={['16px', '24px', '64px']} py="72px">
        <TreasureHuntSummary />
      </Flex>
    );

  // ── Empty / onboarding state ──
  if (events.length === 0)
    return (
      <DashboardEmptyState
        c={c}
        colorMode={colorMode}
        user={user}
        navigate={navigate}
        guideOpen={guideOpen}
        onGuideToggle={() => setGuideOpen((o) => !o)}
        onCreateEventClick={handleCreateEventClick}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleCreateSuccess}
        isAuthModalOpen={isAuthModalOpen}
        onAuthModalClose={onAuthModalClose}
      />
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
            {isGielinorRushEnabled(user) && (
              <Box
                as="button"
                onClick={() => navigate('/gielinor-rush/active')}
                position="relative"
                overflow="hidden"
                px={4}
                py={2}
                borderRadius="lg"
                bgGradient="linear(to-r, green.800, teal.800)"
                border="1px solid"
                borderColor="green.600"
                _hover={{
                  bgGradient: 'linear(to-r, green.700, teal.700)',
                  transform: 'translateY(-1px)',
                  shadow: '0 4px 16px rgba(67,170,139,0.3)',
                  borderColor: 'green.400',
                }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
              >
                <HStack spacing={2}>
                  <Box
                    w="7px"
                    h="7px"
                    borderRadius="full"
                    bg={c.green.base}
                    boxShadow={`0 0 6px ${c.green.base}, 0 0 12px ${c.green.base}55`}
                    flexShrink={0}
                    sx={{
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.6, transform: 'scale(0.85)' },
                      },
                    }}
                  />
                  <Text color="green.100" fontSize="sm" fontWeight="semibold">
                    Spectate live events
                  </Text>
                  <Text color="green.400" fontSize="sm">
                    →
                  </Text>
                </HStack>
              </Box>
            )}
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
            </Button>{' '}
            <Tooltip label="Setup guide" hasArrow>
              <IconButton
                icon={<QuestionIcon />}
                size="sm"
                variant="solid"
                aria-label="Toggle setup guide"
                onClick={() => setGuideOpen((o) => !o)}
              />
            </Tooltip>
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
            <option value="PUBLIC">Public</option>
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
            {filteredAndSortedEvents.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                clickedEventId={clickedEventId}
                colorMode={colorMode}
                c={c}
                isMobile={isMobile}
                onDeleteClick={handleDeleteClick}
                onEventClick={handleEventClick}
              />
            ))}
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
            <AlertDialogHeader fontSize="lg" fontWeight="semibold" color={c.textColor}>
              Delete Event
            </AlertDialogHeader>
            <AlertDialogBody color={c.textColor}>
              Are you sure? This will permanently delete all teams, progress, nodes, and submission
              history.
              <Text mt={2} fontWeight="semibold" color="red.500">
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
