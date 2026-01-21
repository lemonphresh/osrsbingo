import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  HStack,
  Alert,
  AlertIcon,
  Icon,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { UPDATE_TREASURE_EVENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import ContentSelectionModal from './ContentSelectionModal';
import { InfoIcon, WarningIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { FaMap, FaUsers, FaUserFriends, FaDiscord, FaCalendarCheck } from 'react-icons/fa';
import { dateInputToISO, toDateInputValue, getTodayInputValue } from '../../utils/dateUtils';

const MAX_TOTAL_PLAYERS = 150;
const MAX_GP = 20000000000;
const MIN_NODES_PER_INN = 3;
const MAX_NODES_PER_INN = 6;
const MAX_EVENT_DURATION_DAYS = 31;
const MIN_EVENT_NAME_LENGTH = 3;
const MAX_EVENT_NAME_LENGTH = 50;

const IS_DEV = process.env.REACT_APP_ENVIRONMENT === 'development';

export default function EditEventModal({ isOpen, onClose, event, onSuccess }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentSelections, setContentSelections] = useState(null);

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
    estimatedHoursPerPlayerPerDay: 3,
  });

  const today = getTodayInputValue();

  const getMaxEndDate = () => {
    if (!formData.startDate) return '';
    const startDate = new Date(formData.startDate);
    const maxEndDate = new Date(startDate);
    maxEndDate.setDate(maxEndDate.getDate() + MAX_EVENT_DURATION_DAYS);
    return maxEndDate.toISOString().split('T')[0];
  };

  const getEventDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const eventDuration = getEventDuration();
  const maxEndDate = getMaxEndDate();

  // Calculate launch readiness checks
  const launchChecks = useMemo(() => {
    if (!event) return { allPassed: false, checks: [] };

    const hasMap = event.nodes && event.nodes.length > 0;
    const teamCount = event.teams?.length || 0;
    const requiredTeamCount = event.eventConfig?.num_of_teams || formData.numOfTeams || 2;
    const requiredPlayersPerTeam =
      event.eventConfig?.players_per_team || formData.playersPerTeam || 1;
    const hasEnoughTeams = teamCount >= requiredTeamCount;

    const teamsWithInsufficientMembers =
      event.teams?.filter((team) => {
        const memberCount = team.members?.length || 0;
        return memberCount < requiredPlayersPerTeam;
      }) || [];
    const allTeamsHaveEnoughMembers = teamCount > 0 && teamsWithInsufficientMembers.length === 0;

    const hasDiscord = event.discordConfig?.confirmed === true;
    const hasStartDate = !!event.startDate || !!formData.startDate;
    const hasEndDate = !!event.endDate || !!formData.endDate;
    const hasDates = hasStartDate && hasEndDate;

    const checks = [
      {
        key: 'map',
        label: 'Map Generated',
        passed: hasMap,
        icon: FaMap,
        message: hasMap ? `${event.nodes.length} nodes` : 'No map generated',
      },
      {
        key: 'teams',
        label: 'Teams Created',
        passed: hasEnoughTeams,
        icon: FaUsers,
        message: hasEnoughTeams
          ? `${teamCount}/${requiredTeamCount} teams`
          : `${teamCount}/${requiredTeamCount} teams (need ${requiredTeamCount - teamCount} more)`,
      },
      {
        key: 'members',
        label: 'Team Members',
        passed: allTeamsHaveEnoughMembers,
        icon: FaUserFriends,
        message: allTeamsHaveEnoughMembers
          ? `All teams have ${requiredPlayersPerTeam}+ members`
          : `${teamsWithInsufficientMembers.length} team(s) need more members`,
      },
      {
        key: 'discord',
        label: 'Discord Setup',
        passed: hasDiscord,
        icon: FaDiscord,
        message: hasDiscord ? 'Confirmed' : 'Not configured',
      },
      {
        key: 'dates',
        label: 'Event Dates',
        passed: hasDates,
        icon: FaCalendarCheck,
        message: hasDates ? 'Set' : 'Missing dates',
      },
    ];

    return {
      allPassed: checks.every((c) => c.passed),
      checks,
      failedChecks: checks.filter((c) => !c.passed),
    };
  }, [event, formData.numOfTeams, formData.playersPerTeam, formData.startDate, formData.endDate]);

  // Check if trying to set ACTIVE without meeting requirements
  const canSetActive = launchChecks.allPassed;
  const shouldBeLockedOut = IS_DEV && event?.status === 'DRAFT' && !canSetActive;
  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName || '',
        status: event.status || 'DRAFT',
        startDate: toDateInputValue(event.startDate),
        endDate: toDateInputValue(event.endDate),
        prizePoolTotal: event.eventConfig?.prize_pool_total || 0,
        numOfTeams: event.eventConfig?.num_of_teams || 0,
        playersPerTeam: event.eventConfig?.players_per_team || 0,
        nodeToInnRatio: event.eventConfig?.node_to_inn_ratio || 5,
        difficulty: event.eventConfig?.difficulty || 'normal',
        estimatedHoursPerPlayerPerDay: event.eventConfig?.estimated_hours_per_player_per_day || 3,
      });
      setContentSelections(event.contentSelections || null);
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

  const handleSaveContentSelections = async (selections) => {
    try {
      setContentSelections(selections);
      await updateEvent({
        variables: {
          eventId: event.eventId,
          input: { contentSelections: selections },
        },
      });
      showToast('Content selection updated!', 'success');
      setShowContentModal(false);
    } catch (error) {
      console.error('Error updating content selections:', error);
    }
  };

  const totalPlayers = formData.numOfTeams * formData.playersPerTeam;

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

      if (field === 'prizePoolTotal' && value > MAX_GP) {
        showToast(`Maximum prize pool is ${(MAX_GP / 1000000000).toFixed(0)}B GP`, 'warning');
        return { ...prev, prizePoolTotal: MAX_GP };
      }

      if (field === 'nodeToInnRatio') {
        if (value < MIN_NODES_PER_INN) return { ...prev, nodeToInnRatio: MIN_NODES_PER_INN };
        if (value > MAX_NODES_PER_INN) return { ...prev, nodeToInnRatio: MAX_NODES_PER_INN };
      }

      if (field === 'endDate' && prev.startDate) {
        const start = new Date(prev.startDate);
        const end = new Date(value);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > MAX_EVENT_DURATION_DAYS) {
          showToast(`Maximum event duration is ${MAX_EVENT_DURATION_DAYS} days`, 'warning');
          const maxDate = new Date(start);
          maxDate.setDate(maxDate.getDate() + MAX_EVENT_DURATION_DAYS);
          return { ...prev, endDate: maxDate.toISOString().split('T')[0] };
        }
      }

      if (field === 'startDate' && prev.endDate) {
        const start = new Date(value);
        const end = new Date(prev.endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > MAX_EVENT_DURATION_DAYS) {
          const maxDate = new Date(start);
          maxDate.setDate(maxDate.getDate() + MAX_EVENT_DURATION_DAYS);
          return { ...prev, startDate: value, endDate: maxDate.toISOString().split('T')[0] };
        }
      }

      if (field === 'numOfTeams' || field === 'playersPerTeam') {
        const newTotalPlayers =
          field === 'numOfTeams' ? value * newData.playersPerTeam : newData.numOfTeams * value;
        if (newTotalPlayers > MAX_TOTAL_PLAYERS) {
          showToast(`Maximum total players is ${MAX_TOTAL_PLAYERS}.`, 'warning');
          if (field === 'numOfTeams') {
            const maxPlayersPerTeam = Math.floor(MAX_TOTAL_PLAYERS / value);
            return {
              ...prev,
              numOfTeams: value,
              playersPerTeam: Math.min(prev.playersPerTeam, maxPlayersPerTeam),
            };
          } else {
            const maxTeams = Math.floor(MAX_TOTAL_PLAYERS / value);
            return {
              ...prev,
              playersPerTeam: value,
              numOfTeams: Math.min(prev.numOfTeams, maxTeams),
            };
          }
        }
      }

      // Warn if trying to set ACTIVE without meeting requirements
      if (field === 'status' && value === 'ACTIVE' && shouldBeLockedOut) {
        showToast('Complete all launch requirements before setting to Active', 'warning');
        return prev; // Don't allow the change
      }

      return newData;
    });
  };

  const handleUpdateEvent = async () => {
    const trimmedName = formData.eventName.trim();
    if (
      !trimmedName ||
      trimmedName.length < MIN_EVENT_NAME_LENGTH ||
      trimmedName.length > MAX_EVENT_NAME_LENGTH
    ) {
      showToast(
        `Event name must be ${MIN_EVENT_NAME_LENGTH}-${MAX_EVENT_NAME_LENGTH} characters`,
        'warning'
      );
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      showToast('Please select both start and end dates', 'warning');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (isEditable) {
      const todayStr = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      if (formData.startDate < todayStr) {
        showToast('Start date cannot be in the past', 'warning');
        return;
      }
    }

    if (end <= start) {
      showToast('End date must be after start date', 'warning');
      return;
    }

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (duration > MAX_EVENT_DURATION_DAYS) {
      showToast(`Event duration exceeds maximum of ${MAX_EVENT_DURATION_DAYS} days`, 'error');
      return;
    }

    if (totalPlayers > MAX_TOTAL_PLAYERS) {
      showToast(`Total players exceeds maximum of ${MAX_TOTAL_PLAYERS}`, 'error');
      return;
    }

    if (formData.prizePoolTotal > MAX_GP) {
      showToast(`Prize pool exceeds maximum of ${(MAX_GP / 1000000000).toFixed(0)}B GP`, 'error');
      return;
    }

    // Block ACTIVE status if launch checks fail
    if (shouldBeLockedOut) {
      showToast('Cannot activate event: complete all launch requirements first', 'error');
      return;
    }

    const startDate = dateInputToISO(formData.startDate, false);
    const endDate = dateInputToISO(formData.endDate, true);

    try {
      await updateEvent({
        variables: {
          eventId: event.eventId,
          input: {
            eventName: trimmedName,
            status: formData.status,
            startDate,
            endDate,
            eventConfig: {
              prize_pool_total: formData.prizePoolTotal,
              num_of_teams: formData.numOfTeams,
              players_per_team: formData.playersPerTeam,
              node_to_inn_ratio: formData.nodeToInnRatio,
              difficulty: formData.difficulty,
              estimated_hours_per_player_per_day: formData.estimatedHoursPerPlayerPerDay,
              reward_split_ratio: { nodes: 0.6, inns: 0.25, bonus_tasks: 0.15 },
              keys_expire: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Render launch requirements warning when trying to set ACTIVE
  const LaunchRequirementsWarning = () => {
    if (event?.status !== 'DRAFT' || canSetActive) return null;

    return (
      <Alert status="warning" borderRadius="md" flexDirection="column" alignItems="stretch">
        <HStack mb={2}>
          <AlertIcon />
          <Text fontWeight="bold" fontSize="sm">
            Complete these requirements to activate:
          </Text>
        </HStack>
        <VStack align="stretch" spacing={1} pl={8}>
          {launchChecks.checks.map((check) => (
            <HStack key={check.key} spacing={2}>
              <Icon
                as={check.passed ? CheckCircleIcon : WarningIcon}
                color={check.passed ? 'green.500' : 'orange.500'}
                boxSize={3}
              />
              <Icon as={check.icon} color={check.passed ? 'green.500' : 'gray.400'} boxSize={3} />
              <Text fontSize="xs" color={check.passed ? 'green.600' : 'gray.600'}>
                {check.label}: {check.message}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Alert>
    );
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
              <FormLabel color={currentColors.textColor}>
                Event Name ({MIN_EVENT_NAME_LENGTH}-{MAX_EVENT_NAME_LENGTH} chars)
              </FormLabel>
              <Input
                placeholder="My Gielinor Rush"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                color={currentColors.textColor}
                maxLength={MAX_EVENT_NAME_LENGTH}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {formData.eventName.length}/{MAX_EVENT_NAME_LENGTH}
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Status</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                color={currentColors.textColor}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE" disabled={shouldBeLockedOut}>
                  Active {shouldBeLockedOut ? '(requirements not met)' : ''}
                </option>
                <option value="COMPLETED" disabled={shouldBeLockedOut}>
                  Completed {shouldBeLockedOut ? '(requirements not met)' : ''}
                </option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </FormControl>

            {/* Show launch requirements when in DRAFT */}
            {event?.status === 'DRAFT' && <LaunchRequirementsWarning />}

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
                Est. Hours Per Player Per Day
                <Tooltip label="How many hours per day will each player dedicate on average?">
                  <InfoIcon ml={2} />
                </Tooltip>
              </FormLabel>
              <NumberInput
                isDisabled={!isEditable}
                value={formData.estimatedHoursPerPlayerPerDay}
                onChange={(_, valueNumber) => {
                  if (!isNaN(valueNumber))
                    handleInputChange('estimatedHoursPerPlayerPerDay', valueNumber);
                }}
                min={0.5}
                max={12}
                step={0.5}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
              <HStack spacing={2} mt={2}>
                {[
                  { label: 'Casual (1h)', value: 1 },
                  { label: 'Average (3h)', value: 3 },
                  { label: 'Dedicated (6h)', value: 6 },
                  { label: 'Sweatlord (10h)', value: 10 },
                ].map((preset) => (
                  <Button
                    key={preset.value}
                    isDisabled={!isEditable}
                    size="xs"
                    onClick={() => handleInputChange('estimatedHoursPerPlayerPerDay', preset.value)}
                    variant={
                      formData.estimatedHoursPerPlayerPerDay === preset.value ? 'solid' : 'outline'
                    }
                    colorScheme="blue"
                  >
                    {preset.label}
                  </Button>
                ))}
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

            {isEditable && (
              <Button
                variant="solid"
                colorScheme="green"
                color="white"
                onClick={() => setShowContentModal(true)}
              >
                Edit Content Selection
              </Button>
            )}

            <ContentSelectionModal
              isOpen={showContentModal}
              onClose={() => setShowContentModal(false)}
              currentSelections={contentSelections}
              onSave={handleSaveContentSelections}
            />

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
                Locations Between Each Inn • Range: {MIN_NODES_PER_INN}-{MAX_NODES_PER_INN}
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
                      return Math.ceil(nodesNeeded / 3);
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
              onClick={handleUpdateEvent}
              isLoading={loading}
              isDisabled={
                totalPlayers > MAX_TOTAL_PLAYERS ||
                eventDuration > MAX_EVENT_DURATION_DAYS ||
                (formData.status === 'ACTIVE' && shouldBeLockedOut)
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
