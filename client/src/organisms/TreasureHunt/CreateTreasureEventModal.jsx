import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Button,
  SimpleGrid,
  Tooltip,
  Icon,
  HStack,
  Text,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { CREATE_TREASURE_EVENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import { useNavigate } from 'react-router-dom';
import ContentSelectionModal from './ContentSelectionModal';
import {
  dateTimeInputToISO,
  getTodayDateTimeInputValue,
  toDateTimeInputValue,
  getViewerTimezone,
} from '../../utils/dateUtils';

const MAX_TOTAL_PLAYERS = 150;
const MAX_GP = 20000000000;
const MIN_NODES_PER_INN = 3;
const MAX_NODES_PER_INN = 6;
const MAX_EVENT_DURATION_DAYS = 31;

export default function CreateEventModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [contentSelections, setContentSelections] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const { showToast } = useToastContext();

  const today = getTodayDateTimeInputValue();
  const viewerTZ = getViewerTimezone();

  const [formData, setFormData] = useState({
    eventName: '',
    prizePoolTotal: 500000000,
    numOfTeams: 5,
    playersPerTeam: 5,
    nodeToInnRatio: 5,
    difficulty: 'normal',
    startDate: '',
    endDate: '',
    estimatedHoursPerPlayerPerDay: 3.0,
  });

  const getMaxEndDate = () => {
    if (!formData.startDate) return '';
    const start = new Date(formData.startDate);
    const max = new Date(start);
    max.setDate(max.getDate() + MAX_EVENT_DURATION_DAYS);
    return toDateTimeInputValue(max.toISOString());
  };

  const getEventDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diff = new Date(formData.endDate) - new Date(formData.startDate);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const eventDuration = getEventDuration();
  const maxEndDate = getMaxEndDate();
  const totalPlayers = formData.numOfTeams * formData.playersPerTeam;

  const getMaxTeams = () =>
    formData.playersPerTeam === 0 ? 200 : Math.floor(MAX_TOTAL_PLAYERS / formData.playersPerTeam);

  const getMaxPlayersPerTeam = () =>
    formData.numOfTeams === 0 ? 200 : Math.floor(MAX_TOTAL_PLAYERS / formData.numOfTeams);

  const [createEvent, { loading }] = useMutation(CREATE_TREASURE_EVENT, {
    onCompleted: (data) => {
      showToast('Event created successfully!', 'success');
      if (onSuccess) onSuccess();
      navigate(`/gielinor-rush/${data.createTreasureEvent.eventId}`);
      onClose();
    },
    onError: (err) => showToast(`Error creating event: ${err.message}`, 'error'),
  });

  const handleInputChange = (field, value) => {
    if (typeof value === 'number' && isNaN(value)) value = 0;

    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'prizePoolTotal' && value > MAX_GP) {
        showToast(`Maximum prize pool is ${(MAX_GP / 1e9).toFixed(0)}B GP`, 'warning');
        return { ...prev, prizePoolTotal: MAX_GP };
      }

      if (field === 'nodeToInnRatio') {
        if (value < MIN_NODES_PER_INN) return { ...prev, nodeToInnRatio: MIN_NODES_PER_INN };
        if (value > MAX_NODES_PER_INN) return { ...prev, nodeToInnRatio: MAX_NODES_PER_INN };
      }

      if (field === 'endDate' && prev.startDate) {
        const diff = Math.ceil(
          (new Date(value) - new Date(prev.startDate)) / (1000 * 60 * 60 * 24)
        );
        if (diff > MAX_EVENT_DURATION_DAYS) {
          showToast(`Maximum event duration is ${MAX_EVENT_DURATION_DAYS} days`, 'warning');
          const max = new Date(prev.startDate);
          max.setDate(max.getDate() + MAX_EVENT_DURATION_DAYS);
          return { ...prev, endDate: toDateTimeInputValue(max.toISOString()) };
        }
      }

      if (field === 'startDate' && prev.endDate) {
        const diff = Math.ceil((new Date(prev.endDate) - new Date(value)) / (1000 * 60 * 60 * 24));
        if (diff > MAX_EVENT_DURATION_DAYS) {
          const max = new Date(value);
          max.setDate(max.getDate() + MAX_EVENT_DURATION_DAYS);
          return { ...prev, startDate: value, endDate: toDateTimeInputValue(max.toISOString()) };
        }
      }

      if (field === 'numOfTeams' || field === 'playersPerTeam') {
        const newTotal =
          field === 'numOfTeams' ? value * next.playersPerTeam : next.numOfTeams * value;
        if (newTotal > MAX_TOTAL_PLAYERS) {
          showToast(`Maximum total players is ${MAX_TOTAL_PLAYERS}.`, 'warning');
          if (field === 'numOfTeams') {
            return {
              ...prev,
              numOfTeams: value,
              playersPerTeam: Math.min(prev.playersPerTeam, Math.floor(MAX_TOTAL_PLAYERS / value)),
            };
          } else {
            return {
              ...prev,
              playersPerTeam: value,
              numOfTeams: Math.min(prev.numOfTeams, Math.floor(MAX_TOTAL_PLAYERS / value)),
            };
          }
        }
      }

      return next;
    });
  };

  const handleCreateEvent = async () => {
    const name = formData.eventName.trim();
    if (!name || name.length < 3 || name.length > 50) {
      showToast('Event name must be 3–50 characters', 'warning');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      showToast('Please select both start and end dates', 'warning');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start < new Date()) {
      showToast('Start date cannot be in the past', 'warning');
      return;
    }
    if (end <= start) {
      showToast('End date must be after start date', 'warning');
      return;
    }
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (duration > MAX_EVENT_DURATION_DAYS) {
      showToast(
        `Event duration (${duration} days) exceeds ${MAX_EVENT_DURATION_DAYS}-day maximum`,
        'error'
      );
      return;
    }
    if (totalPlayers > MAX_TOTAL_PLAYERS) {
      showToast(`Total players (${totalPlayers}) exceeds maximum of ${MAX_TOTAL_PLAYERS}`, 'error');
      return;
    }
    if (formData.prizePoolTotal > MAX_GP) {
      showToast(`Prize pool exceeds maximum of ${(MAX_GP / 1e9).toFixed(0)}B GP`, 'error');
      return;
    }

    try {
      await createEvent({
        variables: {
          input: {
            eventName: name,
            startDate: dateTimeInputToISO(formData.startDate),
            endDate: dateTimeInputToISO(formData.endDate),
            contentSelections,
            eventConfig: {
              prize_pool_total: formData.prizePoolTotal,
              num_of_teams: formData.numOfTeams,
              players_per_team: formData.playersPerTeam,
              node_to_inn_ratio: formData.nodeToInnRatio,
              difficulty: formData.difficulty,
              reward_split_ratio: { nodes: 0.6, inns: 0.25, bonus_tasks: 0.15 },
              keys_expire: true,
              estimated_hours_per_player_per_day: formData.estimatedHoursPerPlayerPerDay,
            },
          },
        },
      });
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  // ─── Shared styles ────────────────────────────────────────────────────────
  const inputStyles = {
    color: 'white',
    bg: 'gray.700',
    borderColor: 'gray.600',
    _hover: { borderColor: 'gray.500' },
    _focus: { borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' },
    _placeholder: { color: 'gray.400' },
  };

  const LabelWithTooltip = ({ label, tooltip }) => (
    <HStack spacing={1} mb={0}>
      <FormLabel color="gray.100" mb={0}>
        {label}
      </FormLabel>
      <Tooltip
        label={tooltip}
        placement="top"
        hasArrow
        bg="gray.600"
        color="white"
        fontSize="sm"
        maxW="300px"
      >
        <Icon as={InfoIcon} boxSize={3} color="gray.500" cursor="help" />
      </Tooltip>
    </HStack>
  );

  const mapStats = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const days = Math.ceil(
      (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)
    );
    const totalHours = formData.playersPerTeam * days * formData.estimatedHoursPerPlayerPerDay;
    const diffMult = { easy: 0.7, normal: 1.0, hard: 1.3, sweatlord: 1.6 };
    const hoursPerNode = 1.5 * (diffMult[formData.difficulty] || 1.0);
    const nodesNeeded = Math.ceil(totalHours / hoursPerNode);
    const locations = Math.ceil(nodesNeeded / 3);
    const inns = Math.floor(locations / formData.nodeToInnRatio);
    return { totalHours: Math.round(totalHours), locations, inns, days };
  };

  const stats = mapStats();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader color="white">Create New Gielinor Rush Event</ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* Event Name */}
            <FormControl isRequired>
              <LabelWithTooltip
                label="Event Name"
                tooltip="Give your Gielinor Rush a memorable name (i.e., 'Summer Bingo Bonanza')"
              />
              <Input
                placeholder="My Gielinor Rush"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                {...inputStyles}
              />
            </FormControl>

            {/* Dates */}
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <HStack justify="space-between" align="center" mb={1}>
                  <LabelWithTooltip
                    label="Start Date & Time"
                    tooltip="When teams can begin completing objectives. Entered in your local timezone."
                  />
                  <Text fontSize="xs" color="gray.500" flexShrink={0}>
                    {viewerTZ}
                  </Text>
                </HStack>
                <Input
                  type="datetime-local"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <HStack justify="space-between" align="center" mb={1}>
                  <LabelWithTooltip
                    label="End Date & Time"
                    tooltip={`Final deadline. Max ${MAX_EVENT_DURATION_DAYS} days from start.`}
                  />
                  <Text fontSize="xs" color="gray.500" flexShrink={0}>
                    {viewerTZ}
                  </Text>
                </HStack>
                <Input
                  type="datetime-local"
                  min={formData.startDate || today}
                  max={maxEndDate || undefined}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  {...inputStyles}
                />
              </FormControl>
            </SimpleGrid>

            {formData.startDate && formData.endDate && (
              <Text
                fontSize="sm"
                color={eventDuration > MAX_EVENT_DURATION_DAYS ? 'red.400' : 'gray.400'}
                fontWeight={eventDuration > MAX_EVENT_DURATION_DAYS ? 'bold' : 'normal'}
              >
                Event Duration: {eventDuration} day{eventDuration !== 1 ? 's' : ''} •{' '}
                {MAX_EVENT_DURATION_DAYS} days max
                {eventDuration > MAX_EVENT_DURATION_DAYS && ' ⚠️ Exceeds maximum!'}
              </Text>
            )}

            {/* Difficulty */}
            <FormControl isRequired>
              <LabelWithTooltip
                label="Difficulty Level"
                tooltip="Scales all objective requirements. Easy = 80%, Normal = 100%, Hard = 140%, Sweatlord = 200%"
              />
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                {...inputStyles}
              >
                <option value="easy" style={{ backgroundColor: '#2D3748' }}>
                  Easy (0.8x objectives) — Casual fun
                </option>
                <option value="normal" style={{ backgroundColor: '#2D3748' }}>
                  Normal (1.0x objectives) — Balanced
                </option>
                <option value="hard" style={{ backgroundColor: '#2D3748' }}>
                  Hard (1.4x objectives) — Challenging
                </option>
                <option value="sweatlord" style={{ backgroundColor: '#2D3748' }}>
                  Sweatlord (2.0x objectives) — Extreme
                </option>
              </Select>
            </FormControl>

            {/* Hours per player */}
            <FormControl isRequired>
              <LabelWithTooltip
                label="Est. Hours Per Player Per Day"
                tooltip="How many hours per day will each player dedicate on average? Affects map size."
              />
              <NumberInput
                value={formData.estimatedHoursPerPlayerPerDay}
                onChange={(_, val) => handleInputChange('estimatedHoursPerPlayerPerDay', val)}
                min={0.5}
                max={8}
                step={0.5}
              >
                <NumberInputField {...inputStyles} />
              </NumberInput>
              <HStack spacing={2} mt={2} flexWrap="wrap">
                {[
                  { label: 'Casual (1h)', v: 1 },
                  { label: 'Average (3h)', v: 3 },
                  { label: 'Dedicated (6h)', v: 6 },
                  { label: 'Sweatlord (10h)', v: 10 },
                ].map((p) => (
                  <Button
                    key={p.v}
                    size="xs"
                    onClick={() => handleInputChange('estimatedHoursPerPlayerPerDay', p.v)}
                    variant={formData.estimatedHoursPerPlayerPerDay === p.v ? 'solid' : 'outline'}
                    colorScheme="purple"
                  >
                    {p.label}
                  </Button>
                ))}
              </HStack>
              {stats && (
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Total per team: {formData.playersPerTeam} players × {stats.days} days ×{' '}
                  {formData.estimatedHoursPerPlayerPerDay}h = {stats.totalHours} player-hours
                </Text>
              )}
            </FormControl>

            {/* Content selection */}
            <Button colorScheme="green" onClick={() => setShowContentModal(true)} w="full">
              {contentSelections ? '✓ Edit Content Selection' : 'Specify Content Selection'}
            </Button>
            <ContentSelectionModal
              isOpen={showContentModal}
              onClose={() => setShowContentModal(false)}
              currentSelections={contentSelections}
              onSave={(s) => {
                setContentSelections(s);
                setShowContentModal(false);
              }}
            />

            {/* Prize pool */}
            <FormControl isRequired>
              <LabelWithTooltip
                label="Total Prize Pool (GP)"
                tooltip={`Total GP split among teams. Each team targets ${(
                  formData.prizePoolTotal /
                  Math.max(formData.numOfTeams, 1) /
                  1e6
                ).toFixed(1)}M GP.`}
              />
              <NumberInput
                value={formData.prizePoolTotal}
                onChange={(_, val) => handleInputChange('prizePoolTotal', val)}
                min={0}
                max={MAX_GP}
              >
                <NumberInputField {...inputStyles} />
              </NumberInput>
              <Text fontSize="xs" color="gray.400" mt={1}>
                Per team goal:{' '}
                {(formData.prizePoolTotal / Math.max(formData.numOfTeams, 1) / 1e6).toFixed(1)}M GP
                • Total: {(formData.prizePoolTotal / 1e6).toFixed(1)}M GP • Max:{' '}
                {(MAX_GP / 1e9).toFixed(0)}B GP
              </Text>
            </FormControl>

            {/* Teams + players */}
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <LabelWithTooltip
                  label="Number of Teams"
                  tooltip={`How many teams will compete. Max ${getMaxTeams()} with ${
                    formData.playersPerTeam
                  } players each.`}
                />
                <NumberInput
                  value={formData.numOfTeams}
                  onChange={(_, val) => handleInputChange('numOfTeams', val)}
                  min={1}
                  max={getMaxTeams()}
                >
                  <NumberInputField {...inputStyles} />
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <LabelWithTooltip
                  label="Players per Team"
                  tooltip={`Max ${getMaxPlayersPerTeam()} players across ${
                    formData.numOfTeams
                  } teams.`}
                />
                <NumberInput
                  value={formData.playersPerTeam}
                  onChange={(_, val) => handleInputChange('playersPerTeam', val)}
                  min={1}
                  max={getMaxPlayersPerTeam()}
                >
                  <NumberInputField {...inputStyles} />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <Text
              fontSize="sm"
              color={totalPlayers > MAX_TOTAL_PLAYERS ? 'red.400' : 'gray.400'}
              fontWeight={totalPlayers > MAX_TOTAL_PLAYERS ? 'bold' : 'normal'}
            >
              Total Players: {totalPlayers} / {MAX_TOTAL_PLAYERS}
              {totalPlayers > MAX_TOTAL_PLAYERS && ' ⚠️ Exceeds maximum!'}
            </Text>

            {/* Nodes per inn */}
            <FormControl isRequired>
              <LabelWithTooltip
                label="Nodes per Inn"
                tooltip={`How many objective nodes between each Inn checkpoint. Range: ${MIN_NODES_PER_INN}–${MAX_NODES_PER_INN}. Lower = more trading opportunities.`}
              />
              <NumberInput
                value={formData.nodeToInnRatio}
                onChange={(_, val) => handleInputChange('nodeToInnRatio', val)}
                min={MIN_NODES_PER_INN}
                max={MAX_NODES_PER_INN}
              >
                <NumberInputField {...inputStyles} />
              </NumberInput>
              <Text fontSize="xs" color="gray.400" mt={1}>
                Range: {MIN_NODES_PER_INN}–{MAX_NODES_PER_INN} nodes per Inn
              </Text>
            </FormControl>

            {/* Map preview */}
            <VStack w="full" p={3} bg="whiteAlpha.100" borderRadius="md" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="white">
                📊 Map Preview (Per Team)
              </Text>
              <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
                <VStack spacing={0}>
                  <Text color="gray.400">Player Hours</Text>
                  <Text fontWeight="semibold" color="white">
                    {stats ? `${stats.totalHours}h` : '?'}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.400">Total Locations</Text>
                  <Text fontWeight="semibold" color="white">
                    ~{stats ? stats.locations : '?'}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.400">Inns</Text>
                  <Text fontWeight="semibold" color="white">
                    ~{stats ? stats.inns : '?'}
                  </Text>
                </VStack>
              </SimpleGrid>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                All {formData.numOfTeams} teams race through the same map
              </Text>
            </VStack>

            <Button
              bg="purple.500"
              color="white"
              _hover={{ bg: 'purple.400' }}
              w="full"
              onClick={handleCreateEvent}
              isLoading={loading}
              size="lg"
              isDisabled={
                totalPlayers > MAX_TOTAL_PLAYERS || eventDuration > MAX_EVENT_DURATION_DAYS
              }
            >
              Create Event
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
