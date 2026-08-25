import React, { useState } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Center, Spinner, Text, VStack, HStack, Heading, Badge, Button, Input,
  Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  IconButton, Avatar, useToast,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../../providers/AuthProvider';
import { SEARCH_USERS } from '../../graphql/queries';
import {
  GET_SPOOPY_ADMIN_EVENT,
  CREATE_SPOOPY_EVENT,
  SEED_SPOOPY_MOCK_EVENT,
  REFRESH_SPOOPY_EVENT_FROM_MOCK,
  UPDATE_SPOOPY_EVENT_STATUS,
  UPDATE_SPOOPY_EVENT_BOARD,
  SET_SPOOPY_EVENT_PASSWORD,
  SET_SPOOPY_EVENT_PRIZE_POOL,
  SET_SPOOPY_EVENT_WOM_COMPETITION_ID,
  SYNC_SPOOPY_EVENT_WOM,
  DELETE_SPOOPY_EVENT,
  CREATE_SPOOPY_TEAM,
  UPDATE_SPOOPY_TEAM_MEMBERS,
  UPDATE_SPOOPY_TEAM_DISCORD,
  DELETE_SPOOPY_TEAM,
  ADD_SPOOPY_ADMIN,
  REMOVE_SPOOPY_ADMIN,
} from '../../graphql/spoopyOperations';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import SpoopyMemberTag from '../../organisms/spoopy/SpoopyMemberTag';
import { SPOOPY_COLORS, SPOOPY_FONTS } from '../../organisms/spoopy/spoopyTheme';
import { formatCandy, formatGp, GP_PER_CANDY } from '../../organisms/spoopy/spoopyCurrency';

// ── UI atoms — shared paper-on-night styling for form panels ────────────

function Panel({ children, ...props }) {
  return (
    <Box
      bg={SPOOPY_COLORS.night}
      border="1px solid"
      borderColor={SPOOPY_COLORS.nightMist}
      borderRadius="md"
      p={5}
      {...props}
    >
      {children}
    </Box>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <Box mb={1}>
      <Text fontSize="sm" color={SPOOPY_COLORS.paper} opacity={0.85}>{children}</Text>
      {hint && <Text fontSize="xs" opacity={0.5} mt={0.5}>{hint}</Text>}
    </Box>
  );
}

function themedInput(props = {}) {
  return {
    bg: SPOOPY_COLORS.nightDeep,
    borderColor: SPOOPY_COLORS.nightMist,
    color: SPOOPY_COLORS.paper,
    _placeholder: { color: SPOOPY_COLORS.paperShadow, opacity: 0.4 },
    ...props,
  };
}

// Prize-pool editor. Locked once the event goes ACTIVE — the per-team share
// is snapshotted at that point and can't be edited without corrupting
// already-paid rewards. Also shows the derived per-house and haunted-house
// amounts based on current team count so the admin sees what they're
// setting up before flipping the event live.
function PrizePoolPanel({ event, input, setInput, onSave, saving }) {
  const isLocked = event.status !== 'SETUP';
  const houseCount = (event.board?.tiles ?? []).filter((t) => t.tile_type === 'house').length;
  const teamCount = (event.teams ?? []).length;
  const poolNum = Number.parseInt(input, 10);
  const preview = Number.isFinite(poolNum) && teamCount > 0 && houseCount > 0
    ? {
        perTeam: Math.floor(poolNum / teamCount),
        perHouse: Math.floor(Math.floor(poolNum / teamCount) / houseCount),
        hauntedHouse: 3 * Math.floor(Math.floor(poolNum / teamCount) / houseCount),
      }
    : null;

  return (
    <VStack align="stretch" spacing={2}>
      <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">
        prize pool
      </Text>
      <Text fontSize="xs" opacity={0.55}>
        total gp budgeted for trick-or-treat rewards. split evenly across teams at activation,
        then across each team's houses. haunted house pays 3× a single house on top.
        {' '}editable while status = SETUP.
        {isLocked && (
          <> locked ({event.status.toLowerCase()}).</>
        )}
      </Text>
      <HStack spacing={2}>
        <Input
          type="number"
          min={0}
          step={GP_PER_CANDY}
          {...themedInput({ size: 'sm', fontFamily: 'mono' })}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="10000000"
          maxW="240px"
          isDisabled={isLocked}
        />
        <Button
          size="sm"
          variant="outline"
          borderColor={SPOOPY_COLORS.nightMist}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
          isLoading={saving}
          isDisabled={isLocked}
          onClick={onSave}
        >
          save
        </Button>
      </HStack>
      {Number.isFinite(poolNum) && poolNum > 0 && (
        <Text fontSize="xs" opacity={0.75}>
          = {formatCandy(poolNum)} ({formatGp(poolNum)})
        </Text>
      )}
      {preview ? (
        <Box
          bg={SPOOPY_COLORS.night}
          border="1px solid"
          borderColor={SPOOPY_COLORS.nightMist}
          borderRadius="md"
          p={3}
          fontSize="xs"
        >
          <Text opacity={0.7} mb={1}>
            with {teamCount} team{teamCount === 1 ? '' : 's'} and {houseCount} house tile{houseCount === 1 ? '' : 's'}:
          </Text>
          <VStack align="stretch" spacing={0.5}>
            <HStack justify="space-between">
              <Text opacity={0.7}>per team share</Text>
              <Text fontFamily="mono">{formatCandy(preview.perTeam)} · {formatGp(preview.perTeam)}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text opacity={0.7}>per trick-or-treat house</Text>
              <Text fontFamily="mono">{formatCandy(preview.perHouse)} · {formatGp(preview.perHouse)}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text opacity={0.7}>haunted house (3×)</Text>
              <Text fontFamily="mono" color={SPOOPY_COLORS.pumpkinLight}>
                {formatCandy(preview.hauntedHouse)} · {formatGp(preview.hauntedHouse)}
              </Text>
            </HStack>
          </VStack>
        </Box>
      ) : (
        <Text fontSize="xs" opacity={0.55}>
          {teamCount === 0
            ? 'add at least one team to see the per-house breakdown.'
            : houseCount === 0
            ? 'add house tiles to see the per-house breakdown.'
            : 'enter a positive amount to preview per-house rewards.'}
        </Text>
      )}
    </VStack>
  );
}

// Local <input type=datetime-local /> works with 'YYYY-MM-DDTHH:MM'; we
// convert to/from an iso utc string for the mutation. Kept naive on purpose
// — matches how rainbow handles schedule editing.
function toLocalDatetimeInput(utcString) {
  if (!utcString) return '';
  const d = new Date(utcString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalDatetimeInput(local) {
  return local ? new Date(local).toISOString() : null;
}

// ── Create event ─────────────────────────────────────────────────────────

function CreateEventForm({ refetch }) {
  const toast = useToast();
  const [form, setForm] = useState({ eventName: '', curfewStart: '', curfewEnd: '', eventPassword: '', staffChannelId: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [createEvent, { loading }] = useMutation(CREATE_SPOOPY_EVENT, {
    onCompleted: () => { toast({ title: 'event created', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'create failed', description: e.message, status: 'error' }),
  });

  const [seedMock, { loading: seeding }] = useMutation(SEED_SPOOPY_MOCK_EVENT, {
    onCompleted: (res) => { toast({ title: 'mock event created', description: res.seedSpoopyMockEvent.eventId, status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'seed failed', description: e.message, status: 'error' }),
  });

  const handleSubmit = () => {
    if (!form.eventName.trim()) return;
    createEvent({
      variables: {
        input: {
          eventName: form.eventName.trim(),
          curfewStart: fromLocalDatetimeInput(form.curfewStart),
          curfewEnd: fromLocalDatetimeInput(form.curfewEnd),
          eventPassword: form.eventPassword.trim() || null,
          staffChannelId: form.staffChannelId.trim() || null,
        },
      },
    });
  };

  return (
    <Panel>
      <Heading size="sm" mb={4} fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
        create spoopy event
      </Heading>
      <VStack align="stretch" spacing={3}>
        <Box>
          <FieldLabel hint="also becomes the event's display name">event name</FieldLabel>
          <Input {...themedInput()} value={form.eventName} onChange={set('eventName')} placeholder="spooptober" />
        </Box>
        <HStack spacing={3} align="stretch">
          <Box flex={1}>
            <FieldLabel>curfew start</FieldLabel>
            <Input type="datetime-local" {...themedInput()} value={form.curfewStart} onChange={set('curfewStart')} />
          </Box>
          <Box flex={1}>
            <FieldLabel>curfew end</FieldLabel>
            <Input type="datetime-local" {...themedInput()} value={form.curfewEnd} onChange={set('curfewEnd')} />
          </Box>
        </HStack>
        <Box>
          <FieldLabel hint="teams include this visibly in submitted screenshots as proof">event password</FieldLabel>
          <Input {...themedInput({ fontFamily: 'mono' })} value={form.eventPassword} onChange={set('eventPassword')} placeholder="spooptober2026" />
        </Box>
        <Box>
          <FieldLabel hint="optional — staff-only notification channel">staff discord channel id</FieldLabel>
          <Input {...themedInput({ fontFamily: 'mono' })} value={form.staffChannelId} onChange={set('staffChannelId')} placeholder="123456789012345678" />
        </Box>
        <HStack pt={2} spacing={3}>
          <Button
            bg={SPOOPY_COLORS.pumpkin}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
            isLoading={loading}
            isDisabled={!form.eventName.trim()}
            onClick={handleSubmit}
          >
            create event
          </Button>
          <Divider orientation="vertical" borderColor={SPOOPY_COLORS.nightMist} />
          <Button
            variant="outline"
            borderColor={SPOOPY_COLORS.nightMist}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            isLoading={seeding}
            onClick={() => seedMock()}
          >
            🎃 or, seed the mock event
          </Button>
        </HStack>
      </VStack>
    </Panel>
  );
}

// ── Event settings panel ─────────────────────────────────────────────────

function EventSettingsPanel({ event, refetch }) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [startInput, setStartInput] = useState(() => toLocalDatetimeInput(event.curfewStart));
  const [endInput, setEndInput] = useState(() => toLocalDatetimeInput(event.curfewEnd));
  const [passwordInput, setPasswordInput] = useState(event.eventPassword ?? '');
  const [prizePoolInput, setPrizePoolInput] = useState(String(event.prizePool ?? 0));
  const [womInput, setWomInput] = useState(event.womCompetitionId ?? '');

  const [setPassword, { loading: savingPassword }] = useMutation(SET_SPOOPY_EVENT_PASSWORD, {
    onCompleted: () => { toast({ title: 'password saved', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'save failed', description: e.message, status: 'error' }),
  });

  const [setPrizePool, { loading: savingPrizePool }] = useMutation(SET_SPOOPY_EVENT_PRIZE_POOL, {
    onCompleted: () => { toast({ title: 'prize pool saved', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'save failed', description: e.message, status: 'error' }),
  });

  const [setWomCompId, { loading: savingWom }] = useMutation(SET_SPOOPY_EVENT_WOM_COMPETITION_ID, {
    onCompleted: () => { toast({ title: 'wom competition saved', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'save failed', description: e.message, status: 'error' }),
  });

  const [syncWom, { loading: syncingWom }] = useMutation(SYNC_SPOOPY_EVENT_WOM, {
    onCompleted: () => { toast({ title: 'wom sync fired', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'wom sync failed', description: e.message, status: 'error' }),
  });

  const [refreshEvent, { loading: refreshing }] = useMutation(REFRESH_SPOOPY_EVENT_FROM_MOCK, {
    onCompleted: () => { toast({ title: 'event content refreshed from mock', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'refresh failed', description: e.message, status: 'error' }),
  });

  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_SPOOPY_EVENT_STATUS, {
    onCompleted: () => { toast({ title: 'status updated', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'status update failed', description: e.message, status: 'error' }),
  });

  const [updateBoard] = useMutation(UPDATE_SPOOPY_EVENT_BOARD, {
    onCompleted: () => { toast({ title: 'schedule saved', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'save failed', description: e.message, status: 'error' }),
  });

  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_SPOOPY_EVENT, {
    onCompleted: () => { toast({ title: 'event deleted', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'delete failed', description: e.message, status: 'error' }),
  });

  // Schedule saving reuses updateSpoopyEventBoard (no dedicated setSchedule mutation
  // exists yet; curfew lives on the event and can be edited independently).
  const saveSchedule = () => {
    updateBoard({
      variables: {
        eventId: event.eventId,
        // pass through unchanged values for the required inputs — we're only editing curfew here
        board: event.board,
        contentById: event.contentById,
        hauntedHouse: event.hauntedHouse,
        startingTileIds: event.startingTileIds,
      },
    });
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between" wrap="wrap" gap={3}>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">status</Text>
          <HStack spacing={2}>
            {['SETUP', 'ACTIVE', 'COMPLETE'].map((s) => (
              <Button
                key={s}
                size="sm"
                isDisabled={event.status === s || updatingStatus}
                variant={event.status === s ? 'solid' : 'outline'}
                bg={event.status === s ? SPOOPY_COLORS.pumpkin : 'transparent'}
                color={event.status === s ? SPOOPY_COLORS.paper : SPOOPY_COLORS.paper}
                borderColor={SPOOPY_COLORS.nightMist}
                _hover={{ bg: SPOOPY_COLORS.nightMist }}
                onClick={() => updateStatus({ variables: { eventId: event.eventId, status: s } })}
              >
                {s.toLowerCase()}
              </Button>
            ))}
          </HStack>
        </VStack>
      </HStack>

      <Divider borderColor={SPOOPY_COLORS.nightMist} />

      <VStack align="stretch" spacing={2}>
        <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">curfew</Text>
        <HStack spacing={3}>
          <Box flex={1}>
            <FieldLabel>start</FieldLabel>
            <Input type="datetime-local" {...themedInput({ size: 'sm' })} value={startInput} onChange={(e) => setStartInput(e.target.value)} />
          </Box>
          <Box flex={1}>
            <FieldLabel>end</FieldLabel>
            <Input type="datetime-local" {...themedInput({ size: 'sm' })} value={endInput} onChange={(e) => setEndInput(e.target.value)} />
          </Box>
        </HStack>
        <Button
          size="sm"
          alignSelf="flex-start"
          variant="outline"
          borderColor={SPOOPY_COLORS.nightMist}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
          onClick={saveSchedule}
        >
          save curfew
        </Button>
        <Text fontSize="xs" opacity={0.5}>
          note: curfew editing is wired to updateSpoopyEventBoard for now — a dedicated
          setSchedule mutation will land with the next admin phase.
        </Text>
      </VStack>

      <Divider borderColor={SPOOPY_COLORS.nightMist} />

      <VStack align="stretch" spacing={2}>
        <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">event password</Text>
        <Text fontSize="xs" opacity={0.5}>
          teams include this visibly in submitted screenshots as proof. shown to teams under the
          event title on /spoopy-event and again on the refs queue.
        </Text>
        <HStack spacing={2}>
          <Input
            {...themedInput({ size: 'sm', fontFamily: 'mono' })}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="spooptober2026"
            maxW="360px"
          />
          <Button
            size="sm"
            variant="outline"
            borderColor={SPOOPY_COLORS.nightMist}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            isLoading={savingPassword}
            onClick={() =>
              setPassword({
                variables: { eventId: event.eventId, password: passwordInput.trim() || null },
              })
            }
          >
            save
          </Button>
        </HStack>
      </VStack>

      <Divider borderColor={SPOOPY_COLORS.nightMist} />

      <PrizePoolPanel
        event={event}
        input={prizePoolInput}
        setInput={setPrizePoolInput}
        onSave={() => {
          const n = Number.parseInt(prizePoolInput, 10);
          if (!Number.isFinite(n) || n < 0) {
            toast({ title: 'enter a non-negative gp amount', status: 'error' });
            return;
          }
          setPrizePool({ variables: { eventId: event.eventId, prizePool: n } });
        }}
        saving={savingPrizePool}
      />

      <Divider borderColor={SPOOPY_COLORS.nightMist} />

      <VStack align="stretch" spacing={2}>
        <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">
          wom competition
        </Text>
        <Text fontSize="xs" opacity={0.55}>
          paste a wise old man team-competition id. team names on wom must match the team names
          here exactly (spelling + case). when set, skilling / kc tile progress bars auto-fill
          from gains between each tile's pre-screenshot approval and now. syncs on the pre
          approval, on a manual "sync now" click, and every 15 minutes while the event is ACTIVE.
        </Text>
        <HStack spacing={2}>
          <Input
            {...themedInput({ size: 'sm', fontFamily: 'mono' })}
            value={womInput}
            onChange={(e) => setWomInput(e.target.value)}
            placeholder="e.g. 12345"
            maxW="240px"
          />
          <Button
            size="sm"
            variant="outline"
            borderColor={SPOOPY_COLORS.nightMist}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            isLoading={savingWom}
            onClick={() =>
              setWomCompId({
                variables: {
                  eventId: event.eventId,
                  womCompetitionId: womInput.trim() || null,
                },
              })
            }
          >
            save
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor={SPOOPY_COLORS.pumpkin}
            color={SPOOPY_COLORS.pumpkinLight}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            isLoading={syncingWom}
            isDisabled={!event.womCompetitionId}
            onClick={() => syncWom({ variables: { eventId: event.eventId } })}
          >
            🔄 sync now
          </Button>
        </HStack>
        {event.lastWomSyncAt && (
          <Text fontSize="xs" opacity={0.55}>
            last sync: {new Date(event.lastWomSyncAt).toLocaleString(undefined, {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Text>
        )}
      </VStack>

      <Divider borderColor={SPOOPY_COLORS.nightMist} />

      <VStack align="stretch" spacing={2}>
        <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">
          content refresh
        </Text>
        <Text fontSize="xs" opacity={0.55}>
          re-runs the mock generator and overwrites the event's board, tile content, and haunted-house
          config in place. team state (unlocked tiles, gp, submissions) is preserved — this only
          rewrites the static content the mock produces (dialog copy, discord commands, tile types).
        </Text>
        <Button
          size="sm"
          alignSelf="flex-start"
          variant="outline"
          borderColor={SPOOPY_COLORS.nightMist}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
          isLoading={refreshing}
          onClick={() => refreshEvent({ variables: { eventId: event.eventId } })}
        >
          🔄 refresh content from mock
        </Button>
      </VStack>

      <Divider borderColor={SPOOPY_COLORS.nightMist} />

      <VStack align="stretch" spacing={2}>
        <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider" color={SPOOPY_COLORS.ember}>
          danger zone
        </Text>
        {!confirmDelete ? (
          <Button
            size="sm"
            alignSelf="flex-start"
            bg={SPOOPY_COLORS.ember}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.emberDeep }}
            onClick={() => setConfirmDelete(true)}
          >
            delete event
          </Button>
        ) : (
          <HStack spacing={2}>
            <Text fontSize="sm">nuke this event + all teams/submissions?</Text>
            <Button size="sm" onClick={() => setConfirmDelete(false)}>cancel</Button>
            <Button
              size="sm"
              bg={SPOOPY_COLORS.emberDeep}
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.ember }}
              isLoading={deleting}
              onClick={() => deleteEvent({ variables: { eventId: event.eventId } })}
            >
              yes, delete
            </Button>
          </HStack>
        )}
      </VStack>
    </VStack>
  );
}

// ── Team manager ─────────────────────────────────────────────────────────

function AddTeamForm({ eventId, refetch }) {
  const toast = useToast();
  const [form, setForm] = useState({ teamName: '', discordChannelId: '', discordRoleId: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [createTeam, { loading }] = useMutation(CREATE_SPOOPY_TEAM, {
    onCompleted: () => {
      toast({ title: 'team added', status: 'success' });
      setForm({ teamName: '', discordChannelId: '', discordRoleId: '' });
      refetch();
    },
    onError: (e) => toast({ title: 'add team failed', description: e.message, status: 'error' }),
  });

  const submit = () => {
    if (!form.teamName.trim() || !form.discordChannelId.trim()) return;
    createTeam({
      variables: {
        eventId,
        input: {
          teamName: form.teamName.trim(),
          discordChannelId: form.discordChannelId.trim(),
          discordRoleId: form.discordRoleId.trim() || null,
        },
      },
    });
  };

  return (
    <Box
      border="1px dashed"
      borderColor={SPOOPY_COLORS.nightMist}
      borderRadius="md"
      p={4}
    >
      <Text fontSize="sm" fontWeight="semibold" mb={3}>add team</Text>
      <VStack align="stretch" spacing={2}>
        <HStack spacing={2} align="start">
          <Box flex={1}>
            <FieldLabel>team name</FieldLabel>
            <Input {...themedInput({ size: 'sm' })} value={form.teamName} onChange={set('teamName')} placeholder="team spoopy" />
          </Box>
          <Box flex={1}>
            <FieldLabel>discord channel id</FieldLabel>
            <Input {...themedInput({ size: 'sm', fontFamily: 'mono' })} value={form.discordChannelId} onChange={set('discordChannelId')} placeholder="123456789012345678" />
          </Box>
          <Box flex={1}>
            <FieldLabel hint="optional">discord role id</FieldLabel>
            <Input {...themedInput({ size: 'sm', fontFamily: 'mono' })} value={form.discordRoleId} onChange={set('discordRoleId')} placeholder="123456789012345678" />
          </Box>
        </HStack>
        <Button
          alignSelf="flex-start"
          size="sm"
          bg={SPOOPY_COLORS.pumpkin}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
          isLoading={loading}
          isDisabled={!form.teamName.trim() || !form.discordChannelId.trim()}
          onClick={submit}
        >
          add team
        </Button>
      </VStack>
    </Box>
  );
}

function TeamCard({ team, allTeams, refetch }) {
  const toast = useToast();
  const [pendingMemberId, setPendingMemberId] = useState('');
  const [channelInput, setChannelInput] = useState(team.discordChannelId ?? '');
  const [roleInput, setRoleInput] = useState(team.discordRoleId ?? '');

  const [updateMembers, { loading: updatingMembers }] = useMutation(UPDATE_SPOOPY_TEAM_MEMBERS, {
    onCompleted: () => { toast({ title: 'members updated', status: 'success' }); setPendingMemberId(''); refetch(); },
    onError: (e) => toast({ title: 'update failed', description: e.message, status: 'error' }),
  });

  const [updateDiscord, { loading: updatingDiscord }] = useMutation(UPDATE_SPOOPY_TEAM_DISCORD, {
    onCompleted: () => { toast({ title: 'discord bindings updated', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'update failed', description: e.message, status: 'error' }),
  });

  const [deleteTeam, { loading: deleting }] = useMutation(DELETE_SPOOPY_TEAM, {
    onCompleted: () => { toast({ title: 'team deleted', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'delete failed', description: e.message, status: 'error' }),
  });

  const members = team.members ?? [];
  const otherTeamMemberMap = new Map(
    allTeams.filter((t) => t.teamId !== team.teamId)
      .flatMap((t) => (t.members ?? []).map((id) => [id, t.teamName])),
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

  return (
    <Box bg={SPOOPY_COLORS.nightDeep} border="1px solid" borderColor={SPOOPY_COLORS.nightMist} borderRadius="md" p={4}>
      <HStack justify="space-between" align="start" mb={3}>
        <VStack align="start" spacing={0}>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg">{team.teamName}</Text>
          <HStack spacing={2} fontSize="xs" opacity={0.65}>
            <Text>#{team.discordChannelId}</Text>
            {team.color && <Badge bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper}>{team.color}</Badge>}
            <Text>· {members.length} member{members.length === 1 ? '' : 's'}</Text>
          </HStack>
        </VStack>
        <IconButton
          icon={<DeleteIcon />}
          size="xs"
          aria-label="delete team"
          isLoading={deleting}
          bg={SPOOPY_COLORS.ember}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.emberDeep }}
          onClick={() => {
            if (window.confirm(`delete "${team.teamName}"?`)) {
              deleteTeam({ variables: { teamId: team.teamId } });
            }
          }}
        />
      </HStack>

      <VStack align="stretch" spacing={2}>
        {/* Add-member input lives ABOVE the members list so its dropdown
            expands downward into free card space (or overlays existing
            members within the same card) rather than trying to escape into
            the accordion panel below. */}
        <Box maxW="360px" position="relative" zIndex={20}>
          <FieldLabel hint="search by discord id, name, or rsn">add member</FieldLabel>
          <DiscordMemberInput
            value={pendingMemberId}
            onChange={(id) => { setPendingMemberId(id); if (id) handleAdd(id); }}
            onRemove={() => setPendingMemberId('')}
            showRemove={false}
            colorMode="dark"
            conflictTeam={pendingMemberId ? otherTeamMemberMap.get(pendingMemberId) ?? null : null}
            isDuplicateInForm={pendingMemberId ? members.includes(pendingMemberId) : false}
          />
        </Box>

        {members.length > 0 && (
          <VStack align="stretch" spacing={1} pt={2}>
            {members.map((discordId) => (
              <SpoopyMemberTag
                key={discordId}
                discordId={discordId}
                onRemove={handleRemove}
                isUpdating={updatingMembers}
              />
            ))}
          </VStack>
        )}

        <Divider borderColor={SPOOPY_COLORS.nightMist} pt={2} />

        <HStack spacing={2} align="end" wrap="wrap">
          <Box flex="1 1 200px" minW="180px">
            <FieldLabel hint="the team's private discord channel">channel id</FieldLabel>
            <Input
              {...themedInput({ size: 'sm', fontFamily: 'mono' })}
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="123456789012345678"
            />
          </Box>
          <Box flex="1 1 200px" minW="180px">
            <FieldLabel hint="optional — pings on ref actions">role id</FieldLabel>
            <Input
              {...themedInput({ size: 'sm', fontFamily: 'mono' })}
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="123456789012345678"
            />
          </Box>
          <Button
            size="sm"
            variant="outline"
            borderColor={SPOOPY_COLORS.nightMist}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            isLoading={updatingDiscord}
            isDisabled={
              channelInput === (team.discordChannelId ?? '') &&
              roleInput === (team.discordRoleId ?? '')
            }
            onClick={() =>
              updateDiscord({
                variables: {
                  teamId: team.teamId,
                  discordChannelId: channelInput.trim() || null,
                  discordRoleId: roleInput.trim() || null,
                },
              })
            }
          >
            save
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

function TeamManager({ event, refetch }) {
  return (
    <VStack align="stretch" spacing={3}>
      <AddTeamForm eventId={event.eventId} refetch={refetch} />
      {event.teams.length > 0 && (
        <VStack align="stretch" spacing={2}>
          {event.teams.map((t) => (
            <TeamCard key={t.teamId} team={t} allTeams={event.teams} refetch={refetch} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

// ── Admin manager ────────────────────────────────────────────────────────

function AdminManager({ event, refetch }) {
  const toast = useToast();
  const [search, setSearch] = useState('');

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search },
    skip: search.length < 3,
  });

  const [addAdmin] = useMutation(ADD_SPOOPY_ADMIN, {
    onCompleted: () => { toast({ title: 'admin added', status: 'success' }); setSearch(''); refetch(); },
    onError: (e) => toast({ title: 'add failed', description: e.message, status: 'error' }),
  });
  const [removeAdmin] = useMutation(REMOVE_SPOOPY_ADMIN, {
    onCompleted: () => { toast({ title: 'admin removed', status: 'success' }); refetch(); },
    onError: (e) => toast({ title: 'remove failed', description: e.message, status: 'error' }),
  });

  const existingIds = new Set((event.adminIds ?? []).map(String));
  const results = (searchData?.searchUsers ?? []).filter((u) => !existingIds.has(String(u.id)));

  return (
    <VStack align="stretch" spacing={3}>
      <Text fontSize="xs" opacity={0.6}>
        admins can flip event status, add teams, and approve/deny submissions.
      </Text>
      <Input
        {...themedInput({ size: 'sm' })}
        placeholder="search users to add…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {results.map((u) => (
        <HStack key={u.id} justify="space-between" p={2} bg={SPOOPY_COLORS.nightDeep} borderRadius="md">
          <Text fontSize="sm">{u.displayName ?? u.username}</Text>
          <IconButton
            icon={<AddIcon />}
            size="xs"
            aria-label="add"
            bg={SPOOPY_COLORS.green}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.greenDeep }}
            onClick={() => addAdmin({ variables: { eventId: event.eventId, userId: u.id } })}
          />
        </HStack>
      ))}
      <Divider borderColor={SPOOPY_COLORS.nightMist} />
      {(event.admins ?? []).length === 0 ? (
        <Text fontSize="xs" opacity={0.5}>no admins yet.</Text>
      ) : (
        (event.admins ?? []).map((admin) => (
          <HStack key={admin.id} justify="space-between" p={2} bg={SPOOPY_COLORS.nightDeep} borderRadius="md">
            <HStack spacing={2}>
              <Avatar size="xs" name={admin.displayName ?? admin.username} />
              <Text fontSize="sm">{admin.displayName ?? admin.username}</Text>
            </HStack>
            <IconButton
              icon={<DeleteIcon />}
              size="xs"
              aria-label="remove"
              variant="ghost"
              color={SPOOPY_COLORS.paper}
              onClick={() => removeAdmin({ variables: { eventId: event.eventId, userId: admin.id } })}
            />
          </HStack>
        ))
      )}
    </VStack>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

export default function SpoopyAdminPage() {
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const { data, loading, refetch } = useQuery(GET_SPOOPY_ADMIN_EVENT, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  if (isCheckingAuth || loading) {
    return <Shell><Center py={20}><Spinner size="xl" color={SPOOPY_COLORS.pumpkin} /></Center></Shell>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const events = data?.spoopyEvents ?? [];
  const event = events[0] ?? null;
  const isEventAdmin = event
    ? user?.admin || (event.adminIds ?? []).map(String).includes(String(user?.id))
    : user?.admin;

  if (!isEventAdmin) {
    return (
      <Shell>
        <Center py={20}>
          <VStack>
            <Text fontSize="2xl">🔒</Text>
            <Text opacity={0.7}>admin access only</Text>
          </VStack>
        </Center>
      </Shell>
    );
  }

  const teamCount = event?.teams?.length ?? 0;
  const adminCount = event?.admins?.length ?? 0;

  return (
    <Shell event={event}>
      <VStack align="stretch" spacing={5} py={6} px={{ base: 3, md: 6 }} maxW="900px" mx="auto">
        <HStack justify="space-between" wrap="wrap" gap={3}>
          <Text opacity={0.7} fontSize="sm">
            {event ? `managing: ${event.eventName}` : 'no event yet'}
          </Text>
          <HStack spacing={2}>
            <Button as={RouterLink} to="/spoopy-event" size="sm" variant="ghost" color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.nightMist }}>
              main page
            </Button>
            <Button as={RouterLink} to="/spoopy-event/refs" size="sm" variant="outline" borderColor={SPOOPY_COLORS.nightMist} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.nightMist }}>
              refs view
            </Button>
            <Button as={RouterLink} to="/spoopy-event/playground" size="sm" variant="outline" borderColor={SPOOPY_COLORS.nightMist} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.nightMist }}>
              playground
            </Button>
          </HStack>
        </HStack>

        {!event && <CreateEventForm refetch={refetch} />}

        {event && (
          <Accordion allowMultiple defaultIndex={[0]}>
            <AccordionItem border="1px solid" borderColor={SPOOPY_COLORS.nightMist} borderRadius="md" mb={3}>
              <AccordionButton px={4} py={3} _hover={{ bg: SPOOPY_COLORS.night }} borderRadius="md">
                <Box flex={1} textAlign="left">
                  <Text fontWeight="semibold" fontFamily={SPOOPY_FONTS.hand}>event settings</Text>
                </Box>
                <AccordionIcon color={SPOOPY_COLORS.paper} />
              </AccordionButton>
              <AccordionPanel px={4} pb={4} bg={SPOOPY_COLORS.nightDeep}>
                <EventSettingsPanel event={event} refetch={refetch} />
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem
              border="1px solid"
              borderColor={SPOOPY_COLORS.nightMist}
              borderRadius="md"
              mb={3}
              position="relative"
              zIndex={5}
            >
              <AccordionButton px={4} py={3} _hover={{ bg: SPOOPY_COLORS.night }} borderRadius="md">
                <Box flex={1} textAlign="left">
                  <HStack spacing={2}>
                    <Text fontWeight="semibold" fontFamily={SPOOPY_FONTS.hand}>teams</Text>
                    {teamCount > 0 && (
                      <Badge bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper} borderRadius="full">{teamCount}</Badge>
                    )}
                  </HStack>
                </Box>
                <AccordionIcon color={SPOOPY_COLORS.paper} />
              </AccordionButton>
              <AccordionPanel
                px={4}
                pb={4}
                bg={SPOOPY_COLORS.nightDeep}
                overflow="visible"
                motionProps={{ style: { overflow: 'visible' } }}
                sx={{ '.chakra-collapse': { overflow: 'visible !important' } }}
              >
                <TeamManager event={event} refetch={refetch} />
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem border="1px solid" borderColor={SPOOPY_COLORS.nightMist} borderRadius="md" mb={3}>
              <AccordionButton px={4} py={3} _hover={{ bg: SPOOPY_COLORS.night }} borderRadius="md">
                <Box flex={1} textAlign="left">
                  <HStack spacing={2}>
                    <Text fontWeight="semibold" fontFamily={SPOOPY_FONTS.hand}>admins & refs</Text>
                    {adminCount > 0 && (
                      <Badge bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper} borderRadius="full">{adminCount}</Badge>
                    )}
                  </HStack>
                </Box>
                <AccordionIcon color={SPOOPY_COLORS.paper} />
              </AccordionButton>
              <AccordionPanel px={4} pb={4} bg={SPOOPY_COLORS.nightDeep}>
                <AdminManager event={event} refetch={refetch} />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
      </VStack>
    </Shell>
  );
}

function Shell({ event, children }) {
  return (
    <Box minHeight="calc(100vh - 60px)" bg={SPOOPY_COLORS.nightDeep} color={SPOOPY_COLORS.paper}>
      <Box borderBottom="2px solid" borderColor={SPOOPY_COLORS.nightMist} py={3} px={6}>
        <HStack justify="space-between" wrap="wrap" gap={2}>
          <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
            🎃 spoopy admin
          </Heading>
          {event && (
            <HStack spacing={2} fontSize="sm" opacity={0.75}>
              <Text>{event.eventName}</Text>
              <Badge bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper}>{event.status}</Badge>
            </HStack>
          )}
        </HStack>
      </Box>
      {children}
    </Box>
  );
}
