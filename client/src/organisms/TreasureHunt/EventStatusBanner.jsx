import React, { useState, useEffect, useMemo } from 'react';
import { Box, HStack, VStack, Text, Badge, Icon, Progress } from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { FaFlagCheckered, FaArchive, FaClock, FaFire } from 'react-icons/fa';
import { formatDisplayDateTime } from '../../utils/dateUtils';

const EventStatusBanner = ({ event, isAdmin = false }) => {
  const [now, setNow] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = useMemo(() => {
    if (!event) return null;

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const status = event.status;

    // Calculate time differences
    const msUntilStart = startDate - now;
    const msUntilEnd = endDate - now;
    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;
    const progressPercent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

    // Format countdown
    const formatCountdown = (ms) => {
      const abMs = Math.abs(ms);
      const days = Math.floor(abMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((abMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((abMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };

    switch (status) {
      case 'DRAFT':
        return {
          icon: LockIcon,
          color: 'purple',
          bgGradient: 'linear(to-r, purple.600, purple.400)',
          label: 'DRAFT',
          title: 'Event Setup In Progress',
          subtitle: isAdmin
            ? 'Complete the launch checklist to go live'
            : 'This event is being prepared by organizers',
          showProgress: false,
          countdown: null,
          badge: isAdmin ? 'Only visible to admins' : null,
        };

      case 'ACTIVE':
        const isStartingSoon = msUntilStart > 0 && msUntilStart < 24 * 60 * 60 * 1000;
        const isEndingSoon = msUntilEnd > 0 && msUntilEnd < 24 * 60 * 60 * 1000;
        const hasStarted = msUntilStart <= 0;
        const hasEnded = msUntilEnd <= 0;

        if (!hasStarted) {
          // Event is active but hasn't started yet
          return {
            icon: FaClock,
            color: 'blue',
            bgGradient: 'linear(to-r, blue.600, blue.400)',
            label: 'STARTING SOON',
            title: `Starts in ${formatCountdown(msUntilStart)}`,
            subtitle: `${formatDisplayDateTime(startDate)}`,
            showProgress: false,
            countdown: formatCountdown(msUntilStart),
            countdownLabel: 'until start',
            badge: isStartingSoon ? '🔥 Starting soon!' : null,
            pulse: isStartingSoon,
          };
        } else if (!hasEnded) {
          // Event is live and running
          return {
            icon: FaFire,
            color: 'green',
            bgGradient: 'linear(to-r, green.500, teal.400)',
            label: 'LIVE',
            title: isEndingSoon ? `Ends in ${formatCountdown(msUntilEnd)}` : 'Event In Progress',
            subtitle: `Ends ${formatDisplayDateTime(endDate)}`,
            showProgress: false,
            progressPercent,
            countdown: formatCountdown(msUntilEnd),
            countdownLabel: 'remaining',
            badge: isEndingSoon ? '⚠️ Ending soon!' : null,
            pulse: isEndingSoon,
          };
        } else {
          // Event has technically ended but status not updated
          return {
            icon: FaFlagCheckered,
            color: 'orange',
            bgGradient: 'linear(to-r, orange.500, yellow.400)',
            label: 'ENDED',
            title: 'Event Has Ended',
            subtitle: `Ended ${formatDisplayDateTime(endDate)}`,
            showProgress: false,
            progressPercent: 100,
            badge: isAdmin ? 'Update status to COMPLETED' : null,
          };
        }

      case 'COMPLETED':
        return {
          icon: FaFlagCheckered,
          color: 'teal',
          bgGradient: 'linear(to-r, teal.600, cyan.400)',
          label: 'COMPLETED',
          title: 'Event Finished',
          subtitle: `Ended ${formatDisplayDateTime(endDate)}`,
          showProgress: false,
          progressPercent: 100,
          badge: null,
        };

      case 'ARCHIVED':
        return {
          icon: FaArchive,
          color: 'gray',
          bgGradient: 'linear(to-r, gray.600, gray.400)',
          label: 'ARCHIVED',
          title: 'Event Archived',
          subtitle: 'This event is no longer active',
          showProgress: false,
          badge: null,
        };

      default:
        return null;
    }
  }, [event, now, isAdmin]);

  if (!statusConfig) return null;

  return (
    <Box
      w="full"
      maxW="1200px"
      bgGradient={statusConfig.bgGradient}
      borderRadius="lg"
      overflow="hidden"
      boxShadow="lg"
      position="relative"
      mb="24px"
      borderLeft={statusConfig.pulse ? '4px solid rgba(255,255,255,0.8)' : undefined}
    >
      {/* Main content */}
      <HStack p={4} justify="space-between" align="center" flexWrap="wrap" spacing={4}>
        {/* Left side - Icon and status */}
        <HStack spacing={3}>
          <Box
            p={2}
            bg="whiteAlpha.200"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={statusConfig.icon} color="white" boxSize={6} />
          </Box>

          <VStack align="start" spacing={0}>
            <HStack spacing={2}>
              <Badge
                bg="whiteAlpha.300"
                color="white"
                fontSize="xs"
                fontWeight="bold"
                px={2}
                py={0.5}
                borderRadius="full"
              >
                {statusConfig.label}
              </Badge>
              {statusConfig.badge && (
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  fontSize="xs"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {statusConfig.badge}
                </Badge>
              )}
            </HStack>
            <Text color="white" fontWeight="bold" fontSize={['md', 'lg']}>
              {statusConfig.title}
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              {statusConfig.subtitle}
            </Text>
          </VStack>
        </HStack>

        {/* Right side - Countdown */}
        {statusConfig.countdown && (
          <VStack
            align="center"
            spacing={0}
            bg="whiteAlpha.200"
            px={4}
            py={2}
            borderRadius="md"
            minW="100px"
          >
            <Text color="white" fontSize="2xl" fontWeight="bold" fontFamily="mono">
              {statusConfig.countdown}
            </Text>
            <Text color="whiteAlpha.800" fontSize="xs" textTransform="uppercase">
              {statusConfig.countdownLabel}
            </Text>
          </VStack>
        )}
      </HStack>

      {/* Progress bar */}
      {statusConfig.showProgress && (
        <Box px={4} pb={3}>
          <HStack justify="space-between" mb={1}>
            <Text color="whiteAlpha.800" fontSize="xs">
              Progress
            </Text>
            <Text color="whiteAlpha.800" fontSize="xs">
              {Math.round(statusConfig.progressPercent)}%
            </Text>
          </HStack>
          <Progress
            value={statusConfig.progressPercent}
            size="sm"
            bg="whiteAlpha.300"
            borderRadius="full"
            sx={{
              '& > div': {
                background: 'white',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default EventStatusBanner;
