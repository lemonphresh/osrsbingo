import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Center,
  SimpleGrid,
  Checkbox,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { GET_ALL_BS_EVENTS, DELETE_BS_EVENT } from '../../graphql/bsOperations';
import { BSInfoModal, BSLanding } from '../../organisms/battleship/BSInfoModal';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../providers/AuthProvider';
import { isBattleshipEnabled } from '../../config/featureFlags';
import { useToastContext } from '../../providers/ToastProvider';

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  DRAFT: 'gray',
  PLACEMENT: 'yellow',
  ACTIVE: 'teal',
  COMPLETED: 'gray',
  ARCHIVED: 'gray',
};

const STATUS_LABEL = {
  DRAFT: 'Draft',
  PLACEMENT: 'Placement',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

// ── Sub-components ────────────────────────────────────────────────────────

function TeamColorDot({ color }) {
  const bg = color === 'RED' ? 'red.400' : 'cyan.400';
  return <Box w="8px" h="8px" borderRadius="full" bg={bg} flexShrink={0} />;
}

function EventCard({ event, selectMode, isSelected, onToggle }) {
  const teams = event.teams ?? [];

  return (
    <Box
      bg="#0d2137"
      border="1px solid"
      borderColor={isSelected ? '#0ea5e9' : '#1e4976'}
      borderRadius="md"
      p={5}
      display="flex"
      flexDirection="column"
      gap={3}
      transition="all 0.15s"
      cursor={selectMode ? 'pointer' : 'default'}
      onClick={selectMode ? onToggle : undefined}
      _hover={
        selectMode
          ? { borderColor: '#0ea5e9' }
          : { borderColor: '#0ea5e9', transform: 'translateY(-2px)' }
      }
      position="relative"
    >
      {selectMode && (
        <Box position="absolute" top={3} right={3} onClick={(e) => e.stopPropagation()}>
          <Checkbox
            isChecked={isSelected}
            onChange={onToggle}
            colorScheme="cyan"
            borderColor="#475569"
          />
        </Box>
      )}

      <HStack justify="space-between" align="flex-start" pr={selectMode ? 6 : 0}>
        <Text
          fontWeight="bold"
          fontSize="md"
          color="#e2e8f0"
          letterSpacing="wide"
          textTransform="uppercase"
          noOfLines={2}
          flex={1}
          mr={2}
          fontFamily="mono"
        >
          {event.eventName}
        </Text>
        <Badge
          colorScheme={STATUS_COLOR[event.status] ?? 'gray'}
          fontSize="xs"
          flexShrink={0}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {STATUS_LABEL[event.status] ?? event.status}
        </Badge>
      </HStack>

      {teams.length > 0 && (
        <VStack align="stretch" spacing={1}>
          {teams.map((team) => (
            <HStack key={team.teamId} spacing={2} align="center">
              <TeamColorDot color={team.color} />
              <Text fontFamily="mono" fontSize="xs" color="#94a3b8" noOfLines={1}>
                {team.teamName}
              </Text>
            </HStack>
          ))}
        </VStack>
      )}

      {!selectMode && (
        <Box mt="auto" pt={1}>
          <RouterLink to={`/battleship/${event.eventId}`}>
            <Button
              size="sm"
              colorScheme="cyan"
              variant="outline"
              borderColor="#1e4976"
              color="#38bdf8"
              fontFamily="mono"
              fontSize="xs"
              letterSpacing="wider"
              textTransform="uppercase"
              _hover={{ bg: '#0d2137', borderColor: '#38bdf8' }}
              w="full"
            >
              Enter
            </Button>
          </RouterLink>
        </Box>
      )}
    </Box>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────

export default function BattleshipDashboard() {
  usePageTitle('Battleship');
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ALL_BS_EVENTS, {
    skip: !isBattleshipEnabled(user),
    variables: { creatorId: user?.id },
  });
  const [deleteBSEvent] = useMutation(DELETE_BS_EVENT);

  if (!user || !isBattleshipEnabled(user)) return <BSLanding />;

  const events = data?.getAllBSEvents ?? [];

  const toggleSelect = (eventId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Delete ${selected.size} campaign${selected.size !== 1 ? 's' : ''}? This cannot be undone.`
      )
    )
      return;
    setBulkDeleting(true);
    try {
      for (const eventId of selected) {
        await deleteBSEvent({ variables: { eventId } });
      }
      await refetch();
      showToast(`Deleted ${selected.size} campaign${selected.size !== 1 ? 's' : ''}.`, 'success');
      exitSelectMode();
    } catch (e) {
      showToast(e.message ?? 'Delete failed.', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <BSInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
      <Box flex="1" minH="100vh" bg="#071523">
        {/* Hero Header */}
        <Box
          bg="#071523"
          borderBottom="1px solid"
          borderColor="#1e4976"
          position="relative"
          overflow="hidden"
        >
          {/* Subtle grid overlay */}
          <Box
            position="absolute"
            inset={0}
            opacity={0.04}
            backgroundImage="repeating-linear-gradient(0deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px)"
            pointerEvents="none"
          />

          <Box
            maxW="1200px"
            mx="auto"
            px={[4, 6, 8]}
            py={[12, 16, 20]}
            position="relative"
            zIndex={1}
          >
            <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
              <VStack align="flex-start" spacing={3}>
                <Text
                  fontFamily="mono"
                  fontSize={['3xl', '5xl', '6xl']}
                  fontWeight="bold"
                  color="#e2e8f0"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  lineHeight="1"
                >
                  BATTLESHIP
                </Text>
                <Text
                  fontFamily="mono"
                  fontSize={['xs', 'sm']}
                  color="#94a3b8"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  A strategic OSRS naval warfare event
                </Text>
                <HStack spacing={2} mt={2}>
                  <Box w="32px" h="1px" bg="#0ea5e9" />
                  <Box w="8px" h="1px" bg="#1e4976" />
                  <Box w="4px" h="1px" bg="#1e4976" />
                </HStack>
              </VStack>
              <HStack spacing={2} mt={[0, 2]}>
                <Button
                  size="sm"
                  variant="ghost"
                  color="#94a3b8"
                  fontFamily="mono"
                  fontSize="10px"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  _hover={{ color: '#38bdf8', bg: 'transparent' }}
                  onClick={() => setInfoOpen(true)}
                >
                  How It Works
                </Button>
                {user && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color={selectMode ? '#38bdf8' : '#94a3b8'}
                    fontFamily="mono"
                    fontSize="10px"
                    _hover={{ color: '#38bdf8', bg: 'transparent' }}
                    onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
                    title="Manage campaigns"
                  >
                    <SettingsIcon />
                  </Button>
                )}
                <RouterLink to="/battleship/create">
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="cyan"
                    borderColor="#1e4976"
                    color="#38bdf8"
                    fontFamily="mono"
                    fontSize="10px"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    _hover={{ bg: '#0d2137', borderColor: '#38bdf8' }}
                  >
                    New Campaign
                  </Button>
                </RouterLink>
              </HStack>
            </HStack>
          </Box>
        </Box>

        {/* Events section */}
        <Box maxW="1200px" mx="auto" px={[4, 6, 8]} py={[8, 10, 12]}>
          {loading && (
            <Center py={20}>
              <Spinner
                size="xl"
                color="cyan.500"
                thickness="3px"
                speed="0.8s"
                emptyColor="#1e4976"
              />
            </Center>
          )}

          {error && (
            <Center py={20}>
              <Text fontFamily="mono" fontSize="sm" color="red.400" letterSpacing="wide">
                FAILED TO LOAD / CHECK CONNECTION
              </Text>
            </Center>
          )}

          {!loading && !error && events.length === 0 && (
            <Center py={20}>
              <VStack spacing={4} align="center">
                <Box
                  w="60px"
                  h="60px"
                  border="1px solid"
                  borderColor="#1e4976"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box w="24px" h="24px" border="2px solid" borderColor="#0ea5e9" opacity={0.4} />
                </Box>
                <Text
                  fontFamily="mono"
                  fontSize="sm"
                  color="#94a3b8"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  textAlign="center"
                >
                  You haven't created any campaigns yet.
                </Text>
              </VStack>
            </Center>
          )}

          {!loading && !error && events.length > 0 && (
            <VStack align="stretch" spacing={6}>
              <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <Text
                  fontFamily="mono"
                  fontSize="xs"
                  color="#94a3b8"
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  {selectMode
                    ? `${selected.size} selected`
                    : `My Campaigns / ${events.length} found`}
                </Text>
                {selectMode && (
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="#94a3b8"
                      fontFamily="mono"
                      fontSize="10px"
                      letterSpacing="widest"
                      textTransform="uppercase"
                      _hover={{ color: '#e2e8f0', bg: 'transparent' }}
                      onClick={exitSelectMode}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="red"
                      fontFamily="mono"
                      fontSize="10px"
                      letterSpacing="widest"
                      textTransform="uppercase"
                      isDisabled={selected.size === 0}
                      isLoading={bulkDeleting}
                      loadingText="Deleting..."
                      onClick={handleBulkDelete}
                    >
                      Delete {selected.size > 0 ? `(${selected.size})` : ''}
                    </Button>
                  </HStack>
                )}
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {events.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    selectMode={selectMode}
                    isSelected={selected.has(event.eventId)}
                    onToggle={() => toggleSelect(event.eventId)}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </Box>
      </Box>
    </>
  );
}
