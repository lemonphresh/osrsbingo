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
  Tooltip,
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
  bracketType: 'SINGLE_ELIMINATION',
};

function TimingLabel({ label, tip }) {
  return (
    <HStack spacing={1} align="center">
      <Text as="span">{label}</Text>
      <Tooltip
        label={tip}
        hasArrow
        placement="top"
        maxW="260px"
        bg="gray.700"
        color="gray.100"
        fontSize="xs"
        p={3}
      >
        <Text
          as="span"
          fontSize="10px"
          color="gray.500"
          cursor="help"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="full"
          w="14px"
          h="14px"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          _hover={{ color: 'gray.300', borderColor: 'gray.400' }}
        >
          ?
        </Text>
      </Tooltip>
    </HStack>
  );
}

const DIFFICULTY_OPTIONS = [
  { value: 'casual', label: 'Casual', hint: 'Fewer drops required, great for shorter events' },
  { value: 'standard', label: 'Standard', hint: 'Balanced challenge for most clans' },
  { value: 'hardcore', label: 'Hardcore', hint: 'More drops required, for experienced teams' },
];

const DEFAULT_TEAM = { teamName: '', members: [] };
const DEFAULT_MEMBER = { discordId: '', role: 'UNSET' };

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
        <FormLabel fontSize="sm" color="gray.300">
          Event Name
        </FormLabel>
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
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Phase Timings
      </Text>

      <HStack spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">
            <TimingLabel
              label="Gathering (hours)"
              tip="How long players have to complete tasks and earn items for their war chest. 48 hours is a good starting point for a weekend event."
            />
          </FormLabel>
          <NumberInput
            min={1}
            max={168}
            value={config.gatheringHours}
            onChange={(v) => set('gatheringHours', v)}
          >
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">
            <TimingLabel
              label="Outfitting (hours)"
              tip="How long teams have to decide on their loadout using their earned items on their champion's gear slots before the battle begins. 24 hours gives everyone a fair window and accounts for varying timezones and availability."
            />
          </FormLabel>
          <NumberInput
            min={1}
            max={48}
            value={config.outfittingHours}
            onChange={(v) => set('outfittingHours', v)}
          >
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
      </HStack>

      <HStack spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">
            <TimingLabel
              label="Turn Timer (seconds)"
              tip="How many seconds each team has to choose their action during the battle phase. 60 seconds works well for most groups. Shorter timers add pressure; longer ones suit more casual play."
            />
          </FormLabel>
          <NumberInput
            min={15}
            max={300}
            value={config.turnTimerSeconds}
            onChange={(v) => set('turnTimerSeconds', v)}
          >
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">
            <TimingLabel
              label="Max Consumable Slots"
              tip="The maximum number of consumable items (potions, food, etc.) each team can equip on their champion. Consumables are single-use boosts usable during battle."
            />
          </FormLabel>
          <NumberInput
            min={1}
            max={6}
            value={config.maxConsumableSlots}
            onChange={(v) => set('maxConsumableSlots', v)}
          >
            <NumberInputField bg="gray.700" borderColor="gray.600" color="white" />
          </NumberInput>
        </FormControl>
      </HStack>

      <FormControl display="flex" alignItems="center">
        <FormLabel fontSize="sm" color="gray.300" mb={0}>
          <TimingLabel
            label="Allow Flex Roles"
            tip="When enabled, players signed up as Flex can complete any task regardless of role. Useful for smaller teams that want flexibility. When disabled, PvMers can only do PvM tasks and Skillers can only do skilling tasks."
          />
        </FormLabel>
        <Switch
          colorScheme="purple"
          isChecked={config.flexRolesAllowed}
          onChange={(e) => set('flexRolesAllowed', e.target.checked)}
        />
      </FormControl>

      <Divider borderColor="gray.600" />
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wider"
      >
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
            h="80px"
            py={2}
            whiteSpace="normal"
            textAlign="center"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="sm" fontWeight="bold">
              {label}
            </Text>
            <Text
              fontSize="11px"
              fontWeight="normal"
              color={config.difficulty === value ? 'teal.100' : 'gray.400'}
              mt={0.5}
            >
              {hint}
            </Text>
          </Button>
        ))}
      </HStack>

      <Divider borderColor="gray.600" />
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Bracket Format
      </Text>
      <Text fontSize="xs" color="gray.500">
        How teams are eliminated. Double elimination requires exactly 4 or 8 teams.
      </Text>
      <HStack spacing={2}>
        {[
          {
            value: 'SINGLE_ELIMINATION',
            label: 'Single Elimination',
            hint: "One loss and you're out",
          },
          {
            value: 'DOUBLE_ELIMINATION',
            label: 'Double Elimination',
            hint: 'Two losses to be knocked out (4 or 8 teams)',
          },
        ].map(({ value, label, hint }) => (
          <Button
            key={value}
            flex={1}
            size="sm"
            variant={config.bracketType === value ? 'solid' : 'outline'}
            colorScheme="purple"
            onClick={() => set('bracketType', value)}
            flexDirection="column"
            h="80px"
            py={2}
            whiteSpace="normal"
            textAlign="center"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="sm" fontWeight="bold">
              {label}
            </Text>
            <Text
              fontSize="11px"
              fontWeight="normal"
              color={config.bracketType === value ? 'purple.100' : 'gray.400'}
              mt={0.5}
            >
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
          <Badge colorScheme="purple" fontSize="xs">
            Team {index + 1}
          </Badge>
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
        <FormLabel fontSize="xs" color="gray.400" mb={1}>
          Team Name
        </FormLabel>
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
            </VStack>
          );
        })}
      </VStack>

      {team.members.length < 10 && (
        <Button
          size="xs"
          leftIcon={<AddIcon />}
          variant="ghost"
          colorScheme="purple"
          onClick={addMember}
        >
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
        Add the teams competing in this event. Each team can have up to 10 members. Tasks and item
        drops are seeded at event creation, and your roster can be adjusted later.
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
        <Button
          leftIcon={<AddIcon />}
          variant="outline"
          colorScheme="purple"
          size="sm"
          onClick={addTeam}
        >
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
        <Text fontSize="sm" fontWeight="bold" color="purple.300" mb={2}>
          Event Config
        </Text>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            Name
          </Text>
          <Text fontSize="sm" color="white">
            {config.eventName}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            Difficulty
          </Text>
          <Text fontSize="sm" color="white" textTransform="capitalize">
            {config.difficulty}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            Bracket
          </Text>
          <Text fontSize="sm" color="white">
            {config.bracketType === 'DOUBLE_ELIMINATION'
              ? 'Double Elimination'
              : 'Single Elimination'}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            Gathering
          </Text>
          <Text fontSize="sm" color="white">
            {config.gatheringHours}h
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            Outfitting
          </Text>
          <Text fontSize="sm" color="white">
            {config.outfittingHours}h
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            Turn Timer
          </Text>
          <Text fontSize="sm" color="white">
            {config.turnTimerSeconds}s
          </Text>
        </HStack>
      </Box>

      <Box bg="gray.700" p={4} borderRadius="md">
        <Text fontSize="sm" fontWeight="bold" color="purple.300" mb={2}>
          Teams ({teamsWithMembers.length})
        </Text>
        {teamsWithMembers.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            No teams added — you can add them after creation.
          </Text>
        ) : (
          <VStack spacing={2} align="stretch">
            {teamsWithMembers.map((t, i) => (
              <HStack key={i} justify="space-between">
                <Text fontSize="sm" color="white">
                  {t.teamName}
                </Text>
                <Badge colorScheme="gray" fontSize="xs">
                  {t.members.filter((m) => m.discordId).length} members
                </Badge>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      <Text fontSize="xs" color="gray.500">
        A unique seed will be generated for this event. Tasks (30 total) will be auto-assigned from
        the Champion Forge task pool using this seed.
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
        bracketType: config.bracketType,
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
