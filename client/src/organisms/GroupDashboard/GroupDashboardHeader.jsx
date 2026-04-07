import { Box, HStack, VStack, Text, Image } from '@chakra-ui/react';

export default function GroupDashboardHeader({ dashboard, activeEvent, subtitle }) {
  const theme = dashboard?.theme ?? {};
  const primaryColor = theme.primaryColor ?? '#7D5FFF';
  const accentColor = theme.accentColor ?? '#43AA8B';
  const now = new Date();
  const isUpcoming = activeEvent && now < new Date(activeEvent.startDate);
  const isEnded = activeEvent && now > new Date(activeEvent.endDate);

  const statusColor = isUpcoming ? '#7D5FFF' : !isEnded ? accentColor : '#666';
  const statusLabel = isUpcoming ? 'Upcoming' : isEnded ? 'Ended' : 'Active';

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

        {(activeEvent || subtitle) && (
          <HStack spacing={2} align="center">
            <Box w="2px" h="14px" bg={primaryColor} borderRadius="full" flexShrink={0} />
            <Text fontSize="sm" color="gray.400" noOfLines={1}>{activeEvent ? activeEvent.eventName : subtitle}</Text>
            {activeEvent && (
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
            )}
          </HStack>
        )}
      </VStack>
    </HStack>
  );
}
