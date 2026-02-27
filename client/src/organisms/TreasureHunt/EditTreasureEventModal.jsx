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
  Text,
  Tooltip,
  HStack,
  Alert,
  AlertIcon,
  Icon,
} from '@chakra-ui/react';
import { useMutation, gql } from '@apollo/client';
import { UPDATE_TREASURE_EVENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import ContentSelectionModal from './ContentSelectionModal';
import { InfoIcon, WarningIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { FaMap, FaUsers, FaUserFriends, FaDiscord, FaCalendarCheck } from 'react-icons/fa';
import {
  dateTimeInputToISO,
  toDateTimeInputValue,
  getTodayDateTimeInputValue,
  getViewerTimezone,
} from '../../utils/dateUtils';

const COMPLETE_EVENT = gql`
  mutation CompleteEvent($eventId: ID!) {
    completeEvent(eventId: $eventId) {
      eventId
      status
      eventName
    }
  }
`;

const MAX_TOTAL_PLAYERS = 150;
const MAX_GP = 20000000000;
const MIN_NODES_PER_INN = 3;
const MAX_NODES_PER_INN = 6;
const MAX_EVENT_DURATION_DAYS = 31;
const MIN_EVENT_NAME_LENGTH = 3;
const MAX_EVENT_NAME_LENGTH = 50;

const IS_DEV = process.env.REACT_APP_ENVIRONMENT === 'development';

export default function EditEventModal({ isOpen, onClose, event, onSuccess }) {
  const { showToast } = useToastContext();
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentSelections, setContentSelections] = useState(null);

  const isEditable = event?.status === 'DRAFT';
  const today = getTodayDateTimeInputValue();
  const viewerTZ = getViewerTimezone();

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

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName || '',
        status: event.status || 'DRAFT',
        startDate: toDateTimeInputValue(event.startDate),
        endDate: toDateTimeInputValue(event.endDate),
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

  const getMaxEndDate = () => {
    if (!formData.startDate) return '';
    const start = new Date(formData.startDate);
    const max = new Date(start);
    max.setDate(max.getDate() + MAX_EVENT_DURATION_DAYS);
    return toDateTimeInputValue(max.toISOString());
  };

  const getEventDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    return Math.ceil(
      (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)
    );
  };

  const eventDuration = getEventDuration();
  const maxEndDate = getMaxEndDate();
  const totalPlayers = formData.numOfTeams * formData.playersPerTeam;

  const getMaxTeams = () =>
    formData.playersPerTeam === 0 ? 200 : Math.floor(MAX_TOTAL_PLAYERS / formData.playersPerTeam);

  const getMaxPlayersPerTeam = () =>
    formData.numOfTeams === 0 ? 200 : Math.floor(MAX_TOTAL_PLAYERS / formData.numOfTeams);

  // ─── Launch readiness checks ───────────────────────────────────────────────
  const launchChecks = useMemo(() => {
    if (!event) return { allPassed: false, checks: [] };

    const hasMap = event.nodes && event.nodes.length > 0;
    const teamCount = event.teams?.length || 0;
    const requiredTeamCount = event.eventConfig?.num_of_teams || formData.numOfTeams || 2;
    const requiredPlayersPerTeam =
      event.eventConfig?.players_per_team || formData.playersPerTeam || 1;
    const hasEnoughTeams = teamCount >= requiredTeamCount;

    const teamsWithInsufficientMembers =
      event.teams?.filter((t) => (t.members?.length || 0) < requiredPlayersPerTeam) || [];
    const allTeamsHaveEnoughMembers = teamCount > 0 && teamsWithInsufficientMembers.length === 0;

    const hasDiscord = event.discordConfig?.confirmed === true;
    const hasDates =
      (!!event.startDate || !!formData.startDate) && (!!event.endDate || !!formData.endDate);

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
          : `${teamCount}/${requiredTeamCount} (need ${requiredTeamCount - teamCount} more)`,
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

  const canSetActive = launchChecks.allPassed;
  const shouldBeLockedOut = IS_DEV && event?.status === 'DRAFT' && !canSetActive;

  const [updateEvent, { loading }] = useMutation(UPDATE_TREASURE_EVENT, {
    onCompleted: () => {
      showToast('Event updated successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => showToast(`Error updating event: ${err.message}`, 'error'),
  });

  const [completeEvent, { loading: completeLoading }] = useMutation(COMPLETE_EVENT, {
    onCompleted: () => {
      showToast('Event completed — final standings sent to Discord!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => showToast(`Error completing event: ${err.message}`, 'error'),
  });

  const handleSaveContentSelections = async (selections) => {
    try {
      setContentSelections(selections);
      await updateEvent({
        variables: { eventId: event.eventId, input: { contentSelections: selections } },
      });
      showToast('Content selection updated!', 'success');
      setShowContentModal(false);
    } catch (err) {
      console.error('Error updating content selections:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'prizePoolTotal' && value > MAX_GP) {
        showToast(`Maximum prize pool is ${(MAX_GP / 1e9).toFixed(0)}B GP`, 'warning');
        return { ...prev, prizePoolTotal: MAX_GP };
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

      if (field === 'status' && value === 'PUBLIC' && shouldBeLockedOut) {
        showToast('Complete all launch requirements before setting to Public', 'warning');
        return prev;
      }

      return next;
    });
  };

  const handleUpdateEvent = async () => {
    const name = formData.eventName.trim();
    if (!name || name.length < MIN_EVENT_NAME_LENGTH || name.length > MAX_EVENT_NAME_LENGTH) {
      showToast(
        `Event name must be ${MIN_EVENT_NAME_LENGTH}–${MAX_EVENT_NAME_LENGTH} characters`,
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

    if (isEditable && start < new Date()) {
      showToast('Start date cannot be in the past', 'warning');
      return;
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
      showToast(`Prize pool exceeds maximum of ${(MAX_GP / 1e9).toFixed(0)}B GP`, 'error');
      return;
    }
    if (shouldBeLockedOut) {
      showToast('Cannot activate event: complete all launch requirements first', 'error');
      return;
    }

    if (formData.status === 'COMPLETED' && event?.status !== 'COMPLETED') {
      try {
        await completeEvent({ variables: { eventId: event.eventId } });
      } catch (err) {
        console.error('Error completing event:', err);
      }
      return;
    }

    try {
      await updateEvent({
        variables: {
          eventId: event.eventId,
          input: {
            eventName: name,
            status: formData.status,
            startDate: dateTimeInputToISO(formData.startDate),
            endDate: dateTimeInputToISO(formData.endDate),
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
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  // ─── Shared styles ─────────────────────────────────────────────────────────
  const inputStyles = {
    color: 'white',
    bg: 'gray.700',
    borderColor: 'gray.600',
    _hover: { borderColor: 'gray.500' },
    _focus: { borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' },
  };

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

  // ─── Launch requirements warning ──────────────────────────────────────────
  const LaunchRequirementsWarning = () => {
    if (event?.status !== 'DRAFT' || canSetActive) return null;
    return (
      <Alert
        status="warning"
        borderRadius="md"
        flexDirection="column"
        alignItems="stretch"
        bg="orange.900"
      >
        <HStack mb={2}>
          <AlertIcon color="orange.300" />
          <Text fontWeight="semibold" fontSize="sm" color="orange.200">
            Complete these requirements to activate:
          </Text>
        </HStack>
        <VStack align="stretch" spacing={1} pl={8}>
          {launchChecks.checks.map((check) => (
            <HStack key={check.key} spacing={2}>
              <Icon
                as={check.passed ? CheckCircleIcon : WarningIcon}
                color={check.passed ? 'green.400' : 'orange.400'}
                boxSize={3}
              />
              <Icon as={check.icon} color={check.passed ? 'green.400' : 'gray.500'} boxSize={3} />
              <Text fontSize="xs" color={check.passed ? 'green.300' : 'gray.400'}>
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
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader color="white">Edit Event</ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {!isEditable && (
              <Text
                p={2}
                bg="orange.900"
                borderRadius="md"
                color="orange.300"
                fontWeight="semibold"
                fontSize="sm"
                w="full"
                textAlign="center"
              >
                ⚠️ Only the event name and status can be modified after publishing.
              </Text>
            )}

            {/* Event name */}
            <FormControl isRequired>
              <FormLabel color="gray.100">
                Event Name ({MIN_EVENT_NAME_LENGTH}–{MAX_EVENT_NAME_LENGTH} chars)
              </FormLabel>
              <Input
                placeholder="My Gielinor Rush"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                maxLength={MAX_EVENT_NAME_LENGTH}
                {...inputStyles}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {formData.eventName.length}/{MAX_EVENT_NAME_LENGTH}
              </Text>
            </FormControl>

            {/* Status */}
            <FormControl isRequired>
              <FormLabel color="gray.100">Status</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                {...inputStyles}
              >
                <option value="DRAFT" style={{ background: '#2D3748' }}>
                  Draft
                </option>
                <option
                  value="PUBLIC"
                  disabled={shouldBeLockedOut}
                  style={{ background: '#2D3748' }}
                >
                  Public{shouldBeLockedOut ? ' (requirements not met)' : ''}
                </option>
                <option
                  value="COMPLETED"
                  disabled={shouldBeLockedOut}
                  style={{ background: '#2D3748' }}
                >
                  Completed{shouldBeLockedOut ? ' (requirements not met)' : ''}
                </option>
                <option value="ARCHIVED" style={{ background: '#2D3748' }}>
                  Archived
                </option>
              </Select>
            </FormControl>

            {event?.status === 'DRAFT' && <LaunchRequirementsWarning />}

            {/* Dates */}
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <HStack justify="space-between" align="center" mb={1}>
                  <FormLabel color="gray.100" mb={0}>
                    Start Date & Time
                  </FormLabel>
                  <Text fontSize="xs" color="gray.500" flexShrink={0}>
                    {viewerTZ}
                  </Text>
                </HStack>
                <Input
                  type="datetime-local"
                  min={today}
                  value={formData.startDate}
                  isDisabled={!isEditable}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  {...inputStyles}
                />
              </FormControl>
              <FormControl isRequired>
                <HStack justify="space-between" align="center" mb={1}>
                  <FormLabel color="gray.100" mb={0}>
                    End Date & Time • Max {MAX_EVENT_DURATION_DAYS}d
                  </FormLabel>
                  <Text fontSize="xs" color="gray.500" flexShrink={0}>
                    {viewerTZ}
                  </Text>
                </HStack>
                <Input
                  type="datetime-local"
                  min={formData.startDate || today}
                  max={maxEndDate || undefined}
                  value={formData.endDate}
                  isDisabled={!isEditable}
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
                Event Duration: {eventDuration} day{eventDuration !== 1 ? 's' : ''} /{' '}
                {MAX_EVENT_DURATION_DAYS} days max
                {eventDuration > MAX_EVENT_DURATION_DAYS && ' ⚠️ Exceeds maximum!'}
              </Text>
            )}

            {/* Difficulty */}
            <FormControl isRequired>
              <FormLabel color="gray.100">Difficulty Level</FormLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                isDisabled={!isEditable}
                {...inputStyles}
              >
                <option value="easy" style={{ background: '#2D3748' }}>
                  Easy (0.8x objectives)
                </option>
                <option value="normal" style={{ background: '#2D3748' }}>
                  Normal (1.0x objectives)
                </option>
                <option value="hard" style={{ background: '#2D3748' }}>
                  Hard (1.4x objectives)
                </option>
                <option value="sweatlord" style={{ background: '#2D3748' }}>
                  Sweatlord (2.0x objectives)
                </option>
              </Select>
            </FormControl>

            {/* Hours per player */}
            <FormControl isRequired>
              <FormLabel color="gray.100">
                Est. Hours Per Player Per Day
                <Tooltip label="How many hours per day will each player dedicate on average?">
                  <InfoIcon ml={2} color="gray.500" />
                </Tooltip>
              </FormLabel>
              <NumberInput
                isDisabled={!isEditable}
                value={formData.estimatedHoursPerPlayerPerDay}
                onChange={(_, val) => {
                  if (!isNaN(val)) handleInputChange('estimatedHoursPerPlayerPerDay', val);
                }}
                min={0.5}
                max={24}
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
                    isDisabled={!isEditable}
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
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Total per team: {formData.playersPerTeam} players × {stats.days} days ×{' '}
                  {formData.estimatedHoursPerPlayerPerDay}h = {stats.totalHours} player-hours
                </Text>
              )}
            </FormControl>

            {/* Content selection */}
            {isEditable && (
              <Button
                variant="solid"
                colorScheme="green"
                w="full"
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

            {/* Prize pool */}
            <FormControl isRequired>
              <FormLabel color="gray.100">
                Total Prize Pool (GP) • Max: {(MAX_GP / 1e9).toFixed(0)}B
              </FormLabel>
              <NumberInput
                isDisabled={!isEditable}
                value={formData.prizePoolTotal}
                onChange={(_, val) => handleInputChange('prizePoolTotal', val)}
                min={0}
                max={MAX_GP}
              >
                <NumberInputField {...inputStyles} />
              </NumberInput>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Per team max:{' '}
                {(formData.prizePoolTotal / Math.max(formData.numOfTeams, 1) / 1e6).toFixed(1)}M GP
              </Text>
            </FormControl>

            {/* Teams + players */}
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel color="gray.100">Number of Teams • Max: {getMaxTeams()}</FormLabel>
                <NumberInput
                  isDisabled={!isEditable}
                  value={formData.numOfTeams}
                  onChange={(_, val) => handleInputChange('numOfTeams', val)}
                  min={1}
                  max={getMaxTeams()}
                >
                  <NumberInputField {...inputStyles} />
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.100">
                  Players per Team • Max: {getMaxPlayersPerTeam()}
                </FormLabel>
                <NumberInput
                  isDisabled={!isEditable}
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
              <FormLabel color="gray.100">
                Locations Between Each Inn • Range: {MIN_NODES_PER_INN}–{MAX_NODES_PER_INN}
              </FormLabel>
              <NumberInput
                isDisabled={!isEditable}
                value={formData.nodeToInnRatio}
                onChange={(_, val) => handleInputChange('nodeToInnRatio', val)}
                min={MIN_NODES_PER_INN}
                max={MAX_NODES_PER_INN}
                keepWithinRange={false}
              >
                <NumberInputField {...inputStyles} />
              </NumberInput>
            </FormControl>

            {/* Map preview */}
            <VStack w="full" p={3} bg="whiteAlpha.100" borderRadius="md" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="white">
                📊 Map Preview (Per Team)
              </Text>
              <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
                <VStack spacing={0}>
                  <Text color="gray.500">Player Hours</Text>
                  <Text fontWeight="semibold" color="white">
                    {stats ? `${stats.totalHours}h` : '?'}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.500">Total Locations</Text>
                  <Text fontWeight="semibold" color="white">
                    ~{stats ? stats.locations : '?'}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.500">Inns</Text>
                  <Text fontWeight="semibold" color="white">
                    ~{stats ? stats.inns : '?'}
                  </Text>
                </VStack>
              </SimpleGrid>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                All {formData.numOfTeams} teams race through the same map
              </Text>
            </VStack>

            <Button
              colorScheme="purple"
              w="full"
              onClick={handleUpdateEvent}
              isLoading={loading || completeLoading}
              isDisabled={
                totalPlayers > MAX_TOTAL_PLAYERS ||
                eventDuration > MAX_EVENT_DURATION_DAYS ||
                (formData.status === 'PUBLIC' && shouldBeLockedOut)
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
