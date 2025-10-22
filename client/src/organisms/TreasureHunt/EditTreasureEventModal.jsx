import React, { useState, useEffect } from 'react';
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
  Text,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { UPDATE_TREASURE_EVENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';

const MAX_TOTAL_PLAYERS = 150;
const MAX_GP = 20000000000; // 20 billion
const MIN_NODES_PER_INN = 3;
const MAX_NODES_PER_INN = 6;
const MAX_EVENT_DURATION_DAYS = 31; // 1 month maximum

export default function EditEventModal({ isOpen, onClose, event, onSuccess }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const isEditable = event?.status === 'DRAFT';

  const currentColors = colors[colorMode];

  const [formData, setFormData] = useState({
    eventName: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    prizePoolTotal: 0,
    numOfTeams: 0,
    playersPerTeam: 0,
    nodeToInnRatio: 5,
    difficulty: 'normal',
  });

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

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

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName || '',
        status: event.status || 'DRAFT',
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        prizePoolTotal: event.eventConfig?.prize_pool_total || 0,
        numOfTeams: event.eventConfig?.num_of_teams || 0,
        playersPerTeam: event.eventConfig?.players_per_team || 0,
        nodeToInnRatio: event.eventConfig?.node_to_inn_ratio || 5,
        difficulty: event.eventConfig?.difficulty || 'normal',
      });
    }
  }, [event]);

  const [updateEvent, { loading }] = useMutation(UPDATE_TREASURE_EVENT, {
    onCompleted: () => {
      showToast('Event updated successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      showToast(`Error updating event: ${error.message}`, 'error');
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

  const handleUpdateEvent = async () => {
    // Validate dates
    if (!formData.startDate || !formData.endDate) {
      showToast('Please select both start and end dates', 'warning');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

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

    // Convert date strings to ISO datetime strings
    const startDate = new Date(formData.startDate + 'T00:00:00').toISOString();
    const endDate = new Date(formData.endDate + 'T23:59:59').toISOString();

    try {
      await updateEvent({
        variables: {
          eventId: event.eventId,
          input: {
            eventName: formData.eventName,
            status: formData.status,
            startDate: startDate,
            endDate: endDate,
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
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Edit Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {!isEditable && (
              <Text
                p={2}
                bg="orange.100"
                borderRadius="md"
                color="orange.500"
                fontWeight="bold"
                fontSize="sm"
              >
                ⚠️ Only the event name and status can be modified after publishing.
              </Text>
            )}
            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Event Name</FormLabel>
              <Input
                placeholder="My Treasure Hunt"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Status</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                color={currentColors.textColor}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>Start Date</FormLabel>
                <Input
                  type="date"
                  min={today}
                  value={formData.startDate}
                  isDisabled={!isEditable}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  color={currentColors.textColor}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>
                  End Date • Max: {MAX_EVENT_DURATION_DAYS} days
                </FormLabel>
                <Input
                  type="date"
                  min={formData.startDate || today}
                  max={maxEndDate || undefined}
                  value={formData.endDate}
                  isDisabled={!isEditable}
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
                Event Duration: {eventDuration} day{eventDuration !== 1 ? 's' : ''} /{' '}
                {MAX_EVENT_DURATION_DAYS} days max
                {eventDuration > MAX_EVENT_DURATION_DAYS && ' ⚠️ Exceeds maximum!'}
              </Text>
            )}

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Difficulty Level</FormLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                color={currentColors.textColor}
                isDisabled={!isEditable}
              >
                <option value="easy">Easy (0.8x objectives)</option>
                <option value="normal">Normal (1.0x objectives)</option>
                <option value="hard">Hard (1.4x objectives)</option>
                <option value="sweatlord">Sweatlord (2.0x objectives)</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>
                Total Prize Pool (GP) • Max: {(MAX_GP / 1000000000).toFixed(0)}B
              </FormLabel>
              <NumberInput
                isDisabled={!isEditable}
                value={formData.prizePoolTotal}
                onChange={(_, val) => handleInputChange('prizePoolTotal', val)}
                min={0}
                max={MAX_GP}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Per team max:{' '}
                {(formData.prizePoolTotal / Math.max(formData.numOfTeams, 1) / 1000000).toFixed(1)}M
                GP
              </Text>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>
                  Number of Teams • Max: {getMaxTeams()}
                </FormLabel>
                <NumberInput
                  isDisabled={!isEditable}
                  value={formData.numOfTeams}
                  onChange={(_, val) => handleInputChange('numOfTeams', val)}
                  min={1}
                  max={getMaxTeams()}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>
                  Players per Team • Max: {getMaxPlayersPerTeam()}
                </FormLabel>
                <NumberInput
                  isDisabled={!isEditable}
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
              <FormLabel color={currentColors.textColor}>
                Nodes per Inn • Range: {MIN_NODES_PER_INN}-{MAX_NODES_PER_INN}
              </FormLabel>
              <NumberInput
                isDisabled={!isEditable}
                value={formData.nodeToInnRatio}
                onChange={(_, val) => handleInputChange('nodeToInnRatio', val)}
                min={MIN_NODES_PER_INN}
                max={MAX_NODES_PER_INN}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
            </FormControl>

            <Button
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
              w="full"
              onClick={handleUpdateEvent}
              isLoading={loading}
              isDisabled={
                totalPlayers > MAX_TOTAL_PLAYERS || eventDuration > MAX_EVENT_DURATION_DAYS
              }
            >
              Update Event
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
