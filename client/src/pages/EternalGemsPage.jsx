import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box,
  Flex,
  Text,
  Link,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
  IconButton,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { ExternalLinkIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Calendar as RBCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import GemTitle from '../atoms/GemTitle';
import ClanStats from '../organisms/ClanStats';
import usePageTitle from '../hooks/usePageTitle';
import { GET_PUBLIC_CALENDAR_EVENTS } from '../graphql/queries';
import theme from '../theme';
import amethyst from '../assets/amethyst.png';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date()),
  getDay,
  locales,
});

const TYPE_COLOR = {
  PVM: theme.colors.dark.red.base,
  MASS: theme.colors.dark.green.base,
  SKILLING: theme.colors.dark.sapphire.base,
  MISC: theme.colors.dark.purple.light,
  MIXED_CONTENT: theme.colors.dark.pink.dark,
  JAGEX: '#ffa200',
};

const EVENT_TYPE_COLORS = {
  PVM: 'red',
  MASS: 'green',
  SKILLING: 'blue',
  MISC: 'purple',
  MIXED_CONTENT: 'pink',
  JAGEX: 'orange',
};

const EVENT_TYPE_LABELS = {
  PVM: 'PVM',
  MASS: 'Mass',
  SKILLING: 'Skilling',
  MISC: 'Misc',
  MIXED_CONTENT: 'Mixed',
  JAGEX: 'Jagex',
};

const RESOURCES = [
  {
    label: 'Discord',
    description: 'Join the Eternal Gems community',
    url: 'https://discord.gg/EkuKDVSA4',
    accent: theme.colors.dark.sapphire.base,
    glow: 'rgba(25, 100, 126, 0.35)',
    isExternal: true,
  },
  {
    label: 'Clan Wiki',
    description: 'Hosted on Notion: clan info, PvM guides, and other resources',
    url: 'https://eternalgems.notion.site/Welcome-to-Eternal-Gems-1b16f0e73e818045ae7fce3afa5d3e72?pvs=74',
    accent: theme.colors.dark.purple.base,
    glow: 'rgba(125, 95, 255, 0.25)',
    isExternal: true,
  },
  {
    label: 'Wise Old Man',
    description: "The clan's WOM Group's progress and member stats",
    url: 'https://wiseoldman.net/groups/9738',
    accent: theme.colors.dark.green.base,
    glow: 'rgba(67, 170, 139, 0.25)',
    isExternal: true,
  },
  {
    label: 'Group Dashboard',
    description: 'Monthly clan bounty progress tracked here',
    url: '/group/eternal-gems',
    accent: theme.colors.dark.turquoise.base,
    glow: 'rgba(40, 175, 176, 0.25)',
    isExternal: false,
  },
];

function formatEventDate(start, end, allDay) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { month: 'short', day: 'numeric' };
  if (allDay) {
    const sStr = s.toLocaleDateString('en-US', opts);
    const eDay = new Date(e.getTime() - 1);
    const eStr = eDay.toLocaleDateString('en-US', opts);
    return sStr === eStr ? sStr : `${sStr} – ${eStr}`;
  }
  const dateStr = s.toLocaleDateString('en-US', opts);
  const timeStr = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} at ${timeStr}`;
}

function isUpcoming(event) {
  return new Date(event.end) >= new Date();
}

function SectionHeading({ children, color = 'dark.purple.light' }) {
  return (
    <Flex align="center" gap={3}>
      <Box w="3px" h="22px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontWeight="bold" fontSize="lg" letterSpacing="wide">
        {children}
      </Text>
    </Flex>
  );
}

function EventRow({ event, dimmed }) {
  const colorScheme = EVENT_TYPE_COLORS[event.eventType] ?? 'gray';
  const label = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
  const dateStr = formatEventDate(event.start, event.end, event.allDay);

  return (
    <Flex
      align="center"
      py={3}
      gap={3}
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      opacity={dimmed ? 0.45 : 1}
      transition="opacity 0.15s"
    >
      <Badge colorScheme={colorScheme} flexShrink={0} fontSize="10px">
        {label}
      </Badge>
      <Box flex="1" overflow="hidden">
        {event.threadUrl ? (
          <Link
            href={event.threadUrl}
            isExternal
            fontSize="sm"
            fontWeight="semibold"
            _hover={{ color: 'dark.purple.light' }}
            noOfLines={1}
          >
            {event.title}
          </Link>
        ) : (
          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
            {event.title}
          </Text>
        )}
      </Box>
      <Text fontSize="xs" color="whiteAlpha.500" flexShrink={0}>
        {dateStr}
      </Text>
    </Flex>
  );
}

function UpcomingList({ events, loading }) {
  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="sm" color="purple.400" />
      </Center>
    );
  }
  if (events.length === 0) {
    return (
      <Text fontSize="sm" color="whiteAlpha.500">
        No upcoming events scheduled.
      </Text>
    );
  }
  const upcoming = events.filter(isUpcoming);
  const past = events.filter((e) => !isUpcoming(e));
  return (
    <Flex direction="column" gap={0}>
      {upcoming.map((e) => (
        <EventRow key={e.id} event={e} />
      ))}
      {past.length > 0 && (
        <>
          <Text
            fontSize="xs"
            color="whiteAlpha.400"
            textTransform="uppercase"
            letterSpacing="wide"
            mt={4}
            mb={1}
            px={1}
          >
            Recently ended
          </Text>
          {past.map((e) => (
            <EventRow key={e.id} event={e} dimmed />
          ))}
        </>
      )}
    </Flex>
  );
}

function ReadOnlyCalendarToolbar({ label, onNavigate }) {
  return (
    <HStack justify="space-between" mb={4} wrap="wrap">
      <HStack>
        <IconButton
          aria-label="Previous"
          icon={<ChevronLeftIcon />}
          size="sm"
          variant="ghost"
          onClick={() => onNavigate('PREV')}
          _hover={{ bg: 'whiteAlpha.100' }}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate('TODAY')}
          _hover={{ bg: 'whiteAlpha.100' }}
          fontSize="xs"
          color="whiteAlpha.700"
        >
          Today
        </Button>
        <IconButton
          aria-label="Next"
          icon={<ChevronRightIcon />}
          size="sm"
          variant="ghost"
          onClick={() => onNavigate('NEXT')}
          _hover={{ bg: 'whiteAlpha.100' }}
        />
      </HStack>
      <Text
        bg="whiteAlpha.100"
        px={4}
        py={1}
        borderRadius="6px"
        fontSize="sm"
        fontWeight="semibold"
        color="whiteAlpha.800"
      >
        {label}
      </Text>
      <Box w="80px" />
    </HStack>
  );
}

function EventDetailModal({ event, onClose }) {
  if (!event) return null;
  const color = TYPE_COLOR[event.eventType] || theme.colors.dark.purple.base;
  const colorScheme = EVENT_TYPE_COLORS[event.eventType] ?? 'gray';
  const label = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
  const dateStr = formatEventDate(event.start, event.end, event.allDay);

  return (
    <Modal isOpen onClose={onClose} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent
        bg="#0d2e38"
        borderRadius="14px"
        overflow="hidden"
        border="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Box h="3px" bg={color} />
        <ModalCloseButton color="whiteAlpha.500" top={4} right={4} _hover={{ color: 'white' }} />
        <ModalBody px={6} pt={5} pb={6}>
          <Flex direction="column" gap={3}>
            <Badge colorScheme={colorScheme} alignSelf="flex-start" fontSize="10px">
              {label}
            </Badge>
            <Text fontWeight="bold" fontSize="lg" lineHeight="short" pr={6} color="white">
              {event.title}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.500">
              {dateStr}
            </Text>
            {event.description && (
              <Text fontSize="sm" color="whiteAlpha.700" whiteSpace="pre-wrap" mt={1}>
                {event.description}
              </Text>
            )}
            {event.threadUrl && (
              <Link
                href={event.threadUrl}
                isExternal
                mt={2}
                alignSelf="flex-start"
                fontSize="sm"
                color="dark.purple.light"
                display="flex"
                alignItems="center"
                gap={1}
                _hover={{ color: 'white' }}
              >
                View thread <ExternalLinkIcon boxSize={3} />
              </Link>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function EventsCalendar({ events }) {
  const [selected, setSelected] = useState(null);

  const calEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        allDay: e.allDay,
        resource: e,
      })),
    [events]
  );

  const eventPropGetter = (event) => {
    const color = TYPE_COLOR[event.resource?.eventType] || theme.colors.dark.purple.base;
    return {
      style: {
        backgroundColor: color,
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '11px',
        padding: '1px 4px',
        cursor: 'pointer',
      },
    };
  };

  return (
    <>
      <Box
        sx={{
          '.rbc-calendar': { fontFamily: 'inherit' },
          '.rbc-month-view, .rbc-time-view': {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'white',
          },
          '.rbc-header': {
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '6px 4px',
          },
          '.rbc-day-bg': { background: 'transparent' },
          '.rbc-day-bg + .rbc-day-bg': { borderLeft: '1px solid rgba(255,255,255,0.06)' },
          '.rbc-month-row': {
            borderTop: '1px solid rgba(255,255,255,0.06)',
            minHeight: '80px',
          },
          '.rbc-month-row + .rbc-month-row': { borderTop: '1px solid rgba(255,255,255,0.06)' },
          '.rbc-today': { background: 'rgba(125, 95, 255, 0.12)' },
          '.rbc-off-range-bg': { background: 'rgba(0,0,0,0.15)' },
          '.rbc-off-range .rbc-button-link': { color: 'rgba(255,255,255,0.2)' },
          '.rbc-button-link': { color: 'rgba(255,255,255,0.7)', fontSize: '12px' },
          '.rbc-show-more': {
            color: theme.colors.dark.purple.light,
            fontSize: '11px',
            background: 'transparent',
          },
          '.rbc-event:focus': { outline: 'none' },
          '.rbc-toolbar': { display: 'none' },
        }}
      >
        <RBCalendar
          localizer={localizer}
          events={calEvents}
          defaultView="month"
          views={['month']}
          style={{ height: 480 }}
          eventPropGetter={eventPropGetter}
          components={{ toolbar: ReadOnlyCalendarToolbar }}
          onSelectEvent={(e) => setSelected(e.resource)}
          selectable={false}
          popup
        />
      </Box>
      {selected && <EventDetailModal event={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ResourceCard({ label, description, url, accent, glow, isExternal = true }) {
  return (
    <Link href={url} isExternal={isExternal} _hover={{ textDecoration: 'none' }} display="block">
      <Box
        position="relative"
        bg="rgba(13, 46, 56, 0.9)"
        borderRadius="12px"
        p={5}
        height="100%"
        overflow="hidden"
        transition="transform 0.15s, box-shadow 0.15s"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px ${glow}`,
        }}
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          padding: '1px',
          background: `linear-gradient(135deg, ${accent}66, transparent 60%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="1px"
          bgGradient={`linear(to-r, ${accent}00, ${accent}cc, ${accent}00)`}
        />
        <Flex align="center" justify="space-between" mb={2}>
          <Text fontWeight="bold" fontSize="sm" color="whiteAlpha.900">
            {label}
          </Text>
          <ExternalLinkIcon color="whiteAlpha.400" boxSize={3} />
        </Flex>
        <Text fontSize="xs" color="whiteAlpha.500">
          {description}
        </Text>
      </Box>
    </Link>
  );
}

export default function EternalGemsPage() {
  usePageTitle('Eternal Gems');

  const { data, loading } = useQuery(GET_PUBLIC_CALENDAR_EVENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const events = data?.getPublicCalendarEvents ?? [];

  const [memberCount, setMemberCount] = useState(null);
  useEffect(() => {
    fetch('https://api.wiseoldman.net/v2/groups/9738')
      .then((r) => r.json())
      .then((d) => { if (d?.memberCount) setMemberCount(d.memberCount); })
      .catch(() => {});
  }, []);

  return (
    <Flex direction="column" width="100%" minHeight="100vh" bg="#051b24">
      {/* Hero */}
      <Box
        position="relative"
        width="100%"
        overflow="hidden"
        background={`url(${amethyst}) center / cover no-repeat`}
        pt={['48px', '72px', '96px']}
        pb={['80px', '112px', '140px']}
        px={['16px', '24px', '64px']}
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'linear-gradient(to bottom, transparent, #051b24)',
          pointerEvents: 'none',
        }}
      >
        {/* Gradient overlay on top of image */}
        <Box
          position="absolute"
          inset={0}
          background="linear-gradient(160deg, rgba(26,5,56,0.94) 0%, rgba(13,26,58,0.92) 45%, rgba(8,40,40,0.9) 70%, #051b24 100%)"
          pointerEvents="none"
        />

        {/* Ambient glow blobs */}
        <Box
          position="absolute"
          top="-80px"
          right="-80px"
          w="420px"
          h="420px"
          borderRadius="full"
          bg="rgba(125, 95, 255, 0.1)"
          filter="blur(100px)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-60px"
          left="20%"
          w="360px"
          h="260px"
          borderRadius="full"
          bg="rgba(40, 175, 176, 0.07)"
          filter="blur(90px)"
          pointerEvents="none"
        />

        <Flex direction="column" maxW="1200px" mx="auto" gap={4} position="relative" align="center">
          <GemTitle gemColor="purple" size="lg">
            Eternal Gems
          </GemTitle>
          <HStack
            spacing={0}
            divider={<Text color="whiteAlpha.300" px={3}>|</Text>}
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="widest"
            textTransform="uppercase"
            color="whiteAlpha.500"
            mt={1}
          >
            {memberCount && <Text>{memberCount} Members</Text>}
            <Text>W333 EU · W337 NA</Text>
            <Text>Est. May 2021</Text>
          </HStack>
          <Text color="whiteAlpha.600" fontSize={['md', 'lg']} maxW="520px" textAlign="center">
            A large social OSRS clan built on good vibes and genuine friendships. LGBTQIA+ friendly,
            500 total level requirement. Home for PvMers, skillers, and everyone in between. Come
            for the gameplay, stay for the people. 💎
          </Text>
          <SimpleGrid columns={[1, 2, 4]} spacing={3} mt={2} maxW="900px" mx="auto" width="100%">
            {RESOURCES.map((r) => (
              <ResourceCard key={r.label} {...r} />
            ))}
          </SimpleGrid>
        </Flex>
      </Box>

      {/* Content */}
      <Flex
        paddingX={['16px', '24px', '64px']}
        paddingTop={['32px', '48px']}
        paddingBottom={16}
        direction="column"
        align="center"
        width="100%"
      >
        <Flex direction="column" width="100%" maxW="1200px" gap={12}>
          {/* Clan Schedule */}
          <Flex direction="column" gap={4}>
            <Flex align="baseline" justify="space-between" wrap="wrap" gap={2}>
              <SectionHeading color={theme.colors.dark.sapphire.base}>Clan Schedule</SectionHeading>
              <Text fontSize="xs" color="whiteAlpha.400">
                Times shown in your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </Text>
            </Flex>
            <Box bg="#0d2e38" borderRadius="12px" p={6}>
              <EventsCalendar events={events} />
            </Box>
            <Box bg="#0d2e38" borderRadius="12px" p={6}>
              <UpcomingList events={events} loading={loading} />
            </Box>
          </Flex>

          {/* Clan Stats */}
          <Flex direction="column" gap={4}>
            <SectionHeading color={theme.colors.dark.green.base}>Clan Stats</SectionHeading>
            <ClanStats isPublic cardBg="#0d2e38" noPadding />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
