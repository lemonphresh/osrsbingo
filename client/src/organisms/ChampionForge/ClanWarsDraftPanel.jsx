import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, SettingsIcon, StarIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaDiscord, FaUsers, FaScroll } from 'react-icons/fa';
import { useToastContext } from '../../providers/ToastProvider';
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
    <HStack spacing={2} mt={2}>
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
    if (!discordId) { setNewMemberUsername(''); return; }
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
    const newMember = { discordId: newMemberId, username: newMemberUsername || newMemberId, avatar: null, role: 'UNSET' };
    const updated = [...(team.members ?? []), newMember].map(({ discordId, username, avatar, role }) => ({ discordId, username, avatar, role }));
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
      .map(({ discordId: id, username, avatar, role }) => ({ discordId: id, username, avatar, role }));
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

  const roleColor = (role) => role === 'PVMER' ? 'orange' : role === 'SKILLER' ? 'teal' : role === 'FLEX' ? 'purple' : 'gray';

  return (
    <Box borderRadius="lg" border="1px solid" borderColor="gray.600" w="full">
      {/* Card header */}
      <HStack
        px={3} py={2}
        bg="gray.700"
        borderTopRadius="lg"
        justify="space-between"
      >
        <Text fontWeight="semibold" color="white" fontSize="sm">{team.teamName}</Text>
        <Button size="xs" colorScheme="red" variant="ghost" onClick={handleDelete}>
          Delete Team
        </Button>
      </HStack>

      <VStack align="stretch" spacing={0} px={3} pt={2} pb={1}>
        {/* Member list */}
        {(team.members ?? []).length === 0 ? (
          <Text fontSize="xs" color="gray.500" py={1}>No members yet — add one below.</Text>
        ) : (
          (team.members ?? []).map((m) => {
            const isCaptain = m.discordId === team.captainDiscordId;
            return (
              <HStack key={m.discordId} spacing={2} py={1} borderBottom="1px solid" borderColor="gray.700">
                <Badge colorScheme={roleColor(m.role)} fontSize="xs" flexShrink={0}>
                  {m.role ?? 'ANY'}
                </Badge>
                {isCaptain && (
                  <Icon as={StarIcon} color="yellow.400" boxSize={3} flexShrink={0} />
                )}
                <Text fontSize="xs" color={isCaptain ? 'yellow.300' : 'gray.200'} flex={1} noOfLines={1}>
                  {m.username ?? m.discordId}
                </Text>
                {!isCaptain && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="yellow"
                    onClick={() => handleSetCaptain(m.discordId)}
                    title="Set as captain"
                    px={1}
                  >
                    <Icon as={StarIcon} boxSize={3} />
                  </Button>
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
      <Box px={3} pb={3} pt={2}>
        <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={1} textTransform="uppercase" letterSpacing="wider">
          Add Member
        </Text>
        <DiscordMemberInput
          value={newMemberId}
          onChange={handleMemberSelect}
          onRemove={() => { setNewMemberId(''); setNewMemberUsername(''); }}
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
// Launch confirm modal
// ---------------------------------------------------------------------------
function LaunchConfirmModal({ isOpen, onClose, onConfirm, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700" color="white">
        <ModalHeader color="white" fontSize="md">
          Start Gathering Phase?
        </ModalHeader>
        <ModalBody>
          <Text fontSize="sm" color="gray.300">
            This will open the gathering phase for all players. The event clock starts now and{' '}
            <Text as="span" color="yellow.300" fontWeight="semibold">
              this cannot be undone.
            </Text>
          </Text>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" color="gray.400" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="green" isLoading={loading} onClick={onConfirm}>
            Start Gathering
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main draft panel
// ---------------------------------------------------------------------------
export default function ClanWarsDraftPanel({ event, refetch }) {
  const { showToast } = useToastContext();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [updateStatus, { loading: advancing }] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, {
    onCompleted: () => {
      showToast('Gathering phase started!', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to advance', 'error'),
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
    tasks: {
      done: (event.tasks?.length ?? 0) > 0,
      label: 'Task Pool',
      description:
        (event.tasks?.length ?? 0) > 0
          ? `${event.tasks.length} tasks in pool`
          : 'No tasks seeded — use admin controls to add tasks.',
      icon: FaScroll,
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
          <Button
            size="sm"
            colorScheme="green"
            isDisabled={!canLaunch}
            onClick={() => setShowLaunchModal(true)}
          >
            Launch Event →
          </Button>
        </HStack>

        <VStack align="stretch" spacing={5} p={5}>
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
              <ChecklistItem {...checks.tasks} />
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
                Find this in Discord: Server Settings → Widget → Server ID.
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
                mb={2}
              >
                Discord Guild ID
              </Text>
              <HStack>
                <Text fontSize="sm" color="green.400" fontFamily="mono">
                  {event.guildId}
                </Text>
                <GuildIdForm
                  eventId={event.eventId}
                  currentGuildId={event.guildId}
                  refetch={refetch}
                />
              </HStack>
            </Box>
          )}

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
                {teams.map((team) => (
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

      <LaunchConfirmModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onConfirm={handleLaunch}
        loading={advancing}
      />
    </>
  );
}
