import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  IconButton,
  Icon,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { FaCrown, FaCoins, FaMap } from 'react-icons/fa';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { formatGP } from '../../utils/treasureHuntHelpers';

const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

const StandingsCard = ({
  team,
  index,
  event,
  currentColors,
  colorMode,
  onEditTeam,
  onTeamClick,
  userDiscordId,
}) => {
  const navigate = useNavigate();
  const teamColor = PRESET_COLORS[index % PRESET_COLORS.length];
  const isLeader = index === 0 && (team.currentPot || 0) > 0;
  const isOnTeam = userDiscordId && team.members?.some((m) => m.discordUserId === userDiscordId);
  const standardCount = event.nodes?.filter((n) => n.nodeType === 'STANDARD').length ?? 0;
  const innCount = event.nodes?.filter((n) => n.nodeType === 'INN').length ?? 0;
  const startCount = event.nodes?.filter((n) => n.nodeType === 'START').length ?? 0;
  const totalNodes = Math.max(Math.round(standardCount / 3) + innCount + startCount, 1);
  const completedCount = team.completedNodes?.length || 0;
  const progressPct = (completedCount / totalNodes) * 100;

  return (
    <HStack
      p={4}
      bg={
        isLeader
          ? colorMode === 'dark'
            ? 'yellow.900'
            : 'yellow.50'
          : colorMode === 'dark'
          ? 'whiteAlpha.50'
          : 'blackAlpha.50'
      }
      borderRadius="md"
      border={isLeader ? '2px solid' : '1px solid'}
      borderColor={isLeader ? 'yellow.400' : 'transparent'}
      spacing={4}
      transition="all 0.2s"
      _hover={{
        shadow: 'md',
        backgroundColor: isLeader
          ? colorMode === 'dark'
            ? 'yellow.800'
            : 'yellow.100'
          : 'whiteAlpha.300',
      }}
      cursor="pointer"
      onClick={() => {
        onTeamClick?.(team);
      }}
    >
      {/* Rank circle */}
      <Flex
        w={isLeader ? '32px' : '24px'}
        h={isLeader ? '32px' : '24px'}
        bg={isLeader ? 'yellow.400' : teamColor}
        borderRadius="full"
        align="center"
        justify="center"
        color="white"
        fontWeight="semibold"
        fontSize="sm"
        flexShrink={0}
      >
        {isLeader ? <Icon as={FaCrown} /> : index + 1}
      </Flex>

      {/* Team info */}
      <VStack align="start" spacing={1} flex={1} minW={0}>
        <HStack>
          <Text
            fontWeight="semibold"
            color={isLeader ? currentColors.textColor : currentColors.white}
            fontSize="md"
            isTruncated
          >
            {team.teamName}
          </Text>
          {isLeader && (
            <Badge colorScheme="yellow" fontSize="xs">
              Leader
            </Badge>
          )}
        </HStack>
        <HStack spacing={3} flexWrap="wrap">
          <HStack spacing={1}>
            <Icon as={FaCoins} color="yellow.400" boxSize={3} />
            <Text fontSize="sm" color={isLeader ? 'gray.500' : 'gray.200'}>
              {formatGP(team.currentPot || 0)} GP
            </Text>
          </HStack>
          <HStack spacing={1}>
            <Icon as={CheckCircleIcon} color="green.400" boxSize={3} />
            <Text fontSize="sm" color={isLeader ? 'gray.500' : 'gray.200'}>
              {completedCount} {completedCount === 1 ? 'node' : 'nodes'}
            </Text>
          </HStack>
          {event.nodes?.length > 0 && (isOnTeam || onEditTeam) && (
            <Button
              size="sm"
              bg={isLeader ? 'blackAlpha.100' : 'whiteAlpha.200'}
              color={isLeader ? 'gray.500' : 'gray.200'}
              fontWeight="normal"
              _hover={{ bg: isLeader ? 'blackAlpha.200' : 'whiteAlpha.300' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/gielinor-rush/${event.eventId}/team/${team.teamId}`);
              }}
              whiteSpace="nowrap"
            >
              <Icon as={FaMap} />
              &nbsp; View Page
            </Button>
          )}
          {onEditTeam && (
            <IconButton
              size="xs"
              icon={<EditIcon />}
              bg={currentColors.turquoise.base}
              color="white"
              _hover={{ opacity: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onEditTeam(team);
              }}
              aria-label="Edit team"
            />
          )}
        </HStack>
      </VStack>

      {/* Circular progress */}
      <CircularProgress
        value={progressPct}
        size="40px"
        color={teamColor}
        trackColor={isLeader ? 'gray.300' : 'gray.200'}
        thickness="8px"
      >
        <CircularProgressLabel fontSize="xs" color={isLeader ? 'gray.500' : 'gray.200'}>
          {Math.round(progressPct)}%
        </CircularProgressLabel>
      </CircularProgress>
    </HStack>
  );
};

export default StandingsCard;
