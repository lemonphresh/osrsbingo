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
  useColorMode,
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
import { dateInputToISO, getTodayInputValue } from '../../utils/dateUtils';

const MAX_TOTAL_PLAYERS = 150;
const MAX_GP = 20000000000; // 20 billion
const MIN_NODES_PER_INN = 3;
const MAX_NODES_PER_INN = 6;
const MAX_EVENT_DURATION_DAYS = 31; // 1 month maximum

export default function CreateEventModal({ isOpen, onClose, onSuccess }) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const [contentSelections, setContentSelections] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const { showToast } = useToastContext();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      green: '#43AA8B',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#171923',
      cardBg: 'white',
      green: '#43AA8B',
    },
  };

  const currentColors = colors[colorMode];

  const [formData, setFormData] = useState({
    eventName: '',
    // clanId: '',
    prizePoolTotal: 500000000,
    numOfTeams: 5,
    playersPerTeam: 5,
    nodeToInnRatio: 5,
    difficulty: 'normal',
    startDate: '',
    endDate: '',
    estimatedHoursPerPlayerPerDay: 3.0,
  });

  const today = getTodayInputValue();

  // Calculate maximum end date (1 month from start date)
  const getMaxEndDate = () => {
    if (!formData.startDate) return '';
    const startDate = new Date(formData.startDate);
    const maxEndDate = new Date(startDate);
    maxEndDate.setDate(maxEndDate.getDate() + MAX_EVENT_DURATION_DAYS);
    return maxEndDate.toISOString().split('T')[0];
  };

  // Calculate event duration in days
  const getEventDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const eventDuration = getEventDuration();
  const maxEndDate = getMaxEndDate();

  const [createEvent, { loading }] = useMutation(CREATE_TREASURE_EVENT, {
    onCompleted: (data) => {
      showToast('Event created successfully!', 'success');
      if (onSuccess) onSuccess();
      navigate(`/gielinor-rush/${data.createTreasureEvent.eventId}`);
      onClose();
    },
    onError: (error) => {
      showToast(`Error creating event: ${error.message}`, 'error');
    },
  });

  // Calculate current total players
  const totalPlayers = formData.numOfTeams * formData.playersPerTeam;

  // Calculate max values based on current inputs
  const getMaxTeams = () => {
    if (formData.playersPerTeam === 0) return 200;
    return Math.floor(MAX_TOTAL_PLAYERS / formData.playersPerTeam);
  };

  const getMaxPlayersPerTeam = () => {
    if (formData.numOfTeams === 0) return 200;
    return Math.floor(MAX_TOTAL_PLAYERS / formData.numOfTeams);
  };

  const handleInputChange = (field, value) => {
    if (typeof value === 'number' && isNaN(value)) {
      value = 0;
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Enforce GP limit
      if (field === 'prizePoolTotal' && value > MAX_GP) {
        showToast(`Maximum prize pool is ${(MAX_GP / 1000000000).toFixed(0)}B GP`, 'warning');
        return { ...prev, prizePoolTotal: MAX_GP };
      }

      // Enforce nodes per inn limits
      if (field === 'nodeToInnRatio') {
        if (value < MIN_NODES_PER_INN) {
          return { ...prev, nodeToInnRatio: MIN_NODES_PER_INN };
        }
        if (value > MAX_NODES_PER_INN) {
          return { ...prev, nodeToInnRatio: MAX_NODES_PER_INN };
        }
      }

      // Enforce event duration limit
      if (field === 'endDate' && prev.startDate) {
        const start = new Date(prev.startDate);
        const end = new Date(value);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (diffDays > MAX_EVENT_DURATION_DAYS) {
          showToast(
            `Maximum event duration is ${MAX_EVENT_DURATION_DAYS} days (1 month)`,
            'warning'
          );
          // Auto-adjust to max allowed date
          const maxDate = new Date(start);
          maxDate.setDate(maxDate.getDate() + MAX_EVENT_DURATION_DAYS);
          return { ...prev, endDate: maxDate.toISOString().split('T')[0] };
        }
      }

      // If start date changes, validate end date doesn't exceed max duration
      if (field === 'startDate' && prev.endDate) {
        const start = new Date(value);
        const end = new Date(prev.endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (diffDays > MAX_EVENT_DURATION_DAYS) {
          // Auto-adjust end date to max allowed
          const maxDate = new Date(start);
          maxDate.setDate(maxDate.getDate() + MAX_EVENT_DURATION_DAYS);
          return {
            ...prev,
            startDate: value,
            endDate: maxDate.toISOString().split('T')[0],
          };
        }
      }

      // Enforce total player limit
      if (field === 'numOfTeams' || field === 'playersPerTeam') {
        const newTotalPlayers =
          field === 'numOfTeams' ? value * newData.playersPerTeam : newData.numOfTeams * value;

        if (newTotalPlayers > MAX_TOTAL_PLAYERS) {
          showToast(
            `Maximum total players is ${MAX_TOTAL_PLAYERS}. Adjust teams or players per team.`,
            'warning'
          );

          // Adjust the other field to stay within limit
          if (field === 'numOfTeams') {
            // Keep teams, adjust players per team
            const maxPlayersPerTeam = Math.floor(MAX_TOTAL_PLAYERS / value);
            return {
              ...prev,
              numOfTeams: value,
              playersPerTeam: Math.min(prev.playersPerTeam, maxPlayersPerTeam),
            };
          } else {
            // Keep players per team, adjust teams
            const maxTeams = Math.floor(MAX_TOTAL_PLAYERS / value);
            return {
              ...prev,
              playersPerTeam: value,
              numOfTeams: Math.min(prev.numOfTeams, maxTeams),
            };
          }
        }
      }

      return newData;
    });
  };

  const handleCreateEvent = async () => {
    if (
      !formData.eventName ||
      formData.eventName.trim().length < 3 ||
      formData.eventName.trim().length > 50
    ) {
      showToast('Event name must be 3-50 characters', 'warning');
      return;
    }

    // Validate dates
    if (!formData.startDate || !formData.endDate) {
      showToast('Please select both start and end dates', 'warning');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    const today = new Date().toISOString().split('T')[0];
    if (formData.startDate < today) {
      showToast('Start date cannot be in the past', 'warning');
      return;
    }

    if (end <= start) {
      showToast('End date must be after start date', 'warning');
      return;
    }

    // Validate event duration
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (duration > MAX_EVENT_DURATION_DAYS) {
      showToast(
        `Event duration (${duration} days) exceeds maximum of ${MAX_EVENT_DURATION_DAYS} days`,
        'error'
      );
      return;
    }

    // Validate total players
    if (totalPlayers > MAX_TOTAL_PLAYERS) {
      showToast(`Total players (${totalPlayers}) exceeds maximum of ${MAX_TOTAL_PLAYERS}`, 'error');
      return;
    }

    // Validate GP
    if (formData.prizePoolTotal > MAX_GP) {
      showToast(`Prize pool exceeds maximum of ${(MAX_GP / 1000000000).toFixed(0)}B GP`, 'error');
      return;
    }

    const startDate = dateInputToISO(formData.startDate, false);
    const endDate = dateInputToISO(formData.endDate, true);

    try {
      await createEvent({
        variables: {
          input: {
            eventName: formData.eventName,
            // clanId: formData.clanId || null,
            startDate: startDate,
            endDate: endDate,
            contentSelections,
            eventConfig: {
              prize_pool_total: formData.prizePoolTotal,
              num_of_teams: formData.numOfTeams,
              players_per_team: formData.playersPerTeam,
              node_to_inn_ratio: formData.nodeToInnRatio,
              difficulty: formData.difficulty,
              reward_split_ratio: {
                nodes: 0.6,
                inns: 0.25,
                bonus_tasks: 0.15,
              },
              keys_expire: true,
              estimated_hours_per_player_per_day: formData.estimatedHoursPerPlayerPerDay,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  // Helper component for label with tooltip
  const LabelWithTooltip = ({ label, tooltip }) => (
    <HStack spacing={1}>
      <FormLabel color={currentColors.textColor} mb={0}>
        {label}
      </FormLabel>
      <Tooltip
        label={tooltip}
        placement="top"
        hasArrow
        bg="gray.700"
        color="white"
        fontSize="sm"
        maxW="300px"
      >
        <Icon as={InfoIcon} boxSize={3} color="gray.500" cursor="help" />
      </Tooltip>
    </HStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Create New Gielinor Rush Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <LabelWithTooltip
                label="Event Name"
                tooltip="Give your Gielinor Rush a memorable name (i.e., 'Summer Bingo Bonanza')"
              />
              <Input
                placeholder="My Gielinor Rush"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl>

            {/* <FormControl>
              <LabelWithTooltip
                label="Clan ID (Optional)"
                tooltip="Your clan's identifier for Discord integration. Leave blank if not using Discord features."
              />
              <Input
                placeholder="cool_clan_123"
                value={formData.clanId}
                onChange={(e) => handleInputChange('clanId', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl> */}

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <LabelWithTooltip
                  label="Start Date"
                  tooltip="When teams can begin completing objectives"
                />
                <Input
                  type="date"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  color={currentColors.textColor}
                />
              </FormControl>

              <FormControl isRequired>
                <LabelWithTooltip
                  label="End Date"
                  tooltip={`Final deadline for objectives. Maximum duration: ${MAX_EVENT_DURATION_DAYS} days (1 month)`}
                />
                <Input
                  type="date"
                  min={formData.startDate || today}
                  max={maxEndDate || undefined}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  color={currentColors.textColor}
                />
              </FormControl>
            </SimpleGrid>

            {/* Event Duration Display */}
            {formData.startDate && formData.endDate && (
              <Text
                fontSize="sm"
                color={eventDuration > MAX_EVENT_DURATION_DAYS ? 'red.500' : 'gray.500'}
                fontWeight={eventDuration > MAX_EVENT_DURATION_DAYS ? 'bold' : 'normal'}
              >
                Event Duration: {eventDuration} day{eventDuration !== 1 ? 's' : ''} •{' '}
                {MAX_EVENT_DURATION_DAYS} days max
                {eventDuration > MAX_EVENT_DURATION_DAYS && ' ⚠️ Exceeds maximum!'}
              </Text>
            )}

            <FormControl isRequired>
              <LabelWithTooltip
                label="Difficulty Level"
                tooltip="Scales all objective requirements. Easy = 80%, Normal = 100%, Hard = 140%, Sweatlord = 200%"
              />
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                color={currentColors.textColor}
              >
                <option value="easy">Easy (0.8x objectives) - Casual fun</option>
                <option value="normal">Normal (1.0x objectives) - Balanced</option>
                <option value="hard">Hard (1.4x objectives) - Challenging</option>
                <option value="sweatlord">Sweatlord (2.0x objectives) - Extreme</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>
                Est. Hours Per Player Per Day
                <Tooltip label="How many hours per day will each player dedicate on average?">
                  <InfoIcon ml={2} />
                </Tooltip>
              </FormLabel>
              <NumberInput
                value={formData.estimatedHoursPerPlayerPerDay}
                onChange={(_, val) => handleInputChange('estimatedHoursPerPlayerPerDay', val)}
                min={0.5}
                max={8}
                step={0.5}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
              <HStack spacing={2} mt={2}>
                <Button
                  size="xs"
                  onClick={() => handleInputChange('estimatedHoursPerPlayerPerDay', 1)}
                  variant={formData.estimatedHoursPerPlayerPerDay === 1 ? 'solid' : 'outline'}
                  colorScheme="blue"
                >
                  Casual (1h)
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleInputChange('estimatedHoursPerPlayerPerDay', 3)}
                  variant={formData.estimatedHoursPerPlayerPerDay === 3 ? 'solid' : 'outline'}
                  colorScheme="blue"
                >
                  Average (3h)
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleInputChange('estimatedHoursPerPlayerPerDay', 6)}
                  variant={formData.estimatedHoursPerPlayerPerDay === 6 ? 'solid' : 'outline'}
                  colorScheme="blue"
                >
                  Dedicated (6h)
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleInputChange('estimatedHoursPerPlayerPerDay', 10)}
                  variant={formData.estimatedHoursPerPlayerPerDay === 10 ? 'solid' : 'outline'}
                  colorScheme="blue"
                >
                  Sweatlord (10h)
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {(() => {
                  if (!formData.startDate || !formData.endDate)
                    return 'Select dates to see estimate';
                  const days = Math.ceil(
                    (new Date(formData.endDate) - new Date(formData.startDate)) /
                      (1000 * 60 * 60 * 24)
                  );
                  const totalHours =
                    formData.playersPerTeam * days * formData.estimatedHoursPerPlayerPerDay;
                  return `Total per team: ${formData.playersPerTeam} players × ${days} days × ${formData.estimatedHoursPerPlayerPerDay}h = ${totalHours} player-hours`;
                })()}
              </Text>
            </FormControl>

            <Button colorScheme="green" onClick={() => setShowContentModal(true)}>
              {contentSelections ? 'Edit Content Selection' : 'Specify Content Selection'}
            </Button>
            <ContentSelectionModal
              isOpen={showContentModal}
              onClose={() => setShowContentModal(false)}
              currentSelections={contentSelections}
              onSave={(selections) => {
                setContentSelections(selections);
                setShowContentModal(false);
              }}
            />

            <FormControl isRequired>
              <LabelWithTooltip
                label="Total Prize Pool (GP)"
                tooltip={`Total GP to be split among teams. Each team will work towards a maximum of ${(
                  formData.prizePoolTotal /
                  Math.max(formData.numOfTeams, 1) /
                  1000000
                ).toFixed(1)}M GP, which is the total (${
                  formData.prizePoolTotal
                } GP) divided by the ${Math.max(formData.numOfTeams, 1)} specified teams.`}
              />
              <NumberInput
                value={formData.prizePoolTotal}
                onChange={(_, val) => handleInputChange('prizePoolTotal', val)}
                min={0}
                max={MAX_GP}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Per team goal:{' '}
                {(formData.prizePoolTotal / Math.max(formData.numOfTeams, 1) / 1000000).toFixed(1)}M
                GP • Your pool: {(formData.prizePoolTotal / 1000000).toFixed(1)} M GP • Maximum
                pool: {(MAX_GP / 1000000000).toFixed(0)}B
              </Text>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <LabelWithTooltip
                  label="Number of Teams"
                  tooltip={`How many teams will compete. Max: ${getMaxTeams()} teams with ${
                    formData.playersPerTeam
                  } players each`}
                />
                <NumberInput
                  value={formData.numOfTeams}
                  onChange={(_, val) => handleInputChange('numOfTeams', val)}
                  min={1}
                  max={getMaxTeams()}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <LabelWithTooltip
                  label="Players per Team"
                  tooltip={`Team size affects map generation. Max: ${getMaxPlayersPerTeam()} players on each of the allocated ${
                    formData.numOfTeams
                  } teams`}
                />
                <NumberInput
                  value={formData.playersPerTeam}
                  onChange={(_, val) => handleInputChange('playersPerTeam', val)}
                  min={1}
                  max={getMaxPlayersPerTeam()}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            {/* Total Players Counter */}
            <Text
              fontSize="sm"
              color={totalPlayers > MAX_TOTAL_PLAYERS ? 'red.500' : 'gray.500'}
              fontWeight={totalPlayers > MAX_TOTAL_PLAYERS ? 'bold' : 'normal'}
            >
              Total Players: {totalPlayers} / {MAX_TOTAL_PLAYERS}
              {totalPlayers > MAX_TOTAL_PLAYERS && ' ⚠️ Exceeds maximum!'}
            </Text>

            <FormControl isRequired>
              <LabelWithTooltip
                label="Nodes per Inn"
                tooltip={`How many objective nodes between each Inn checkpoint. Range: ${MIN_NODES_PER_INN}-${MAX_NODES_PER_INN}. Lower = more trading opportunities.`}
              />
              <NumberInput
                value={formData.nodeToInnRatio}
                onChange={(_, val) => handleInputChange('nodeToInnRatio', val)}
                min={MIN_NODES_PER_INN}
                max={MAX_NODES_PER_INN}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Range: {MIN_NODES_PER_INN}-{MAX_NODES_PER_INN} nodes per Inn
              </Text>
            </FormControl>

            {/* Map Preview Stats */}
            <VStack
              w="full"
              p={3}
              bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
              borderRadius="md"
              spacing={2}
            >
              <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                📊 Map Preview (Per Team)
              </Text>
              <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
                <VStack spacing={0}>
                  <Text color="gray.500">Player Hours</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    {(() => {
                      if (!formData.startDate || !formData.endDate) return '?';
                      const days = Math.ceil(
                        (new Date(formData.endDate) - new Date(formData.startDate)) /
                          (1000 * 60 * 60 * 24)
                      );
                      return Math.round(
                        formData.playersPerTeam * days * formData.estimatedHoursPerPlayerPerDay
                      );
                    })()}
                    h
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.500">Total Locations</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    ~
                    {(() => {
                      if (!formData.startDate || !formData.endDate) return '?';
                      const days = Math.ceil(
                        (new Date(formData.endDate) - new Date(formData.startDate)) /
                          (1000 * 60 * 60 * 24)
                      );
                      const totalHours =
                        formData.playersPerTeam * days * formData.estimatedHoursPerPlayerPerDay;
                      const diffMult = { easy: 0.7, normal: 1.0, hard: 1.3, sweatlord: 1.6 };
                      const hoursPerNode = 1.5 * (diffMult[formData.difficulty] || 1.0);
                      const nodesNeeded = Math.ceil(totalHours / hoursPerNode);
                      const locationGroups = Math.ceil(nodesNeeded / 3);
                      return locationGroups;
                    })()}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.500">Inns</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    ~
                    {(() => {
                      if (!formData.startDate || !formData.endDate) return '?';
                      const days = Math.ceil(
                        (new Date(formData.endDate) - new Date(formData.startDate)) /
                          (1000 * 60 * 60 * 24)
                      );
                      const totalHours =
                        formData.playersPerTeam * days * formData.estimatedHoursPerPlayerPerDay;
                      const diffMult = { easy: 0.7, normal: 1.0, hard: 1.3, sweatlord: 1.6 };
                      const hoursPerNode = 1.5 * (diffMult[formData.difficulty] || 1.0);
                      const nodesNeeded = Math.ceil(totalHours / hoursPerNode);
                      const locationGroups = Math.ceil(nodesNeeded / 3);
                      return Math.floor(locationGroups / formData.nodeToInnRatio);
                    })()}
                  </Text>
                </VStack>
              </SimpleGrid>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                All {formData.numOfTeams} teams race through the same map
              </Text>
            </VStack>

            <Button
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
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
