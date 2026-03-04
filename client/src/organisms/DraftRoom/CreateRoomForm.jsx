import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorMode,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREATE_DRAFT_ROOM } from '../../graphql/draftOperations';
import { useToastContext } from '../../providers/ToastProvider';

const ALL_STAT_CATEGORIES = [
  { id: 'combatLevel', label: 'Combat Level' },
  { id: 'totalLevel', label: 'Total Level' },
  { id: 'ehp', label: 'EHP (Efficient Hours Played)' },
  { id: 'ehb', label: 'EHB (Efficient Hours Bossed)' },
  { id: 'slayerLevel', label: 'Slayer Level' },
  { id: 'topBossKcs', label: 'Top 3 Boss KCs' },
];

const DEFAULT_STAT_CATS = ['combatLevel', 'totalLevel', 'ehp', 'ehb'];

const STEPS = ['Room Setup', 'Player Pool', 'Stats & Tiers'];

export default function CreateRoomForm() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Step 1
  const [roomName, setRoomName] = useState('');
  const [format, setFormat] = useState('SNAKE');
  const [numTeams, setNumTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [pin, setPin] = useState('');
  const [pickTime, setPickTime] = useState(60);

  // Step 2
  const [rsnText, setRsnText] = useState('');

  // Step 3
  const [statCats, setStatCats] = useState(DEFAULT_STAT_CATS);
  const [useTiers, setUseTiers] = useState(false);
  const [ehpWeight, setEhpWeight] = useState(1);
  const [ehbWeight, setEhbWeight] = useState(1);
  const [totalLevelWeight, setTotalLevelWeight] = useState(0.5);

  const [createRoom, { loading }] = useMutation(CREATE_DRAFT_ROOM, {
    onError: (e) => showToast({ title: 'Failed to create room', description: e.message, status: 'error' }),
  });

  function handleNumTeamsChange(val) {
    const n = Math.max(2, Math.min(10, val));
    setNumTeams(n);
    setTeamNames((prev) => {
      const updated = [...prev];
      while (updated.length < n) updated.push(`Team ${updated.length + 1}`);
      return updated.slice(0, n);
    });
  }

  function getRsns() {
    return rsnText
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean);
  }

  async function handleSubmit() {
    const rsns = getRsns();
    if (!roomName.trim()) return showToast({ title: 'Enter a room name', status: 'warning' });
    if (rsns.length < numTeams) {
      return showToast({
        title: 'Not enough players',
        description: `Need at least ${numTeams} RSNs for ${numTeams} teams`,
        status: 'warning',
      });
    }

    const result = await createRoom({
      variables: {
        input: {
          roomName: roomName.trim(),
          rsns,
          numberOfTeams: numTeams,
          teamNames,
          draftFormat: format,
          statCategories: statCats,
          pickTimeSeconds: pickTime,
          tierFormula: useTiers ? { ehpWeight, ehbWeight, totalLevelWeight } : null,
          roomPin: pin || null,
        },
      },
    });

    if (result?.data?.createDraftRoom?.roomId) {
      navigate(`/blind-draft/${result.data.createDraftRoom.roomId}`);
    }
  }

  const cardBg = isDark ? '#2D3748' : 'white';

  return (
    <Box maxW="640px" mx="auto">
      {/* Step indicators */}
      <HStack spacing={2} mb={6}>
        {STEPS.map((label, i) => (
          <HStack key={label} spacing={1}>
            <Box
              w={6}
              h={6}
              borderRadius="full"
              bg={i <= step ? 'purple.500' : isDark ? 'gray.600' : 'gray.200'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" fontWeight="bold" color="white">{i + 1}</Text>
            </Box>
            <Text fontSize="sm" color={i === step ? 'purple.300' : 'gray.400'}>{label}</Text>
            {i < STEPS.length - 1 && <Text color="gray.600" mx={1}>→</Text>}
          </HStack>
        ))}
      </HStack>

      <Box bg={cardBg} borderRadius="xl" p={6} border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
        {/* Step 1: Room Setup */}
        {step === 0 && (
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" fontSize="lg">Room Setup</Text>

            <Box>
              <Text fontSize="sm" mb={1}>Room Name *</Text>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Spring Clan Draft 2026" />
            </Box>

            <Box>
              <Text fontSize="sm" mb={1}>Draft Format</Text>
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="SNAKE">Snake — alternating order each round</option>
                <option value="LINEAR">Linear — fixed order repeats</option>
                <option value="AUCTION">Auction — bid points for players</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="sm" mb={1}>Number of Teams (2–10)</Text>
              <NumberInput min={2} max={10} value={numTeams} onChange={(_, v) => handleNumTeamsChange(v)} maxW="120px">
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>

            <Box>
              <Text fontSize="sm" mb={2}>Team Names</Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                {teamNames.map((name, i) => (
                  <Input
                    key={i}
                    size="sm"
                    value={name}
                    onChange={(e) => {
                      const updated = [...teamNames];
                      updated[i] = e.target.value;
                      setTeamNames(updated);
                    }}
                    placeholder={`Team ${i + 1}`}
                  />
                ))}
              </SimpleGrid>
            </Box>

            <HStack spacing={4} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1}>Pick Timer (seconds)</Text>
                <NumberInput min={15} max={300} value={pickTime} onChange={(_, v) => setPickTime(v || 60)} maxW="120px">
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>Room PIN (optional)</Text>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Leave blank for open"
                  maxW="200px"
                />
              </Box>
            </HStack>
          </VStack>
        )}

        {/* Step 2: Player Pool */}
        {step === 1 && (
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" fontSize="lg">Player Pool</Text>
            <Text fontSize="sm" color="gray.400">
              Paste RSNs — one per line or comma-separated. WOM stats will be fetched on creation.
            </Text>
            <Textarea
              value={rsnText}
              onChange={(e) => setRsnText(e.target.value)}
              placeholder={'Zezima\nWoox\nB0aty\nPvM King\n...'}
              minH="200px"
              fontFamily="mono"
              fontSize="sm"
            />
            <HStack>
              <Text fontSize="sm" color={getRsns().length >= numTeams ? 'green.300' : 'orange.300'}>
                {getRsns().length} player{getRsns().length !== 1 ? 's' : ''} entered
                {getRsns().length < numTeams ? ` (need at least ${numTeams})` : ''}
              </Text>
            </HStack>
          </VStack>
        )}

        {/* Step 3: Stats & Tiers */}
        {step === 2 && (
          <VStack spacing={5} align="stretch">
            <Text fontWeight="bold" fontSize="lg">Stats & Tiers</Text>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>Stat Categories to Show on Cards</Text>
              <CheckboxGroup value={statCats} onChange={(vals) => setStatCats(vals)}>
                <SimpleGrid columns={2} spacing={2}>
                  {ALL_STAT_CATEGORIES.map((cat) => (
                    <Checkbox key={cat.id} value={cat.id} size="sm">
                      {cat.label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
            </Box>

            <Divider />

            <Box>
              <Checkbox isChecked={useTiers} onChange={(e) => setUseTiers(e.target.checked)} mb={3}>
                Enable Tier Badges (S/A/B/C/D)
              </Checkbox>

              {useTiers && (
                <VStack spacing={3} align="stretch" pl={4}>
                  <Text fontSize="xs" color="gray.400">
                    Tier scores are calculated from a weighted formula. Adjust weights below.
                  </Text>

                  {[
                    { label: 'EHP Weight', value: ehpWeight, set: setEhpWeight },
                    { label: 'EHB Weight', value: ehbWeight, set: setEhbWeight },
                    { label: 'Total Level Weight', value: totalLevelWeight, set: setTotalLevelWeight },
                  ].map(({ label, value, set }) => (
                    <Box key={label}>
                      <HStack justify="space-between">
                        <Text fontSize="sm">{label}</Text>
                        <Text fontSize="sm" fontWeight="bold">{value.toFixed(1)}</Text>
                      </HStack>
                      <Slider
                        min={0}
                        max={3}
                        step={0.1}
                        value={value}
                        onChange={(v) => set(v)}
                      >
                        <SliderTrack>
                          <SliderFilledTrack bg="purple.400" />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        )}

        {/* Navigation */}
        <HStack justify="space-between" mt={6}>
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            isDisabled={step === 0}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              colorScheme="purple"
              onClick={() => setStep((s) => s + 1)}
              isDisabled={step === 1 && getRsns().length < numTeams}
            >
              Next
            </Button>
          ) : (
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Fetching stats..."
            >
              Create Room
            </Button>
          )}
        </HStack>
      </Box>
    </Box>
  );
}
