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
import { FaClipboardList, FaDiscord, FaHistory, FaLink, FaShieldAlt, FaUsers } from 'react-icons/fa';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import BSDiscordSetupModal from '../../molecules/battleship/BSDiscordSetupModal';
import BSLaunchControl from '../../organisms/battleship/BSLaunchControl';
import { useAuth } from '../../providers/AuthProvider';
import { isBattleshipEnabled } from '../../config/featureFlags';
import { useToastContext } from '../../providers/ToastProvider';
import {
  ADD_BS_REF,
  ADD_BS_SKIP_TOKENS,
  GET_BS_EVENT_FULL,
  GET_BS_SHOT_LOG,
  REMOVE_BS_REF,
  TRIGGER_BS_WOM_SYNC,
  UPDATE_BS_EVENT,
  UPDATE_BS_TEAM_DISCORD,
  UPDATE_BS_TEAM_MEMBERS,
} from '../../graphql/bsOperations';
import { SEARCH_USERS } from '../../graphql/queries';

const GREEN = '#4ade80';
const DIM = '#6b9e78';
const BG = '#060f0a';
const CARD_BG = '#091a10';
const BORDER = '#1a4028';

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
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
    <Box
      px={3}
      py={2}
      bg={BG}
      borderRadius="md"
      border="1px solid"
      borderColor={BORDER}
      minW="80px"
      textAlign="center"
    >
      <Text fontSize="lg" fontWeight="bold" color={GREEN} fontFamily="mono">
        {value}
      </Text>
      <Text fontSize="xs" color={DIM} textTransform="uppercase" letterSpacing="wider">
        {label}
      </Text>
    </Box>
  );
}

const isValidDiscordId = (id) => /^\d{17,19}$/.test(id);

function TeamSection({ team, allTeams, refetchEvent, showToast }) {
  const [memberIds, setMemberIds] = useState(team.members ?? []);
  const [saving, setSaving] = useState(false);
  const [addingTokens, setAddingTokens] = useState(false);
  const [channelId, setChannelId] = useState(team.discordChannelId ?? '');
  const [roleId, setRoleId] = useState(team.discordRoleId ?? '');
  const [savingDiscord, setSavingDiscord] = useState(false);

  const [doUpdateMembers] = useMutation(UPDATE_BS_TEAM_MEMBERS);
  const [doAddSkipTokens] = useMutation(ADD_BS_SKIP_TOKENS);
  const [doUpdateDiscord] = useMutation(UPDATE_BS_TEAM_DISCORD);

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

  const handleSaveDiscord = async () => {
    setSavingDiscord(true);
    try {
      await doUpdateDiscord({
        variables: {
          teamId: team.teamId,
          discordChannelId: channelId.trim() || null,
          discordRoleId: roleId.trim() || null,
        },
      });
      showToast('Discord channel saved', 'success');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to save Discord channel', 'error');
    } finally {
      setSavingDiscord(false);
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
        <Box
          w={3}
          h={3}
          borderRadius="full"
          bg={team.color === 'RED' ? '#fc8181' : '#76e4f7'}
          flexShrink={0}
        />
        <Text
          fontWeight="bold"
          color="#d4f0da"
          fontFamily="mono"
          fontSize="md"
          letterSpacing="wide"
        >
          {team.teamName}
        </Text>
        <Badge colorScheme={team.color === 'RED' ? 'red' : 'cyan'} fontSize="xs">
          {team.color}
        </Badge>
      </HStack>

      <VStack align="stretch" spacing={5}>
        {/* Members */}
        <Box>
          <Text
            fontSize="xs"
            color={DIM}
            textTransform="uppercase"
            letterSpacing="wider"
            fontWeight="semibold"
            mb={3}
          >
            Members ({memberIds.filter(isValidDiscordId).length})
          </Text>
          <VStack align="stretch" spacing={3} maxW="400px">
            {memberIds.map((id, i) => (
              <DiscordMemberInput
                key={i}
                value={id}
                onChange={(val) => handleMemberChange(i, val)}
                onRemove={() => handleRemoveMember(i)}
                showRemove
                colorMode="dark"
                conflictTeam={isValidDiscordId(id) ? otherTeamMemberMap.get(id) ?? null : null}
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
            <Text
              fontSize="xs"
              color={DIM}
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="semibold"
            >
              Skip Tokens
            </Text>
            <Text fontWeight="bold" color={GREEN} fontFamily="mono">
              {team.skipTokens ?? 0}
            </Text>
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

        {/* Discord Channel */}
        <Box>
          <Text
            fontSize="xs"
            color={DIM}
            textTransform="uppercase"
            letterSpacing="wider"
            fontWeight="semibold"
            mb={3}
          >
            Discord Channel
          </Text>
          <VStack align="stretch" spacing={2}>
            <Box>
              <Text fontSize="10px" color={DIM} letterSpacing="wider" mb={1}>
                Channel ID
              </Text>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="i.e. 123456789012345678"
                bg={BG}
                border="1px solid"
                borderColor={BORDER}
                color="#d4f0da"
                fontFamily="mono"
                fontSize="sm"
                maxW="320px"
                _placeholder={{ color: '#3d6b4a' }}
                _focus={{ borderColor: GREEN, boxShadow: 'none' }}
                _hover={{ borderColor: DIM }}
              />
            </Box>
            <Box>
              <Text fontSize="10px" color={DIM} letterSpacing="wider" mb={1}>
                Role ID{' '}
                <Text as="span" color="#3d6b4a">
                  (optional — bot will ping this role)
                </Text>
              </Text>
              <Input
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                placeholder="i.e. 123456789012345678"
                bg={BG}
                border="1px solid"
                borderColor={BORDER}
                color="#d4f0da"
                fontFamily="mono"
                fontSize="sm"
                maxW="320px"
                _placeholder={{ color: '#3d6b4a' }}
                _focus={{ borderColor: GREEN, boxShadow: 'none' }}
                _hover={{ borderColor: DIM }}
              />
            </Box>
            <Button
              size="sm"
              colorScheme="green"
              variant="outline"
              isLoading={savingDiscord}
              onClick={handleSaveDiscord}
              alignSelf="flex-start"
            >
              Save Channel
            </Button>
          </VStack>
        </Box>

        {/* Board Stats */}
        {tiles.length > 0 && (
          <Box>
            <Text
              fontSize="xs"
              color={DIM}
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="semibold"
              mb={3}
            >
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
        <Text fontSize="sm" color={DIM} fontFamily="mono">
          No refs assigned yet.
        </Text>
      )}

      {refs.length > 0 && (
        <VStack align="stretch" spacing={2} maxW="400px">
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
              overflow="hidden"
            >
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="sm" color="#d4f0da" fontWeight="semibold">
                  {ref.displayName}
                </Text>
                <Text fontSize="xs" color={DIM} fontFamily="mono">
                  @{ref.username}
                </Text>
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
        <Text
          fontSize="xs"
          color={DIM}
          textTransform="uppercase"
          letterSpacing="wider"
          fontWeight="semibold"
          mb={2}
        >
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
          maxW="320px"
          _focus={{ borderColor: GREEN, boxShadow: 'none' }}
          _hover={{ borderColor: DIM }}
          _placeholder={{ color: DIM }}
        />

        {filteredResults.length > 0 && (
          <VStack align="stretch" spacing={1} mt={2} maxW="320px">
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
                overflow="hidden"
              >
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="sm" color="#d4f0da">
                    {u.displayName}
                  </Text>
                  <Text fontSize="xs" color={DIM} fontFamily="mono">
                    @{u.username}
                  </Text>
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

  const {
    data: eventData,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useQuery(GET_BS_EVENT_FULL, {
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

  const [womCompInput, setWomCompInput] = useState('');
  const [womTeamNames, setWomTeamNames] = useState({});
  useEffect(() => {
    if (event?.womCompetitionId != null) setWomCompInput(event.womCompetitionId);
  }, [event?.womCompetitionId]);
  useEffect(() => {
    if (!event?.teams) return;
    setWomTeamNames(Object.fromEntries(event.teams.map((t) => [t.teamId, t.womTeamName ?? ''])));
  }, [event?.teams?.map((t) => t.teamId + (t.womTeamName ?? '')).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const [updateBSEvent] = useMutation(UPDATE_BS_EVENT, {
    onError: (err) => showToast(err.message ?? 'Failed to save.', 'error'),
  });
  const [updateTeamWomName] = useMutation(UPDATE_BS_TEAM_DISCORD, {
    onError: (err) => showToast(err.message ?? 'Failed to save team WOM name.', 'error'),
  });

  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [savingWom, setSavingWom] = useState(false);
  const handleSaveWom = async () => {
    setSavingWom(true);
    try {
      await updateBSEvent({
        variables: { eventId, input: { womCompetitionId: womCompInput.trim() } },
      });
      await Promise.all(
        teams.map((t) =>
          updateTeamWomName({
            variables: { teamId: t.teamId, womTeamName: womTeamNames[t.teamId]?.trim() || null },
          })
        )
      );
      showToast('WOM integration saved.', 'success');
      refetchEvent();
    } catch {
      // individual mutations already toast on error
    } finally {
      setSavingWom(false);
    }
  };

  const womAllFilled =
    womCompInput.trim().length > 0 &&
    teams.length >= 2 &&
    teams.every((t) => womTeamNames[t.teamId]?.trim().length > 0);

  const [triggerWomSync, { loading: syncingWom }] = useMutation(TRIGGER_BS_WOM_SYNC, {
    onCompleted: () => showToast('WOM sync triggered — progress will update shortly.', 'success'),
    onError: (err) => showToast(err.message ?? 'Failed to trigger sync.', 'error'),
  });

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
  if (!isBattleshipEnabled(user)) return <Navigate to="/" replace />;

  if (!isAdmin && event) {
    return (
      <Center h="60vh" bg={BG}>
        <VStack spacing={3}>
          <Text fontSize="xl" color={DIM} fontFamily="mono">
            ACCESS DENIED
          </Text>
          <Text color={DIM} fontSize="sm">
            Admin access required.
          </Text>
          <Button
            as={RouterLink}
            to={`/battleship/${eventId}`}
            size="sm"
            colorScheme="green"
            variant="ghost"
          >
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
              <Text color={DIM} fontSize="sm" fontFamily="mono">
                {event.eventName}
              </Text>
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

        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4]}>
          {/* Section 1: Event Overview */}
          <AccordionItem
            border="1px solid"
            borderColor={BORDER}
            borderRadius="lg"
            mb={3}
            overflow="hidden"
          >
            <AccordionButton
              px={4}
              py={3}
              bg={CARD_BG}
              _hover={{ bg: '#0e2418' }}
              _expanded={{ bg: CARD_BG }}
            >
              <HStack flex={1} spacing={2}>
                <FaClipboardList color={DIM} />
                <Text
                  fontWeight="semibold"
                  color="#d4f0da"
                  fontFamily="mono"
                  letterSpacing="wide"
                  fontSize="sm"
                >
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
                      <Text
                        fontSize="xs"
                        color={DIM}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Event Name
                      </Text>
                      <Text color="#d4f0da" fontFamily="mono" fontWeight="semibold">
                        {event.eventName}
                      </Text>
                    </VStack>
                    <VStack align="flex-start" spacing={1}>
                      <Text
                        fontSize="xs"
                        color={DIM}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Status
                      </Text>
                      <Badge
                        colorScheme={
                          event.status === 'ACTIVE'
                            ? 'green'
                            : event.status === 'PLACEMENT'
                            ? 'cyan'
                            : event.status === 'COMPLETED'
                            ? 'gray'
                            : 'yellow'
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
                      <Text
                        fontSize="xs"
                        color={DIM}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Cooldown
                      </Text>
                      <Text color="#d4f0da" fontFamily="mono">
                        {event.cooldownMinutes ?? 0} min
                      </Text>
                    </VStack>
                    <VStack align="flex-start" spacing={1}>
                      <Text
                        fontSize="xs"
                        color={DIM}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Initial Skip Tokens
                      </Text>
                      <Text color="#d4f0da" fontFamily="mono">
                        {event.initialSkipTokens ?? 0}
                      </Text>
                    </VStack>
                    <VStack align="flex-start" spacing={1}>
                      <Text
                        fontSize="xs"
                        color={DIM}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Placement Hours
                      </Text>
                      <Text color="#d4f0da" fontFamily="mono">
                        {event.placementPhaseHours ?? 0}
                      </Text>
                    </VStack>
                  </HStack>

                  {event.eventPassword && (
                    <VStack align="flex-start" spacing={1}>
                      <Text
                        fontSize="xs"
                        color={DIM}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Event Password
                      </Text>
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
                        <Text
                          fontSize="xs"
                          color={DIM}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Placement Starts
                        </Text>
                        <Text color="#d4f0da" fontFamily="mono" fontSize="sm">
                          {new Date(event.placementStartsAt).toLocaleString()}
                        </Text>
                      </VStack>
                    )}
                    {event.placementEndsAt && (
                      <VStack align="flex-start" spacing={1}>
                        <Text
                          fontSize="xs"
                          color={DIM}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Placement Ends
                        </Text>
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

          {/* Section 1.5: Launch Event (DRAFT only) */}
          {event?.status === 'DRAFT' && (
            <AccordionItem
              border="1px solid"
              borderColor={BORDER}
              borderRadius="lg"
              mb={3}
              overflow="hidden"
            >
              <AccordionButton
                px={4}
                py={3}
                bg={CARD_BG}
                _hover={{ bg: '#0e2418' }}
                _expanded={{ bg: CARD_BG }}
              >
                <HStack flex={1} spacing={2}>
                  <FaShieldAlt color={DIM} />
                  <Text
                    fontWeight="semibold"
                    color="#d4f0da"
                    fontFamily="mono"
                    letterSpacing="wide"
                    fontSize="sm"
                  >
                    LAUNCH EVENT
                  </Text>
                  {event.scheduledPlacementStart && (
                    <Badge colorScheme="purple" fontFamily="mono" fontSize="xs">
                      SCHEDULED
                    </Badge>
                  )}
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <BSLaunchControl event={event} refetch={refetchEvent} />
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Section 2: Discord Bot Setup */}
          <AccordionItem
            border="1px solid"
            borderColor={BORDER}
            borderRadius="lg"
            mb={3}
            overflow="hidden"
          >
            <AccordionButton
              px={4}
              py={3}
              bg={CARD_BG}
              _hover={{ bg: '#0e2418' }}
              _expanded={{ bg: CARD_BG }}
            >
              <HStack flex={1} spacing={2}>
                <FaDiscord color={DIM} />
                <Text fontWeight="semibold" color="#d4f0da" fontFamily="mono" letterSpacing="wide" fontSize="sm">
                  DISCORD BOT SETUP
                </Text>
                <Badge colorScheme={event?.guildId ? 'green' : 'yellow'} fontSize="xs">
                  {event?.guildId ? 'Connected' : 'Not configured'}
                </Badge>
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>
            <AccordionPanel px={4} py={4} bg={BG}>
              <VStack align="stretch" spacing={3}>
                {event?.guildId ? (
                  <HStack spacing={2}>
                    <Text fontFamily="mono" fontSize="xs" color={DIM}>Guild ID:</Text>
                    <Text fontFamily="mono" fontSize="xs" color="#d4f0da">{event.guildId}</Text>
                  </HStack>
                ) : (
                  <Text fontFamily="mono" fontSize="xs" color={DIM}>
                    The Discord bot has not been connected yet. Set it up to enable task submission notifications.
                  </Text>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  borderColor={BORDER}
                  color={GREEN}
                  fontFamily="mono"
                  fontSize="xs"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  alignSelf="flex-start"
                  leftIcon={<FaDiscord />}
                  onClick={() => setShowDiscordModal(true)}
                  _hover={{ bg: '#0e2418', borderColor: GREEN }}
                >
                  {event?.guildId ? 'Reconfigure Bot' : 'Set Up Bot'}
                </Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Section 3: WOM Integration */}
          <AccordionItem
            border="1px solid"
            borderColor={BORDER}
            borderRadius="lg"
            mb={3}
            overflow="hidden"
          >
            <AccordionButton
              px={4}
              py={3}
              bg={CARD_BG}
              _hover={{ bg: '#0e2418' }}
              _expanded={{ bg: CARD_BG }}
            >
              <HStack flex={1} spacing={2}>
                <FaLink color={DIM} />
                <Text
                  fontWeight="semibold"
                  color="#d4f0da"
                  fontFamily="mono"
                  letterSpacing="wide"
                  fontSize="sm"
                >
                  WOM INTEGRATION
                </Text>
                {event?.womCompetitionId && (
                  <Badge colorScheme="cyan" fontSize="xs">
                    LINKED
                  </Badge>
                )}
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>

            <AccordionPanel px={4} py={4} bg={BG}>
              <VStack align="stretch" spacing={4}>
                <Text fontSize="xs" color={DIM} fontFamily="mono">
                  Link a Wise Old Man competition to automatically track metric progress on revealed
                  tasks. All fields must be filled before saving. Team names must match the WOM
                  competition team names exactly.
                </Text>

                <Box>
                  <Text
                    fontSize="10px"
                    color={DIM}
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={1}
                  >
                    Competition ID
                  </Text>
                  <Input
                    value={womCompInput}
                    onChange={(e) => setWomCompInput(e.target.value)}
                    placeholder="i.e. 12345"
                    bg={CARD_BG}
                    border="1px solid"
                    borderColor={womCompInput.trim() ? GREEN : BORDER}
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="sm"
                    _placeholder={{ color: DIM }}
                    _focus={{ borderColor: GREEN, boxShadow: 'none' }}
                    _hover={{ borderColor: DIM }}
                  />
                </Box>

                {teams.length < 2 ? (
                  <Text fontSize="xs" color={DIM} fontFamily="mono">
                    Add both teams first before configuring WOM integration.
                  </Text>
                ) : (
                  teams.map((t) => (
                    <Box key={t.teamId}>
                      <HStack spacing={2} mb={1}>
                        <Box
                          w="6px"
                          h="6px"
                          borderRadius="full"
                          bg={t.color === 'RED' ? '#fc8181' : '#76e4f7'}
                          flexShrink={0}
                        />
                        <Text
                          fontSize="10px"
                          color={DIM}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          {t.teamName} / WOM Team Name
                        </Text>
                      </HStack>
                      <Input
                        value={womTeamNames[t.teamId] ?? ''}
                        onChange={(e) =>
                          setWomTeamNames((prev) => ({ ...prev, [t.teamId]: e.target.value }))
                        }
                        placeholder="Must match team name in WOM competition exactly"
                        bg={CARD_BG}
                        border="1px solid"
                        borderColor={womTeamNames[t.teamId]?.trim() ? GREEN : BORDER}
                        color="#d4f0da"
                        fontFamily="mono"
                        fontSize="sm"
                        _placeholder={{ color: DIM }}
                        _focus={{ borderColor: GREEN, boxShadow: 'none' }}
                        _hover={{ borderColor: DIM }}
                      />
                    </Box>
                  ))
                )}

                <HStack spacing={3} flexWrap="wrap">
                  <Button
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    borderColor={BORDER}
                    color={GREEN}
                    fontFamily="mono"
                    fontSize="10px"
                    letterSpacing="wider"
                    textTransform="uppercase"
                    isLoading={savingWom}
                    isDisabled={!womAllFilled}
                    _hover={{ bg: CARD_BG, borderColor: GREEN }}
                    _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
                    onClick={handleSaveWom}
                  >
                    Save WOM Setup
                  </Button>
                  {event?.womCompetitionId && event?.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      colorScheme="cyan"
                      variant="outline"
                      borderColor={BORDER}
                      color="cyan.300"
                      fontFamily="mono"
                      fontSize="10px"
                      letterSpacing="wider"
                      textTransform="uppercase"
                      isLoading={syncingWom}
                      _hover={{ bg: CARD_BG, borderColor: 'cyan.300' }}
                      onClick={() => triggerWomSync({ variables: { eventId } })}
                    >
                      Sync WOM Progress Now
                    </Button>
                  )}
                </HStack>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Section 3: Teams */}
          <AccordionItem
            border="1px solid"
            borderColor={BORDER}
            borderRadius="lg"
            mb={3}
            overflow="hidden"
          >
            <AccordionButton
              px={4}
              py={3}
              bg={CARD_BG}
              _hover={{ bg: '#0e2418' }}
              _expanded={{ bg: CARD_BG }}
            >
              <HStack flex={1} spacing={2}>
                <FaUsers color={DIM} />
                <Text
                  fontWeight="semibold"
                  color="#d4f0da"
                  fontFamily="mono"
                  letterSpacing="wide"
                  fontSize="sm"
                >
                  TEAMS
                </Text>
                {event && (
                  <Badge colorScheme="green" fontSize="xs">
                    {(event.teams ?? []).length}
                  </Badge>
                )}
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>

            <AccordionPanel px={4} py={4} bg={BG}>
              {event && (event.teams ?? []).length === 0 && (
                <Text fontSize="sm" color={DIM} fontFamily="mono">
                  No teams yet.
                </Text>
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

          {/* Section 4: Refs */}
          <AccordionItem
            border="1px solid"
            borderColor={BORDER}
            borderRadius="lg"
            mb={3}
            overflow="hidden"
          >
            <AccordionButton
              px={4}
              py={3}
              bg={CARD_BG}
              _hover={{ bg: '#0e2418' }}
              _expanded={{ bg: CARD_BG }}
            >
              <HStack flex={1} spacing={2}>
                <FaShieldAlt color={DIM} />
                <Text
                  fontWeight="semibold"
                  color="#d4f0da"
                  fontFamily="mono"
                  letterSpacing="wide"
                  fontSize="sm"
                >
                  REFS MANAGEMENT
                </Text>
                {event && (
                  <Badge colorScheme="green" fontSize="xs">
                    {(event.refs ?? []).length}
                  </Badge>
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

          {/* Section 5: Shot Log */}
          {shotLog.length > 0 && (
            <AccordionItem
              border="1px solid"
              borderColor={BORDER}
              borderRadius="lg"
              mb={3}
              overflow="hidden"
            >
              <AccordionButton
                px={4}
                py={3}
                bg={CARD_BG}
                _hover={{ bg: '#0e2418' }}
                _expanded={{ bg: CARD_BG }}
              >
                <HStack flex={1} spacing={2}>
                  <FaHistory color={DIM} />
                  <Text
                    fontWeight="semibold"
                    color="#d4f0da"
                    fontFamily="mono"
                    letterSpacing="wide"
                    fontSize="sm"
                  >
                    SHOT LOG
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">
                    {shotLog.length}
                  </Badge>
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
                          <Box
                            w="5px"
                            h="5px"
                            borderRadius="full"
                            bg={accentColor}
                            flexShrink={0}
                          />
                          <Text
                            fontFamily="mono"
                            fontSize="xs"
                            color={accentColor}
                            fontWeight="bold"
                            flexShrink={0}
                          >
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

      {showDiscordModal && eventId && (
        <BSDiscordSetupModal
          isOpen
          eventId={eventId}
          onConfirmed={() => { setShowDiscordModal(false); refetchEvent(); }}
          onClose={() => setShowDiscordModal(false)}
        />
      )}
    </Box>
  );
}
