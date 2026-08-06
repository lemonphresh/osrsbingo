import React from 'react';
import { Box, VStack, HStack, Text, Badge, Tooltip } from '@chakra-ui/react';
import {
  cooldownRemaining,
  formatCooldown,
  coordLabel,
  timeAgo,
} from '../../utils/battleship/bsClientHelpers';

export function TeamStatusCard({ team, cooldownMinutes, isViewing }) {
  const cooldownMs = cooldownRemaining(team.lastShotAt, cooldownMinutes);
  const cooldownLabel = formatCooldown(cooldownMs);
  const accentColor = team.color === 'RED' ? 'red.400' : 'cyan.400';

  return (
    <Box
      bg="#091a10"
      border="1px solid"
      borderColor={isViewing ? accentColor : '#1a4028'}
      borderRadius="md"
      p={4}
      position="relative"
    >
      {isViewing && (
        <Box
          position="absolute"
          top={2}
          right={2}
          px={1.5}
          py={0.5}
          bg={accentColor}
          borderRadius="sm"
        >
          <Text
            fontFamily="mono"
            fontSize="9px"
            fontWeight="bold"
            color="#060f0a"
            letterSpacing="wider"
          >
            YOU
          </Text>
        </Box>
      )}

      <HStack spacing={2} mb={2} align="center">
        <Box w="8px" h="8px" borderRadius="full" bg={accentColor} flexShrink={0} />
        <Text
          fontFamily="mono"
          fontSize="sm"
          fontWeight="bold"
          color="#d4f0da"
          letterSpacing="wide"
        >
          {team.teamName}
        </Text>
      </HStack>

      <VStack align="stretch" spacing={1}>
        <HStack justify="space-between">
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
            Members
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
            {team.members?.length ?? 0}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Tooltip
            label="Skip tokens let your team bypass an ocean (miss) task without completing it. Used from the active task panel when you land a miss."
            fontSize="xs"
            placement="top"
            hasArrow
          >
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="#6b9e78"
              cursor="help"
              textDecoration="underline dotted"
            >
              Skip tokens
            </Text>
          </Tooltip>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
            {team.skipTokens ?? 0}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
            Cooldown
          </Text>
          <Text fontFamily="mono" fontSize="xs" color={cooldownLabel ? 'yellow.400' : 'green.400'}>
            {cooldownLabel ? cooldownLabel : 'Ready'}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

export function ShotLogEntry({ shot, teams }) {
  const firingTeam = teams.find((t) => t.teamId === shot.firingTeamId);
  const targetTeam = teams.find((t) => t.board?.boardId === shot.targetBoardId);
  const isHit = shot.result === 'HIT';
  const accentColor = firingTeam?.color === 'RED' ? 'red.400' : 'cyan.400';

  return (
    <Box py={2} px={3} bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="sm">
      <HStack justify="space-between" align="center" spacing={3}>
        <HStack spacing={2} flex={1} minW={0}>
          <Box w="6px" h="6px" borderRadius="full" bg={accentColor} flexShrink={0} />
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" fontWeight="bold" flexShrink={0}>
            {coordLabel(shot.row, shot.col)}
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78" noOfLines={1}>
            {firingTeam?.teamName ?? 'Unknown'}
            {targetTeam && targetTeam.teamId !== firingTeam?.teamId
              ? ` → ${targetTeam.teamName}`
              : ''}
          </Text>
          <Badge
            colorScheme={isHit ? 'red' : 'gray'}
            fontSize="9px"
            textTransform="uppercase"
            letterSpacing="wider"
            flexShrink={0}
          >
            {isHit ? 'Hit' : 'Miss'}
          </Badge>
        </HStack>
        <Text fontFamily="mono" fontSize="10px" color="#6b9e78" flexShrink={0}>
          {timeAgo(shot.shotAt)}
        </Text>
      </HStack>
    </Box>
  );
}
