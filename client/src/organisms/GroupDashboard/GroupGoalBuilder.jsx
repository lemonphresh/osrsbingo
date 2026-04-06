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

const BOSS_METRICS = [
  { value: 'abyssal_sire', label: 'Abyssal Sire' },
  { value: 'alchemical_hydra', label: 'Alchemical Hydra' },
  { value: 'amoxliatl', label: 'Amoxliatl' },
  { value: 'araxxor', label: 'Araxxor' },
  { value: 'artio', label: 'Artio' },
  { value: 'barrows_chests', label: 'Barrows Chests' },
  { value: 'brutus', label: 'Brutus' },
  { value: 'bryophyta', label: 'Bryophyta' },
  { value: 'callisto', label: 'Callisto' },
  { value: 'calvarion', label: "Calvar'ion" },
  { value: 'cerberus', label: 'Cerberus' },
  { value: 'chambers_of_xeric', label: 'Chambers of Xeric' },
  { value: 'chambers_of_xeric_challenge_mode', label: 'Chambers of Xeric (CM)' },
  { value: 'chaos_elemental', label: 'Chaos Elemental' },
  { value: 'chaos_fanatic', label: 'Chaos Fanatic' },
  { value: 'commander_zilyana', label: 'Commander Zilyana (Sara)' },
  { value: 'corporeal_beast', label: 'Corporeal Beast' },
  { value: 'the_corrupted_gauntlet', label: 'Corrupted Gauntlet' },
  { value: 'crazy_archaeologist', label: 'Crazy Archaeologist' },
  { value: 'dagannoth_prime', label: 'Dagannoth Prime' },
  { value: 'dagannoth_rex', label: 'Dagannoth Rex' },
  { value: 'dagannoth_supreme', label: 'Dagannoth Supreme' },
  { value: 'deranged_archaeologist', label: 'Deranged Archaeologist' },
  { value: 'doom_of_mokhaiotl', label: 'Doom of Mokhaiotl' },
  { value: 'duke_sucellus', label: 'Duke Sucellus' },
  { value: 'general_graardor', label: 'General Graardor (Bandos)' },
  { value: 'giant_mole', label: 'Giant Mole' },
  { value: 'grotesque_guardians', label: 'Grotesque Guardians' },
  { value: 'hespori', label: 'Hespori' },
  { value: 'the_hueycoatl', label: 'The Hueycoatl' },
  { value: 'kalphite_queen', label: 'Kalphite Queen' },
  { value: 'king_black_dragon', label: 'King Black Dragon' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'kreearra', label: "Kree'arra (Arma)" },
  { value: 'kril_tsutsaroth', label: "K'ril Tsutsaroth (Zammy)" },
  { value: 'lunar_chests', label: 'Lunar Chests' },
  { value: 'mimic', label: 'Mimic' },
  { value: 'nex', label: 'Nex' },
  { value: 'nightmare', label: 'Nightmare' },
  { value: 'obor', label: 'Obor' },
  { value: 'phantom_muspah', label: 'Phantom Muspah' },
  { value: 'phosanis_nightmare', label: "Phosani's Nightmare" },
  { value: 'sarachnis', label: 'Sarachnis' },
  { value: 'scorpia', label: 'Scorpia' },
  { value: 'scurrius', label: 'Scurrius' },
  { value: 'shellbane_gryphon', label: 'Shellbane Gryphon' },
  { value: 'skotizo', label: 'Skotizo' },
  { value: 'sol_heredit', label: 'Sol Heredit' },
  { value: 'spindel', label: 'Spindel' },
  { value: 'tempoross', label: 'Tempoross' },
  { value: 'the_gauntlet', label: 'The Gauntlet' },
  { value: 'the_leviathan', label: 'The Leviathan' },
  { value: 'the_royal_titans', label: 'The Royal Titans' },
  { value: 'the_whisperer', label: 'The Whisperer' },
  { value: 'theatre_of_blood', label: 'Theatre of Blood' },
  { value: 'theatre_of_blood_hard_mode', label: 'Theatre of Blood (HM)' },
  { value: 'thermonuclear_smoke_devil', label: 'Thermonuclear Smoke Devil' },
  { value: 'tombs_of_amascut', label: 'Tombs of Amascut' },
  { value: 'tombs_of_amascut_expert', label: 'Tombs of Amascut (Expert)' },
  { value: 'tzkal_zuk', label: 'TzKal-Zuk' },
  { value: 'tztok_jad', label: 'TzTok-Jad' },
  { value: 'vardorvis', label: 'Vardorvis' },
  { value: 'venenatis', label: 'Venenatis' },
  { value: 'vetion', label: "Vet'ion" },
  { value: 'vorkath', label: 'Vorkath' },
  { value: 'wintertodt', label: 'Wintertodt' },
  { value: 'yama', label: 'Yama' },
  { value: 'zalcano', label: 'Zalcano' },
  { value: 'zulrah', label: 'Zulrah' },
];

const SKILL_METRICS = [
  'overall',
  'agility',
  'attack',
  'construction',
  'cooking',
  'crafting',
  'defence',
  'farming',
  'firemaking',
  'fishing',
  'fletching',
  'herblore',
  'hitpoints',
  'hunter',
  'magic',
  'mining',
  'prayer',
  'ranged',
  'runecrafting',
  'sailing',
  'slayer',
  'smithing',
  'strength',
  'thieving',
  'woodcutting',
].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

const CLUE_METRICS = [
  { value: 'clue_scrolls_all', label: 'All Clues' },
  { value: 'clue_scrolls_beginner', label: 'Beginner' },
  { value: 'clue_scrolls_easy', label: 'Easy' },
  { value: 'clue_scrolls_medium', label: 'Medium' },
  { value: 'clue_scrolls_hard', label: 'Hard' },
  { value: 'clue_scrolls_elite', label: 'Elite' },
  { value: 'clue_scrolls_master', label: 'Master' },
];

const GOAL_TYPES = [
  { value: 'boss_kc', label: 'Boss KC (aggregate)' },
  { value: 'clue_kc', label: 'Clue Scrolls (aggregate)' },
  { value: 'skill_xp', label: 'Skill XP (aggregate)' },
  { value: 'ehb', label: 'EHB (aggregate)' },
  { value: 'ehp', label: 'EHP (aggregate)' },
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

function getMetricOptions(type) {
  if (type === 'boss_kc') return BOSS_METRICS;
  if (type === 'skill_xp') return SKILL_METRICS;
  if (type === 'clue_kc') return CLUE_METRICS;
  return [];
}

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

export default function GroupGoalBuilder({ goal, onChange, onRemove }) {
  const metricOptions = getMetricOptions(goal.type);

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
                const opts = getMetricOptions(newType);
                onChange({ ...goal, type: newType, metric: opts[0]?.value ?? '' });
              }}
              bg="gray.800"
              borderColor="gray.600"
            >
              {GOAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormControl>

          {metricOptions.length > 0 && (
            <FormControl size="sm">
              <FormLabel fontSize="xs" color="gray.400" mb={1}>
                Metric
              </FormLabel>
              <Select
                size="sm"
                value={goal.metric}
                onChange={(e) => update('metric', e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
              >
                {metricOptions.map((m) => (
                  <option key={m.value} value={m.value}>
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
            Target
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
