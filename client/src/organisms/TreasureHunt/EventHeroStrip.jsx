import React from 'react';
import {
  Badge,
  Button,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { CopyIcon, EditIcon } from '@chakra-ui/icons';
import { formatDisplayDateTime } from '../../utils/dateUtils';
import GemTitle from '../../atoms/GemTitle';
import theme from '../../theme';

const EventHeroStrip = ({ event, currentColors, isEventAdmin, onEditEventOpen, showToast }) => (
  <VStack position="relative" align="center" spacing={1}>
    <GemTitle size="xl" mb="0">
      {event.status === 'COMPLETED' ? 'Summary' : event.eventName}
    </GemTitle>

    <HStack>
      <Badge
        bg={event.status === 'DRAFT' ? currentColors.red : currentColors.green.base}
        color="white"
        px={2}
        py={1}
        borderRadius="md"
        fontSize="md"
      >
        {event.status}
      </Badge>
      <Text color={theme.colors.gray[300]}>
        {formatDisplayDateTime(event.startDate)} – {formatDisplayDateTime(event.endDate)}
      </Text>
    </HStack>

    {/* Copyable IDs / URL */}
    <HStack spacing={2} flexWrap="wrap" justify="center" mt={2}>
      {[
        {
          label: `ID: ${event.eventId}`,
          value: event.eventId,
          toastTitle: 'Event ID Copied!',
        },
        ...(event.eventPassword
          ? [
              {
                label: `Password: ${event.eventPassword}`,
                value: event.eventPassword,
                toastTitle: 'Event Password Copied!',
              },
            ]
          : []),
        {
          label: `URL: ${window.location.href}`,
          value: window.location.href,
          toastTitle: 'URL Copied!',
        },
      ].map(({ label, value, toastTitle }) => (
        <Tooltip key={label} label={`Click to copy — ${value}`} hasArrow>
          <HStack
            spacing={2}
            px={3}
            py={1}
            bg="whiteAlpha.100"
            borderRadius="md"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: 'whiteAlpha.400' }}
            onClick={() => {
              navigator.clipboard.writeText(value);
              showToast(toastTitle, 'success');
            }}
          >
            <Text
              fontSize="xs"
              color={currentColors.orange}
              fontFamily="mono"
              maxW="260px"
              isTruncated
            >
              {label}
            </Text>
            <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
          </HStack>
        </Tooltip>
      ))}
    </HStack>

    {/* Admin edit button */}
    {isEventAdmin && (
      <>
        <Button
          position="absolute"
          alignSelf="end"
          display={['none', 'none', 'block']}
          bg={currentColors.purple.base}
          color="white"
          _hover={{ bg: currentColors.purple.light }}
          onClick={onEditEventOpen}
        >
          Edit Event
        </Button>
        <IconButton
          display={['block', 'block', 'none']}
          icon={<EditIcon />}
          bg={currentColors.purple.base}
          color="white"
          _hover={{ bg: currentColors.purple.light }}
          onClick={onEditEventOpen}
          aria-label="Edit Event"
        />
      </>
    )}
  </VStack>
);

export default EventHeroStrip;
