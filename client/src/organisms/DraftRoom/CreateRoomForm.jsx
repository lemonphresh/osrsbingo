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
  SimpleGrid,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
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

const STEPS = ['Room Setup', 'Player Pool'];

const FORMAT_INFO = {
  SNAKE: {
    label: 'Snake Draft',
    summary:
      'The fairest format for most groups. Pick order reverses every round. Team 1 picks first in odd rounds, last in even rounds. Everyone gets a mix of early and late picks.',
    example: '4 teams: 1→2→3→4→4→3→2→1→1→2→...',
  },
  LINEAR: {
    label: 'Linear Draft',
    summary:
      'Fixed pick order that repeats every round. The team that picks first always picks first. Best for casual drafts where simplicity matters more than fairness.',
    example: '4 teams: 1→2→3→4→1→2→3→4→...',
  },
  AUCTION: {
    label: 'Auction Draft',
    summary:
      'Each team starts with 100 budget points. One player is put up for auction at a time. All captains submit sealed bids simultaneously, highest bid wins. Encourages strategic budgeting and creates exciting moments.',
    example: 'Player up → everyone bids → highest wins, budget deducted → next player',
  },
};

export default function CreateRoomForm() {
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Step 1
  const [roomName, setRoomName] = useState('');
  const [format, setFormat] = useState('SNAKE');
  const [numTeams, setNumTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [pin, setPin] = useState('');
  const [pickTime, setPickTime] = useState('60');

  // Tier badges (advanced, in Step 1 accordion)
  const [useTiers, setUseTiers] = useState(false);
  const [ehpWeight, setEhpWeight] = useState(1);
  const [ehbWeight, setEhbWeight] = useState(1);
  const [totalLevelWeight, setTotalLevelWeight] = useState(0.5);

  // Step 2
  const [rsnText, setRsnText] = useState('');

  const [createRoom, { loading }] = useMutation(CREATE_DRAFT_ROOM, {
    onError: (e) => showToast(`Failed to create room: ${e.message}`, 'error'),
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
    if (!roomName.trim()) return showToast('Enter a room name', 'warning');
    if (rsns.length < numTeams) {
      return showToast(
        `Not enough players — need at least ${numTeams} RSNs for ${numTeams} teams`,
        'warning'
      );
    }

    const result = await createRoom({
      variables: {
        input: {
          roomName: roomName.trim(),
          rsns,
          numberOfTeams: numTeams,
          teamNames,
          draftFormat: format,
          pickTimeSeconds: Math.max(15, Math.min(300, parseInt(pickTime, 10) || 60)),
          tierFormula: useTiers ? { ehpWeight, ehbWeight, totalLevelWeight } : null,
          roomPin: pin || null,
        },
      },
    });

    if (result?.data?.createDraftRoom?.roomId) {
      navigate(`/blind-draft/${result.data.createDraftRoom.roomId}`);
    }
  }

  return (
    <Box maxW="640px" mx="auto">
      {/* step indicators */}
      <HStack spacing={2} mb={6}>
        {STEPS.map((label, i) => (
          <HStack key={label} spacing={1}>
            <Box
              w={6}
              h={6}
              borderRadius="full"
              bg={i <= step ? 'purple.500' : 'gray.600'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" fontWeight="bold" color="white">
                {i + 1}
              </Text>
            </Box>
            <Text fontSize="sm" color={i === step ? 'purple.300' : 'gray.400'}>
              {label}
            </Text>
            {i < STEPS.length - 1 && (
              <Text color="gray.600" mx={1}>
                →
              </Text>
            )}
          </HStack>
        ))}
      </HStack>

      <Box bg="gray.700" borderRadius="xl" p={6} border="1px solid" borderColor="gray.600">
        {/* step 1: Room Setup */}
        {step === 0 && (
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" fontSize="lg">
              Room Setup
            </Text>

            <Box>
              <Text fontSize="sm" mb={1}>
                Room Name *
              </Text>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Spring Clan Draft 2026"
              />
            </Box>

            <Box>
              <Text fontSize="sm" mb={1}>
                Draft Format
              </Text>
              <Select value={format} onChange={(e) => setFormat(e.target.value)} mb={2}>
                <option value="SNAKE">Snake</option>
                <option value="LINEAR">Linear</option>
                <option value="AUCTION">Auction</option>
              </Select>
              {FORMAT_INFO[format] && (
                <Box
                  bg="gray.800"
                  borderRadius="md"
                  px={3}
                  py={2.5}
                  borderLeft="3px solid"
                  borderColor="purple.500"
                >
                  <Text fontSize="xs" fontWeight="bold" color="purple.300" mb={1}>
                    {FORMAT_INFO[format].label}
                  </Text>
                  <Text fontSize="xs" color="gray.300" mb={1.5}>
                    {FORMAT_INFO[format].summary}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    {FORMAT_INFO[format].example}
                  </Text>
                </Box>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" mb={1}>
                Number of Teams (2–10)
              </Text>
              <NumberInput
                min={2}
                max={10}
                value={numTeams}
                onChange={(_, v) => handleNumTeamsChange(v)}
                maxW="120px"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>

            <Box>
              <Text fontSize="sm" mb={2}>
                Team Names
              </Text>
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
                <Text fontSize="sm" mb={1}>
                  Pick Timer (seconds)
                </Text>
                <NumberInput
                  min={15}
                  max={300}
                  value={pickTime}
                  onChange={(valStr) => setPickTime(valStr)}
                  onBlur={() => {
                    const n = parseInt(pickTime, 10);
                    setPickTime(String(Math.max(15, Math.min(300, isNaN(n) ? 60 : n))));
                  }}
                  maxW="120px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>
                  Room PIN (optional)
                </Text>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Leave blank for open"
                  maxW="200px"
                />
              </Box>
            </HStack>

            <Divider />

            {/* advanced: tier badges */}
            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
                  <Text fontSize="sm" color="gray.400" flex={1} textAlign="left">
                    Advanced: Tier Badges
                  </Text>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
                <AccordionPanel pb={0} px={0}>
                  <VStack spacing={3} align="stretch" pt={2}>
                    <Checkbox isChecked={useTiers} onChange={(e) => setUseTiers(e.target.checked)}>
                      <Text fontSize="sm">Enable Tier Badges (S/A/B/C/D) on player cards</Text>
                    </Checkbox>

                    {useTiers && (
                      <VStack spacing={3} align="stretch" pl={4}>
                        <Text fontSize="xs" color="gray.400">
                          Tier scores are calculated from a weighted formula. Adjust weights below.
                        </Text>
                        {[
                          { label: 'EHP Weight', value: ehpWeight, set: setEhpWeight },
                          { label: 'EHB Weight', value: ehbWeight, set: setEhbWeight },
                          {
                            label: 'Total Level Weight',
                            value: totalLevelWeight,
                            set: setTotalLevelWeight,
                          },
                        ].map(({ label, value, set }) => (
                          <Box key={label}>
                            <HStack justify="space-between">
                              <Text fontSize="sm">{label}</Text>
                              <Text fontSize="sm" fontWeight="bold">
                                {value.toFixed(1)}
                              </Text>
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
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        )}

        {/* step 2: player pool */}
        {step === 1 && (
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" fontSize="lg">
              Player Pool
            </Text>
            <Text fontSize="sm" color="gray.400">
              Paste RSNs. One per line or comma-separated. WOM stats will be fetched on creation.
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

        {/* navigation */}
        <HStack justify="space-between" mt={6}>
          <Button
            variant="ghost"
            color="white"
            onClick={() => setStep((s) => s - 1)}
            isDisabled={step === 0}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button colorScheme="purple" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Fetching stats..."
              isDisabled={getRsns().length < numTeams}
            >
              Create Room
            </Button>
          )}
        </HStack>
      </Box>
    </Box>
  );
}
