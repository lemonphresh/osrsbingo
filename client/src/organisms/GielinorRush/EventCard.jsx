import React from 'react';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { MdMoreVert } from 'react-icons/md';
import EternalGem from '../../assets/gemoji.png';
import { formatDisplayDate } from '../../utils/dateUtils';

const getStatusColor = (status, c) =>
  ({
    PUBLIC: c.green.base,
    DRAFT: c.red,
    COMPLETED: c.turquoise.base,
    ARCHIVED: c.purple.base,
  }[status] ?? c.sapphire.base);

const EventCard = ({ event, clickedEventId, colorMode, c, isMobile, onDeleteClick, onEventClick }) => (
  <Card
    key={event.eventId}
    cursor="pointer"
    bg={c.cardBg}
    borderWidth="1px"
    borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
    _hover={{ transform: 'translateY(-4px)', shadow: 'xl', borderColor: c.purple.base }}
    _focus={{ outline: '2px solid', outlineColor: c.purple.base, outlineOffset: '2px' }}
    transition="all 0.2s ease-in-out"
    onClick={() => onEventClick(event.eventId)}
    position="relative"
    overflow="hidden"
    role="group"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onEventClick(event.eventId);
      }
    }}
  >
    <Image
      src={EternalGem}
      alt=""
      aria-hidden
      position="absolute"
      right="-30px"
      bottom="-20px"
      width="110px"
      height="110px"
      opacity={0.15}
      pointerEvents="none"
    />
    {/* Status pill in the top-right so the footer row stays clean. */}
    <Badge
      position="absolute"
      top={3}
      right={10}
      bg={getStatusColor(event.status, c)}
      color="white"
      px={2.5}
      py={1}
      borderRadius="md"
      fontWeight="semibold"
      textTransform="uppercase"
      fontSize="10px"
      letterSpacing="wider"
      zIndex={1}
    >
      {event.status}
    </Badge>
    {clickedEventId === event.eventId && (
      <Flex
        position="absolute"
        inset={0}
        bg={colorMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        zIndex={10}
      >
        <Spinner size="xl" color={c.purple.base} thickness="4px" />
      </Flex>
    )}
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<MdMoreVert />}
        position="absolute"
        top={2}
        right={2}
        size="sm"
        variant="ghost"
        opacity={isMobile ? 1 : 0}
        _groupHover={{ opacity: 1 }}
        _focus={{ opacity: 1 }}
        transition="opacity 0.2s"
        onClick={(e) => e.stopPropagation()}
        aria-label="Event options"
        zIndex={2}
      />
      <MenuList bg={c.cardBg} borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}>
        <MenuItem
          icon={<DeleteIcon />}
          onClick={(e) => onDeleteClick(e, event.eventId)}
          color="red.500"
          _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'red.50' }}
        >
          Delete Event
        </MenuItem>
      </MenuList>
    </Menu>
    <CardHeader pb={2}>
      <Heading size="md" color={c.textColor} noOfLines={2} pr={8} mb={2}>
        {event.eventName}
      </Heading>
    </CardHeader>
    <CardBody pt={0} display="flex" flexDirection="column" flex="1">
      <VStack align="stretch" spacing={2.5} flex="1">
        {[
          ['Start', formatDisplayDate(event.startDate)],
          ['End', formatDisplayDate(event.endDate)],
          ['Teams', event.teams.length],
        ].map(([label, val]) => (
          <HStack key={label} spacing={3}>
            <Text
              fontSize="xs"
              color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
              minW="50px"
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="semibold"
            >
              {label}
            </Text>
            <Text
              fontSize="sm"
              color={label === 'Teams' ? c.purple.base : c.textColor}
              fontWeight={label === 'Teams' ? 'bold' : 'medium'}
            >
              {val}
            </Text>
          </HStack>
        ))}
      </VStack>
    </CardBody>
  </Card>
);

export default EventCard;
