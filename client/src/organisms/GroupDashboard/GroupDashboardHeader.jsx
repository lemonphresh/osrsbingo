import { Box, HStack, VStack, Text, Image } from '@chakra-ui/react';

function formatCountdown(endDate) {
  const ms = new Date(endDate) - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export default function GroupDashboardHeader({ dashboard, activeEvent }) {
  const theme = dashboard?.theme ?? {};
  const primaryColor = theme.primaryColor ?? '#7D5FFF';
  const accentColor = theme.accentColor ?? '#43AA8B';
  const countdown = activeEvent ? formatCountdown(activeEvent.endDate) : null;
  const now = new Date();
  const isActive =
    activeEvent &&
    now >= new Date(activeEvent.startDate) &&
    now <= new Date(activeEvent.endDate);
  const isUpcoming = activeEvent && now < new Date(activeEvent.startDate);

  const statusColor = isUpcoming ? '#7D5FFF' : isActive ? accentColor : '#666';
  const statusLabel = isUpcoming ? 'Upcoming' : isActive && countdown ? countdown : 'Ended';

  return (
    <HStack spacing={4} align="center" minW={0}>
      {theme.groupIconUrl && (
        <Box
          flexShrink={0}
          borderRadius="lg"
          overflow="hidden"
          border="2px solid"
          borderColor={primaryColor}
          boxShadow={`0 0 12px ${primaryColor}55`}
        >
          <Image
            src={theme.groupIconUrl}
            alt={dashboard.groupName}
            boxSize="52px"
            objectFit="cover"
            display="block"
          />
        </Box>
      )}

      <VStack align="flex-start" spacing={1} minW={0}>
        <Text fontSize="2xl" fontWeight="extrabold" color="white" lineHeight="1.1" noOfLines={1}>
          {dashboard.groupName}
        </Text>

        {activeEvent && (
          <HStack spacing={2} align="center">
            <Box w="2px" h="14px" bg={primaryColor} borderRadius="full" flexShrink={0} />
            <Text fontSize="sm" color="gray.400" noOfLines={1}>{activeEvent.eventName}</Text>
            <Box
              px={2} py={0.5}
              bg={`${statusColor}22`}
              border="1px solid"
              borderColor={`${statusColor}66`}
              borderRadius="md"
              flexShrink={0}
            >
              <Text fontSize="xs" fontWeight="bold" color={statusColor} textTransform="uppercase" letterSpacing="wide">
                {statusLabel}
              </Text>
            </Box>
          </HStack>
        )}
      </VStack>
    </HStack>
  );
}
