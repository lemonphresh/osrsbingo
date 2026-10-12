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
import { getWomErrorMessage, WOM_ERROR_TOAST_DURATION } from '../../utils/womErrorMessage';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';

const STEPS = ['Room Setup', 'Player Pool'];

const TIER_PRESETS = {
  'All-Rounder': {
    ehpWeight: 1, ehbWeight: 1, totalLevelWeight: 0.5, ehbyWeight: 1.5, ehpyWeight: 0,
    coxWeight: 0.1, tobWeight: 0.15, toaWeight: 0.1,
  },
  'PvM Focused': {
    ehpWeight: 0.5, ehbWeight: 2.0, totalLevelWeight: 0.25, ehbyWeight: 1.0, ehpyWeight: 0,
    coxWeight: 0.1, tobWeight: 0.15, toaWeight: 0.1,
  },
  'Skilling Focused': {
    ehpWeight: 2.0, ehbWeight: 0, totalLevelWeight: 1.0, ehbyWeight: 0, ehpyWeight: 2.0,
    coxWeight: 0, tobWeight: 0, toaWeight: 0,
  },
  'Raid Specialist': {
    ehpWeight: 0.25, ehbWeight: 1.5, totalLevelWeight: 0, ehbyWeight: 0.5, ehpyWeight: 0,
    coxWeight: 0.25, tobWeight: 0.3, toaWeight: 0.25,
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

// Compact mono-styled form field label used throughout the HUD form.
function FieldLabel({ children, ...rest }) {
  return (
    <Text
      fontFamily={HUD_FONT_MONO}
      fontSize="10px"
      color={HUD.textSecondary}
      textTransform="uppercase"
      letterSpacing="0.15em"
      mb={1.5}
      {...rest}
    >
      {children}
    </Text>
  );
}

// Shared Input styles for the HUD form — cyan focus ring, mono fonts
// optional via explicit fontFamily on the caller.
const hudInputStyles = {
  bg: HUD.bgRecessed,
  borderColor: HUD.border,
  color: HUD.textPrimary,
  _hover: { borderColor: HUD.borderBright },
  _focus: { borderColor: HUD.cyan, boxShadow: `0 0 0 1px ${HUD.cyan}` },
  _placeholder: { color: HUD.textMuted },
};

// Mini chip-style preset button. Mirrors the balancer's preset chips.
function PresetChip({ active, onClick, children }) {
  return (
    <Button
      size="xs"
      onClick={onClick}
      bg={active ? HUD.cyanGlow : 'transparent'}
      color={active ? HUD.cyan : HUD.textSecondary}
      borderWidth="1px"
      borderStyle="solid"
      borderColor={active ? HUD.cyan : HUD.border}
      borderRadius="2px"
      fontFamily={HUD_FONT_MONO}
      fontSize="11px"
      fontWeight="500"
      textTransform="uppercase"
      letterSpacing="0.08em"
      px={3}
      h="28px"
      boxShadow={active ? `0 0 10px ${HUD.cyanGlow}` : 'none'}
      _hover={{
        bg: active ? HUD.cyanGlow : HUD.bgElevated,
        borderColor: active ? HUD.cyan : HUD.borderBright,
        color: active ? HUD.cyan : HUD.textPrimary,
      }}
    >
      {children}
    </Button>
  );
}

export default function CreateRoomForm() {
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isTierInfoOpen, setIsTierInfoOpen] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [format, setFormat] = useState('SNAKE');
  const [numTeams, setNumTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [pin, setPin] = useState('');
  const [pickTime, setPickTime] = useState('60');
  const [picksPerTurn, setPicksPerTurn] = useState(1);

  const [useTiers, setUseTiers] = useState(false);
  const [ehpWeight, setEhpWeight] = useState(1);
  const [ehbWeight, setEhbWeight] = useState(1);
  const [totalLevelWeight, setTotalLevelWeight] = useState(0.5);
  const [ehbyWeight, setEhbyWeight] = useState(1.5);
  const [ehpyWeight, setEhpyWeight] = useState(0);
  const [coxWeight, setCoxWeight] = useState(0.1);
  const [tobWeight, setTobWeight] = useState(0.15);
  const [toaWeight, setToaWeight] = useState(0.1);

  const [rsnText, setRsnText] = useState('');

  const [createRoom, { loading }] = useMutation(CREATE_DRAFT_ROOM, {
    onError: (e) => showToast(getWomErrorMessage(e), 'error', WOM_ERROR_TOAST_DURATION),
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
        `Not enough players. Add at least ${numTeams} RSNs for ${numTeams} teams.`,
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
                ehpWeight, ehbWeight, totalLevelWeight, ehbyWeight, ehpyWeight,
                coxWeight, tobWeight, toaWeight,
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
          <HStack key={label} spacing={2}>
            <Box
              w={6}
              h={6}
              borderRadius="2px"
              borderWidth="1px"
              borderStyle="solid"
              borderColor={i <= step ? HUD.cyan : HUD.border}
              bg={i <= step ? HUD.cyanGlow : 'transparent'}
              boxShadow={i === step ? `0 0 10px ${HUD.cyanGlow}` : 'none'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontFamily={HUD_FONT_MONO}
                fontSize="10px"
                fontWeight="600"
                color={i <= step ? HUD.cyan : HUD.textMuted}
                letterSpacing="0.05em"
              >
                {String(i + 1).padStart(2, '0')}
              </Text>
            </Box>
            <Text
              fontFamily={HUD_FONT_MONO}
              fontSize="10px"
              color={i === step ? HUD.cyan : HUD.textSecondary}
              textTransform="uppercase"
              letterSpacing="0.15em"
            >
              {label}
            </Text>
            {i < STEPS.length - 1 && (
              <Text color={HUD.textMuted} mx={1}>
                →
              </Text>
            )}
          </HStack>
        ))}
      </HStack>

      <Box
        bg={HUD.bgSurface}
        borderRadius="2px"
        p={6}
        border="1px solid"
        borderColor={HUD.border}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bg: `linear-gradient(90deg, transparent 0%, ${HUD.cyan} 20%, ${HUD.cyan} 80%, transparent 100%)`,
          opacity: 0.4,
        }}
      >
        {/* step 1: Room Setup */}
        {step === 0 && (
          <VStack spacing={5} align="stretch">
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="lg"
              color={HUD.textPrimary}
              letterSpacing="-0.01em"
            >
              Room Setup
            </Text>

            <Box>
              <FieldLabel>Room Name *</FieldLabel>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Spring Clan Draft 2026"
                {...hudInputStyles}
              />
            </Box>

            <Box>
              <FieldLabel>Draft Format</FieldLabel>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                mb={3}
                {...hudInputStyles}
              >
                <option value="SNAKE" style={{ background: HUD.bgRecessed, color: HUD.textPrimary }}>Snake</option>
                <option value="LINEAR" style={{ background: HUD.bgRecessed, color: HUD.textPrimary }}>Linear</option>
                <option value="AUCTION" style={{ background: HUD.bgRecessed, color: HUD.textPrimary }}>Auction</option>
              </Select>
              {FORMAT_INFO[format] && (
                <Box
                  bg={HUD.bgRecessed}
                  borderRadius="2px"
                  px={3}
                  py={2.5}
                  borderLeft="3px solid"
                  borderColor={HUD.cyan}
                  boxShadow={`0 0 8px ${HUD.cyanGlow}`}
                >
                  <Text
                    fontFamily={HUD_FONT_MONO}
                    fontSize="10px"
                    fontWeight="500"
                    color={HUD.cyan}
                    mb={1}
                    textTransform="uppercase"
                    letterSpacing="0.15em"
                  >
                    {FORMAT_INFO[format].label}
                  </Text>
                  <Text fontSize="xs" color={HUD.textSecondary} mb={1.5} lineHeight="1.6">
                    {FORMAT_INFO[format].summary}
                  </Text>
                  <Text fontSize="xs" color={HUD.textMuted} fontFamily={HUD_FONT_MONO}>
                    {FORMAT_INFO[format].example}
                  </Text>
                </Box>
              )}
            </Box>

            <Box>
              <FieldLabel>Number of Teams (2–10)</FieldLabel>
              <NumberInput
                min={2}
                max={10}
                value={numTeams}
                onChange={(_, v) => handleNumTeamsChange(v)}
                maxW="120px"
              >
                <NumberInputField {...hudInputStyles} />
                <NumberInputStepper>
                  <NumberIncrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                  <NumberDecrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                </NumberInputStepper>
              </NumberInput>
            </Box>

            <Box>
              <FieldLabel>Team Names</FieldLabel>
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
                    {...hudInputStyles}
                  />
                ))}
              </SimpleGrid>
            </Box>

            <HStack spacing={4} flexWrap="wrap">
              <Box>
                <FieldLabel>Pick Timer (sec)</FieldLabel>
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
                  <NumberInputField {...hudInputStyles} />
                  <NumberInputStepper>
                    <NumberIncrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                    <NumberDecrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              {format !== 'AUCTION' && (
                <Box>
                  <FieldLabel>Picks Per Turn</FieldLabel>
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
                    <NumberInputField {...hudInputStyles} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                      <NumberDecrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
              )}

              <Box>
                <FieldLabel>Room PIN (optional)</FieldLabel>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Leave blank for open"
                  maxW="200px"
                  {...hudInputStyles}
                />
              </Box>
            </HStack>

            <Divider borderColor={HUD.border} />

            {/* advanced: tier badges */}
            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
                  <Text
                    fontFamily={HUD_FONT_MONO}
                    fontSize="10px"
                    color={HUD.textSecondary}
                    flex={1}
                    textAlign="left"
                    textTransform="uppercase"
                    letterSpacing="0.2em"
                  >
                    [ Advanced: Tier Badges ]
                  </Text>
                  <AccordionIcon color={HUD.textMuted} />
                </AccordionButton>
                <AccordionPanel pb={0} px={0}>
                  <VStack spacing={3} align="stretch" pt={2}>
                    <Checkbox
                      isChecked={useTiers}
                      onChange={(e) => setUseTiers(e.target.checked)}
                      colorScheme="cyan"
                    >
                      <Text fontSize="sm" color={HUD.textSecondary}>
                        Enable Tier Badges (S/A/B/C/D) on player cards
                      </Text>
                    </Checkbox>
                    {useTiers && (
                      <VStack spacing={3} w="100%" align="stretch" pl={4}>
                        <Box w="100%">
                          <FieldLabel mb={2}>Start with a preset</FieldLabel>
                          <HStack justifyContent="flex-start" spacing={1.5} flexWrap="wrap">
                            {Object.keys(TIER_PRESETS).map((name) => (
                              <PresetChip
                                key={name}
                                active={selectedPreset === name}
                                onClick={() => applyPreset(name)}
                              >
                                {name}
                              </PresetChip>
                            ))}
                          </HStack>
                        </Box>
                        <Button
                          variant="link"
                          size="xs"
                          color={HUD.textMuted}
                          fontWeight="normal"
                          fontFamily={HUD_FONT_MONO}
                          fontSize="10px"
                          onClick={() => setIsTierInfoOpen(true)}
                          textDecoration="underline"
                          alignSelf="flex-start"
                          _hover={{ color: HUD.cyan }}
                          textTransform="uppercase"
                          letterSpacing="0.1em"
                        >
                          What do these mean?
                        </Button>
                        <Text fontSize="xs" color={HUD.textMuted} lineHeight="1.6">
                          Tier scores are a weighted sum of each stat. EHP, EHB, yearly EHB, and
                          yearly EHP are in the same range (~0–500) so their weights are directly
                          comparable. Total Level is normalized to 0–100. Raid KCs are raw kill
                          counts (i.e. 500 CoX), so use small weights like 0.1–0.2 to keep them
                          balanced.
                        </Text>
                      </VStack>
                    )}

                    {useTiers && selectedPreset && (
                      <VStack spacing={3} align="stretch" pl={4}>
                        {[
                          { label: 'EHP Weight', value: ehpWeight, set: setEhpWeight },
                          { label: 'EHB Weight', value: ehbWeight, set: setEhbWeight },
                          { label: 'Total Level Weight', value: totalLevelWeight, set: setTotalLevelWeight },
                          { label: 'Yearly EHB Weight', value: ehbyWeight, set: setEhbyWeight },
                          { label: 'Yearly EHP Weight', value: ehpyWeight, set: setEhpyWeight },
                          { label: 'CoX KC Weight', value: coxWeight, set: setCoxWeight },
                          { label: 'ToB KC Weight', value: tobWeight, set: setTobWeight },
                          { label: 'ToA KC Weight', value: toaWeight, set: setToaWeight },
                        ].map(({ label, value, set }) => (
                          <Box key={label}>
                            <HStack justify="space-between" mb={1}>
                              <Text
                                fontFamily={HUD_FONT_MONO}
                                fontSize="10px"
                                color={HUD.textSecondary}
                                textTransform="uppercase"
                                letterSpacing="0.1em"
                              >
                                {label}
                              </Text>
                              <Text
                                fontFamily={HUD_FONT_MONO}
                                fontSize="xs"
                                fontWeight="600"
                                color={HUD.cyan}
                              >
                                {value.toFixed(2)}
                              </Text>
                            </HStack>
                            <Slider
                              min={0}
                              max={3}
                              step={0.05}
                              value={value}
                              onChange={(v) => set(v)}
                              focusThumbOnChange={false}
                            >
                              <SliderTrack bg={HUD.bgRecessed}>
                                <SliderFilledTrack bg={HUD.cyan} />
                              </SliderTrack>
                              <SliderThumb boxSize={3} bg={HUD.cyan} borderColor={HUD.cyan} />
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
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="lg"
              color={HUD.textPrimary}
              letterSpacing="-0.01em"
            >
              Player Pool
            </Text>
            <Text fontSize="sm" color={HUD.textSecondary} lineHeight="1.6">
              Paste RSNs. One per line or comma-separated. WOM stats will be fetched on creation.
            </Text>
            <Textarea
              value={rsnText}
              onChange={(e) => setRsnText(e.target.value)}
              placeholder={'Zezima\nWoox\nB0aty\nPvM King\n...'}
              minH="200px"
              fontFamily={HUD_FONT_MONO}
              fontSize="sm"
              {...hudInputStyles}
            />
            <Text
              fontFamily={HUD_FONT_MONO}
              fontSize="10px"
              color={getRsns().length >= numTeams ? HUD.cyan : HUD.amber}
              textTransform="uppercase"
              letterSpacing="0.1em"
            >
              {getRsns().length} player{getRsns().length !== 1 ? 's' : ''} entered
              {getRsns().length < numTeams ? ` · need ${numTeams}+` : ''}
            </Text>
          </VStack>
        )}

        {/* navigation */}
        <HStack justify="space-between" mt={7}>
          <Button
            onClick={() => setStep((s) => s - 1)}
            isDisabled={step === 0}
            bg="transparent"
            color={HUD.textSecondary}
            borderWidth="1px"
            borderStyle="solid"
            borderColor={HUD.border}
            borderRadius="2px"
            fontFamily={HUD_FONT_MONO}
            fontSize="11px"
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing="0.1em"
            h="36px"
            px={4}
            _hover={{ bg: HUD.bgElevated, borderColor: HUD.borderBright, color: HUD.textPrimary }}
            _disabled={{ opacity: 0.3, cursor: 'not-allowed', _hover: {} }}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              isDisabled={step === 0 && !roomName.trim()}
              bg={HUD.cyan}
              color={HUD.bgDeep}
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="0.15em"
              h="40px"
              px={6}
              borderRadius="2px"
              boxShadow={`0 0 16px ${HUD.cyanGlow}, inset 0 0 0 1px ${HUD.cyan}`}
              _hover={{
                filter: 'brightness(1.1)',
                boxShadow: `0 0 24px ${HUD.cyan}, inset 0 0 0 1px ${HUD.cyan}`,
              }}
              _active={{ filter: 'brightness(0.95)' }}
              _disabled={{
                bg: HUD.bgElevated,
                color: HUD.textMuted,
                boxShadow: 'none',
                cursor: 'not-allowed',
                _hover: {},
              }}
            >
              Next ▸
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Fetching stats..."
              isDisabled={getRsns().length < numTeams}
              bg={HUD.cyan}
              color={HUD.bgDeep}
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="0.15em"
              h="40px"
              px={6}
              borderRadius="2px"
              boxShadow={`0 0 16px ${HUD.cyanGlow}, inset 0 0 0 1px ${HUD.cyan}`}
              _hover={{
                filter: 'brightness(1.1)',
                boxShadow: `0 0 24px ${HUD.cyan}, inset 0 0 0 1px ${HUD.cyan}`,
              }}
              _active={{ filter: 'brightness(0.95)' }}
              _disabled={{
                bg: HUD.bgElevated,
                color: HUD.textMuted,
                boxShadow: 'none',
                cursor: 'not-allowed',
                _hover: {},
              }}
            >
              ▸ Create Room
            </Button>
          )}
        </HStack>
      </Box>
      <Modal isOpen={isTierInfoOpen} onClose={() => setIsTierInfoOpen(false)} size="md" isCentered>
        <ModalOverlay bg="rgba(6, 9, 18, 0.75)" />
        <ModalContent bg={HUD.bgSurface} borderColor={HUD.border} border="1px solid" borderRadius="2px">
          <ModalHeader
            fontFamily={HUD_FONT_DISPLAY}
            color={HUD.textPrimary}
            fontSize="md"
            fontWeight="700"
            pb={2}
            borderBottom="1px solid"
            borderColor={HUD.border}
          >
            Tier Badge Weights: What Do They Mean?
          </ModalHeader>
          <ModalCloseButton color={HUD.textSecondary} _hover={{ color: HUD.cyan }} />
          <ModalBody pb={6} pt={4}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="xs" color={HUD.textSecondary} lineHeight="1.6">
                Each player gets a tier score (S/A/B/C/D) based on a weighted sum of their stats.
                Higher weight = that stat matters more when ranking players. Set a weight to 0 to
                ignore it entirely.
              </Text>

              {[
                {
                  label: 'EHP: Efficient Hours Played',
                  desc: 'Lifetime skilling hours, calculated by WOM based on XP rates. A reliable proxy for how long and seriously someone has played. Maxed skillers sit around 800–1200 EHP.',
                },
                {
                  label: 'EHB: Efficient Hours Bossing',
                  desc: 'Lifetime bossing hours based on kill counts. High EHB means someone spends serious time at bosses. Most active PvMers sit in the 100–500 range.',
                },
                {
                  label: 'Total Level',
                  desc: 'Sum of all skill levels, max 2376. Normalized to 0–100 in the formula so it stays comparable to EHP/EHB. Good signal for overall account progression.',
                },
                {
                  label: 'Yearly EHB',
                  desc: 'EHB gained in the last 12 months. Measures recent bossing activity rather than lifetime totals, useful for events where you care how active someone currently is.',
                },
                {
                  label: 'Yearly EHP',
                  desc: 'EHP gained in the last 12 months. Measures recent skilling activity. Most useful for skilling-focused events where current grind effort matters.',
                },
                {
                  label: 'CoX / ToB / ToA KC Weights',
                  desc: 'Raw kill counts for Chambers of Xeric, Theatre of Blood, and Tombs of Amascut. These are large numbers (hundreds to thousands) so keep weights small: 0.1 to 0.3 is usually enough to give raids meaningful influence without dominating the score.',
                },
              ].map(({ label, desc }) => (
                <Box key={label}>
                  <Text
                    fontFamily={HUD_FONT_MONO}
                    fontSize="10px"
                    fontWeight="500"
                    color={HUD.cyan}
                    mb={1}
                    textTransform="uppercase"
                    letterSpacing="0.12em"
                  >
                    {label}
                  </Text>
                  <Text fontSize="xs" color={HUD.textSecondary} lineHeight="1.6">
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
