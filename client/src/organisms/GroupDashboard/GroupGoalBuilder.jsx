import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  IconButton,
  Box,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  Button,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import useContentRegistry from '../../hooks/useContentRegistry';

const GOAL_TYPES = [
  { value: 'boss_kc', label: 'Boss KC (group total)' },
  { value: 'minigame_kc', label: 'Minigame KC (group total)' },
  { value: 'clue_kc', label: 'Clue Scrolls (group total)' },
  { value: 'skill_xp', label: 'Skill XP (group total)' },
  { value: 'ehb', label: 'EHB (group total)' },
  { value: 'ehp', label: 'EHP (group total)' },
  { value: 'leagues_points', label: 'Leagues Points (group total)' },
  { value: 'individual_boss_kc', label: 'Boss KC (individual target)' },
  { value: 'individual_minigame_kc', label: 'Minigame KC (individual target)' },
  { value: 'individual_clue_kc', label: 'Clue Scrolls (individual target)' },
  { value: 'individual_skill_xp', label: 'Skill XP (individual target)' },
  { value: 'individual_ehb', label: 'EHB (individual target)' },
  { value: 'individual_ehp', label: 'EHP (individual target)' },
  { value: 'individual_leagues_points', label: 'Leagues Points (individual target)' },
];

const EMOJI_OPTIONS = [
  // Combat / bosses
  '⚔️',
  '🗡️',
  '🏹',
  '🪃',
  '🔱',
  '⚡',
  '🔥',
  '💀',
  '☠️',
  '👾',
  // Creatures
  '🐉',
  '🕷️',
  '🦂',
  '🦇',
  '🐍',
  '🦁',
  '🦅',
  '🐺',
  '🐊',
  '🦑',
  // Treasure / rewards
  '💰',
  '💎',
  '🏆',
  '🌟',
  '⭐',
  '🎯',
  '🎲',
  '🍀',
  '🔮',
  '🪄',
  // Skills
  '⛏️',
  '🪝',
  '🌿',
  '🧪',
  '🏗️',
  '🔨',
  '🛡️',
  '🧙',
  '🌲',
  '🐟',
  // Misc / celebration
  '🎉',
  '🚀',
  '💪',
  '🏅',
  '📊',
  '🎖️',
  '🔑',
  '🪙',
  '🌊',
  '🎃',
];


function EmojiPicker({ value, onChange }) {
  return (
    <Popover placement="bottom-start" isLazy>
      <PopoverTrigger>
        <Button
          size="sm"
          variant="outline"
          colorScheme="gray"
          minW="44px"
          fontSize="lg"
          px={2}
          aria-label="Pick emoji"
        >
          {value || '🎯'}
        </Button>
      </PopoverTrigger>
      <PopoverContent bg="gray.800" borderColor="gray.600" w="230px">
        <PopoverBody p={2}>
          <SimpleGrid columns={10} spacing={1}>
            {EMOJI_OPTIONS.map((e) => (
              <Button
                key={e}
                size="xs"
                variant={value === e ? 'solid' : 'ghost'}
                colorScheme={value === e ? 'purple' : 'gray'}
                fontSize="md"
                p={1}
                minW="20px"
                onClick={() => onChange(e)}
                aria-label={e}
              >
                {e}
              </Button>
            ))}
          </SimpleGrid>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

const TYPES_WITH_METRIC = new Set([
  'boss_kc', 'individual_boss_kc',
  'minigame_kc', 'individual_minigame_kc',
  'skill_xp', 'individual_skill_xp',
  'clue_kc', 'individual_clue_kc',
]);

export default function GroupGoalBuilder({ goal, onChange, onRemove }) {
  const {
    bossMetricOptions,
    skillMetricOptions,
    clueMetricOptions,
    activityMetricOptions,
  } = useContentRegistry();

  function getMetricOptions(type) {
    if (type === 'boss_kc' || type === 'individual_boss_kc') return bossMetricOptions ?? [];
    if (type === 'minigame_kc' || type === 'individual_minigame_kc') return activityMetricOptions ?? [];
    if (type === 'skill_xp' || type === 'individual_skill_xp') return skillMetricOptions ?? [];
    if (type === 'clue_kc' || type === 'individual_clue_kc') return clueMetricOptions ?? [];
    return [];
  }

  function getDefaultMetric(type) {
    if (type === 'leagues_points' || type === 'individual_leagues_points') return 'league_points';
    return getMetricOptions(type)[0]?.value ?? '';
  }

  const metricOptions = getMetricOptions(goal.type);
  const showMetricSelect = TYPES_WITH_METRIC.has(goal.type);

  function update(field, value) {
    onChange({ ...goal, [field]: value });
  }

  return (
    <Box bg="gray.700" borderRadius="md" p={3} position="relative">
      <IconButton
        size="xs"
        variant="ghost"
        colorScheme="red"
        icon={<DeleteIcon />}
        aria-label="Remove goal"
        position="absolute"
        top={2}
        right={2}
        onClick={onRemove}
      />

      <VStack spacing={2} align="stretch" pr={8}>
        <HStack spacing={2}>
          <FormControl size="sm">
            <FormLabel fontSize="xs" color="gray.400" mb={1}>
              Type
            </FormLabel>
            <Select
              size="sm"
              value={goal.type}
              onChange={(e) => {
                const newType = e.target.value;
                onChange({ ...goal, type: newType, metric: getDefaultMetric(newType) });
              }}
              bg="gray.800"
              color="gray.100"
              borderColor="gray.600"
            >
              {GOAL_TYPES.map((t) => (
                <option key={t.value} value={t.value} style={{ background: '#1A202C', color: '#E2E8F0' }}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormControl>

          {showMetricSelect && (
            <FormControl size="sm">
              <FormLabel fontSize="xs" color="gray.400" mb={1}>
                Metric
              </FormLabel>
              <Select
                size="sm"
                value={goal.metric}
                onChange={(e) => update('metric', e.target.value)}
                bg="gray.800"
                color="gray.100"
                borderColor="gray.600"
                isDisabled={metricOptions.length === 0}
              >
                {metricOptions.length === 0 && (
                  <option value="">Loading...</option>
                )}
                {metricOptions.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: '#1A202C', color: '#E2E8F0' }}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}
        </HStack>

        <HStack spacing={2} align="flex-end">
          <FormControl size="sm" flex={1}>
            <FormLabel fontSize="xs" color="gray.400" mb={1}>
              Goal Display Name
            </FormLabel>
            <Input
              size="sm"
              value={goal.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              placeholder="i.e. 5,000 Vardorvis KC"
              bg="gray.800"
              borderColor="gray.600"
            />
          </FormControl>

          <FormControl size="sm" w="auto" flexShrink={0}>
            <FormLabel fontSize="xs" color="gray.400" mb={1}>
              Emoji
            </FormLabel>
            <EmojiPicker value={goal.emoji} onChange={(e) => update('emoji', e)} />
          </FormControl>
        </HStack>

        <FormControl size="sm">
          <FormLabel fontSize="xs" color="gray.400" mb={1}>
            {goal.type.startsWith('individual_') ? 'Per-member target' : 'Group target'}
          </FormLabel>
          <NumberInput
            size="sm"
            min={1}
            value={goal.target}
            onChange={(_, val) => update('target', val || 0)}
          >
            <NumberInputField bg="gray.800" borderColor="gray.600" placeholder="i.e. 5000" />
          </NumberInput>
        </FormControl>
      </VStack>
    </Box>
  );
}
