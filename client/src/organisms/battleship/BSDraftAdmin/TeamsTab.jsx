import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  Input,
  Select,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import {
  UPDATE_BS_TEAM_MEMBERS,
  ADD_BS_TEAM,
  UPDATE_BS_TEAM_DISCORD,
} from '../../../graphql/bsOperations';
import { GET_USER_BY_DISCORD_ID } from '../../../graphql/queries';
import { useToastContext } from '../../../providers/ToastProvider';
import DiscordMemberInput from '../../../molecules/DiscordMemberInput';
import { FieldLabel } from '../BSSharedComponents';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

export function MemberTag({ discordId, onRemove, isUpdating }) {
  const [resolvedName, setResolvedName] = useState(null);

  const { loading } = useQuery(GET_USER_BY_DISCORD_ID, {
    variables: { discordUserId: discordId },
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      if (data?.getUserByDiscordId?.displayName) {
        setResolvedName(data.getUserByDiscordId.displayName);
      } else {
        fetch(`${API_BASE}/discuser/${discordId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d?.username || d?.global_name) setResolvedName(d.global_name ?? d.username);
          })
          .catch(() => {});
      }
    },
  });

  const label = resolvedName ?? (loading ? '…' : `${discordId.slice(0, 8)}…`);

  return (
    <HStack
      key={discordId}
      justify="space-between"
      align="center"
      px={2}
      py={1}
      bg="#091a10"
      borderRadius="sm"
    >
      <Text fontFamily="mono" fontSize="xs" color="#b8d4c0" noOfLines={1}>
        {label}
      </Text>
      <Button
        size="xs"
        variant="ghost"
        color="#3d6b4a"
        fontFamily="mono"
        fontSize="10px"
        px={1}
        minW="auto"
        isLoading={isUpdating}
        _hover={{ color: 'red.400', bg: 'transparent' }}
        onClick={() => onRemove(discordId)}
      >
        ✕
      </Button>
    </HStack>
  );
}

export function TeamCard({ team, allTeams, refetch }) {
  const { showToast } = useToastContext();
  const [pendingMemberId, setPendingMemberId] = useState('');
  const [channelId, setChannelId] = useState(team.discordChannelId ?? '');
  const [roleId, setRoleId] = useState(team.discordRoleId ?? '');

  const [updateMembers, { loading: updatingMembers }] = useMutation(UPDATE_BS_TEAM_MEMBERS, {
    onCompleted: () => {
      showToast('Members updated.', 'success');
      setPendingMemberId('');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update members.', 'error'),
  });

  const [updateDiscord, { loading: updatingDiscord }] = useMutation(UPDATE_BS_TEAM_DISCORD, {
    onCompleted: () => {
      showToast('Discord channel saved.', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to save Discord channel.', 'error'),
  });

  const handleSaveDiscord = () => {
    updateDiscord({
      variables: {
        teamId: team.teamId,
        discordChannelId: channelId.trim() || null,
        discordRoleId: roleId.trim() || null,
      },
    });
  };

  const members = team.members ?? [];
  const otherTeamMemberMap = new Map(
    allTeams
      .filter((t) => t.teamId !== team.teamId)
      .flatMap((t) => (t.members ?? []).map((id) => [id, t.teamName]))
  );

  const handleAdd = (discordId) => {
    if (!discordId || members.includes(discordId)) return;
    updateMembers({ variables: { teamId: team.teamId, members: [...members, discordId] } });
  };

  const handleRemove = (discordId) => {
    updateMembers({
      variables: { teamId: team.teamId, members: members.filter((m) => m !== discordId) },
    });
  };

  const dotColor = team.color === 'RED' ? 'red.400' : 'cyan.400';

  return (
    <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={4}>
      <HStack spacing={2} mb={3} align="center">
        <Box w="8px" h="8px" borderRadius="full" bg={dotColor} flexShrink={0} />
        <Text
          fontFamily="mono"
          fontSize="sm"
          fontWeight="bold"
          color="#d4f0da"
          letterSpacing="wide"
        >
          {team.teamName}
        </Text>
        <Badge
          colorScheme={team.color === 'RED' ? 'red' : 'cyan'}
          fontSize="9px"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {team.color}
        </Badge>
      </HStack>

      <VStack align="stretch" spacing={2}>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#6b9e78"
          letterSpacing="widest"
          textTransform="uppercase"
        >
          Members / {members.length}
        </Text>

        {members.length > 0 && (
          <VStack align="stretch" spacing={1}>
            {members.map((discordId) => (
              <MemberTag
                key={discordId}
                discordId={discordId}
                onRemove={handleRemove}
                isUpdating={updatingMembers}
              />
            ))}
          </VStack>
        )}

        <Box maxW="320px">
          <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
            ADD MEMBER
          </Text>
          <DiscordMemberInput
            value={pendingMemberId}
            onChange={(id) => {
              setPendingMemberId(id);
              if (id) handleAdd(id);
            }}
            onRemove={() => setPendingMemberId('')}
            showRemove={false}
            colorMode="bs"
            conflictTeam={pendingMemberId ? otherTeamMemberMap.get(pendingMemberId) ?? null : null}
            isDuplicateInForm={pendingMemberId ? members.includes(pendingMemberId) : false}
          />
        </Box>

        <Divider borderColor="#1a4028" />

        <Box>
          <Text
            fontFamily="mono"
            fontSize="10px"
            color="#6b9e78"
            letterSpacing="widest"
            textTransform="uppercase"
            mb={2}
          >
            Discord Channel
          </Text>
          <VStack align="stretch" spacing={2}>
            <Box>
              <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
                CHANNEL ID
              </Text>
              <Input
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="i.e. 123456789012345678"
                bg="#091a10"
                border="1px solid"
                borderColor={channelId ? '#22c55e' : '#1a4028'}
                color="#d4f0da"
                fontFamily="mono"
                fontSize="sm"
                size="sm"
                maxW="320px"
                _placeholder={{ color: '#3d6b4a' }}
                _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                _hover={{ borderColor: '#1a5c2e' }}
              />
            </Box>
            <Box>
              <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
                ROLE ID{' '}
                <Text as="span" color="#2d4a35">
                  (optional — bot will ping this role)
                </Text>
              </Text>
              <Input
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                placeholder="i.e. 123456789012345678"
                bg="#091a10"
                border="1px solid"
                borderColor="#1a4028"
                color="#d4f0da"
                fontFamily="mono"
                fontSize="sm"
                size="sm"
                maxW="320px"
                _placeholder={{ color: '#3d6b4a' }}
                _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                _hover={{ borderColor: '#1a5c2e' }}
              />
            </Box>
            <Button
              size="xs"
              colorScheme="green"
              variant="outline"
              borderColor="#1a4028"
              color="#4ade80"
              fontFamily="mono"
              fontSize="10px"
              letterSpacing="wider"
              textTransform="uppercase"
              isLoading={updatingDiscord}
              onClick={handleSaveDiscord}
              alignSelf="flex-start"
              _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
            >
              Save Channel
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}

export function TeamsTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const teams = event.teams ?? [];
  const canAddTeam = teams.length < 2;
  const takenColors = teams.map((t) => t.color).filter(Boolean);
  const availableColors = ['BLUE', 'RED'].filter((c) => !takenColors.includes(c));

  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState(availableColors[0] ?? 'BLUE');

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(teamColor)) {
      setTeamColor(availableColors[0]);
    }
  }, [availableColors.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const [addBSTeam, { loading: addingTeam }] = useMutation(ADD_BS_TEAM, {
    onCompleted: () => {
      showToast('Team enlisted.', 'success');
      setTeamName('');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to add team.', 'error'),
  });

  const handleAddTeam = (e) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) return;
    addBSTeam({
      variables: {
        eventId: event.eventId,
        input: { teamName: trimmed, color: teamColor },
      },
    });
  };

  return (
    <VStack align="stretch" spacing={5}>
      {/* Explainer */}
      <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
        <VStack align="stretch" spacing={2}>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" letterSpacing="wide">
            Team members are identified by their Discord user ID. Each member must have an OSRS
            Bingo Hub account with their Discord linked in order to view their own team's board and
            participate.
          </Text>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wide">
            Admins can always view all boards regardless of team membership.
          </Text>
          <Accordion allowToggle width="fit-content">
            <AccordionItem border="none">
              <AccordionButton px={0} py={1} _hover={{ bg: 'transparent' }}>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#0ea5e9"
                  letterSpacing="wide"
                  flex="1"
                  textAlign="left"
                >
                  How do I find a Discord user ID?
                </Text>
                <AccordionIcon color="#0ea5e9" boxSize={3} />
              </AccordionButton>
              <AccordionPanel px={0} pb={1}>
                <VStack align="stretch" spacing={1}>
                  <Text fontFamily="mono" fontSize="10px" color="#94a3b8" letterSpacing="wide">
                    1. Open Discord → User Settings → Advanced → enable{' '}
                    <Text as="span" color="#d4f0da">
                      Developer Mode
                    </Text>
                  </Text>
                  <Text fontFamily="mono" fontSize="10px" color="#94a3b8" letterSpacing="wide">
                    2. Right-click a user&apos;s name →{' '}
                    <Text as="span" color="#d4f0da">
                      Copy User ID
                    </Text>
                  </Text>
                  <Text fontFamily="mono" fontSize="10px" color="#94a3b8" letterSpacing="wide">
                    3. Paste the 17–19 digit number (i.e.{' '}
                    <Text as="span" color="#d4f0da">
                      123456789012345678
                    </Text>
                    )
                  </Text>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Box>

      {teams.length === 0 ? (
        <Text fontFamily="mono" fontSize="xs" color="#6b9e78" letterSpacing="wide">
          No teams yet. Enlist two teams to begin.
        </Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {teams.map((team) => (
            <TeamCard key={team.teamId} team={team} allTeams={teams} refetch={refetch} />
          ))}
        </VStack>
      )}

      {canAddTeam && (
        <>
          <Divider borderColor="#1a4028" />
          <Box
            as="form"
            onSubmit={handleAddTeam}
            bg="#060f0a"
            border="1px solid"
            borderColor="#1a4028"
            borderRadius="md"
            p={4}
          >
            <VStack align="stretch" spacing={3}>
              <FieldLabel>Enlist New Team</FieldLabel>
              <HStack spacing={3} align="flex-end" flexWrap="wrap">
                <Box flex={1} minW="160px">
                  <FieldLabel>Team Name</FieldLabel>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="i.e. Iron Armada"
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="sm"
                    size="sm"
                    _placeholder={{ color: '#3d6b4a' }}
                    _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                    _hover={{ borderColor: '#1a5c2e' }}
                  />
                </Box>
                <Box w="120px">
                  <FieldLabel>Color</FieldLabel>
                  <Select
                    value={teamColor}
                    onChange={(e) => setTeamColor(e.target.value)}
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="sm"
                    size="sm"
                    _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                    _hover={{ borderColor: '#1a5c2e' }}
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c} style={{ background: '#091a10' }}>
                        {c.charAt(0) + c.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Button
                  type="submit"
                  isLoading={addingTeam}
                  colorScheme="green"
                  variant="outline"
                  borderColor="#1a4028"
                  color="#4ade80"
                  fontFamily="mono"
                  fontSize="10px"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  size="sm"
                  _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
                  flexShrink={0}
                >
                  Enlist
                </Button>
              </HStack>
            </VStack>
          </Box>
        </>
      )}

      {!canAddTeam && (
        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wide">
          Maximum teams reached (2/2).
        </Text>
      )}
    </VStack>
  );
}
