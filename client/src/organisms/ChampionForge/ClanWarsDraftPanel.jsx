import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
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
import { CheckIcon, WarningIcon, SettingsIcon } from '@chakra-ui/icons';
import { FaDiscord, FaUsers, FaScroll } from 'react-icons/fa';
import { useToastContext } from '../../providers/ToastProvider';
import {
  UPDATE_CLAN_WARS_EVENT_SETTINGS,
  UPDATE_CLAN_WARS_EVENT_STATUS,
  CREATE_CLAN_WARS_TEAM,
  DELETE_CLAN_WARS_TEAM,
  SET_CLAN_WARS_CAPTAIN,
} from '../../graphql/clanWarsOperations';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';

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
            <Badge colorScheme="yellow" fontSize="xs">Required</Badge>
          )}
        </HStack>
        <Text fontSize="xs" color={done ? 'green.500' : 'gray.400'}>{description}</Text>
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
  const [updateSettings, { loading }] = useMutation(UPDATE_CLAN_WARS_EVENT_SETTINGS, {
    onCompleted: () => {
      showToast('Guild ID saved', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to save', 'error'),
  });

  const handleSave = () => {
    if (!value.trim()) return;
    updateSettings({ variables: { eventId, input: { guildId: value.trim() } } });
  };

  return (
    <HStack spacing={2} mt={2}>
      <Input
        size="sm"
        placeholder="Discord Server (Guild) ID"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        bg="gray.700"
        borderColor="gray.600"
        color="white"
        _placeholder={{ color: 'gray.500' }}
        fontFamily="mono"
      />
      <Button size="sm" colorScheme="purple" isLoading={loading} onClick={handleSave} flexShrink={0}>
        Save
      </Button>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Team card (draft view — editable members)
// ---------------------------------------------------------------------------
function DraftTeamCard({ team, eventId, refetch }) {
  const { showToast } = useToastContext();
  const [deleteTeam] = useMutation(DELETE_CLAN_WARS_TEAM, { onCompleted: refetch });
  const [setCaptain] = useMutation(SET_CLAN_WARS_CAPTAIN, { onCompleted: refetch });
  const [captainInput, setCaptainInput] = useState('');

  const handleDelete = async () => {
    try {
      await deleteTeam({ variables: { eventId, teamId: team.teamId } });
      showToast('Team removed', 'success');
    } catch {
      showToast('Failed to remove team', 'error');
    }
  };

  const handleSetCaptain = async () => {
    if (!captainInput.trim()) return;
    try {
      await setCaptain({ variables: { teamId: team.teamId, discordId: captainInput.trim() } });
      showToast('Captain set', 'success');
      setCaptainInput('');
    } catch {
      showToast('Failed to set captain', 'error');
    }
  };

  return (
    <Box bg="gray.700" borderRadius="md" p={3} border="1px solid" borderColor="gray.600">
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="semibold" color="white" fontSize="sm">{team.teamName}</Text>
        <Button size="xs" colorScheme="red" variant="ghost" onClick={handleDelete}>
          Remove
        </Button>
      </HStack>

      <VStack align="stretch" spacing={1} mb={2}>
        {(team.members ?? []).map((m, i) => (
          <HStack key={m.discordId ?? i} spacing={2}>
            <Badge
              colorScheme={m.role === 'PVMER' ? 'orange' : m.role === 'SKILLER' ? 'teal' : 'purple'}
              fontSize="xs"
              flexShrink={0}
            >
              {m.role ?? 'ANY'}
            </Badge>
            <Text fontSize="xs" color="gray.300" noOfLines={1}>{m.username ?? m.discordId}</Text>
          </HStack>
        ))}
        {!team.members?.length && (
          <Text fontSize="xs" color="gray.600">No members yet</Text>
        )}
      </VStack>

      {team.captainDiscordId && (
        <Text fontSize="xs" color="yellow.400" mb={2}>
          Captain: {team.captainDiscordId}
        </Text>
      )}

      <HStack spacing={2}>
        <Input
          size="xs"
          placeholder="Set captain (Discord ID)"
          value={captainInput}
          onChange={(e) => setCaptainInput(e.target.value)}
          bg="gray.800"
          borderColor="gray.600"
          color="white"
          _placeholder={{ color: 'gray.500' }}
          fontFamily="mono"
        />
        <Button size="xs" colorScheme="purple" onClick={handleSetCaptain} flexShrink={0}>
          Set
        </Button>
      </HStack>
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
      <Button size="sm" colorScheme="purple" isLoading={loading} onClick={handleSubmit} flexShrink={0}>
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
        <ModalHeader color="white" fontSize="md">Start Gathering Phase?</ModalHeader>
        <ModalBody>
          <Text fontSize="sm" color="gray.300">
            This will open the gathering phase for all players. The event clock starts now and{' '}
            <Text as="span" color="yellow.300" fontWeight="semibold">this cannot be undone.</Text>
          </Text>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" color="gray.400" onClick={onClose}>Cancel</Button>
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
      <Box bg="gray.800" border="2px solid" borderColor="purple.700" borderRadius="xl" overflow="hidden">
        {/* Header */}
        <HStack
          px={5} py={3}
          bg="purple.900"
          borderBottom="1px solid"
          borderColor="purple.700"
          justify="space-between"
        >
          <HStack spacing={2}>
            <Icon as={SettingsIcon} color="purple.300" />
            <Text fontWeight="semibold" color="purple.200">Event Setup</Text>
            <Badge colorScheme="gray" fontSize="xs">DRAFT</Badge>
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
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase"
              letterSpacing="wider" mb={3}>
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
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase"
                letterSpacing="wider" mb={2}>
                Discord Guild ID
              </Text>
              <Text fontSize="xs" color="gray.400" mb={2}>
                Find this in Discord: Server Settings → Widget → Server ID.
              </Text>
              <GuildIdForm eventId={event.eventId} currentGuildId={event.guildId} refetch={refetch} />
            </Box>
          )}

          {checks.guildId.done && (
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase"
                letterSpacing="wider" mb={2}>
                Discord Guild ID
              </Text>
              <HStack>
                <Text fontSize="sm" color="green.400" fontFamily="mono">{event.guildId}</Text>
                <GuildIdForm eventId={event.eventId} currentGuildId={event.guildId} refetch={refetch} />
              </HStack>
            </Box>
          )}

          <Divider borderColor="gray.700" />

          {/* Team management */}
          <Box>
            <HStack mb={3} justify="space-between">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase"
                letterSpacing="wider">
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
            <Box bg="yellow.900" border="1px solid" borderColor="yellow.700" borderRadius="md" px={4} py={3}>
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
