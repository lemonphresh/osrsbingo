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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREATE_DRAFT_ROOM } from '../../graphql/draftOperations';
import { useToastContext } from '../../providers/ToastProvider';

const STEPS = ['Room Setup', 'Player Pool'];

const TIER_PRESETS = {
  'All-Rounder': {
    ehpWeight: 1,
    ehbWeight: 1,
    totalLevelWeight: 0.5,
    ehbyWeight: 1.5,
    ehpyWeight: 0,
    coxWeight: 0.1,
    tobWeight: 0.15,
    toaWeight: 0.1,
  },
  'PvM Focused': {
    ehpWeight: 0.5,
    ehbWeight: 2.0,
    totalLevelWeight: 0.25,
    ehbyWeight: 1.0,
    ehpyWeight: 0,
    coxWeight: 0.1,
    tobWeight: 0.15,
    toaWeight: 0.1,
  },
  'Skilling Focused': {
    ehpWeight: 2.0,
    ehbWeight: 0,
    totalLevelWeight: 1.0,
    ehbyWeight: 0,
    ehpyWeight: 2.0,
    coxWeight: 0,
    tobWeight: 0,
    toaWeight: 0,
  },
  'Raid Specialist': {
    ehpWeight: 0.25,
    ehbWeight: 1.5,
    totalLevelWeight: 0,
    ehbyWeight: 0.5,
    ehpyWeight: 0,
    coxWeight: 0.25,
    tobWeight: 0.3,
    toaWeight: 0.25,
  },
};

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
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isTierInfoOpen, setIsTierInfoOpen] = useState(false);

  // Step 1
  const [roomName, setRoomName] = useState('');
  const [format, setFormat] = useState('SNAKE');
  const [numTeams, setNumTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [pin, setPin] = useState('');
  const [pickTime, setPickTime] = useState('60');
  const [picksPerTurn, setPicksPerTurn] = useState(1);

  // Tier badges (advanced, in Step 1 accordion)
  const [useTiers, setUseTiers] = useState(false);
  const [ehpWeight, setEhpWeight] = useState(1);
  const [ehbWeight, setEhbWeight] = useState(1);
  const [totalLevelWeight, setTotalLevelWeight] = useState(0.5);
  const [ehbyWeight, setEhbyWeight] = useState(1.5);
  const [ehpyWeight, setEhpyWeight] = useState(0);
  const [coxWeight, setCoxWeight] = useState(0.1);
  const [tobWeight, setTobWeight] = useState(0.15);
  const [toaWeight, setToaWeight] = useState(0.1);

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
    if (format !== 'AUCTION' && picksPerTurn * numTeams > rsns.length) {
      return showToast(
        `${picksPerTurn} picks/turn × ${numTeams} teams needs at least ${
          picksPerTurn * numTeams
        } players (got ${rsns.length})`,
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
          picksPerTurn: format !== 'AUCTION' ? Math.max(1, Math.min(5, picksPerTurn)) : 1,
          tierFormula: useTiers
            ? {
                ehpWeight,
                ehbWeight,
                totalLevelWeight,
                ehbyWeight,
                ehpyWeight,
                coxWeight,
                tobWeight,
                toaWeight,
              }
            : null,
          roomPin: pin || null,
        },
      },
    });

    if (result?.data?.createDraftRoom?.roomId) {
      navigate(`/blind-draft/${result.data.createDraftRoom.roomId}`);
    }
  }

  function applyPreset(name) {
    const p = TIER_PRESETS[name];
    setSelectedPreset(name);
    setEhpWeight(p.ehpWeight);
    setEhbWeight(p.ehbWeight);
    setTotalLevelWeight(p.totalLevelWeight);
    setEhbyWeight(p.ehbyWeight);
    setEhpyWeight(p.ehpyWeight);
    setCoxWeight(p.coxWeight);
    setTobWeight(p.tobWeight);
    setToaWeight(p.toaWeight);
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
              <Select value={format} onChange={(e) => setFormat(e.target.value)} mb={2} bg="gray.700" color="gray.100" borderColor="gray.600">
                <option value="SNAKE" style={{ background: '#2D3748', color: '#E2E8F0' }}>Snake</option>
                <option value="LINEAR" style={{ background: '#2D3748', color: '#E2E8F0' }}>Linear</option>
                <option value="AUCTION" style={{ background: '#2D3748', color: '#E2E8F0' }}>Auction</option>
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

              {format !== 'AUCTION' && (
                <Box>
                  <Text fontSize="sm" mb={1}>
                    Picks Per Turn
                  </Text>
                  <NumberInput
                    min={1}
                    max={5}
                    value={picksPerTurn}
                    onChange={(valStr) => setPicksPerTurn(valStr)}
                    onBlur={() => {
                      const n = parseInt(picksPerTurn, 10);
                      setPicksPerTurn(String(Math.max(1, Math.min(5, isNaN(n) ? 1 : n))));
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
              )}

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
                      <VStack spacing={3} w="100%" align="stretch" pl={4}>
                        {/* preset buttons — ADD THIS BLOCK */}
                        <Box w="100%">
                          <Text fontSize="xs" color="gray.500" mb={2}>
                            Start with a preset:
                          </Text>
                          <HStack justifyContent="center" spacing={2} flexWrap="wrap">
                            {Object.keys(TIER_PRESETS).map((name) => (
                              <Button
                                key={name}
                                size="xs"
                                variant={selectedPreset === name ? 'solid' : 'outline'}
                                colorScheme="yellow"
                                onClick={() => applyPreset(name)}
                              >
                                {name}
                              </Button>
                            ))}
                          </HStack>
                        </Box>
                        <Button
                          variant="link"
                          size="xs"
                          color="gray.500"
                          fontWeight="normal"
                          onClick={() => setIsTierInfoOpen(true)}
                          textDecoration="underline"
                          _hover={{ color: 'gray.300' }}
                        >
                          What do these mean?
                        </Button>
                        <Text fontSize="xs" color="gray.400">
                          Tier scores are a weighted sum of each stat. Tier scores are a weighted
                          sum of each stat. EHP, EHB, yearly EHB, and yearly EHP are in the same
                          range (~0–500) so their weights are directly comparable. Total Level is
                          normalized to 0–100. Raid KCs are raw kill counts (i.e. 500 CoX), so use
                          small weights like 0.1–0.2 to keep them balanced.
                        </Text>
                      </VStack>
                    )}

                    {useTiers && selectedPreset && (
                      <VStack spacing={3} align="stretch" pl={4}>
                        {[
                          { label: 'EHP Weight', value: ehpWeight, set: setEhpWeight },
                          { label: 'EHB Weight', value: ehbWeight, set: setEhbWeight },
                          {
                            label: 'Total Level Weight',
                            value: totalLevelWeight,
                            set: setTotalLevelWeight,
                          },
                          { label: 'Yearly EHB Weight', value: ehbyWeight, set: setEhbyWeight },
                          { label: 'Yearly EHP Weight', value: ehpyWeight, set: setEhpyWeight },
                          { label: 'CoX KC Weight', value: coxWeight, set: setCoxWeight },
                          { label: 'ToB KC Weight', value: tobWeight, set: setTobWeight },
                          { label: 'ToA KC Weight', value: toaWeight, set: setToaWeight },
                        ].map(({ label, value, set }) => (
                          <Box key={label}>
                            <HStack justify="space-between">
                              <Text fontSize="sm">{label}</Text>
                              <Text fontSize="sm" fontWeight="bold">
                                {value.toFixed(2)}
                              </Text>
                            </HStack>
                            <Slider
                              min={0}
                              max={3}
                              step={0.05}
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
            <Button
              colorScheme="purple"
              onClick={() => setStep((s) => s + 1)}
              isDisabled={step === 0 && !roomName.trim()}
            >
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
      <Modal isOpen={isTierInfoOpen} onClose={() => setIsTierInfoOpen(false)} size="md" isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.600" border="1px solid">
          <ModalHeader color="white" fontSize="md" pb={2}>
            Tier Badge Weights — What Do They Mean?
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="xs" color="gray.400">
                Each player gets a tier score (S/A/B/C/D) based on a weighted sum of their stats.
                Higher weight = that stat matters more when ranking players. Set a weight to 0 to
                ignore it entirely.
              </Text>

              {[
                {
                  label: 'EHP — Efficient Hours Played',
                  color: 'green.300',
                  desc: 'Lifetime skilling hours, calculated by WOM based on XP rates. A reliable proxy for how long and seriously someone has played. Maxed skillers sit around 800–1200 EHP.',
                },
                {
                  label: 'EHB — Efficient Hours Bossing',
                  color: 'red.300',
                  desc: 'Lifetime bossing hours based on kill counts. High EHB means someone spends serious time at bosses. Most active PvMers sit in the 100–500 range.',
                },
                {
                  label: 'Total Level',
                  color: 'yellow.300',
                  desc: 'Sum of all skill levels, max 2376. Normalized to 0–100 in the formula so it stays comparable to EHP/EHB. Good signal for overall account progression.',
                },
                {
                  label: 'Yearly EHB',
                  color: 'orange.300',
                  desc: 'EHB gained in the last 12 months. Measures recent bossing activity rather than lifetime totals, useful for events where you care how active someone currently is.',
                },
                {
                  label: 'Yearly EHP',
                  color: 'teal.300',
                  desc: 'EHP gained in the last 12 months. Measures recent skilling activity. Most useful for skilling-focused events where current grind effort matters.',
                },
                {
                  label: 'CoX / ToB / ToA KC Weights',
                  color: 'purple.300',
                  desc: 'Raw kill counts for Chambers of Xeric, Theatre of Blood, and Tombs of Amascut. These are large numbers (hundreds to thousands) so keep weights small: 0.1 to 0.3 is usually enough to give raids meaningful influence without dominating the score.',
                },
              ].map(({ label, color, desc }) => (
                <Box key={label}>
                  <Text fontSize="xs" fontWeight="bold" color={color} mb={0.5}>
                    {label}
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    {desc}
                  </Text>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
