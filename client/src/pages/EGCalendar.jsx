import { useEffect, useMemo, useState } from 'react';
import {
  HStack,
  Button,
  ButtonGroup,
  IconButton,
  Text,
  Flex,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Calendar as RBCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import theme from '../theme';

import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useAuth } from '../providers/AuthProvider';
import Toolbar from '../organisms/CalendarToolbar';
import EventFormModal from '../organisms/EventFormModal';
import {
  GET_CALENDAR_EVENTS,
  GET_SAVED_CALENDAR_EVENTS,
  GET_CALENDAR_VERSION,
} from '../graphql/queries';
import {
  CREATE_CAL_EVENT,
  DELETE_CAL_EVENT,
  UPDATE_CAL_EVENT,
  SAVE_CAL_EVENT,
  RESTORE_CAL_EVENT,
  PROMOTE_CAL_EVENT,
  DEMOTE_CAL_EVENT,
} from '../graphql/mutations';
import CalendarGlobal from '../utils/CalendarGlobalStyles';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import EventViewModal from '../organisms/EventViewModal';
import CalendarLegend from '../molecules/CalendarLegend';
import SavedEventsPanel from '../organisms/SavedEventsPanel';
import RescheduleModal from '../organisms/RescheduleModal';
import UpdateBanner from '../molecules/UpdateBanner';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date()),
  getDay,
  locales,
});

function ChakraToolbar({ label, onNavigate, onView, views, view }) {
  return (
    <HStack justify="space-between" mb={4} wrap="wrap" gap={3}>
      <HStack>
        <IconButton
          aria-label="Prev"
          onClick={() => onNavigate('PREV')}
          icon={<ChevronLeftIcon size={18} />}
          size="sm"
          _hover={{ bg: 'dark.turquoise.light' }}
        />
        <Button
          _hover={{ bg: 'dark.turquoise.light' }}
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Today
        </Button>
        <IconButton
          aria-label="Next"
          _hover={{ bg: 'dark.turquoise.light' }}
          onClick={() => onNavigate('NEXT')}
          icon={<ChevronRightIcon size={18} />}
          size="sm"
        />
      </HStack>

      <Text
        backgroundColor={theme.colors.dark.sapphire.dark}
        paddingY="3px"
        paddingX="16px"
        borderRadius="6px"
        fontSize="lg"
        fontWeight="semibold"
      >
        {label}
      </Text>

      <ButtonGroup size="sm" isAttached>
        {views.map((v) => (
          <Button
            borderColor="transparent"
            key={v}
            variant={v === view ? 'solid' : 'outline'}
            onClick={() => onView(v)}
            bg={v !== view ? 'dark.turquoise.light' : undefined}
            _hover={v !== view ? { bg: 'dark.turquoise.base' } : undefined}
          >
            {v}
          </Button>
        ))}
      </ButtonGroup>
    </HStack>
  );
}

const TYPE_COLOR = {
  PVM: theme.colors.dark.red.base,
  MASS: theme.colors.dark.green.base,
  SKILLING: theme.colors.dark.sapphire.base,
  MISC: theme.colors.dark.purple.light,
  MIXED_CONTENT: theme.colors.dark.pink.dark,
  JAGEX: '#ffa200ff',
};

export default function EGCalendar({ authed, setAuthed }) {
  const toast = useToast();
  const { user } = useAuth();

  const [calView, setCalView] = useState('official'); // 'official' | 'draft'
  const [selected, setSelected] = useState(null);
  const [toRestore, setToRestore] = useState(null);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [hasDrift, setHasDrift] = useState(false);
  const [, setBaseline] = useState({ activeUpdatedAt: null, savedUpdatedAt: null });
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [savedDiscordChannelId, setSavedDiscordChannelId] = useState('');
  const [channelIdSaved, setChannelIdSaved] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState(false);
  const [discordRoleId, setDiscordRoleId] = useState('');
  const [savedDiscordRoleId, setSavedDiscordRoleId] = useState('');
  const [roleIdSaved, setRoleIdSaved] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(false);
  const [posting, setPosting] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [customMessage, setCustomMessage] = useState('');
  const discordModal = useDisclosure();

  const form = useDisclosure();
  const viewModal = useDisclosure();
  const reschedule = useDisclosure();

  // --- MAIN EVENTS QUERY ---
  const { data, refetch } = useQuery(GET_CALENDAR_EVENTS, {
    fetchPolicy: 'network-only',
    skip: !authed,
    variables: { publishStatus: calView === 'official' ? 'OFFICIAL' : undefined },
    onError: (e) => {
      const isUnauthed = e?.graphQLErrors?.some(
        (err) => err?.extensions?.code === 'UNAUTHENTICATED'
      );
      if (isUnauthed) setAuthed(false);
    },
  });

  // --- VERSION DRIFT (no polling — manual check only) ---
  const [checkVersion] = useLazyQuery(GET_CALENDAR_VERSION, {
    fetchPolicy: 'network-only',
    onCompleted: (verData) => {
      const active = new Date(verData.calendarVersion.lastUpdated).getTime();
      const saved = new Date(verData.savedCalendarVersion.lastUpdated).getTime();

      setBaseline((prev) => {
        if (prev.activeUpdatedAt === null && prev.savedUpdatedAt === null) {
          return { activeUpdatedAt: active, savedUpdatedAt: saved };
        }
        const drift =
          (prev.activeUpdatedAt && active > prev.activeUpdatedAt) ||
          (prev.savedUpdatedAt && saved > prev.savedUpdatedAt);
        setHasDrift(!!drift);
        return prev;
      });
    },
  });

  useEffect(() => {
    if (authed) checkVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    fetch('/api/calendar/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setDiscordChannelId(d.discordChannelId || '');
        setSavedDiscordChannelId(d.discordChannelId || '');
        setDiscordRoleId(d.discordRoleId || '');
        setSavedDiscordRoleId(d.discordRoleId || '');
      })
      .catch(() => {});
  }, [authed]);

  // Pre-populate custom message when month changes
  useEffect(() => {
    if (!authed) return;
    fetch(
      `/api/calendar/monthly-message?year=${calDate.getFullYear()}&month=${calDate.getMonth()}`,
      { credentials: 'include' }
    )
      .then((r) => r.json())
      .then((d) => setCustomMessage(d.message || ''))
      .catch(() => {});
  }, [authed, calDate]);

  const openDiscordModal = () => discordModal.onOpen();

  const postToDiscord = async () => {
    setPosting(true);
    discordModal.onClose();
    try {
      const r = await fetch('/api/calendar/post-to-discord', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: calDate.getFullYear(),
          month: calDate.getMonth(),
          customMessage,
        }),
      });
      const text = await r.text();
      const data = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      })();
      if (!r.ok) throw new Error(data.error || text || 'Failed');
      toast({
        status: 'success',
        title: `${data.action === 'edited' ? 'Updated' : 'Posted'} ${data.eventCount} event${
          data.eventCount !== 1 ? 's' : ''
        } to Discord`,
      });
    } catch (e) {
      toast({ status: 'error', title: e.message || 'Failed to post to Discord' });
    } finally {
      setPosting(false);
    }
  };

  const saveChannelId = async () => {
    try {
      await fetch('/api/calendar/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordChannelId: discordChannelId || null }),
      });
      setSavedDiscordChannelId(discordChannelId);
      setChannelIdSaved(true);
      setTimeout(() => setChannelIdSaved(false), 2000);
    } catch {
      toast({ status: 'error', title: 'Failed to save channel ID' });
    }
  };

  const saveRoleId = async () => {
    try {
      await fetch('/api/calendar/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordRoleId: discordRoleId || null }),
      });
      setSavedDiscordRoleId(discordRoleId);
      setRoleIdSaved(true);
      setTimeout(() => setRoleIdSaved(false), 2000);
    } catch {
      toast({ status: 'error', title: 'Failed to save role ID' });
    }
  };

  // --- SAVED EVENTS ---
  const { data: savedData, refetch: refetchSaved } = useQuery(GET_SAVED_CALENDAR_EVENTS, {
    fetchPolicy: 'network-only',
    skip: !authed,
    onError: (e) => {
      const isUnauthed = e?.graphQLErrors?.some(
        (err) => err?.extensions?.code === 'UNAUTHENTICATED'
      );
      if (isUnauthed) setAuthed(false);
    },
  });

  // --- MUTATIONS ---
  const [createEvent] = useMutation(CREATE_CAL_EVENT);
  const [updateEvent] = useMutation(UPDATE_CAL_EVENT);
  const [deleteEvent] = useMutation(DELETE_CAL_EVENT);
  const [saveEvent] = useMutation(SAVE_CAL_EVENT);
  const [restoreEvent] = useMutation(RESTORE_CAL_EVENT);
  const [promoteEvent] = useMutation(PROMOTE_CAL_EVENT);
  const [demoteEvent] = useMutation(DEMOTE_CAL_EVENT);

  const events = useMemo(() => {
    const items = data?.calendarEvents?.items ?? [];
    return items.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      eventType: e.eventType || 'MISC',
    }));
  }, [data]);

  const doRefreshLists = async () => {
    await Promise.all([refetch(), refetchSaved()]);
    checkVersion();
    setBaseline({ activeUpdatedAt: null, savedUpdatedAt: null });
    setHasDrift(false);
  };

  const openToolbar = (eventData, domEvt) => {
    setSelected(eventData);
    setToolbarPos({ x: (domEvt?.clientX || 0) + 8, y: (domEvt?.clientY || 0) + 8 });
    setToolbarOpen(true);
  };
  const closeToolbar = () => setToolbarOpen(false);

  const safeRun = async (fn) => {
    try {
      await fn();
    } catch (e) {
      const isUnauthed = e?.graphQLErrors?.some(
        (err) => err?.extensions?.code === 'UNAUTHENTICATED'
      );
      if (isUnauthed) {
        setAuthed(false);
        return;
      }
      toast({ status: 'error', title: e?.message || 'Request failed' });
    }
  };

  const onSelectSlot = ({ start, end }) => {
    setSelected({ id: '', title: '', description: '', start, end, allDay: false });
    form.onOpen();
  };

  const onSelectEvent = (e, domEvt) => openToolbar(e, domEvt);

  const handleSave = async (vals) => {
    await safeRun(async () => {
      if (selected?.id) {
        await updateEvent({ variables: { id: selected.id, input: vals } });
      } else {
        await createEvent({
          variables: {
            input: { ...vals, publishStatus: calView === 'official' ? 'OFFICIAL' : 'DRAFT' },
          },
        });
      }
      await refetch();
      checkVersion();
      toast({ status: 'success', title: 'Saved' });
    });
  };

  const handlePromote = async (id) => {
    await safeRun(async () => {
      await promoteEvent({ variables: { id } });
      await refetch();
      checkVersion();
      toast({ status: 'success', title: 'Promoted to Official' });
    });
  };

  const handleDemote = async (id) => {
    await safeRun(async () => {
      await demoteEvent({ variables: { id } });
      await refetch();
      checkVersion();
      toast({ status: 'success', title: 'Demoted to Draft' });
    });
  };

  const handleDelete = async (id) => {
    await safeRun(async () => {
      await deleteEvent({ variables: { id } });
      await Promise.all([refetch(), refetchSaved()]);
      checkVersion();
      toast({ status: 'success', title: 'Deleted' });
    });
  };

  const handleDeleteSaved = async (ev) => {
    await safeRun(async () => {
      await deleteEvent({ variables: { id: ev.id } });
      await refetchSaved();
      checkVersion();
      toast({ status: 'success', title: 'Saved event deleted' });
    });
  };

  return (
    <>
      <CalendarGlobal />

      <Flex
        alignItems="center"
        flex="1"
        flexDirection="column"
        justifyContent="center"
        width="100%"
        paddingX={['16px', '24px', '64px']}
        paddingBottom={['72px', '112px']}
        paddingTop={['32px', '48px']}
      >
        {/* Official / Draft toggle + Discord channel setting */}
        <Flex
          width="100%"
          maxW="1200px"
          mb={4}
          align="center"
          justify="space-between"
          gap={3}
          wrap="wrap"
        >
          <ButtonGroup size="sm" isAttached>
            <Button
              variant={calView === 'official' ? 'solid' : 'outline'}
              onClick={() => setCalView('official')}
              borderColor="whiteAlpha.300"
              bg={calView !== 'official' ? 'dark.turquoise.light' : undefined}
              _hover={calView !== 'official' ? { bg: 'dark.turquoise.base' } : undefined}
            >
              Official
            </Button>
            <Button
              variant={calView === 'draft' ? 'solid' : 'outline'}
              onClick={() => setCalView('draft')}
              borderColor="whiteAlpha.300"
              bg={calView !== 'draft' ? 'dark.turquoise.light' : undefined}
              _hover={calView !== 'draft' ? { bg: 'dark.turquoise.base' } : undefined}
            >
              Draft
            </Button>
          </ButtonGroup>

          {user?.admin && (
          <HStack spacing={2}>
            {savedDiscordChannelId && !editingChannelId ? (
              <Button
                size="sm"
                variant="outline"
                borderColor="gray.600"
                color="gray.400"
                _hover={{ bg: 'whiteAlpha.100', borderColor: 'gray.500' }}
                onClick={() => setEditingChannelId(true)}
                flexShrink={0}
              >
                Channel: {discordChannelId}
              </Button>
            ) : (
              <>
                <Input
                  size="sm"
                  placeholder="Discord channel ID"
                  value={discordChannelId}
                  onChange={(e) => setDiscordChannelId(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.600"
                  color="gray.100"
                  width="200px"
                  borderRadius="md"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    saveChannelId();
                    setEditingChannelId(false);
                  }}
                  bg={channelIdSaved ? 'dark.green.base' : 'dark.turquoise.dark'}
                  _hover={{ bg: 'dark.turquoise.logoDark' }}
                  color="white"
                  flexShrink={0}
                >
                  {channelIdSaved ? 'Saved!' : 'Save'}
                </Button>
              </>
            )}
            {savedDiscordRoleId && !editingRoleId ? (
              <Button
                size="sm"
                variant="outline"
                borderColor="gray.600"
                color="gray.400"
                _hover={{ bg: 'whiteAlpha.100', borderColor: 'gray.500' }}
                onClick={() => setEditingRoleId(true)}
                flexShrink={0}
              >
                Role: {discordRoleId}
              </Button>
            ) : (
              <>
                <Input
                  size="sm"
                  placeholder="CC Events role ID"
                  value={discordRoleId}
                  onChange={(e) => setDiscordRoleId(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.600"
                  color="gray.100"
                  width="200px"
                  borderRadius="md"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    saveRoleId();
                    setEditingRoleId(false);
                  }}
                  bg={roleIdSaved ? 'dark.green.base' : 'dark.turquoise.dark'}
                  _hover={{ bg: 'dark.turquoise.logoDark' }}
                  color="white"
                  flexShrink={0}
                >
                  {roleIdSaved ? 'Saved!' : 'Save'}
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={openDiscordModal}
              isLoading={posting}
              isDisabled={!discordChannelId}
              bg="dark.sapphire.base"
              _hover={{ bg: 'dark.sapphire.light' }}
              color="white"
              flexShrink={0}
            >
              Post to Discord
            </Button>
            {process.env.NODE_ENV !== 'production' && (
              <Button
                size="sm"
                variant="ghost"
                color="gray.500"
                _hover={{ color: 'gray.300' }}
                flexShrink={0}
                onClick={async () => {
                  const r = await fetch('/api/calendar/reset-message-id', { method: 'POST', credentials: 'include' });
                  const text = await r.text();
                  const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
                  if (!r.ok) {
                    toast({ status: 'error', title: data.error || text || 'Reset failed' });
                  } else {
                    toast({ status: 'info', title: 'Reset — next post will ping the role' });
                  }
                }}
              >
                [dev] reset month
              </Button>
            )}
          </HStack>
          )}
        </Flex>

        {hasDrift && (
          <div style={{ width: '100%', maxWidth: 1200, marginBottom: 12 }}>
            <UpdateBanner onRefresh={doRefreshLists} onDismiss={() => setHasDrift(false)} />
          </div>
        )}

        <div
          style={{
            height: 700,
            width: '100%',
            maxWidth: 1200,
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          <RBCalendar
            localizer={localizer}
            events={events}
            components={{
              toolbar: ChakraToolbar,
              event: ({ event }) => (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      flexShrink: 0,
                      background: TYPE_COLOR[event.eventType] || TYPE_COLOR.MISC,
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{event.title}</span>
                  {event.publishStatus === 'DRAFT' && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 1,
                        opacity: 0.8,
                        border: '1px solid rgba(255,255,255,0.6)',
                        borderRadius: 3,
                        padding: '0 3px',
                        flexShrink: 0,
                      }}
                    >
                      DRAFT
                    </span>
                  )}
                </div>
              ),
            }}
            startAccessor="start"
            endAccessor="end"
            date={calDate}
            onNavigate={(date) => setCalDate(date)}
            selectable
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectEvent}
            views={['month', 'week', 'day', 'agenda']}
            eventPropGetter={(event, start, end, isSelected) => {
              const bg = TYPE_COLOR[event.eventType] || TYPE_COLOR.MISC;
              return {
                style: {
                  backgroundColor: bg,
                  borderColor: bg,
                  color: 'white',
                  borderRadius: 6,
                  opacity: isSelected ? 0.9 : 1,
                },
              };
            }}
            popup
          />
        </div>

        <div style={{ width: '100%', maxWidth: 1200, marginTop: 12 }}>
          <CalendarLegend />
        </div>

        <EventFormModal
          isOpen={form.isOpen}
          onClose={() => {
            form.onClose();
            setSelected(null);
          }}
          initial={
            selected
              ? {
                  id: selected.id,
                  title: selected.title,
                  description: selected.description,
                  threadUrl: selected.threadUrl,
                  start: selected.start,
                  end: selected.end,
                  allDay: !!selected.allDay,
                  eventType: selected.eventType || 'MISC',
                }
              : undefined
          }
          onSubmit={handleSave}
        />

        <EventViewModal isOpen={viewModal.isOpen} onClose={viewModal.onClose} event={selected} />

        {toolbarOpen && selected && (
          <Toolbar
            x={toolbarPos.x}
            y={toolbarPos.y}
            onClose={closeToolbar}
            onView={() => {
              viewModal.onOpen();
              closeToolbar();
            }}
            onEdit={() => {
              form.onOpen();
              closeToolbar();
            }}
            onSaveForLater={async () => {
              await safeRun(async () => {
                await saveEvent({ variables: { id: selected.id } });
                await Promise.all([refetch(), refetchSaved()]);
                checkVersion();
                toast({ status: 'info', title: 'Saved for later' });
              });
              closeToolbar();
            }}
            onDelete={async () => {
              await handleDelete(selected.id);
              closeToolbar();
            }}
            onPromote={
              calView === 'draft' && selected.publishStatus === 'DRAFT'
                ? async () => {
                    await handlePromote(selected.id);
                    closeToolbar();
                  }
                : undefined
            }
            onDemote={
              calView === 'official' && selected.publishStatus === 'OFFICIAL'
                ? async () => {
                    await handleDemote(selected.id);
                    closeToolbar();
                  }
                : undefined
            }
            title={selected.title}
          />
        )}

        <SavedEventsPanel
          items={savedData?.savedCalendarEvents?.items ?? []}
          onRestore={(ev) => {
            setToRestore(ev);
            reschedule.onOpen();
          }}
          onView={(ev) => {
            setSelected(ev);
            viewModal.onOpen();
          }}
          onDelete={handleDeleteSaved}
        />
      </Flex>

      <RescheduleModal
        isOpen={reschedule.isOpen}
        onClose={() => {
          setToRestore(null);
          reschedule.onClose();
        }}
        onConfirm={async ({ start, end }) => {
          try {
            await restoreEvent({ variables: { id: toRestore.id, start, end } });
            await Promise.all([refetch(), refetchSaved()]);
            checkVersion();
            toast({ status: 'success', title: 'Event added back' });
          } catch {
            toast({ status: 'error', title: 'Failed to add back' });
          } finally {
            setToRestore(null);
            reschedule.onClose();
          }
        }}
      />

      <Modal isOpen={discordModal.isOpen} onClose={discordModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Post to Discord</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Custom message (optional)</FormLabel>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a message to precede the event list..."
                rows={4}
                resize="vertical"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} variant="ghost" onClick={discordModal.onClose}>
              Cancel
            </Button>
            <Button
              onClick={postToDiscord}
              isLoading={posting}
              bg="dark.sapphire.base"
              _hover={{ bg: 'dark.sapphire.light' }}
              color="white"
            >
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
