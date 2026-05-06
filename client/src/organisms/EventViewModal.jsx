import {
  Badge,
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { format, isValid as isValidDate, subDays, isSameDay } from 'date-fns';

const TYPE_LABEL = {
  PVM: 'PvM',
  MASS: 'Mass',
  SKILLING: 'Skilling',
  MISC: 'Misc',
  MIXED_CONTENT: 'Mixed Content',
};

export default function EventViewModal({ isOpen, onClose, event }) {
  if (!event) return null;

  // Safe parsing – saved events may not have start/end
  const start = event.start ? new Date(event.start) : null;
  const end = event.end ? new Date(event.end) : null;
  const hasStart = start && isValidDate(start);
  const hasEnd = end && isValidDate(end);

  // When an event comes from the saved list, you do have updatedAt
  const updatedAt = event.updatedAt ? new Date(event.updatedAt) : null;
  const isSaved = !hasStart && !hasEnd; // heuristic: no schedule => saved draft

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{event.title || 'Event'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <HStack spacing={3} wrap="wrap">
              <Badge colorScheme="purple">{TYPE_LABEL[event.eventType] || 'Event'}</Badge>
              {event.allDay && <Badge colorScheme="yellow">All day</Badge>}
              {isSaved && <Badge colorScheme="blue">Saved</Badge>}
            </HStack>

            <Box>
              <Text fontWeight="semibold" mb={1}>
                When
              </Text>
              {hasStart ? (
                <Text>
                  {event.allDay
                    ? (() => {
                        // FullCalendar all-day end is exclusive, subtract 1 day for display
                        const endInclusive = hasEnd ? subDays(end, 1) : null;
                        const isMultiDay = endInclusive && !isSameDay(start, endInclusive);
                        return isMultiDay
                          ? `${format(start, 'EEE, MMM d')} – ${format(endInclusive, 'EEE, MMM d, yyyy')} (all day)`
                          : `${format(start, 'EEE, MMM d, yyyy')} (all day)`;
                      })()
                    : `${format(start, 'EEE, MMM d, yyyy • p')}${
                        hasEnd ? ` – ${format(end, 'p')}` : ''
                      }`}
                </Text>
              ) : (
                <Text color="gray.400">
                  Not scheduled yet
                  {updatedAt && ` • saved ${format(updatedAt, 'MMM d, yyyy • p')}`}
                </Text>
              )}
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="semibold" mb={1}>
                Description
              </Text>
              <Text whiteSpace="pre-wrap" wordBreak="break-word">
                {event.description || '—'}
              </Text>
            </Box>

            {event.threadUrl && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="semibold" mb={1}>
                    Event Thread
                  </Text>
                  <Text
                    as="a"
                    href={event.threadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="blue.300"
                    wordBreak="break-all"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {event.threadUrl}
                  </Text>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
