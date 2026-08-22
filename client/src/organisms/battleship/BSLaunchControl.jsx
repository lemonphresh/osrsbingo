import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from '@chakra-ui/react';
import {
  START_BS_PLACEMENT_PHASE,
  UPDATE_BS_EVENT,
} from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';

function localDatetimeMin() {
  const d = new Date(Date.now() + 60_000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fmtScheduled(iso, utc) {
  const fmt = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return utc
    ? new Date(iso).toLocaleString(undefined, { ...fmt, timeZone: 'UTC' }) + ' UTC'
    : new Date(iso).toLocaleString(undefined, { ...fmt, timeZoneName: 'short' });
}

function LaunchConfirmModal({
  isOpen,
  onClose,
  onStartNow,
  onSchedule,
  loadingNow,
  loadingSchedule,
  canLaunch,
}) {
  const [mode, setMode] = useState('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [useUtc, setUseUtc] = useState(false);
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (isOpen) {
      setMode('now');
      setScheduledAt('');
      setUseUtc(false);
    }
  }, [isOpen]);

  const handleSchedule = () => {
    if (!scheduledAt) return;
    const iso = useUtc
      ? new Date(scheduledAt + 'Z').toISOString()
      : new Date(scheduledAt).toISOString();
    onSchedule(iso);
  };

  const minDatetime = useUtc
    ? new Date(Date.now() + 60_000).toISOString().slice(0, 16)
    : localDatetimeMin();

  let conversionHint = null;
  if (scheduledAt) {
    try {
      const fmt = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      if (useUtc) {
        conversionHint =
          '= ' +
          new Date(scheduledAt + 'Z').toLocaleString(undefined, { ...fmt, timeZoneName: 'short' });
      } else {
        conversionHint =
          '= ' +
          new Date(scheduledAt).toLocaleString(undefined, { ...fmt, timeZone: 'UTC' }) +
          ' UTC';
      }
    } catch {}
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg="#091a10" border="1px solid" borderColor="#1a4028" color="#d4f0da">
        <ModalHeader
          fontFamily="mono"
          fontSize="sm"
          letterSpacing="widest"
          textTransform="uppercase"
          color="#4ade80"
        >
          Launch Placement Phase
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <ButtonGroup isAttached w="100%" size="sm">
              <Button
                flex={1}
                color="white"
                _hover={{ color: mode === 'now' ? 'white' : 'gray.400' }}
                colorScheme={mode === 'now' ? 'green' : 'gray'}
                variant={mode === 'now' ? 'solid' : 'outline'}
                onClick={() => setMode('now')}
              >
                Start Now
              </Button>
              <Button
                flex={1}
                color="white"
                _hover={{ color: mode === 'schedule' ? 'white' : 'gray.400' }}
                colorScheme={mode === 'schedule' ? 'purple' : 'gray'}
                variant={mode === 'schedule' ? 'solid' : 'outline'}
                onClick={() => setMode('schedule')}
              >
                Schedule
              </Button>
            </ButtonGroup>

            <Text fontSize="xs" color="#6b9e78" fontFamily="mono">
              Scheduling is optional — you can still start manually at any time. Once launched
              (now or on schedule), your Discord setup and tasks are finalized.
            </Text>

            {mode === 'now' ? (
              <Text fontSize="sm" color="#d4f0da">
                Placement clock starts immediately.{' '}
                <Text as="span" color="yellow.300" fontWeight="semibold">
                  This cannot be undone.
                </Text>
              </Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="center">
                  <Text fontSize="xs" color="#6b9e78" fontFamily="mono">
                    {useUtc ? 'UTC' : `Local · ${localTz}`}
                  </Text>
                  <ButtonGroup isAttached size="xs">
                    <Button
                      colorScheme="purple"
                      variant={!useUtc ? 'solid' : 'outline'}
                      color="white"
                      _hover={{ bg: !useUtc ? 'purple.600' : 'gray.700' }}
                      onClick={() => {
                        setUseUtc(false);
                        setScheduledAt('');
                      }}
                    >
                      Local
                    </Button>
                    <Button
                      colorScheme="purple"
                      variant={useUtc ? 'solid' : 'outline'}
                      color="white"
                      _hover={{ bg: useUtc ? 'purple.600' : 'gray.700' }}
                      onClick={() => {
                        setUseUtc(true);
                        setScheduledAt('');
                      }}
                    >
                      UTC
                    </Button>
                  </ButtonGroup>
                </HStack>
                <Input
                  type="datetime-local"
                  size="sm"
                  min={minDatetime}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  bg="#060f0a"
                  borderColor="#1a4028"
                  color="#d4f0da"
                />
                {conversionHint && (
                  <Text fontSize="xs" color="#6b9e78" fontFamily="mono">
                    {conversionHint}
                  </Text>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" color="gray.400" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'now' ? (
            <Button
              colorScheme="green"
              isLoading={loadingNow}
              isDisabled={!canLaunch}
              onClick={onStartNow}
            >
              Start Placement
            </Button>
          ) : (
            <Button
              colorScheme="purple"
              isLoading={loadingSchedule}
              isDisabled={!scheduledAt || !canLaunch}
              onClick={handleSchedule}
            >
              Schedule
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function BSLaunchControl({ event, refetch, compact = false }) {
  const { user } = useAuth();
  const isLocalSiteAdmin = process.env.NODE_ENV === 'development' && user?.admin === true;
  const { showToast } = useToastContext();

  const teams = event?.teams ?? [];
  const teamOk = teams.length >= 2;
  const discordOk = teamOk && teams.every((t) => t.discordChannelId);
  const canLaunch = isLocalSiteAdmin || (teamOk && discordOk);
  const isDraft = event?.status === 'DRAFT';

  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [bannerUtc, setBannerUtc] = useState(false);
  const scheduleActionRef = React.useRef('schedule');

  const [startPlacement, { loading: starting }] = useMutation(START_BS_PLACEMENT_PHASE, {
    onCompleted: () => {
      showToast('Placement phase initiated. Teams may now place ships.', 'success');
      setShowLaunchModal(false);
      refetch?.();
    },
    onError: (err) => showToast(err.message ?? 'Failed to start placement phase.', 'error'),
  });

  const [updateBSEvent, { loading: scheduling }] = useMutation(UPDATE_BS_EVENT, {
    onCompleted: () => {
      const isCancel = scheduleActionRef.current === 'cancel';
      showToast(isCancel ? 'Schedule cancelled.' : 'Launch scheduled.', 'success');
      setShowLaunchModal(false);
      refetch?.();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update schedule.', 'error'),
  });

  if (!isDraft) return null;

  const handleStartNow = () => {
    startPlacement({ variables: { eventId: event.eventId } });
  };

  const handleSchedule = (isoString) => {
    scheduleActionRef.current = 'schedule';
    updateBSEvent({
      variables: { eventId: event.eventId, input: { scheduledPlacementStart: isoString } },
    });
  };

  const handleCancelSchedule = () => {
    scheduleActionRef.current = 'cancel';
    updateBSEvent({
      variables: { eventId: event.eventId, input: { scheduledPlacementStart: null } },
    });
  };

  return (
    <VStack align="stretch" spacing={3}>
      {event.scheduledPlacementStart && (
        <Box
          bg="#1a0a2e"
          border="1px solid"
          borderColor="#6b46c1"
          borderRadius="md"
          px={4}
          py={3}
        >
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" spacing={3}>
            <VStack align="flex-start" spacing={1} flex="1" minW="200px">
              <Text
                fontSize="xs"
                color="#c4b5fd"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                fontFamily="mono"
              >
                ⏰ Launch Scheduled
              </Text>
              <HStack spacing={2} align="center" flexWrap="wrap">
                <Text fontSize="sm" color="white" fontWeight="semibold" fontFamily="mono">
                  {fmtScheduled(event.scheduledPlacementStart, bannerUtc)}
                </Text>
                <ButtonGroup isAttached size="xs">
                  <Button
                    colorScheme="purple"
                    variant={!bannerUtc ? 'solid' : 'outline'}
                    color="white"
                    onClick={() => setBannerUtc(false)}
                  >
                    Local
                  </Button>
                  <Button
                    colorScheme="purple"
                    variant={bannerUtc ? 'solid' : 'outline'}
                    color="white"
                    onClick={() => setBannerUtc(true)}
                  >
                    UTC
                  </Button>
                </ButtonGroup>
              </HStack>
              <Text fontSize="xs" color="#a78bfa" fontFamily="mono">
                Placement phase will auto-start at this time and announce in team channels.
              </Text>
            </VStack>
            <Button
              size="xs"
              colorScheme="red"
              variant="ghost"
              isLoading={scheduling && scheduleActionRef.current === 'cancel'}
              onClick={handleCancelSchedule}
              fontFamily="mono"
              letterSpacing="wider"
              textTransform="uppercase"
            >
              Cancel Schedule
            </Button>
          </HStack>
        </Box>
      )}

      <Box>
        <Button
          onClick={() => setShowLaunchModal(true)}
          isDisabled={!canLaunch || !!event.scheduledPlacementStart}
          colorScheme="green"
          w="full"
          fontFamily="mono"
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="widest"
          textTransform="uppercase"
          bg="#22c55e"
          color="#060f0a"
          _hover={{ bg: '#4ade80' }}
          _active={{ bg: '#16a34a' }}
          _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
        >
          {event.scheduledPlacementStart ? 'Launch Scheduled' : 'Launch or Schedule Event →'}
        </Button>
        {!compact && (
          <Text
            fontFamily="mono"
            fontSize="10px"
            color="#3d6b4a"
            mt={2}
            textAlign="center"
            letterSpacing="wide"
          >
            Start now, or schedule a launch for later. Discord setup and tasks finalize on launch.
          </Text>
        )}
      </Box>

      <LaunchConfirmModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onStartNow={handleStartNow}
        onSchedule={handleSchedule}
        loadingNow={starting}
        loadingSchedule={scheduling && scheduleActionRef.current === 'schedule'}
        canLaunch={canLaunch}
      />
    </VStack>
  );
}
