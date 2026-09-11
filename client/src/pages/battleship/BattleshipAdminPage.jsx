import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Link as RouterLink, useParams } from 'react-router-dom';
import { useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';
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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import {
  FaClipboardList,
  FaDiscord,
  FaFlagCheckered,
  FaHistory,
  FaLink,
  FaShieldAlt,
  FaUsers,
} from 'react-icons/fa';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import BSDiscordSetupModal from '../../molecules/battleship/BSDiscordSetupModal';
import BSLaunchControl from '../../organisms/battleship/BSLaunchControl';
import { TeamStatusCard } from '../../organisms/battleship/BSActiveComponents';
import { BoardPanel } from '../../organisms/battleship/BSSharedComponents';
import { BSPlacementMiniBoard } from '../../organisms/battleship/BSPlacementView';
import {
  GET_BS_PLACEMENT_SUGGESTIONS,
  BS_PLACEMENT_SUGGESTIONS_UPDATED,
} from '../../graphql/bsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { isBattleshipEnabled } from '../../config/featureFlags';
import { useToastContext } from '../../providers/ToastProvider';
import {
  ADD_BS_ADMIN,
  ADD_BS_REF,
  ADD_BS_SKIP_TOKENS,
  ADMIN_FORCE_BS_GAME_OVER,
  GET_BS_EVENT_FULL,
  GET_BS_SHOT_LOG,
  REMOVE_BS_ADMIN,
  REMOVE_BS_REF,
  SEND_BS_TEST_DISCORD_MESSAGES,
  START_BS_GAME,
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

// Live-queries the placement suggestions for a single team. Server-side auth
// returns [] for a ref who isn't on the team, so refs only see their own team;
// admins see everything.
function TeamPlacementSuggestions({ team }) {
  const { data, refetch } = useQuery(GET_BS_PLACEMENT_SUGGESTIONS, {
    variables: { teamId: team.teamId },
    fetchPolicy: 'cache-and-network',
  });
  useSubscription(BS_PLACEMENT_SUGGESTIONS_UPDATED, {
    variables: { teamId: team.teamId },
    onData: () => refetch(),
  });
  const suggestions = data?.getBSPlacementSuggestions ?? [];
  const dotColor = team.color === 'RED' ? '#f87171' : '#60a5fa';
  return (
    <Box>
      <HStack spacing={2} mb={3}>
        <Box w="8px" h="8px" borderRadius="full" bg={dotColor} />
        <Text
          fontFamily="mono"
          fontSize="xs"
          fontWeight="bold"
          color="#d4f0da"
          letterSpacing="wide"
        >
          {team.teamName}
        </Text>
        <Badge colorScheme="cyan" fontSize="9px" letterSpacing="wider">
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </Badge>
      </HStack>
      {suggestions.length === 0 ? (
        <Text fontFamily="mono" fontSize="10px" color={DIM}>
          No suggestions shared yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={2}>
          {suggestions.map((s) => (
            <HStack
              key={s.suggestionId}
              align="flex-start"
              spacing={3}
              flexWrap="wrap"
              bg="#060f0a"
              border="1px solid"
              borderColor="#1a4028"
              borderRadius="md"
              p={2}
            >
              <BSPlacementMiniBoard ships={s.ships ?? []} />
              <VStack align="flex-start" spacing={1} minW="120px">
                <Text fontFamily="mono" fontSize="10px" color="#d4f0da" noOfLines={1}>
                  {s.proposerDiscordId?.slice(0, 12) ?? 'unknown'}
                </Text>
                <Badge colorScheme="cyan" fontSize="9px" letterSpacing="wider">
                  {s.voteCount ?? 0} vote{(s.voteCount ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}

function VoteThresholdEditor({ event, onSave }) {
  const teams = event?.teams ?? [];
  const maxTeamSize = teams.reduce((m, t) => Math.max(m, (t.members ?? []).length), 0);
  const currentValue = event?.voteThreshold;
  const [input, setInput] = useState(currentValue ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInput(currentValue ?? '');
  }, [currentValue]);

  const effective = (() => {
    // Mirror server logic: explicit value clamped to team size, else auto formula.
    const teamSize = maxTeamSize || 1;
    if (currentValue != null) return Math.max(1, Math.min(currentValue, teamSize));
    return teamSize > 3 ? 3 : 1;
  })();

  const handleSave = async () => {
    const trimmed = String(input).trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1)) return;
    setSaving(true);
    try {
      await onSave(parsed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack align="stretch" spacing={3}>
      <Text
        fontFamily="mono"
        fontSize="xs"
        color="#6b9e78"
        letterSpacing="wide"
        textTransform="uppercase"
      >
        Vote Threshold
      </Text>
      <Text fontFamily="mono" fontSize="xs" color="#6b9e78" lineHeight="1.6">
        Number of approvals required before a shot or skip proposal fires. Leave blank to use the
        default (1 vote for teams of 1–3 members, 3 votes for larger teams). The value is clamped to
        the size of the firing team.
      </Text>
      <HStack spacing={2} align="center">
        <Input
          type="number"
          min={1}
          size="sm"
          maxW="120px"
          placeholder="Auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          bg="#060f0a"
          borderColor="#1a4028"
          color="#d4f0da"
          fontFamily="mono"
        />
        <Button
          size="sm"
          colorScheme="green"
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          textTransform="uppercase"
          isLoading={saving}
          onClick={handleSave}
        >
          Save
        </Button>
        {currentValue != null && (
          <Button
            size="sm"
            variant="ghost"
            color="#6b9e78"
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="wider"
            textTransform="uppercase"
            _hover={{ color: '#d4f0da', bg: 'transparent' }}
            onClick={async () => {
              setInput('');
              setSaving(true);
              try {
                await onSave(null);
              } finally {
                setSaving(false);
              }
            }}
          >
            Reset to Auto
          </Button>
        )}
      </HStack>
      <Text fontFamily="mono" fontSize="10px" color="#3d6b4a">
        Currently effective:{' '}
        <Text as="span" color="#d4f0da">
          {effective}
        </Text>{' '}
        {currentValue != null ? `(admin set to ${currentValue})` : '(auto)'}
      </Text>
    </VStack>
  );
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
  const [customTokenCount, setCustomTokenCount] = useState('');
  const [tokenReason, setTokenReason] = useState('');
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

  const handleAddTokens = async (count, reason) => {
    setAddingTokens(true);
    try {
      await doAddSkipTokens({
        variables: { teamId: team.teamId, count, reason: reason?.trim() || null },
      });
      const verb = count >= 0 ? 'Added' : 'Removed';
      const noun = Math.abs(count) === 1 ? 'skip token' : 'skip tokens';
      showToast(`${verb} ${Math.abs(count)} ${noun}`, 'success');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to update skip tokens', 'error');
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

        {/* Skip Tokens — stage a delta + reason, then submit once. */}
        {(() => {
          const currentBalance = team.skipTokens ?? 0;
          const parsedPending = Number(customTokenCount);
          const pendingValid =
            customTokenCount !== '' &&
            customTokenCount !== '-' &&
            Number.isInteger(parsedPending) &&
            parsedPending !== 0;
          const bumpPending = (delta) => {
            const base = pendingValid ? parsedPending : 0;
            const next = base + delta;
            setCustomTokenCount(String(next));
          };
          const resetPending = () => {
            setCustomTokenCount('');
            setTokenReason('');
          };
          const submitPending = async () => {
            if (!pendingValid) return;
            await handleAddTokens(parsedPending, tokenReason);
            resetPending();
          };
          const newBalance = pendingValid
            ? Math.max(0, currentBalance + parsedPending)
            : currentBalance;
          const isAward = pendingValid && parsedPending > 0;
          const submitDisabled =
            addingTokens || !pendingValid || (parsedPending < 0 && currentBalance <= 0);
          return (
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
                  {currentBalance}
                </Text>
                {pendingValid && (
                  <Text fontSize="10px" color={DIM} fontFamily="mono">
                    →{' '}
                    <Text as="span" color={isAward ? '#4ade80' : '#f87171'} fontWeight="bold">
                      {newBalance}
                    </Text>
                    <Text as="span" color={DIM}>
                      {' '}
                      ({parsedPending > 0 ? '+' : ''}
                      {parsedPending})
                    </Text>
                  </Text>
                )}
              </HStack>
              <VStack align="stretch" spacing={3} maxW="360px">
                {/* Preset bumpers */}
                <HStack spacing={2} flexWrap="wrap">
                  {[1, 3, 5].map((n) => (
                    <Button
                      key={n}
                      size="xs"
                      variant="outline"
                      colorScheme="green"
                      borderColor="#1a4028"
                      color={GREEN}
                      _hover={{ borderColor: GREEN }}
                      onClick={() => bumpPending(n)}
                    >
                      +{n}
                    </Button>
                  ))}
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    borderColor="#4c1a1a"
                    color="#f87171"
                    _hover={{ bg: '#1a0a0a', borderColor: '#f87171' }}
                    onClick={() => bumpPending(-1)}
                  >
                    −1
                  </Button>
                </HStack>

                {/* Staged amount input */}
                <HStack spacing={2} align="center">
                  <Text fontSize="10px" color={DIM} letterSpacing="wider" minW="70px">
                    Amount
                  </Text>
                  <Input
                    value={customTokenCount}
                    onChange={(e) => setCustomTokenCount(e.target.value)}
                    placeholder="±N"
                    size="xs"
                    maxW="90px"
                    bg={BG}
                    borderColor={BORDER}
                    color="#d4f0da"
                    fontFamily="mono"
                    _placeholder={{ color: '#3d6b4a' }}
                    _focus={{ borderColor: GREEN, boxShadow: 'none' }}
                    _hover={{ borderColor: DIM }}
                  />
                  {pendingValid && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color={DIM}
                      fontFamily="mono"
                      fontSize="10px"
                      _hover={{ color: '#d4f0da', bg: 'transparent' }}
                      onClick={resetPending}
                    >
                      Clear
                    </Button>
                  )}
                </HStack>

                {/* Reason */}
                <Box>
                  <Text fontSize="10px" color={DIM} letterSpacing="wider" mb={1}>
                    Reason (optional, posted to the team's Discord channel)
                  </Text>
                  <Textarea
                    value={tokenReason}
                    onChange={(e) => setTokenReason(e.target.value)}
                    placeholder="i.e. Compensating for a bugged tile, awarded for completing challenge, etc"
                    size="sm"
                    rows={2}
                    bg={BG}
                    borderColor={BORDER}
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="xs"
                    _placeholder={{ color: '#3d6b4a' }}
                    _focus={{ borderColor: GREEN, boxShadow: 'none' }}
                    _hover={{ borderColor: DIM }}
                  />
                </Box>

                {/* Single submit button */}
                <Button
                  size="sm"
                  colorScheme={isAward ? 'green' : 'red'}
                  isLoading={addingTokens}
                  isDisabled={submitDisabled}
                  onClick={submitPending}
                  fontFamily="mono"
                  fontSize="xs"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  {pendingValid
                    ? isAward
                      ? `Award ${parsedPending} Token${parsedPending === 1 ? '' : 's'}`
                      : `Revoke ${Math.abs(parsedPending)} Token${
                          Math.abs(parsedPending) === 1 ? '' : 's'
                        }`
                    : 'Stage an amount'}
                </Button>
              </VStack>
            </Box>
          );
        })()}

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
                  (optional, bot will ping this role)
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

// Mirror of RefsSection with three deltas: uses ADD/REMOVE_BS_ADMIN,
// reads event.admins/adminIds, and disables the Remove button for the event
// creator (server rejects that mutation, so the button would 500 otherwise).
function AdminsSection({ event, eventId, refetchEvent, showToast }) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const debounceRef = useRef(null);

  const [doSearch] = useLazyQuery(SEARCH_USERS, { fetchPolicy: 'network-only' });
  const [doAddAdmin] = useMutation(ADD_BS_ADMIN);
  const [doRemoveAdmin] = useMutation(REMOVE_BS_ADMIN);

  const currentAdminIds = useMemo(() => new Set(event?.adminIds ?? []), [event]);
  const admins = event?.admins ?? [];
  const creatorId = event?.creatorId ? String(event.creatorId) : null;

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

  const handleAddAdmin = async (userId) => {
    setAddingId(userId);
    try {
      await doAddAdmin({ variables: { eventId, userId } });
      showToast('Admin added', 'success');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to add admin', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveAdmin = async (userId, displayName) => {
    const label = displayName || 'this admin';
    if (!window.confirm(`Remove ${label} from the admin list?`)) return;
    setRemovingId(userId);
    try {
      await doRemoveAdmin({ variables: { eventId, userId } });
      showToast('Admin removed', 'info');
      await refetchEvent();
    } catch (e) {
      showToast(e.message ?? 'Failed to remove admin', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredResults = searchResults.filter((u) => !currentAdminIds.has(String(u.id)));

  return (
    <VStack align="stretch" spacing={4}>
      {admins.length === 0 && (
        <Text fontSize="sm" color={DIM} fontFamily="mono">
          No extra admins assigned yet. The event creator is always an admin.
        </Text>
      )}

      {admins.length > 0 && (
        <VStack align="stretch" spacing={2} maxW="400px">
          {admins.map((admin) => {
            const isCreator = creatorId && String(admin.id) === creatorId;
            return (
              <HStack
                key={admin.id}
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
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="#d4f0da" fontWeight="semibold">
                      {admin.displayName}
                    </Text>
                    {isCreator && (
                      <Badge colorScheme="green" fontSize="9px" letterSpacing="wider">
                        CREATOR
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color={DIM} fontFamily="mono">
                    @{admin.username}
                  </Text>
                </VStack>
                <Button
                  size="xs"
                  colorScheme="red"
                  variant="outline"
                  isLoading={removingId === String(admin.id)}
                  isDisabled={!!removingId || isCreator}
                  title={isCreator ? 'The event creator cannot be removed as an admin.' : undefined}
                  onClick={() => handleRemoveAdmin(String(admin.id), admin.displayName)}
                >
                  Remove Admin
                </Button>
              </HStack>
            );
          })}
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
          Add Admin
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
                  onClick={() => handleAddAdmin(String(u.id))}
                >
                  Add as Admin
                </Button>
              </HStack>
            ))}
          </VStack>
        )}

        {searchInput.trim() && filteredResults.length === 0 && searchResults.length > 0 && (
          <Text fontSize="xs" color={DIM} mt={2} fontFamily="mono">
            All matching users are already admins.
          </Text>
        )}
      </Box>
    </VStack>
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

  const handleRemoveRef = async (userId, displayName) => {
    // Small guard so a stray click during a live event doesn't yank a ref
    // mid-review. Refs can be re-added, but the friction is cheap insurance.
    const label = displayName || 'this ref';
    if (!window.confirm(`Remove ${label} from the ref list?`)) return;
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
                onClick={() => handleRemoveRef(String(ref.id), ref.displayName)}
              >
                Remove Ref
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
  // useMemo so `?? []` doesn't produce a fresh array reference every render
  // (would re-run any useMemo that depends on `teams` / `shotLog`).
  const teams = useMemo(() => event?.teams ?? [], [event?.teams]);
  const shotLog = useMemo(() => shotLogData?.getBSShotLog ?? [], [shotLogData?.getBSShotLog]);

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
  const [adminForceGameOver, { loading: forcingGameOver }] = useMutation(
    ADMIN_FORCE_BS_GAME_OVER,
    { onError: (err) => showToast(err.message ?? 'Failed to force game over.', 'error') },
  );

  // Force-game-over confirmation state. Two-step: step 1 shows the calculated
  // winner + hit counts, step 2 requires typing the event name.
  const [forceOpen, setForceOpen] = useState(false);
  const [forceStep, setForceStep] = useState(1);
  const [forceConfirmText, setForceConfirmText] = useState('');

  // Client-side preview of who would win — same ranking as computeAdminGameOverWinner
  // (hits, then fewer misses, then earlier last-shot, then alphabetical teamId).
  const forcePreview = useMemo(() => {
    if (!event || teams.length < 2) return null;
    const stats = Object.fromEntries(
      teams.map((t) => [t.teamId, { hits: 0, misses: 0, lastShotAt: null }]),
    );
    for (const s of shotLog) {
      const bucket = stats[s.firingTeamId];
      if (!bucket) continue;
      if (s.result === 'HIT') bucket.hits += 1;
      else if (s.result === 'MISS') bucket.misses += 1;
      const ts = s.shotAt ? new Date(s.shotAt).getTime() : null;
      if (ts != null && (bucket.lastShotAt == null || ts > bucket.lastShotAt)) {
        bucket.lastShotAt = ts;
      }
    }
    const ranked = [...teams].sort((a, b) => {
      const sa = stats[a.teamId];
      const sb = stats[b.teamId];
      if (sb.hits !== sa.hits) return sb.hits - sa.hits;
      if (sa.misses !== sb.misses) return sa.misses - sb.misses;
      const la = sa.lastShotAt ?? Number.POSITIVE_INFINITY;
      const lb = sb.lastShotAt ?? Number.POSITIVE_INFINITY;
      if (la !== lb) return la - lb;
      return String(a.teamId).localeCompare(String(b.teamId));
    });
    return {
      winner: ranked[0],
      loser: ranked[1],
      winnerStats: stats[ranked[0].teamId],
      loserStats: stats[ranked[1].teamId],
    };
  }, [event, teams, shotLog]);

  const openForceModal = () => {
    setForceStep(1);
    setForceConfirmText('');
    setForceOpen(true);
  };
  const closeForceModal = () => {
    if (forcingGameOver) return;
    setForceOpen(false);
    setForceStep(1);
    setForceConfirmText('');
  };
  const handleForceGameOver = async () => {
    try {
      await adminForceGameOver({ variables: { eventId } });
      showToast('Campaign called. Winners have been declared.', 'success');
      closeForceModal();
      refetchEvent();
    } catch (_) {
      // Toast already fired by onError.
    }
  };
  const [updateTeamWomName] = useMutation(UPDATE_BS_TEAM_DISCORD, {
    onError: (err) => showToast(err.message ?? 'Failed to save team WOM name.', 'error'),
  });
  const [startBSGame, { loading: startingBattle }] = useMutation(START_BS_GAME, {
    onCompleted: () => {
      showToast('Battle phase started.', 'success');
      refetchEvent();
    },
    onError: (err) => showToast(err.message ?? 'Failed to start battle phase.', 'error'),
  });
  const [confirmStartBattle, setConfirmStartBattle] = useState(false);

  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [sendTestDiscordMessages, { loading: sendingTestDiscordMessages }] = useMutation(
    SEND_BS_TEST_DISCORD_MESSAGES
  );
  const handleSendTestDiscordMessages = async () => {
    try {
      const { data } = await sendTestDiscordMessages({ variables: { eventId } });
      const summary = data?.sendBSTestDiscordMessages;
      const sent = summary?.sentCount ?? 0;
      const failed = summary?.failedCount ?? 0;
      const skipped = summary?.skippedCount ?? 0;
      const problemTeams = (summary?.results ?? [])
        .filter((result) => result.status !== 'SENT')
        .map((result) => `${result.teamName}: ${result.error}`)
        .join(' · ');

      if (failed === 0 && skipped === 0) {
        showToast(`Test message sent to all ${sent} team channels.`, 'success');
      } else if (sent > 0) {
        showToast(`Sent to ${sent} team channels. ${problemTeams}`, 'warning');
      } else {
        showToast(problemTeams || 'No test messages were sent.', 'error');
      }
    } catch (error) {
      showToast(error.message ?? 'Failed to send Discord test messages.', 'error');
    }
  };
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
    onCompleted: () => showToast('WOM sync triggered. Progress will update shortly.', 'success'),
    onError: (err) => showToast(err.message ?? 'Failed to trigger sync.', 'error'),
  });

  const isAdmin = useMemo(() => {
    if (!event || !user) return false;
    if (user.admin) return true;
    const uid = String(user.id);
    return event.creatorId === uid || (event.adminIds ?? []).includes(uid);
  }, [event, user]);

  // Only spin on initial load — background refetches keep the current view.
  if (isCheckingAuth || (eventLoading && !event)) {
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

        {/* No defaultIndex on purpose: several AccordionItems below are
            conditional on data that loads asynchronously (teams, shotLog,
            event.guildId). Chakra's Accordion tracks open state by positional
            index, so any defaultIndex ends up pointing at whatever items
            happened to be mounted at the moment the accordion first
            initialized. When later items mount, indices shift and the
            "open" set silently references different items than intended,
            which produced two known bugs: the Shot Log accordion opening
            by default when it shouldn't, and needing two clicks to close a
            panel because Chakra's internal state was out of sync with the
            visible layout. Everything defaults collapsed. One extra click to
            open something is a small price for predictable behavior. */}
        <Accordion allowMultiple>
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
                      <HStack spacing={2}>
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
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={BORDER}
                          color={DIM}
                          fontFamily="mono"
                          fontSize="10px"
                          letterSpacing="wider"
                          textTransform="uppercase"
                          onClick={() => {
                            navigator.clipboard.writeText(event.eventPassword).catch(() => {});
                            showToast('Password copied.', 'success');
                          }}
                          _hover={{ bg: CARD_BG, borderColor: GREEN, color: GREEN }}
                        >
                          Copy
                        </Button>
                      </HStack>
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

          {/* Section 1.25: Fleet Status (ACTIVE only) — both teams' live intel */}
          {event?.status === 'ACTIVE' && (event.teams ?? []).length > 0 && (
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
                    FLEET STATUS
                  </Text>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={3}>
                  {(event.teams ?? []).map((team) => (
                    <TeamStatusCard
                      key={team.teamId}
                      team={team}
                      cooldownMinutes={event.cooldownMinutes}
                    />
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Section 1.27: Team Boards (ACTIVE only, default collapsed) — full
              board overlay for both teams. Admins bypass the ship-redaction
              filter server-side (canSeeShips returns true for event admins),
              so this renders live ship placements too. Kept collapsed so the
              admin scroll doesn't get dominated by two 10x10 grids. */}
          {event?.status === 'ACTIVE' && teams.length >= 2 && (
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
                    TEAM BOARDS
                  </Text>
                  <Badge
                    colorScheme="gray"
                    fontFamily="mono"
                    fontSize="9px"
                    letterSpacing="wider"
                    textTransform="uppercase"
                  >
                    ships visible
                  </Badge>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <Text fontSize="xs" color={DIM} mb={3} lineHeight="1.7">
                  Admin-only view of both fleets. Ship placements are hidden from
                  opponents by the server; you see everything.
                </Text>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  {teams.map((team) => (
                    <Box key={team.teamId}>
                      <Text
                        fontFamily="mono"
                        fontSize="10px"
                        color="#6b9e78"
                        letterSpacing="widest"
                        textTransform="uppercase"
                        mb={2}
                      >
                        {team.teamName}
                      </Text>
                      <BoardPanel
                        title=""
                        tiles={team.board?.tiles ?? []}
                        showShips
                        canFire={false}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )}

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

          {/* Section 1.6: Advance to Battle Phase (PLACEMENT only) */}
          {event?.status === 'PLACEMENT' && (
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
                    ADVANCE TO BATTLE PHASE
                  </Text>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={3}>
                  <Text fontFamily="mono" fontSize="xs" color={DIM}>
                    Battle phase starts automatically when the placement timer expires. Use this to
                    skip ahead manually. Any teams with missing ships will have their fleet randomly
                    positioned.
                  </Text>
                  {!confirmStartBattle ? (
                    <Button
                      size="sm"
                      colorScheme="green"
                      fontFamily="mono"
                      fontSize="xs"
                      letterSpacing="widest"
                      textTransform="uppercase"
                      bg="#22c55e"
                      color="#060f0a"
                      _hover={{ bg: '#4ade80' }}
                      alignSelf="flex-start"
                      onClick={() => setConfirmStartBattle(true)}
                    >
                      Start Battle Phase
                    </Button>
                  ) : (
                    <Box
                      bg="#060f0a"
                      border="1px solid"
                      borderColor={BORDER}
                      borderRadius="md"
                      p={3}
                    >
                      <Text fontFamily="mono" fontSize="xs" color="#fbbf24" mb={3}>
                        This will end placement immediately and lock in current ship positions. Any
                        team without ships placed will be randomized. This cannot be undone.
                      </Text>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          fontFamily="mono"
                          fontSize="10px"
                          letterSpacing="wider"
                          textTransform="uppercase"
                          isLoading={startingBattle}
                          loadingText="Launching..."
                          bg="#22c55e"
                          color="#060f0a"
                          _hover={{ bg: '#4ade80' }}
                          onClick={() => startBSGame({ variables: { eventId } })}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          color={DIM}
                          fontFamily="mono"
                          fontSize="10px"
                          _hover={{ color: '#d4f0da', bg: 'transparent' }}
                          onClick={() => setConfirmStartBattle(false)}
                        >
                          Cancel
                        </Button>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Section 1.65: Placement Suggestions (PLACEMENT only) */}
          {event?.status === 'PLACEMENT' && (event.teams ?? []).length > 0 && (
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
                    PLACEMENT SUGGESTIONS
                  </Text>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={5}>
                  <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="tall">
                    Teams are workshopping placements privately, sharing suggestions to their team,
                    and voting. Highest-voted layout per team wins at phase end. Ties break at
                    random.
                  </Text>
                  {(event.teams ?? []).map((team) => (
                    <TeamPlacementSuggestions key={team.teamId} team={team} />
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Section 1.7: Game Settings (always available) */}
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
                  GAME SETTINGS
                </Text>
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>
            <AccordionPanel px={4} py={4} bg={BG}>
              <VoteThresholdEditor
                event={event}
                onSave={async (value) => {
                  await updateBSEvent({
                    variables: { eventId, input: { voteThreshold: value } },
                  });
                  showToast('Vote threshold updated.', 'success');
                  refetchEvent();
                }}
              />
            </AccordionPanel>
          </AccordionItem>

          {/* Section 2: Discord Bot Setup — rendered here (near the top)
              only while unconfigured, so first-time admins land on the CTA
              immediately. Once connected, the section moves to the bottom
              of the accordion (right above Force Game Over) so admins don't
              have to scroll past a resolved setup step on every visit. */}
          {!event?.guildId && (
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
                  <Text
                    fontWeight="semibold"
                    color="#d4f0da"
                    fontFamily="mono"
                    letterSpacing="wide"
                    fontSize="sm"
                  >
                    DISCORD BOT SETUP
                  </Text>
                  <Badge colorScheme="yellow" fontSize="xs">
                    Not configured
                  </Badge>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={3}>
                  <Text fontFamily="mono" fontSize="xs" color={DIM}>
                    The Discord bot has not been connected yet. Set it up to enable task submission
                    notifications.
                  </Text>
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
                    Set Up Bot
                  </Button>
                  <Box>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="#5865f2"
                      color="#aeb7ff"
                      fontFamily="mono"
                      fontSize="xs"
                      letterSpacing="wider"
                      textTransform="uppercase"
                      leftIcon={<FaDiscord />}
                      isLoading={sendingTestDiscordMessages}
                      loadingText="Sending"
                      isDisabled={!teams.some((team) => team.discordChannelId)}
                      onClick={handleSendTestDiscordMessages}
                      _hover={{ bg: 'rgba(88, 101, 242, 0.14)', borderColor: '#818cf8' }}
                    >
                      Send Test to Team Channels
                    </Button>
                    <Text fontFamily="mono" fontSize="xs" color={DIM} mt={2}>
                      Sends a no-ping test to each configured team channel. Messages delete
                      themselves after 15 seconds.
                      {!teams.some((team) => team.discordChannelId) && (
                        <>
                          {' '}
                          <Text as="span" color="#fbbf24">
                            At least one team needs a Discord channel set before this can run.
                          </Text>
                        </>
                      )}
                    </Text>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}

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
                {!womAllFilled && (
                  <Text fontSize="xs" color={DIM} mt={1}>
                    Save is disabled until the WOM competition ID and every team's WOM name are
                    filled in.
                  </Text>
                )}
                {event?.womCompetitionId && event?.status !== 'ACTIVE' && (
                  <Text fontSize="xs" color={DIM} mt={1}>
                    The manual sync button appears once the event is ACTIVE. Progress syncs
                    automatically every 7 minutes during the battle phase.
                  </Text>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Section 3: Teams & Skip Tokens */}
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
                  TEAMS & SKIP TOKENS
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

          {/* Section 3.5: Admins */}
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
                  ADMINS MANAGEMENT
                </Text>
                {event && (
                  <Badge colorScheme="green" fontSize="xs">
                    {(event.admins ?? []).length}
                  </Badge>
                )}
              </HStack>
              <AccordionIcon color={DIM} />
            </AccordionButton>

            <AccordionPanel px={4} py={4} bg={BG}>
              <AdminsSection
                event={event}
                eventId={eventId}
                refetchEvent={refetchEvent}
                showToast={showToast}
              />
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

          {/* Section 8: Discord Bot (configured) — bottom position. Once
              the bot is connected, this section only surfaces reconfigure +
              test-message controls, so it sinks to the bottom of the admin
              surface. See the top-position twin for the first-time setup
              variant. */}
          {event?.guildId && (
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
                  <Text
                    fontWeight="semibold"
                    color="#d4f0da"
                    fontFamily="mono"
                    letterSpacing="wide"
                    fontSize="sm"
                  >
                    DISCORD BOT
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">
                    Connected
                  </Badge>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={3}>
                  <HStack spacing={2}>
                    <Text fontFamily="mono" fontSize="xs" color={DIM}>
                      Guild ID:
                    </Text>
                    <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                      {event.guildId}
                    </Text>
                  </HStack>
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
                    Reconfigure Bot
                  </Button>
                  <Box>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="#5865f2"
                      color="#aeb7ff"
                      fontFamily="mono"
                      fontSize="xs"
                      letterSpacing="wider"
                      textTransform="uppercase"
                      leftIcon={<FaDiscord />}
                      isLoading={sendingTestDiscordMessages}
                      loadingText="Sending"
                      isDisabled={!teams.some((team) => team.discordChannelId)}
                      onClick={handleSendTestDiscordMessages}
                      _hover={{ bg: 'rgba(88, 101, 242, 0.14)', borderColor: '#818cf8' }}
                    >
                      Send Test to Team Channels
                    </Button>
                    <Text fontFamily="mono" fontSize="xs" color={DIM} mt={2}>
                      Sends a no-ping test to each configured team channel. Messages delete
                      themselves after 15 seconds.
                      {!teams.some((team) => team.discordChannelId) && (
                        <>
                          {' '}
                          <Text as="span" color="#fbbf24">
                            At least one team needs a Discord channel set before this can run.
                          </Text>
                        </>
                      )}
                    </Text>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Section 9: Force Game Over (ACTIVE only, DANGER ZONE) — kept
              at the very bottom of the admin surface so it's harder to
              trip on accidentally. Winner determined by ship-hit count.
              Guarded by a two-step confirm modal (see openForceModal). */}
          {event?.status === 'ACTIVE' && teams.length >= 2 && (
            <AccordionItem
              border="1px solid"
              borderColor="#7f1d1d"
              borderRadius="lg"
              mb={3}
              overflow="hidden"
            >
              <AccordionButton
                px={4}
                py={3}
                bg={CARD_BG}
                _hover={{ bg: '#1a0a0a' }}
                _expanded={{ bg: CARD_BG }}
              >
                <HStack flex={1} spacing={2}>
                  <FaFlagCheckered color="#fca5a5" />
                  <Text
                    fontWeight="semibold"
                    color="#fca5a5"
                    fontFamily="mono"
                    letterSpacing="wide"
                    fontSize="sm"
                  >
                    FORCE GAME OVER
                  </Text>
                  <Badge colorScheme="red" fontFamily="mono" fontSize="xs">
                    DANGER ZONE
                  </Badge>
                </HStack>
                <AccordionIcon color={DIM} />
              </AccordionButton>
              <AccordionPanel px={4} py={4} bg={BG}>
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="xs" color={DIM} lineHeight="1.7">
                    Manually ends the campaign and declares the winner by ship-hit count. Use for
                    early ends (stuck event) or at a pre-communicated end time. This cannot be
                    undone. The event flips to COMPLETED, the game-over screen animates for both
                    teams, and Discord announcements go out.
                  </Text>
                  {forcePreview && (
                    <Box
                      bg={CARD_BG}
                      border="1px solid"
                      borderColor={BORDER}
                      borderRadius="md"
                      p={3}
                    >
                      <Text fontSize="10px" color={DIM} fontFamily="mono" mb={2} letterSpacing="wide">
                        CURRENT STANDINGS
                      </Text>
                      <VStack align="stretch" spacing={1}>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color={GREEN} fontFamily="mono">
                            🏆 {forcePreview.winner.teamName}
                          </Text>
                          <Text fontSize="xs" color={DIM} fontFamily="mono">
                            {forcePreview.winnerStats.hits} hits / {forcePreview.winnerStats.misses} misses
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#fbbf24" fontFamily="mono">
                            {forcePreview.loser.teamName}
                          </Text>
                          <Text fontSize="xs" color={DIM} fontFamily="mono">
                            {forcePreview.loserStats.hits} hits / {forcePreview.loserStats.misses} misses
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                  <Button
                    leftIcon={<FaFlagCheckered />}
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    onClick={openForceModal}
                    isDisabled={!forcePreview}
                  >
                    Force Game Over…
                  </Button>
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
          onConfirmed={() => {
            setShowDiscordModal(false);
            refetchEvent();
          }}
          onClose={() => setShowDiscordModal(false)}
        />
      )}

      {/* Force Game Over — two-step confirm. Step 1: winner preview + basic
          confirm. Step 2: type the event name to unlock the final button. */}
      <Modal isOpen={forceOpen} onClose={closeForceModal} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={CARD_BG} border="1px solid" borderColor="#7f1d1d" color="#d4f0da">
          <ModalHeader fontFamily="mono" fontSize="sm" color="#fca5a5">
            <HStack spacing={2}>
              <FaFlagCheckered />
              <Text>
                {forceStep === 1 ? 'Force Game Over: Confirm' : 'Force Game Over: Type to Confirm'}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton isDisabled={forcingGameOver} />
          <ModalBody>
            {forceStep === 1 && forcePreview && (
              <VStack align="stretch" spacing={4}>
                <Text fontSize="sm" color="#e2e8f0" lineHeight="1.7">
                  This will end <strong>{event?.eventName}</strong> right now. Both teams will see
                  the game-over screen and Discord will announce a hit-count victory.
                </Text>
                <Box bg={BG} border="1px solid" borderColor={BORDER} borderRadius="md" p={3}>
                  <Text fontSize="10px" color={DIM} fontFamily="mono" mb={2} letterSpacing="wide">
                    WINNER (BY SHIP-HIT COUNT)
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={GREEN} fontFamily="mono" fontWeight="bold">
                        🏆 {forcePreview.winner.teamName}
                      </Text>
                      <Text fontSize="xs" color={DIM} fontFamily="mono">
                        {forcePreview.winnerStats.hits} hits / {forcePreview.winnerStats.misses} misses
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="#fbbf24" fontFamily="mono">
                        {forcePreview.loser.teamName}
                      </Text>
                      <Text fontSize="xs" color={DIM} fontFamily="mono">
                        {forcePreview.loserStats.hits} hits / {forcePreview.loserStats.misses} misses
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                <Text fontSize="xs" color="#fbbf24" lineHeight="1.7">
                  ⚠️ This cannot be undone. Standings are recomputed by the server at the moment
                  you confirm, so a shot resolved between now and then may shift the winner.
                </Text>
              </VStack>
            )}
            {forceStep === 2 && (
              <VStack align="stretch" spacing={4}>
                <Text fontSize="sm" color="#e2e8f0" lineHeight="1.7">
                  Type <strong>{event?.eventName}</strong> below to unlock the final button.
                </Text>
                <Input
                  value={forceConfirmText}
                  onChange={(e) => setForceConfirmText(e.target.value)}
                  placeholder={event?.eventName}
                  bg={BG}
                  borderColor={BORDER}
                  color="#e2e8f0"
                  autoFocus
                />
              </VStack>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              size="sm"
              variant="ghost"
              color={DIM}
              onClick={closeForceModal}
              isDisabled={forcingGameOver}
            >
              Cancel
            </Button>
            {forceStep === 1 && (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => setForceStep(2)}
                isDisabled={!forcePreview}
              >
                Continue →
              </Button>
            )}
            {forceStep === 2 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="#1a4028"
                  color="#6b9e78"
                  onClick={() => {
                    setForceConfirmText('');
                    setForceStep(1);
                  }}
                  isDisabled={forcingGameOver}
                >
                  ← Back
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={handleForceGameOver}
                  isLoading={forcingGameOver}
                  isDisabled={forceConfirmText !== event?.eventName}
                >
                  Force Game Over
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
