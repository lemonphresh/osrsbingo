import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Link as RouterLink, useParams } from 'react-router-dom';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  HStack,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { FaClipboardList, FaHistory, FaShieldAlt, FaUsers } from 'react-icons/fa';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import {
  ADD_BS_REF,
  ADD_BS_SKIP_TOKENS,
  GET_BS_EVENT_FULL,
  GET_BS_SHOT_LOG,
  REMOVE_BS_REF,
  UPDATE_BS_TEAM_MEMBERS,
} from '../../graphql/bsOperations';
import { SEARCH_USERS } from '../../graphql/queries';

const GREEN = '#4ade80';
const DIM = '#6b9e78';
const BG = '#060f0a';
const CARD_BG = '#091a10';
const BORDER = '#1a4028';

const COL_LABELS = ['A','B','C','D','E','F','G','H','I','J'];
function coordLabel(row, col) {
  return `${COL_LABELS[col] ?? col}${row + 1}`;
}

function fmtDateTime(iso) {
  if (!iso) return '?';
  const d = new Date(iso);
  const day = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}

function StatBox({ label, value }) {
  return (
    <Box px={3} py={2} bg={BG} borderRadius="md" border="1px solid" borderColor={BORDER} minW="80px" textAlign="center">
      <Text fontSize="lg" fontWeight="bold" color={GREEN} fontFamily="mono">{value}</Text>
      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">{label}</Text>
    </Box>
  );
}

const isValidDiscordId = (id) => /^\d{17,19}$/.test(id);

function TeamSection({ team, allTeams, refetchEvent, showToast }) {
  const [memberIds, setMemberIds] = useState(team.members ?? []);
  const [saving, setSaving] = useState(false);
  const [addingTokens, setAddingTokens] = useState(false);

  const [doUpdateMembers] = useMutation(UPDATE_BS_TEAM_MEMBERS);
  const [doAddSkipTokens] = useMutation(ADD_BS_SKIP_TOKENS);

  useEffect(() => {
    setMemberIds(team.members ?? []);
  }, [team.members]);

  // Build a map of Discord ID -> team name for members on the OTHER team
  const otherTeamMemberMap = useMemo(() => {
    const map = new Map();
    for (const t of allTeams) {
      if (t.teamId === team.teamId) continue;
      for (const id of t.members ?? []) {
        map.set(id, t.teamName);
      }
    }
    return map;
  }, [allTeams, team.teamId]);

  const handleAddMember = () => setMemberIds((prev) => [...prev, '']);
  const handleRemoveMember = (i) => setMemberIds((prev) => prev.filter((_, idx) => idx !== i));
  const handleMemberChange = (i, val) =>
    setMemberIds((prev) => prev.map((m, idx) => (idx === i ? val : m)));

  const handleSave = async () => {
    setSaving(true);
    try {
      const members = memberIds.filter((m) => isValidDiscordId(m));
      const unique = [...new Set(members)];
      await doUpdateMembers({ variables: { teamId: team.teamId, members: unique } });
      showToast('Members updated', 'success');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to update members', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTokens = async (count) => {
    setAddingTokens(true);
    try {
      await doAddSkipTokens({ variables: { teamId: team.teamId, count } });
      showToast(`Added ${count} skip token${count !== 1 ? 's' : ''}`, 'success');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to add skip tokens', 'error');
    } finally {
      setAddingTokens(false);
    }
  };

  const tiles = team.board?.tiles ?? [];
  const shipHits = tiles.filter((t) => t.isShot && t.shipType).length;
  const oceanHits = tiles.filter((t) => t.isShot && !t.shipType).length;
  const tasksCompleted = tiles.filter((t) => t.taskCompleted).length;
  const tasksSkipped = tiles.filter((t) => t.skipped).length;

  return (
    <Box bg={CARD_BG} border="1px solid" borderColor={BORDER} borderRadius="lg" p={4}>
      <HStack spacing={2} mb={4}>
        <Box w={3} h={3} borderRadius="full" bg={team.color === 'RED' ? '#fc8181' : '#76e4f7'} flexShrink={0} />
        <Text fontWeight="bold" color="#d4f0da" fontFamily="mono" fontSize="md" letterSpacing="wide">
          {team.teamName}
        </Text>
        <Badge colorScheme={team.color === 'RED' ? 'red' : 'cyan'} fontSize="xs">{team.color}</Badge>
      </HStack>

      <VStack align="stretch" spacing={5}>
        {/* Members */}
        <Box>
          <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={3}>
            Members ({memberIds.filter(isValidDiscordId).length})
          </Text>
          <VStack align="stretch" spacing={3}>
            {memberIds.map((id, i) => (
              <DiscordMemberInput
                key={i}
                value={id}
                onChange={(val) => handleMemberChange(i, val)}
                onRemove={() => handleRemoveMember(i)}
                showRemove
                colorMode="dark"
                conflictTeam={isValidDiscordId(id) ? (otherTeamMemberMap.get(id) ?? null) : null}
                isDuplicateInForm={
                  isValidDiscordId(id) && memberIds.some((m, idx) => idx !== i && m === id)
                }
              />
            ))}
            <Button
              leftIcon={<AddIcon />}
              size="sm"
              variant="outline"
              onClick={handleAddMember}
              color={DIM}
              borderColor={BORDER}
              _hover={{ borderColor: GREEN, color: GREEN }}
              alignSelf="flex-start"
            >
              Add Member
            </Button>
          </VStack>
          <Button
            mt={3}
            size="sm"
            colorScheme="green"
            variant="outline"
            isLoading={saving}
            onClick={handleSave}
          >
            Save Members
          </Button>
        </Box>

        {/* Skip Tokens */}
        <Box>
          <HStack spacing={3} align="center" mb={2}>
            <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider" fontWeight="semibold">
              Skip Tokens
            </Text>
            <Text fontWeight="bold" color={GREEN} fontFamily="mono">{team.skipTokens ?? 0}</Text>
          </HStack>
          <HStack spacing={2}>
            {[1, 3, 5].map((n) => (
              <Button
                key={n}
                size="xs"
                colorScheme="green"
                variant="outline"
                isLoading={addingTokens}
                isDisabled={addingTokens}
                onClick={() => handleAddTokens(n)}
              >
                +{n}
              </Button>
            ))}
          </HStack>
        </Box>

        {/* Board Stats */}
        {tiles.length > 0 && (
          <Box>
            <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={3}>
              Board Stats
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              <StatBox label="Ship Hits" value={shipHits} />
              <StatBox label="Ocean Hits" value={oceanHits} />
              <StatBox label="Completed" value={tasksCompleted} />
              <StatBox label="Skipped" value={tasksSkipped} />
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

function RefsSection({ event, eventId, refetchEvent, showToast }) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const debounceRef = useRef(null);

  const [doSearch] = useLazyQuery(SEARCH_USERS, { fetchPolicy: 'network-only' });
  const [doAddRef] = useMutation(ADD_BS_REF);
  const [doRemoveRef] = useMutation(REMOVE_BS_REF);

  const currentRefIds = useMemo(() => new Set(event?.refIds ?? []), [event]);
  const refs = event?.refs ?? [];

  const handleSearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchInput(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!val.trim()) {
        setSearchResults([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await doSearch({ variables: { search: val.trim() } });
          setSearchResults(data?.searchUsers ?? []);
        } catch {
          setSearchResults([]);
        }
      }, 300);
    },
    [doSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAddRef = async (userId) => {
    setAddingId(userId);
    try {
      await doAddRef({ variables: { eventId, userId } });
      showToast('Ref added', 'success');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to add ref', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveRef = async (userId) => {
    setRemovingId(userId);
    try {
      await doRemoveRef({ variables: { eventId, userId } });
      showToast('Ref removed', 'info');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to remove ref', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredResults = searchResults.filter((u) => !currentRefIds.has(String(u.id)));

  return (
    <VStack align="stretch" spacing={4}>
      {refs.length === 0 && (
        <Text fontSize="sm" color={DIM} fontFamily="mono">No refs assigned yet.</Text>
      )}

      {refs.length > 0 && (
        <VStack align="stretch" spacing={2}>
          {refs.map((ref) => (
            <HStack
              key={ref.id}
              justify="space-between"
              bg={BG}
              border="1px solid"
              borderColor={BORDER}
              borderRadius="md"
              px={3}
              py={2}
            >
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" color="#d4f0da" fontWeight="semibold">{ref.displayName}</Text>
                <Text fontSize="xs" color={DIM} fontFamily="mono">@{ref.username}</Text>
              </VStack>
              <Button
                size="xs"
                colorScheme="red"
                variant="outline"
                isLoading={removingId === String(ref.id)}
                isDisabled={!!removingId}
                onClick={() => handleRemoveRef(String(ref.id))}
              >
                Remove
              </Button>
            </HStack>
          ))}
        </VStack>
      )}

      <Divider borderColor={BORDER} />

      <Box>
        <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb={2}>
          Add Ref
        </Text>
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by name or username..."
          bg={BG}
          borderColor={BORDER}
          color="#d4f0da"
          fontFamily="mono"
          fontSize="sm"
          _focus={{ borderColor: GREEN, boxShadow: 'none' }}
          _hover={{ borderColor: DIM }}
          _placeholder={{ color: DIM }}
        />

        {filteredResults.length > 0 && (
          <VStack align="stretch" spacing={1} mt={2}>
            {filteredResults.map((u) => (
              <HStack
                key={u.id}
                justify="space-between"
                bg={BG}
                border="1px solid"
                borderColor={BORDER}
                borderRadius="md"
                px={3}
                py={2}
              >
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="sm" color="#d4f0da">{u.displayName}</Text>
                  <Text fontSize="xs" color={DIM} fontFamily="mono">@{u.username}</Text>
                </VStack>
                <Button
                  size="xs"
                  colorScheme="green"
                  isLoading={addingId === String(u.id)}
                  isDisabled={!!addingId}
                  onClick={() => handleAddRef(String(u.id))}
                >
                  Add as Ref
                </Button>
              </HStack>
            ))}
          </VStack>
        )}

        {searchInput.trim() && filteredResults.length === 0 && searchResults.length > 0 && (
          <Text fontSize="xs" color={DIM} mt={2} fontFamily="mono">
            All matching users are already refs.
          </Text>
        )}
      </Box>
    </VStack>
  );
}

export default function BattleshipAdminPage() {
  const { eventId } = useParams();
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const { showToast } = useToastContext();

  const { data: eventData, loading: eventLoading, refetch: refetchEvent } = useQuery(GET_BS_EVENT_FULL, {
    variables: { eventId },
    skip: !isAuthenticated || !eventId,
    fetchPolicy: 'cache-and-network',
  });

  const { data: shotLogData } = useQuery(GET_BS_SHOT_LOG, {
    variables: { eventId },
    skip: !isAuthenticated || !eventId,
    fetchPolicy: 'cache-and-network',
  });

  const event = eventData?.getBSEvent;
  const teams = event?.teams ?? [];
  const shotLog = shotLogData?.getBSShotLog ?? [];

  const isAdmin = useMemo(() => {
    if (!event || !user) return false;
    if (user.admin) return true;
    const uid = String(user.id);
    return event.creatorId === uid || (event.adminIds ?? []).includes(uid);
  }, [event, user]);

  if (isCheckingAuth || eventLoading) {
    return (
      <Center h="60vh" bg={BG}>
        <Spinner size="xl" color={GREEN} />
      </Center>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isAdmin && event) {
    return (
      <Center h="60vh" bg={BG}>
        <VStack spacing={3}>
          <Text fontSize="xl" color={DIM} fontFamily="mono">ACCESS DENIED</Text>
          <Text color={DIM} fontSize="sm">Admin access required.</Text>
          <Button as={RouterLink} to={`/battleship/${eventId}`} size="sm" colorScheme="green" variant="ghost">
            Back to Event
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={BG} color="#d4f0da" pt="56px" pb={8} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" spacing={6} maxW="900px" mx="auto">

        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg" color={GREEN} fontFamily="mono" letterSpacing="tight">
              BATTLESHIP / ADMIN
            </Heading>
            {event && (
              <Text color={DIM} fontSize="sm" fontFamily="mono">{event.eventName}</Text>
            )}
          </VStack>

          <HStack spacing={3} flexWrap="wrap">
            <Button
              as={RouterLink}
              to={`/battleship/${eventId}`}
              size="sm"
              variant="ghost"
              color={DIM}
              _hover={{ color: GREEN }}
            >
              &larr; Event Page
            </Button>
            <Button
              as={RouterLink}
              to={`/battleship/${eventId}/refs`}
              size="sm"
              variant="outline"
              borderColor={BORDER}
              color={DIM}
              _hover={{ borderColor: GREEN, color: GREEN }}
            >
              &rarr; Refs Page
            </Button>
          </HStack>
        </HStack>

        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>

          {/* Section 1: Event Overview */}
          <AccordionItem border="1px solid" borderColor={BORDER} borderRadius="lg" mb={3} overflow="hidden">
            <AccordionButton px={4} py={3} bg={CARD_BG} _hover={{ bg: '#0e2418' }} _expanded={{ bg: CARD_BG }}>
              <HStack flex={1} spacing={2}>
                <FaClipboardList color={DIM} />
                <Text fontWeight="semibold" color="#d4f0da" fontFamily="mono" letterSpacing="wide" fontSize="sm">
                  EVENT OVERVIEW
                </Text>
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>

            <AccordionPanel px={4} py={4} bg={BG}>
              {event && (
                <VStack align="stretch" spacing={4}>
                  <HStack flexWrap="wrap" spacing={4} align="flex-start">
                    <VStack align="flex-start" spacing={1} flex={1} minW="160px">
                      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Event Name</Text>
                      <Text color="#d4f0da" fontFamily="mono" fontWeight="semibold">{event.eventName}</Text>
                    </VStack>
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Status</Text>
                      <Badge
                        colorScheme={
                          event.status === 'ACTIVE' ? 'green' :
                          event.status === 'PLACEMENT' ? 'cyan' :
                          event.status === 'COMPLETED' ? 'gray' : 'yellow'
                        }
                        fontFamily="mono"
                        fontSize="xs"
                      >
                        {event.status}
                      </Badge>
                    </VStack>
                  </HStack>

                  <HStack flexWrap="wrap" spacing={4}>
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Cooldown</Text>
                      <Text color="#d4f0da" fontFamily="mono">{event.cooldownMinutes ?? 0} min</Text>
                    </VStack>
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Initial Skip Tokens</Text>
                      <Text color="#d4f0da" fontFamily="mono">{event.initialSkipTokens ?? 0}</Text>
                    </VStack>
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Placement Hours</Text>
                      <Text color="#d4f0da" fontFamily="mono">{event.placementPhaseHours ?? 0}</Text>
                    </VStack>
                  </HStack>

                  {event.eventPassword && (
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Event Password</Text>
                      <Box
                        bg={CARD_BG}
                        border="1px solid"
                        borderColor={BORDER}
                        borderRadius="md"
                        px={3}
                        py={2}
                        fontFamily="mono"
                        fontSize="sm"
                        color={GREEN}
                        letterSpacing="wider"
                      >
                        {event.eventPassword}
                      </Box>
                    </VStack>
                  )}

                  <HStack flexWrap="wrap" spacing={4}>
                    {event.placementStartsAt && (
                      <VStack align="flex-start" spacing={1}>
                        <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Placement Starts</Text>
                        <Text color="#d4f0da" fontFamily="mono" fontSize="sm">
                          {new Date(event.placementStartsAt).toLocaleString()}
                        </Text>
                      </VStack>
                    )}
                    {event.placementEndsAt && (
                      <VStack align="flex-start" spacing={1}>
                        <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">Placement Ends</Text>
                        <Text color="#d4f0da" fontFamily="mono" fontSize="sm">
                          {new Date(event.placementEndsAt).toLocaleString()}
                        </Text>
                      </VStack>
                    )}
                  </HStack>

                  <HStack spacing={3} flexWrap="wrap">
                    <Button
                      as={RouterLink}
                      to={`/battleship/${eventId}`}
                      size="sm"
                      variant="ghost"
                      color={DIM}
                      _hover={{ color: GREEN }}
                    >
                      &larr; Event Page
                    </Button>
                    <Button
                      as={RouterLink}
                      to={`/battleship/${eventId}/refs`}
                      size="sm"
                      variant="ghost"
                      color={DIM}
                      _hover={{ color: GREEN }}
                    >
                      &rarr; Refs Page
                    </Button>
                  </HStack>
                </VStack>
              )}
            </AccordionPanel>
          </AccordionItem>

          {/* Section 2: Teams */}
          <AccordionItem border="1px solid" borderColor={BORDER} borderRadius="lg" mb={3} overflow="hidden">
            <AccordionButton px={4} py={3} bg={CARD_BG} _hover={{ bg: '#0e2418' }} _expanded={{ bg: CARD_BG }}>
              <HStack flex={1} spacing={2}>
                <FaUsers color={DIM} />
                <Text fontWeight="semibold" color="#d4f0da" fontFamily="mono" letterSpacing="wide" fontSize="sm">
                  TEAMS
                </Text>
                {event && (
                  <Badge colorScheme="green" fontSize="xs">{(event.teams ?? []).length}</Badge>
                )}
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>

            <AccordionPanel px={4} py={4} bg={BG}>
              {event && (event.teams ?? []).length === 0 && (
                <Text fontSize="sm" color={DIM} fontFamily="mono">No teams yet.</Text>
              )}
              <VStack align="stretch" spacing={4}>
                {(event?.teams ?? []).map((team) => (
                  <TeamSection
                    key={team.teamId}
                    team={team}
                    allTeams={event?.teams ?? []}
                    refetchEvent={refetchEvent}
                    showToast={showToast}
                  />
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Section 3: Refs */}
          <AccordionItem border="1px solid" borderColor={BORDER} borderRadius="lg" mb={3} overflow="hidden">
            <AccordionButton px={4} py={3} bg={CARD_BG} _hover={{ bg: '#0e2418' }} _expanded={{ bg: CARD_BG }}>
              <HStack flex={1} spacing={2}>
                <FaShieldAlt color={DIM} />
                <Text fontWeight="semibold" color="#d4f0da" fontFamily="mono" letterSpacing="wide" fontSize="sm">
                  REFS MANAGEMENT
                </Text>
                {event && (
                  <Badge colorScheme="green" fontSize="xs">{(event.refs ?? []).length}</Badge>
                )}
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>

            <AccordionPanel px={4} py={4} bg={BG}>
              <RefsSection
                event={event}
                eventId={eventId}
                refetchEvent={refetchEvent}
                showToast={showToast}
              />
            </AccordionPanel>
          </AccordionItem>

          {/* Section 4: Shot Log */}
          {shotLog.length > 0 && (
            <AccordionItem border="1px solid" borderColor={BORDER} borderRadius="lg" mb={3} overflow="hidden">
              <AccordionButton px={4} py={3} bg={CARD_BG} _hover={{ bg: '#0e2418' }} _expanded={{ bg: CARD_BG }}>
                <HStack flex={1} spacing={2}>
                  <FaHistory color={DIM} />
                  <Text fontWeight="semibold" color="#d4f0da" fontFamily="mono" letterSpacing="wide" fontSize="sm">
                    SHOT LOG
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">{shotLog.length}</Badge>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>

              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={1} maxH="400px" overflowY="auto">
                  {[...shotLog].reverse().map((shot) => {
                    const firingTeam = teams.find((t) => t.teamId === shot.firingTeamId);
                    const accentColor = firingTeam?.color === 'RED' ? '#fc8181' : '#76e4f7';
                    const isHit = shot.result === 'HIT';
                    return (
                      <HStack
                        key={shot.shotId}
                        py={1.5}
                        px={3}
                        bg={CARD_BG}
                        border="1px solid"
                        borderColor={BORDER}
                        borderRadius="sm"
                        spacing={3}
                        justify="space-between"
                      >
                        <HStack spacing={2} flex={1} minW={0}>
                          <Box w="5px" h="5px" borderRadius="full" bg={accentColor} flexShrink={0} />
                          <Text fontFamily="mono" fontSize="xs" color={accentColor} fontWeight="bold" flexShrink={0}>
                            {coordLabel(shot.row, shot.col)}
                          </Text>
                          <Text fontFamily="mono" fontSize="xs" color={DIM} noOfLines={1}>
                            {firingTeam?.teamName ?? shot.firingTeamId}
                          </Text>
                          <Badge colorScheme={isHit ? 'red' : 'gray'} fontSize="9px" flexShrink={0}>
                            {isHit ? 'Hit' : 'Miss'}
                          </Badge>
                        </HStack>
                        <Text fontFamily="mono" fontSize="10px" color={DIM} flexShrink={0}>
                          {fmtDateTime(shot.shotAt)}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}

        </Accordion>

        <Divider borderColor={BORDER} />
        <Text fontSize="xs" color={DIM} textAlign="center" fontFamily="mono">
          OSRS BINGO HUB / BATTLESHIP ADMIN CONSOLE
        </Text>
      </VStack>
    </Box>
  );
}
