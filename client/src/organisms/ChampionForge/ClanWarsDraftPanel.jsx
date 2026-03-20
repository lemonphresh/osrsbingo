import React, { useState } from 'react';
import {
  playSubmissionIncoming,
  playSubmissionApproved,
  playSubmissionDenied,
  playTaskComplete,
  playBattleSound,
  playBattleVictory,
  playTournamentComplete,
} from '../../utils/soundEngine';
import BattleVolumeSlider from './BattleVolumeSlider';
import { useMutation, useLazyQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Input,
  SimpleGrid,
  Icon,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonGroup,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, SettingsIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaDiscord, FaUsers, FaScroll, FaCrown } from 'react-icons/fa';
import { useToastContext } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import ClanWarsStaffManager from './ClanWarsStaffManager';
import {
  VERIFY_DISCORD_GUILD,
  UPDATE_CLAN_WARS_EVENT_SETTINGS,
  UPDATE_CLAN_WARS_EVENT_STATUS,
  UPDATE_CLAN_WARS_TEAM_MEMBERS,
  CREATE_CLAN_WARS_TEAM,
  DELETE_CLAN_WARS_TEAM,
  SET_CLAN_WARS_CAPTAIN,
} from '../../graphql/clanWarsOperations';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

// ---------------------------------------------------------------------------
// Checklist item
// ---------------------------------------------------------------------------
function ChecklistItem({ done, label, description, icon, action, actionLabel, required }) {
  return (
    <HStack
      p={3}
      bg={done ? 'green.900' : 'gray.700'}
      border="1px solid"
      borderColor={done ? 'green.700' : required ? 'yellow.700' : 'gray.600'}
      borderRadius="md"
      spacing={3}
      align="flex-start"
    >
      <Icon
        as={done ? CheckIcon : WarningIcon}
        color={done ? 'green.400' : required ? 'yellow.400' : 'gray.500'}
        mt="2px"
        flexShrink={0}
      />
      <VStack align="flex-start" spacing={0} flex={1}>
        <HStack spacing={2}>
          <Icon as={icon} color={done ? 'green.400' : 'gray.400'} boxSize={3} />
          <Text fontSize="sm" fontWeight="semibold" color={done ? 'green.300' : 'white'}>
            {label}
          </Text>
          {required && !done && (
            <Badge colorScheme="yellow" fontSize="xs">
              Required
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color={done ? 'green.500' : 'gray.400'}>
          {description}
        </Text>
      </VStack>
      {action && actionLabel && !done && (
        <Button size="xs" colorScheme="purple" variant="outline" onClick={action} flexShrink={0}>
          {actionLabel}
        </Button>
      )}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Guild ID setup
// ---------------------------------------------------------------------------
function GuildIdForm({ eventId, currentGuildId, refetch }) {
  const { showToast } = useToastContext();
  const [value, setValue] = useState(currentGuildId ?? '');
  const [verifiedName, setVerifiedName] = useState(null);

  // Fetch display name for already-saved guild ID on mount
  React.useEffect(() => {
    if (!currentGuildId) return;
    fetch(`${API_BASE}/discguild/${currentGuildId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.name) setVerifiedName(d.name);
      })
      .catch(() => {});
  }, [currentGuildId]);

  const [verifyGuild, { loading: verifying }] = useLazyQuery(VERIFY_DISCORD_GUILD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const result = data?.verifyDiscordGuild;
      if (result?.success) {
        setVerifiedName(result.guildName);
        updateSettings({ variables: { eventId, input: { guildId: value.trim() } } });
      } else {
        showToast(result?.error ?? 'Bot not found in that server', 'error');
      }
    },
    onError: (err) => showToast(err.message ?? 'Verification failed', 'error'),
  });

  const [updateSettings, { loading: saving }] = useMutation(UPDATE_CLAN_WARS_EVENT_SETTINGS, {
    onCompleted: () => {
      showToast(`Guild verified: ${verifiedName}`, 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to save', 'error'),
  });

  const handleVerifyAndSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setVerifiedName(null);
    verifyGuild({ variables: { guildId: trimmed } });
  };

  return (
    <Box mt={2}>
      <HStack spacing={2}>
        <Input
          size="sm"
          placeholder="Discord Server (Guild) ID"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setVerifiedName(null);
          }}
          bg="gray.700"
          borderColor="gray.600"
          color="white"
          _placeholder={{ color: 'gray.500' }}
          fontFamily="mono"
        />
        <Button
          size="sm"
          colorScheme="purple"
          isLoading={verifying || saving}
          onClick={handleVerifyAndSave}
          flexShrink={0}
        >
          Verify & Save
        </Button>
      </HStack>
      {verifiedName && (
        <Text fontSize="xs" color="green.400" mt={1}>
          ✅{' '}
          <Text as="span" fontWeight="semibold">
            {verifiedName}
          </Text>{' '}
          <Text as="span" color="gray.500">
            (id: {currentGuildId || value})
          </Text>
        </Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Announcements channel setup
// ---------------------------------------------------------------------------
function AnnouncementsChannelForm({ eventId, currentChannelId, refetch }) {
  const { showToast } = useToastContext();
  const [value, setValue] = useState(currentChannelId ?? '');
  const [channelName, setChannelName] = useState(null);

  // Fetch display name for already-saved channel ID on mount
  React.useEffect(() => {
    if (!currentChannelId) return;
    fetch(`${API_BASE}/discchannel/${currentChannelId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.name) setChannelName(d.name);
      })
      .catch(() => {});
  }, [currentChannelId]);

  const [updateSettings, { loading: saving }] = useMutation(UPDATE_CLAN_WARS_EVENT_SETTINGS, {
    onCompleted: (data) => {
      const saved = data?.updateClanWarsEventSettings?.announcementsChannelId;
      if (saved) {
        fetch(`${API_BASE}/discchannel/${saved}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.name) setChannelName(d.name);
          })
          .catch(() => {});
      }
      showToast('Announcements channel saved', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to save', 'error'),
  });

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    updateSettings({ variables: { eventId, input: { announcementsChannelId: trimmed } } });
  };

  return (
    <Box mt={2}>
      <HStack spacing={2}>
        <Input
          size="sm"
          placeholder="Announcements Channel ID"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setChannelName(null);
          }}
          bg="gray.700"
          borderColor="gray.600"
          color="white"
          _placeholder={{ color: 'gray.500' }}
          fontFamily="mono"
        />
        <Button
          size="sm"
          colorScheme="purple"
          isLoading={saving}
          isDisabled={!value.trim() || value.trim() === currentChannelId}
          onClick={handleSave}
          flexShrink={0}
        >
          Save
        </Button>
      </HStack>
      {channelName && (
        <Text fontSize="xs" color="green.400" mt={1}>
          ✅{' '}
          <Text as="span" fontWeight="semibold">
            #{channelName}
          </Text>{' '}
          <Text as="span" color="gray.500">
            (id: {currentChannelId || value})
          </Text>
        </Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Team card (draft view — editable members)
// ---------------------------------------------------------------------------
function DraftTeamCard({ team, eventId, refetch }) {
  const { showToast } = useToastContext();
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [adding, setAdding] = useState(false);

  const [deleteTeam] = useMutation(DELETE_CLAN_WARS_TEAM, { onCompleted: refetch });
  const [setCaptain] = useMutation(SET_CLAN_WARS_CAPTAIN, { onCompleted: refetch });
  const [updateMembers] = useMutation(UPDATE_CLAN_WARS_TEAM_MEMBERS, {
    onCompleted: () => {
      refetch();
      setNewMemberId('');
      setNewMemberUsername('');
    },
  });

  const handleDelete = async () => {
    try {
      await deleteTeam({ variables: { eventId, teamId: team.teamId } });
      showToast('Team removed', 'success');
    } catch {
      showToast('Failed to remove team', 'error');
    }
  };

  const handleMemberSelect = async (discordId) => {
    setNewMemberId(discordId);
    if (!discordId) {
      setNewMemberUsername('');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/discuser/${discordId}`);
      if (res.ok) {
        const data = await res.json();
        setNewMemberUsername(data.username || data.globalName || discordId);
      }
    } catch {
      setNewMemberUsername(discordId);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId) return;
    if ((team.members ?? []).some((m) => m.discordId === newMemberId)) {
      showToast('That member is already on this team', 'warning');
      return;
    }
    setAdding(true);
    const newMember = {
      discordId: newMemberId,
      username: newMemberUsername || newMemberId,
      avatar: null,
      role: 'UNSET',
    };
    const updated = [...(team.members ?? []), newMember].map(
      ({ discordId, username, avatar, role }) => ({ discordId, username, avatar, role })
    );
    try {
      await updateMembers({ variables: { teamId: team.teamId, members: updated } });
      showToast('Member added', 'success');
    } catch {
      showToast('Failed to add member', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (discordId) => {
    const updated = (team.members ?? [])
      .filter((m) => m.discordId !== discordId)
      .map(({ discordId: id, username, avatar, role }) => ({
        discordId: id,
        username,
        avatar,
        role,
      }));
    try {
      await updateMembers({ variables: { teamId: team.teamId, members: updated } });
      showToast('Member removed', 'success');
    } catch {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleSetCaptain = async (discordId) => {
    try {
      await setCaptain({ variables: { teamId: team.teamId, discordId } });
      showToast('Captain set', 'success');
    } catch {
      showToast('Failed to set captain', 'error');
    }
  };

  return (
    <Box
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.600"
      w="full"
      display="flex"
      flexDirection="column"
    >
      {/* Card header */}
      <HStack px={3} py={2} bg="gray.700" borderTopRadius="lg" justify="space-between">
        <Text fontWeight="semibold" color="white" fontSize="sm">
          {team.teamName}
        </Text>
        <Button size="xs" colorScheme="red" variant="ghost" onClick={handleDelete}>
          Delete Team
        </Button>
      </HStack>

      <VStack align="stretch" spacing={0} px={3} pt={2} pb={1} flex={1}>
        {/* Member list */}
        {(team.members ?? []).length === 0 ? (
          <Text fontSize="xs" color="gray.500" py={1}>
            No members yet — add one below.
          </Text>
        ) : (
          (team.members ?? []).map((m) => {
            const isCaptain = m.discordId === team.captainDiscordId;
            return (
              <HStack
                key={m.discordId}
                spacing={2}
                py={1}
                borderBottom="1px solid"
                borderColor="gray.700"
              >
                {isCaptain && <Icon as={FaCrown} color="yellow.400" boxSize={3} flexShrink={0} />}
                <Text
                  fontSize="xs"
                  color={isCaptain ? 'yellow.300' : 'gray.200'}
                  flex={1}
                  noOfLines={1}
                >
                  {m.username ?? m.discordId}
                </Text>
                {!isCaptain && (
                  <Tooltip label="Set as captain" placement="top" hasArrow openDelay={200}>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="yellow"
                      onClick={() => handleSetCaptain(m.discordId)}
                      px={1}
                    >
                      <Icon as={FaCrown} boxSize={3} />
                    </Button>
                  </Tooltip>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleRemoveMember(m.discordId)}
                  px={1}
                >
                  <Icon as={DeleteIcon} boxSize={3} />
                </Button>
              </HStack>
            );
          })
        )}
      </VStack>

      {/* Add member form */}
      <Box px={3} pb={3} pt={2} mt="auto">
        <Text
          fontSize="xs"
          color="gray.500"
          fontWeight="semibold"
          mb={1}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Add Member
        </Text>
        <DiscordMemberInput
          value={newMemberId}
          onChange={handleMemberSelect}
          onRemove={() => {
            setNewMemberId('');
            setNewMemberUsername('');
          }}
          showRemove={!!newMemberId}
        />
        <HStack mt={2} spacing={2}>
          <Button
            size="sm"
            colorScheme="purple"
            isDisabled={!newMemberId}
            isLoading={adding}
            onClick={handleAddMember}
            w="full"
          >
            Add Member
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Add team form
// ---------------------------------------------------------------------------
function AddTeamForm({ eventId, refetch }) {
  const { showToast } = useToastContext();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createTeam] = useMutation(CREATE_CLAN_WARS_TEAM, { onCompleted: refetch });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createTeam({ variables: { eventId, input: { teamName: name.trim() } } });
      showToast('Team added', 'success');
      setName('');
    } catch {
      showToast('Failed to create team', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HStack spacing={2} mt={2}>
      <Input
        size="sm"
        placeholder="New team name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        bg="gray.700"
        borderColor="gray.600"
        color="white"
        _placeholder={{ color: 'gray.500' }}
      />
      <Button
        size="sm"
        colorScheme="purple"
        isLoading={loading}
        onClick={handleSubmit}
        flexShrink={0}
      >
        Add Team
      </Button>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Launch confirm modal — Start Now or Schedule
// ---------------------------------------------------------------------------
function localDatetimeMin() {
  const d = new Date(Date.now() + 60_000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Convert a UTC ISO string to the YYYY-MM-DDTHH:MM format the datetime-local input expects (local time)
function isoToLocalDatetimeInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fmtScheduled(iso, utc) {
  const fmt = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return utc
    ? new Date(iso).toLocaleString(undefined, { ...fmt, timeZone: 'UTC' }) + ' UTC'
    : new Date(iso).toLocaleString(undefined, { ...fmt, timeZoneName: 'short' });
}

function LaunchConfirmModal({
  isOpen,
  onClose,
  onStartNow,
  onSchedule,
  loadingNow,
  loadingSchedule,
  initialMode = 'now',
  initialScheduledAt = '',
}) {
  const [mode, setMode] = useState('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [useUtc, setUseUtc] = useState(false);

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Reset on open, pre-fill if editing an existing schedule
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setScheduledAt(initialScheduledAt);
      setUseUtc(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSchedule = () => {
    if (!scheduledAt) return;
    // UTC mode: treat input as UTC by appending Z; local mode: browser converts from local
    const iso = useUtc
      ? new Date(scheduledAt + 'Z').toISOString()
      : new Date(scheduledAt).toISOString();
    onSchedule(iso);
  };

  // min must match the input's timezone interpretation
  const minDatetime = useUtc
    ? new Date(Date.now() + 60_000).toISOString().slice(0, 16)
    : localDatetimeMin();

  // Show the equivalent in the other timezone after a value is picked
  let conversionHint = null;
  if (scheduledAt) {
    try {
      const fmt = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      if (useUtc) {
        conversionHint =
          '= ' +
          new Date(scheduledAt + 'Z').toLocaleString(undefined, { ...fmt, timeZoneName: 'short' });
      } else {
        conversionHint =
          '= ' +
          new Date(scheduledAt).toLocaleString(undefined, { ...fmt, timeZone: 'UTC' }) +
          ' UTC';
      }
    } catch {}
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700" color="white">
        <ModalHeader color="white" fontSize="md">
          Launch Gathering Phase
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <ButtonGroup isAttached w="100%" size="sm">
              <Button
                flex={1}
                color="white"
                _hover={{ color: mode === 'now' ? 'white' : 'gray.400' }}
                colorScheme={mode === 'now' ? 'green' : 'gray'}
                variant={mode === 'now' ? 'solid' : 'outline'}
                onClick={() => setMode('now')}
              >
                Start Now
              </Button>
              <Button
                flex={1}
                color="white"
                _hover={{ color: mode === 'schedule' ? 'white' : 'gray.400' }}
                colorScheme={mode === 'schedule' ? 'purple' : 'gray'}
                variant={mode === 'schedule' ? 'solid' : 'outline'}
                onClick={() => setMode('schedule')}
              >
                Schedule
              </Button>
            </ButtonGroup>

            <Text fontSize="sm" color="gray.300">
              This is essentially the start of the entire event. Make sure you've completed the
              checklist and set up your Discord server and channels before launching.
            </Text>

            {mode === 'now' ? (
              <Text fontSize="sm" color="gray.300">
                The gathering clock starts immediately.{' '}
                <Text as="span" color="yellow.300" fontWeight="semibold">
                  This cannot be undone.
                </Text>
              </Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.400">
                    {useUtc ? 'UTC' : `Local · ${localTz}`}
                  </Text>
                  <ButtonGroup isAttached size="xs">
                    <Button
                      colorScheme="purple"
                      _hover={{ bg: !useUtc ? 'purple.600' : 'gray.700' }}
                      variant={!useUtc ? 'solid' : 'outline'}
                      color="white"
                      onClick={() => {
                        setUseUtc(false);
                        setScheduledAt('');
                      }}
                    >
                      Local
                    </Button>
                    <Button
                      colorScheme="purple"
                      variant={useUtc ? 'solid' : 'outline'}
                      _hover={{ bg: useUtc ? 'purple.600' : 'gray.700' }}
                      color="white"
                      onClick={() => {
                        setUseUtc(true);
                        setScheduledAt('');
                      }}
                    >
                      UTC
                    </Button>
                  </ButtonGroup>
                </HStack>
                <Input
                  type="datetime-local"
                  size="sm"
                  min={minDatetime}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                />
                {conversionHint && (
                  <Text fontSize="xs" color="gray.500">
                    {conversionHint}
                  </Text>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" color="gray.400" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'now' ? (
            <Button colorScheme="green" isLoading={loadingNow} onClick={onStartNow}>
              Start Gathering
            </Button>
          ) : (
            <Button
              colorScheme="purple"
              isLoading={loadingSchedule}
              isDisabled={!scheduledAt}
              onClick={handleSchedule}
            >
              Schedule
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Dev-only sound test widget
// ---------------------------------------------------------------------------
const UI_SOUNDS = [
  { label: 'Sub In', fn: playSubmissionIncoming },
  { label: 'Approved', fn: playSubmissionApproved },
  { label: 'Denied', fn: playSubmissionDenied },
  { label: 'Task Done', fn: playTaskComplete },
  { label: 'Victory', fn: playBattleVictory },
  { label: 'Tournament End', fn: playTournamentComplete },
];

const BATTLE_SOUNDS = [
  'slash', 'critSlash', 'doubleSlash', 'shield', 'fortressRipple',
  'lightning', 'bleed', 'drain', 'heal', 'explosion', 'debuff', 'buff',
];

function SoundDevWidget() {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Box mt={6} border="1px dashed" borderColor="purple.600" borderRadius="md" overflow="hidden">
      <Box
        px={3}
        py={2}
        bg="purple.900"
        cursor="pointer"
        onClick={() => setOpen((o) => !o)}
        userSelect="none"
      >
        <Text fontSize="xs" color="purple.300" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase">
          {open ? '▲' : '▾'} 🔊 Dev — Sound Tester
        </Text>
      </Box>

      {open && (
        <Box px={4} py={3} bg="gray.900">
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wider">
                UI Sounds
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {UI_SOUNDS.map(({ label, fn }) => (
                  <Button key={label} size="xs" colorScheme="purple" variant="outline" onClick={fn}>
                    {label}
                  </Button>
                ))}
              </HStack>
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                  Battle Sounds
                </Text>
                <BattleVolumeSlider />
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                {BATTLE_SOUNDS.map((key) => (
                  <Button key={key} size="xs" colorScheme="orange" variant="outline" onClick={() => playBattleSound(key)}>
                    {key}
                  </Button>
                ))}
              </HStack>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// Main draft panel
// ---------------------------------------------------------------------------
export default function ClanWarsDraftPanel({ event, refetch }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [bannerUtc, setBannerUtc] = useState(false);
  const scheduleActionRef = React.useRef('schedule');
  const [updateStatus, { loading: advancing }] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, {
    onCompleted: () => {
      showToast('Gathering phase started!', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to advance', 'error'),
  });
  const [updateSettings, { loading: scheduling }] = useMutation(UPDATE_CLAN_WARS_EVENT_SETTINGS, {
    onCompleted: () => {
      const isCancel = scheduleActionRef.current === 'cancel';
      showToast(isCancel ? 'Schedule cancelled' : 'Gathering phase scheduled!', 'success');
      setShowLaunchModal(false);
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update', 'error'),
  });

  const teams = event.teams ?? [];
  const teamsWithMembers = teams.filter((t) => (t.members?.length ?? 0) > 0);

  const checks = {
    guildId: {
      done: !!event.guildId,
      label: 'Discord Guild ID',
      description: event.guildId
        ? `Guild ID set: ${event.guildId}`
        : 'Required for bot integration and submission channels.',
      icon: FaDiscord,
      required: true,
    },
    teams: {
      done: teams.length >= 2,
      label: 'Teams',
      description:
        teams.length >= 2
          ? `${teams.length} teams created`
          : `${teams.length}/2 teams — need at least 2 to launch`,
      icon: FaUsers,
      required: true,
    },
    members: {
      done: teamsWithMembers.length === teams.length && teams.length >= 2,
      label: 'Team Members',
      description:
        teams.length === 0
          ? 'Add teams first'
          : teamsWithMembers.length === teams.length
          ? 'All teams have at least 1 member'
          : `${teams.length - teamsWithMembers.length} team(s) have no members`,
      icon: FaUsers,
      required: false,
    },
    announcementsChannel: {
      done: !!event.announcementsChannelId,
      label: 'Announcements Channel',
      description: event.announcementsChannelId
        ? `Channel set: ${event.announcementsChannelId}`
        : 'Optional, but recommended. Bot will post phase announcements here.',
      icon: FaDiscord,
      required: false,
    },
    staffRefs: {
      done: (event.refIds ?? []).length > 0,
      label: 'Event Refs',
      description:
        (event.refIds ?? []).length > 0
          ? `${event.refIds.length} ref(s) added`
          : 'Optional, but recommended. Add trustworthy refs to help approve submissions.',
      icon: FaUsers,
      required: false,
    },
  };

  const canLaunch = checks.guildId.done && checks.teams.done;

  const handleLaunch = async () => {
    try {
      await updateStatus({ variables: { eventId: event.eventId, status: 'GATHERING' } });
      setShowLaunchModal(false);
    } catch {
      // error shown via onError above
    }
  };

  const handleScheduleGathering = (isoString) => {
    scheduleActionRef.current = 'schedule';
    updateSettings({
      variables: { eventId: event.eventId, input: { scheduledGatheringStart: isoString } },
    });
  };

  const handleCancelSchedule = () => {
    scheduleActionRef.current = 'cancel';
    updateSettings({
      variables: { eventId: event.eventId, input: { scheduledGatheringStart: null } },
    });
  };

  return (
    <>
      <Box
        bg="gray.800"
        border="2px solid"
        borderColor="teal.700"
        borderRadius="xl"
        overflow="hidden"
      >
        {/* Header */}
        <HStack
          px={5}
          py={3}
          bg="teal.900"
          borderBottom="1px solid"
          borderColor="teal.700"
          justify="space-between"
        >
          <HStack spacing={2}>
            <Icon as={SettingsIcon} color="teal.300" />
            <Text fontWeight="semibold" color="teal.200">
              Event Setup
            </Text>
            <Badge colorScheme="gray" fontSize="xs">
              DRAFT
            </Badge>
          </HStack>
          {!event.scheduledGatheringStart && (
            <Button
              size="sm"
              colorScheme="green"
              isDisabled={!canLaunch}
              onClick={() => setShowLaunchModal(true)}
            >
              Launch Event →
            </Button>
          )}
        </HStack>

        <VStack align="stretch" spacing={5} p={5}>
          {/* Scheduled launch banner */}
          {event.scheduledGatheringStart && (
            <Box
              bg="purple.900"
              border="1px solid"
              borderColor="purple.600"
              borderRadius="md"
              px={4}
              py={3}
            >
              <HStack justify="space-between" align="flex-start">
                <VStack align="flex-start" spacing={1}>
                  <Text
                    fontSize="xs"
                    color="purple.400"
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    ⏰ Gathering Launch Scheduled
                  </Text>
                  <HStack spacing={2} align="center" flexWrap="wrap">
                    <Text fontSize="sm" color="white" fontWeight="semibold">
                      {fmtScheduled(event.scheduledGatheringStart, bannerUtc)}
                    </Text>
                    <ButtonGroup isAttached size="xs">
                      <Button
                        colorScheme="purple"
                        variant={!bannerUtc ? 'solid' : 'outline'}
                        color="white"
                        onClick={() => setBannerUtc(false)}
                      >
                        Local
                      </Button>
                      <Button
                        colorScheme="purple"
                        variant={bannerUtc ? 'solid' : 'outline'}
                        color="white"
                        onClick={() => setBannerUtc(true)}
                      >
                        UTC
                      </Button>
                    </ButtonGroup>
                  </HStack>
                </VStack>
                <HStack spacing={2} flexShrink={0}>
                  <Button
                    size="xs"
                    colorScheme="purple"
                    variant="outline"
                    color="white"
                    onClick={() => setShowLaunchModal(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    isLoading={scheduling}
                    onClick={handleCancelSchedule}
                  >
                    Cancel
                  </Button>
                </HStack>
              </HStack>
            </Box>
          )}

          {/* Checklist */}
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={3}
            >
              Pre-launch Checklist
            </Text>
            <VStack align="stretch" spacing={2}>
              <ChecklistItem {...checks.guildId} />
              <ChecklistItem {...checks.teams} />
              <ChecklistItem {...checks.members} />
              <ChecklistItem {...checks.announcementsChannel} />
              <ChecklistItem {...checks.staffRefs} />
            </VStack>
          </Box>

          {/* Guild ID form (always visible in draft) */}
          {!checks.guildId.done && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Discord Guild ID
              </Text>
              <Text fontSize="xs" color="gray.400" mb={2}>
                Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode), then
                right-click your server icon and select Copy Server ID.
              </Text>
              <GuildIdForm
                eventId={event.eventId}
                currentGuildId={event.guildId}
                refetch={refetch}
              />
            </Box>
          )}

          {checks.guildId.done && (
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                Discord Guild ID
              </Text>
              <GuildIdForm
                eventId={event.eventId}
                currentGuildId={event.guildId}
                refetch={refetch}
              />
            </Box>
          )}

          {/* Announcements channel */}
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={1}
            >
              Announcements Channel
            </Text>
            <Text fontSize="xs" color="gray.400" mb={1}>
              The bot will post phase announcements here (gathering start, outfitting, battles).
              Enable Developer Mode, right-click a channel and select Copy Channel ID.
            </Text>
            <AnnouncementsChannelForm
              eventId={event.eventId}
              currentChannelId={event.announcementsChannelId}
              refetch={refetch}
            />
          </Box>

          {/* Staff manager */}
          <Accordion allowMultiple defaultIndex={[0]} reduceMotion>
            <AccordionItem border="none" borderRadius="md" bg="gray.750">
              <AccordionButton px={3} py={2} _hover={{ bg: 'gray.700' }} borderRadius="md">
                <Box flex="1" textAlign="left">
                  <Text fontWeight="semibold" color="gray.300" fontSize="sm">
                    Staff - Admins & Refs
                  </Text>
                </Box>
                <AccordionIcon color="gray.400" />
              </AccordionButton>
              <AccordionPanel px={3} pb={4}>
                <ClanWarsStaffManager event={event} currentUserId={user?.id} refetch={refetch} />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Divider borderColor="gray.700" />

          {/* Team management */}
          <Box>
            <HStack mb={3} justify="space-between">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Teams ({teams.length})
              </Text>
            </HStack>

            {teams.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                {[...teams]
                  .sort((a, b) => a.teamId.localeCompare(b.teamId))
                  .map((team) => (
                    <DraftTeamCard
                      key={team.teamId}
                      team={team}
                      eventId={event.eventId}
                      refetch={refetch}
                    />
                  ))}
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="gray.600" mb={3}>
                No teams yet. Add at least 2 to launch.
              </Text>
            )}

            <AddTeamForm eventId={event.eventId} refetch={refetch} />
          </Box>

          {!canLaunch && (
            <Box
              bg="yellow.900"
              border="1px solid"
              borderColor="yellow.700"
              borderRadius="md"
              px={4}
              py={3}
            >
              <Text fontSize="sm" color="yellow.300">
                Complete the required checklist items above before launching the event.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <SoundDevWidget />

      <LaunchConfirmModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onStartNow={handleLaunch}
        onSchedule={handleScheduleGathering}
        loadingNow={advancing}
        loadingSchedule={scheduling}
        initialMode={event.scheduledGatheringStart ? 'schedule' : 'now'}
        initialScheduledAt={
          event.scheduledGatheringStart
            ? isoToLocalDatetimeInput(event.scheduledGatheringStart)
            : ''
        }
      />
    </>
  );
}
