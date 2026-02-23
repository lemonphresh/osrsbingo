import { useEffect, useMemo, useState } from 'react';
import {
  HStack,
  Button,
  ButtonGroup,
  IconButton,
  Text,
  Flex,
  Spinner,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Calendar as RBCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import theme from '../theme';

import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import Toolbar from '../organisms/CalendarToolbar';
import PasswordGate from '../organisms/PasswordGate';
import EventFormModal from '../organisms/EventFormModal';
import {
  GET_CALENDAR_EVENTS,
  GET_SAVED_CALENDAR_EVENTS,
  GET_CALENDAR_VERSION,
} from '../graphql/queries';
import {
  AUTHENTICATE_CALENDAR,
  CREATE_CAL_EVENT,
  DELETE_CAL_EVENT,
  UPDATE_CAL_EVENT,
  SAVE_CAL_EVENT,
  RESTORE_CAL_EVENT,
} from '../graphql/mutations';
import CalendarGlobal from '../utils/CalendarGlobalStyles';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import EventViewModal from '../organisms/EventViewModal';
import CalendarLegend from '../molecules/CalendarLegend';
import SavedEventsPanel from '../organisms/SavedEventsPanel';
import RescheduleModal from '../organisms/RescheduleModal';
import UpdateBanner from '../molecules/UpdateBanner';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';

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

export default function CalendarPage() {
  const toast = useToast();

  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toRestore, setToRestore] = useState(null);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [hasDrift, setHasDrift] = useState(false);
  const [, setBaseline] = useState({ activeUpdatedAt: null, savedUpdatedAt: null });

  const form = useDisclosure();
  const viewModal = useDisclosure();
  const reschedule = useDisclosure();

  // --- AUTH CHECK ---
  const [checkAuth, { loading: authLoading }] = useLazyQuery(GET_CALENDAR_EVENTS, {
    variables: { limit: 1, offset: 0 },
    fetchPolicy: 'network-only',
    onCompleted: () => {
      setAuthed(true);
      setAuthChecked(true);
    },
    onError: (e) => {
      const isUnauthed = e?.graphQLErrors?.some(
        (err) => err?.extensions?.code === 'UNAUTHENTICATED'
      );
      setAuthed(!isUnauthed);
      setAuthChecked(true);
    },
  });

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- MAIN EVENTS QUERY ---
  const { data, refetch } = useQuery(GET_CALENDAR_EVENTS, {
    fetchPolicy: 'network-only',
    skip: !authed,
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

  // Check version once when authed, then again after user actions that mutate data
  useEffect(() => {
    if (authed) checkVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

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
  const [doAuth] = useMutation(AUTHENTICATE_CALENDAR);
  const [createEvent] = useMutation(CREATE_CAL_EVENT);
  const [updateEvent] = useMutation(UPDATE_CAL_EVENT);
  const [deleteEvent] = useMutation(DELETE_CAL_EVENT);
  const [saveEvent] = useMutation(SAVE_CAL_EVENT);
  const [restoreEvent] = useMutation(RESTORE_CAL_EVENT);

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
    // Re-snapshot baseline after manual refresh
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
        await createEvent({ variables: { input: vals } });
      }
      await refetch();
      checkVersion();
      toast({ status: 'success', title: 'Saved' });
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

  const submitPassword = async (pwd) => {
    await safeRun(async () => {
      const res = await doAuth({ variables: { password: pwd } });
      if (res?.data?.authenticateCalendar?.ok) {
        setAuthed(true);
        await refetch?.();
      } else {
        toast({ status: 'error', title: 'Incorrect password' });
      }
    });
  };

  usePageTitle('EG Events Calendar');

  if (!authChecked || authLoading) {
    return (
      <Flex align="center" justify="center" minHeight="60vh">
        <Spinner />
      </Flex>
    );
  }

  if (!authed) {
    return (
      <Flex align="center" justify="center" minHeight="60vh">
        <div style={{ width: 420 }}>
          <GemTitle gemColor="purple" size="md" style={{ marginBottom: 16 }}>
            Eternal Gems Events Calendar
          </GemTitle>
          <PasswordGate onAuthed={() => {}} submitOverride={submitPassword} />
        </div>
      </Flex>
    );
  }

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
        paddingY={['72px', '112px']}
      >
        <GemTitle gemColor="purple" maxW="1200px" width="100%" paddingBottom="32px">
          Eternal Gems Events Calendar
        </GemTitle>

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
                      background: TYPE_COLOR[event.eventType] || TYPE_COLOR.MISC,
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{event.title}</span>
                </div>
              ),
            }}
            startAccessor="start"
            endAccessor="end"
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
    </>
  );
}
