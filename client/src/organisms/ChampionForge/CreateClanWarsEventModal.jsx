import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Switch,
  Button,
  Text,
  Divider,
  Box,
  IconButton,
  Badge,
  Select,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_CONFIG = {
  eventName: '',
  gatheringHours: 48,
  outfittingHours: 24,
  turnTimerSeconds: 60,
  maxConsumableSlots: 4,
  flexRolesAllowed: false,
  difficulty: 'standard',
};

const DIFFICULTY_OPTIONS = [
  { value: 'casual',   label: 'Casual',   hint: 'Fewer drops required — great for shorter events' },
  { value: 'standard', label: 'Standard', hint: 'Balanced challenge for most clans'               },
  { value: 'hardcore', label: 'Hardcore', hint: 'More drops required — for experienced teams'     },
];

const DEFAULT_TEAM = { teamName: '', members: [] };
const DEFAULT_MEMBER = { discordId: '', role: 'ANY' };

const STEPS = ['Event Setup', 'Teams & Rosters', 'Review & Create'];

// ---------------------------------------------------------------------------
// Step indicators
// ---------------------------------------------------------------------------
function StepDots({ step, total }) {
  return (
    <HStack spacing={2} justify="center" mb={1}>
      {Array.from({ length: total }).map((_, i) => (
        <Box
          key={i}
          w={i === step ? '20px' : '8px'}
          h="8px"
          borderRadius="full"
          bg={i === step ? 'purple.400' : i < step ? 'purple.700' : 'gray.600'}
          transition="all 0.2s"
        />
      ))}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Event config
// ---------------------------------------------------------------------------
function StepEventConfig({ config, onChange }) {
  const set = (key, value) => onChange({ ...config, [key]: value });

  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel fontSize="sm" color="gray.300">Event Name</FormLabel>
        <Input
          value={config.eventName}
          onChange={(e) => set('eventName', e.target.value)}
          placeholder="Summer Clan Wars 2026"
          bg="gray.700"
          border="1px solid"
          borderColor="gray.600"
          _placeholder={{ color: 'gray.500' }}
          color="white"
        />
      </FormControl>

      <Divider borderColor="gray.600" />
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        Phase Timings
      </Text>

      <HStack spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">Gathering (hours)</FormLabel>
          <NumberInput min={1} max={168} value={config.gatheringHours}
            onChange={(v) => set('gatheringHours', v)}>
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">Outfitting (hours)</FormLabel>
          <NumberInput min={1} max={48} value={config.outfittingHours}
            onChange={(v) => set('outfittingHours', v)}>
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
      </HStack>

      <HStack spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">Turn Timer (seconds)</FormLabel>
          <NumberInput min={15} max={300} value={config.turnTimerSeconds}
            onChange={(v) => set('turnTimerSeconds', v)}>
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">Max Consumable Slots</FormLabel>
          <NumberInput min={1} max={6} value={config.maxConsumableSlots}
            onChange={(v) => set('maxConsumableSlots', v)}>
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
      </HStack>

      <FormControl display="flex" alignItems="center">
        <FormLabel fontSize="sm" color="gray.300" mb={0}>Allow Flex Roles</FormLabel>
        <Switch
          colorScheme="purple"
          isChecked={config.flexRolesAllowed}
          onChange={(e) => set('flexRolesAllowed', e.target.checked)}
        />
      </FormControl>

      <Divider borderColor="gray.600" />
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        Event Difficulty
      </Text>
      <Text fontSize="xs" color="gray.500">
        Controls how many drops PvMers must earn per task, and XP goals for Skillers.
      </Text>

      <HStack spacing={2}>
        {DIFFICULTY_OPTIONS.map(({ value, label, hint }) => (
          <Button
            key={value}
            flex={1}
            size="sm"
            variant={config.difficulty === value ? 'solid' : 'outline'}
            colorScheme="teal"
            onClick={() => set('difficulty', value)}
            flexDirection="column"
            h="auto"
            py={2}
            whiteSpace="normal"
          >
            <Text fontSize="sm" fontWeight="bold">{label}</Text>
            <Text fontSize="9px" fontWeight="normal" color={config.difficulty === value ? 'teal.100' : 'gray.400'} mt={0.5}>
              {hint}
            </Text>
          </Button>
        ))}
      </HStack>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Teams & Rosters
// ---------------------------------------------------------------------------

function TeamCard({ team, index, onChange, onRemove }) {
  const updateMember = (mi, updated) => {
    const members = team.members.map((m, i) => (i === mi ? updated : m));
    onChange({ ...team, members });
  };

  const addMember = () => onChange({ ...team, members: [...team.members, { ...DEFAULT_MEMBER }] });

  const removeMember = (mi) => {
    onChange({ ...team, members: team.members.filter((_, i) => i !== mi) });
  };

  return (
    <Box bg="gray.700" borderRadius="md" p={4} border="1px solid" borderColor="gray.600">
      <HStack mb={3} justify="space-between">
        <HStack>
          <Badge colorScheme="purple" fontSize="xs">Team {index + 1}</Badge>
          <Text fontSize="sm" color="gray.300" fontWeight="medium">
            {team.teamName || 'Unnamed'}
          </Text>
        </HStack>
        <IconButton
          size="xs"
          icon={<DeleteIcon />}
          variant="ghost"
          colorScheme="red"
          aria-label="Remove team"
          onClick={onRemove}
        />
      </HStack>

      <FormControl mb={3}>
        <FormLabel fontSize="xs" color="gray.400" mb={1}>Team Name</FormLabel>
        <Input
          size="sm"
          value={team.teamName}
          onChange={(e) => onChange({ ...team, teamName: e.target.value })}
          placeholder="Blazing Adzes"
          bg="gray.800"
          borderColor="gray.600"
          _placeholder={{ color: 'gray.600' }}
          color="white"
        />
      </FormControl>

      <Text fontSize="xs" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wider">
        Members
      </Text>

      <VStack spacing={3} align="stretch" mb={2}>
        {team.members.map((m, mi) => {
          const isDuplicate = team.members.some(
            (other, oi) => oi !== mi && other.discordId && other.discordId === m.discordId
          );
          return (
            <VStack key={mi} spacing={1} align="stretch" bg="gray.800" p={2} borderRadius="md">
              <DiscordMemberInput
                value={m.discordId}
                onChange={(id) => updateMember(mi, { ...m, discordId: id })}
                onRemove={() => removeMember(mi)}
                colorMode="dark"
                isDuplicateInForm={isDuplicate}
              />
              <HStack>
                <FormLabel fontSize="xs" color="gray.400" mb={0} whiteSpace="nowrap">Role</FormLabel>
                <Select
                  size="sm"
                  value={m.role}
                  onChange={(e) => updateMember(mi, { ...m, role: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                  maxW="140px"
                >
                  <option value="ANY">Any</option>
                  <option value="PVMER">PvMer</option>
                  <option value="SKILLER">Skiller</option>
                </Select>
              </HStack>
            </VStack>
          );
        })}
      </VStack>

      {team.members.length < 10 && (
        <Button size="xs" leftIcon={<AddIcon />} variant="ghost" colorScheme="purple"
          onClick={addMember}>
          Add Member
        </Button>
      )}
    </Box>
  );
}

function StepTeams({ teams, onChange }) {
  const addTeam = () => onChange([...teams, { ...DEFAULT_TEAM, members: [] }]);

  const updateTeam = (ti, updated) => onChange(teams.map((t, i) => (i === ti ? updated : t)));
  const removeTeam = (ti) => onChange(teams.filter((_, i) => i !== ti));

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="sm" color="gray.400">
        Add the teams competing in this event. Each team can have up to 10 members.
        Tasks and item drops are seeded at event creation — your roster can be adjusted later.
      </Text>

      {teams.map((team, ti) => (
        <TeamCard
          key={ti}
          team={team}
          index={ti}
          onChange={(updated) => updateTeam(ti, updated)}
          onRemove={() => removeTeam(ti)}
        />
      ))}

      {teams.length < 16 && (
        <Button leftIcon={<AddIcon />} variant="outline" colorScheme="purple" size="sm"
          onClick={addTeam}>
          Add Team
        </Button>
      )}
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review
// ---------------------------------------------------------------------------
function StepReview({ config, teams }) {
  const teamsWithMembers = teams.filter((t) => t.teamName.trim());
  return (
    <VStack spacing={4} align="stretch">
      <Box bg="gray.700" p={4} borderRadius="md">
        <Text fontSize="sm" fontWeight="bold" color="purple.300" mb={2}>Event Config</Text>
        <HStack justify="space-between"><Text fontSize="sm" color="gray.400">Name</Text>
          <Text fontSize="sm" color="white">{config.eventName}</Text></HStack>
        <HStack justify="space-between"><Text fontSize="sm" color="gray.400">Difficulty</Text>
          <Text fontSize="sm" color="white" textTransform="capitalize">{config.difficulty}</Text></HStack>
        <HStack justify="space-between"><Text fontSize="sm" color="gray.400">Gathering</Text>
          <Text fontSize="sm" color="white">{config.gatheringHours}h</Text></HStack>
        <HStack justify="space-between"><Text fontSize="sm" color="gray.400">Outfitting</Text>
          <Text fontSize="sm" color="white">{config.outfittingHours}h</Text></HStack>
        <HStack justify="space-between"><Text fontSize="sm" color="gray.400">Turn Timer</Text>
          <Text fontSize="sm" color="white">{config.turnTimerSeconds}s</Text></HStack>
      </Box>

      <Box bg="gray.700" p={4} borderRadius="md">
        <Text fontSize="sm" fontWeight="bold" color="purple.300" mb={2}>
          Teams ({teamsWithMembers.length})
        </Text>
        {teamsWithMembers.length === 0 ? (
          <Text fontSize="sm" color="gray.500">No teams added — you can add them after creation.</Text>
        ) : (
          <VStack spacing={2} align="stretch">
            {teamsWithMembers.map((t, i) => (
              <HStack key={i} justify="space-between">
                <Text fontSize="sm" color="white">{t.teamName}</Text>
                <Badge colorScheme="gray" fontSize="xs">{t.members.filter((m) => m.discordId).length} members</Badge>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      <Text fontSize="xs" color="gray.500">
        A unique seed will be generated for this event. Tasks (30 total) will be auto-assigned
        from the Champion Forge task pool using this seed. You can adjust them after creation.
      </Text>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
export default function CreateClanWarsEventModal({ isOpen, onClose, onSubmit }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(0);
    setConfig(DEFAULT_CONFIG);
    setTeams([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canAdvanceStep1 = config.eventName.trim().length > 0;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const validTeams = teams
        .filter((t) => t.teamName.trim())
        .map((t) => ({
          teamName: t.teamName.trim(),
          members: t.members
            .filter((m) => m.discordId.trim())
            .map((m) => ({
              discordId: m.discordId.trim(),
              avatar: null,
              role: m.role,
            })),
        }));

      await onSubmit({
        eventName: config.eventName.trim(),
        gatheringHours: Number(config.gatheringHours),
        outfittingHours: Number(config.outfittingHours),
        turnTimerSeconds: Number(config.turnTimerSeconds),
        maxConsumableSlots: Number(config.maxConsumableSlots),
        flexRolesAllowed: config.flexRolesAllowed,
        difficulty: config.difficulty,
        teams: validTeams,
      });

      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white" maxH="85vh">
        <ModalHeader color="white" pb={2}>
          Create Champion Forge Event
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        <Box px={6} pb={2}>
          <StepDots step={step} total={STEPS.length} />
          <Text fontSize="xs" color="gray.400" textAlign="center" mt={1}>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </Text>
        </Box>

        <ModalBody overflowY="auto">
          {step === 0 && <StepEventConfig config={config} onChange={setConfig} />}
          {step === 1 && <StepTeams teams={teams} onChange={setTeams} />}
          {step === 2 && <StepReview config={config} teams={teams} />}
        </ModalBody>

        <ModalFooter>
          {step > 0 && (
            <Button variant="ghost" color="gray.300" mr={3} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          <Button variant="ghost" color="gray.400" mr="auto" onClick={handleClose}>
            Cancel
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              colorScheme="purple"
              isDisabled={step === 0 && !canAdvanceStep1}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button colorScheme="purple" isLoading={loading} onClick={handleSubmit}>
              Create Event
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
