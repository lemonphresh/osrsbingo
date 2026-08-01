import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Avatar,
  Icon,
  Tooltip,
  Button,
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { FaShieldAlt, FaScroll, FaCrown } from 'react-icons/fa';

export default function TeamCard({ team, eventId, currentUserDiscordId, isAdmin, phase }) {
  const navigate = useNavigate();

  const isMember = useMemo(() => {
    if (!currentUserDiscordId) return false;
    return (team.members ?? []).some((m) =>
      typeof m === 'string'
        ? m === currentUserDiscordId
        : (m?.discordId ?? m?.discordUserId) === currentUserDiscordId
    );
  }, [team.members, currentUserDiscordId]);

  const canEnterBarracks = isAdmin || isMember;
  const barracksPath = `/champion-forge/${eventId}/barracks/${team.teamId}`;

  const loadoutStatus = team.loadoutLocked
    ? { icon: LockIcon, color: 'green.400', label: 'Loadout locked' }
    : { icon: UnlockIcon, color: 'gray.500', label: 'Loadout not locked' };

  const completedCount = team.completedTaskIds?.length ?? 0;
  const itemCount = team.items?.length ?? 0;

  const pvmers = (team.members ?? []).filter((m) => m.role === 'PVMER').length;
  const skillers = (team.members ?? []).filter((m) => m.role === 'SKILLER').length;
  const anyRole = (team.members ?? []).filter((m) => m.role === 'ANY' || !m.role).length;

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor={isMember ? 'teal.600' : 'gray.700'}
      borderRadius="xl"
      overflow="hidden"
      transition="border-color 0.2s"
      _hover={{ borderColor: isMember ? 'teal.400' : 'gray.500' }}
      display="flex"
      flexDirection="column"
    >
      {/* Card header */}
      <Box
        bg={isMember ? 'teal.900' : 'gray.700'}
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor={isMember ? 'teal.700' : 'gray.700'}
      >
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={FaShieldAlt} color={isMember ? 'teal.300' : 'gray.500'} />
            <Text fontWeight="bold" color="white" fontSize="md">
              {team.teamName}
            </Text>
            {isMember && (
              <Badge colorScheme="teal" fontSize="xs">
                Your Team
              </Badge>
            )}
          </HStack>
          <Tooltip label={loadoutStatus.label} hasArrow>
            <Icon as={loadoutStatus.icon} color={loadoutStatus.color} boxSize={3} />
          </Tooltip>
        </HStack>
      </Box>

      {/* Card body */}
      <VStack align="stretch" spacing={3} p={4} flex={1}>
        {team.members?.length > 0 ? (
          <VStack align="flex-start" spacing={2}>
            <HStack spacing={0}>
              {team.members.slice(0, 6).map((m, i) => {
                const isCaptain = m.discordId === team.captainDiscordId;
                const roleBorderColor =
                  m.role === 'PVMER'
                    ? 'orange.400'
                    : m.role === 'SKILLER'
                    ? 'teal.400'
                    : m.role === 'FLEX'
                    ? 'purple.400'
                    : 'gray.600';
                const avatar = (
                  <Avatar
                    name={m.username ?? m.discordId}
                    src={
                      m.avatar
                        ? `https://cdn.discordapp.com/avatars/${m.discordId}/${m.avatar}.png`
                        : undefined
                    }
                    size="xs"
                    bg="gray.600"
                    showBorder
                    borderColor={roleBorderColor}
                    borderWidth="2px"
                  />
                );
                return (
                  <Tooltip
                    key={m.discordId ?? i}
                    label={`${m.username ?? m.discordId}${isCaptain ? ' 👑 Captain' : ''} (${
                      m.role ?? 'ANY'
                    })`}
                    hasArrow
                  >
                    <Box
                      ml={i > 0 ? '-6px' : 0}
                      zIndex={team.members.length - i}
                      position="relative"
                      display="inline-flex"
                    >
                      {avatar}
                      {isCaptain && (
                        <Icon
                          as={FaCrown}
                          position="absolute"
                          top="-7px"
                          left="50%"
                          transform="translateX(-50%)"
                          color="yellow.400"
                          boxSize="10px"
                          filter="drop-shadow(0 1px 1px rgba(0,0,0,0.8))"
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
              {team.members.length > 6 && (
                <Avatar
                  name={`+${team.members.length - 6}`}
                  size="xs"
                  bg="gray.700"
                  ml="-6px"
                  zIndex={0}
                  getInitials={(n) => n}
                />
              )}
            </HStack>
            <HStack spacing={1} flexWrap="wrap">
              <Text fontSize="xs" color="gray.400">
                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
              </Text>
              {pvmers > 0 && (
                <Badge colorScheme="orange" fontSize="xs">
                  {pvmers} PvM
                </Badge>
              )}
              {skillers > 0 && (
                <Badge colorScheme="teal" fontSize="xs">
                  {skillers} Skill
                </Badge>
              )}
              {anyRole > 0 && (
                <Badge colorScheme="purple" fontSize="xs">
                  {anyRole} Any
                </Badge>
              )}
            </HStack>
          </VStack>
        ) : (
          <Text fontSize="xs" color="gray.600">
            No members yet
          </Text>
        )}

        {(phase === 'GATHERING' ||
          phase === 'OUTFITTING' ||
          phase === 'BATTLE' ||
          phase === 'COMPLETED') && (
          <HStack spacing={3}>
            {completedCount > 0 && (
              <HStack spacing={1}>
                <Icon as={FaScroll} color="green.400" boxSize={3} />
                <Text fontSize="xs" color="gray.400">
                  {completedCount} tasks done
                </Text>
              </HStack>
            )}
            {itemCount > 0 && (
              <HStack spacing={1}>
                <Text fontSize="xs" color="gray.400">
                  ⚔ {itemCount} items
                </Text>
              </HStack>
            )}
          </HStack>
        )}

        {canEnterBarracks && (
          <Button
            mt="auto"
            size="sm"
            colorScheme="purple"
            onClick={() => navigate(barracksPath)}
            leftIcon={<Icon as={FaShieldAlt} />}
          >
            Enter Barracks
          </Button>
        )}
      </VStack>
    </Box>
  );
}
