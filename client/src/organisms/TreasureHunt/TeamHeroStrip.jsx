import React from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { MdHome } from 'react-icons/md';
import GemTitle from '../../atoms/GemTitle';
import { formatGP } from '../../utils/treasureHuntHelpers';

const TeamHeroStrip = ({
  team,
  event,
  adminMode,
  currentColors,
  availableInns,
  onAvailableInnsOpen,
  toast,
}) => (
  <Flex
    align={['flex-start', 'center']}
    justify="space-between"
    flexDir={['column', 'row']}
    gap={3}
  >
    {/* Left: title + chips */}
    <VStack align="start" spacing={2} flexShrink={0}>
      <HStack>
        <GemTitle size="lg" mb={0}>
          {team.teamName}
        </GemTitle>
        {adminMode && (
          <Badge bg={currentColors.red.base} color="white" fontSize="sm">
            ⚙️ ADMIN
          </Badge>
        )}
      </HStack>
      <Tooltip label={`Click to copy — ${event.eventId}`} hasArrow>
        <HStack
          spacing={2}
          px={2}
          py={0.5}
          bg="whiteAlpha.100"
          borderRadius="md"
          cursor="pointer"
          _hover={{ bg: 'whiteAlpha.300' }}
          onClick={() => {
            navigator.clipboard.writeText(event.eventId);
            toast({ title: 'Event ID Copied!', status: 'success', duration: 2000 });
          }}
        >
          <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
            Event ID: {event.eventId}
          </Text>
          <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
        </HStack>
      </Tooltip>
      {event.eventPassword && (
        <Tooltip label="Click to copy Event Password" hasArrow>
          <HStack
            spacing={2}
            px={2}
            py={0.5}
            bg="whiteAlpha.100"
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: 'whiteAlpha.300' }}
            onClick={() => {
              navigator.clipboard.writeText(event.eventPassword);
              toast({ title: 'Event Password Copied!', status: 'success', duration: 2000 });
            }}
          >
            <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
              Event Password: {event.eventPassword}
            </Text>
            <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
          </HStack>
        </Tooltip>
      )}
    </VStack>

    {/* Center: team members */}
    {team.members?.length > 0 && (
      <Flex
        flex={1}
        mx={6}
        flexWrap="wrap"
        gap={2}
        align="center"
        justify={['flex-start', 'center']}
      >
        <Text fontSize="sm" color={currentColors.white} fontWeight="medium">
          Team Members:
        </Text>
        {team.members.map((member, idx) => (
          <HStack
            key={idx}
            spacing={1.5}
            px={3}
            py={1}
            bg="whiteAlpha.100"
            borderRadius="full"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={currentColors.green.base}
              flexShrink={0}
            />
            <Text fontSize="sm" color={currentColors.white} fontWeight="medium">
              {member.rsn || member.discordUsername || member.discordUserId}
            </Text>
          </HStack>
        ))}
      </Flex>
    )}

    {/* Right: Prize Pot + Inn button */}
    <HStack spacing={3} flexWrap="wrap" alignSelf="flex-start" flexShrink={0}>
      <Stat
        bg={currentColors.cardBg}
        px={4}
        py={2}
        borderRadius="md"
        minW="100px"
        textAlign="center"
      >
        <StatLabel fontSize="xs" color={currentColors.textColor}>
          Prize Pot
        </StatLabel>
        <StatNumber fontSize="lg" color={currentColors.green.base}>
          {formatGP(team.currentPot || 0)} GP
        </StatNumber>
      </Stat>
      {availableInns > 0 && (
        <Button
          bg="yellow.400"
          color="gray.900"
          fontWeight="semibold"
          leftIcon={<Icon as={MdHome} />}
          onClick={onAvailableInnsOpen}
          animation="pulseInn 2s ease-in-out infinite"
          sx={{
            '@keyframes pulseInn': {
              '0%,100%': { boxShadow: '0 0 0 0 rgba(236,201,75,0.6)' },
              '50%': { boxShadow: '0 0 12px 4px rgba(236,201,75,0.8)' },
            },
          }}
        >
          {availableInns} Inn{availableInns > 1 ? 's' : ''} Available!
        </Button>
      )}
    </HStack>
  </Flex>
);

export default TeamHeroStrip;
