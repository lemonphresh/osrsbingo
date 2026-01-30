import { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Switch,
  VStack,
  Select,
  Textarea,
  FormHelperText,
  HStack,
  Tooltip,
  Text,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';

export default function EventFormModal({ isOpen, onClose, initial, onSubmit }) {
  const [v, setV] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    eventType: 'MISC',
  });

  // viewer time zone (i.e., "America/Chicago" or "Europe/London")
  const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';

  useEffect(() => {
    if (initial) {
      setV({
        title: initial.title || '',
        description: initial.description || '',
        start: initial.start ? toInput(initial.start) : '',
        end: initial.end ? toInput(initial.end) : '',
        allDay: !!initial.allDay,
        eventType: initial.eventType || 'MISC',
      });
    } else {
      setV({ title: '', description: '', start: '', end: '', allDay: false, eventType: 'MISC' });
    }
  }, [initial]);

  const submit = async () => {
    await onSubmit({
      ...v,
      start: fromInput(v.start),
      end: fromInput(v.end),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{initial?.id ? 'Edit event' : 'Create event'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={v.title}
                onChange={(e) => setV((s) => ({ ...s, title: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={v.description}
                onChange={(e) => setV((s) => ({ ...s, description: e.target.value }))}
                placeholder="Add any notes, requirements, links to Discord threads, who is running the event, etc."
                resize="vertical"
                rows={5}
              />
            </FormControl>

            <FormControl isRequired>
              <HStack justify="space-between" align="center">
                <FormLabel mb={0}>Start</FormLabel>
                <Tooltip
                  hasArrow
                  label="Times are saved in UTC and shown in each viewer’s local time automatically."
                  placement="top"
                >
                  <Text
                    as="span"
                    color="gray.400"
                    fontSize="sm"
                    display="inline-flex"
                    alignItems="center"
                    gap="6px"
                  >
                    <InfoOutlineIcon /> {viewerTZ}
                  </Text>
                </Tooltip>
              </HStack>
              <Input
                type="datetime-local"
                value={v.start}
                onChange={(e) => setV((s) => ({ ...s, start: e.target.value }))}
              />
              <FormHelperText>
                Saved in UTC. You’re selecting this in <strong>{viewerTZ}</strong>; others will see
                it in their own timezone.
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>End</FormLabel>
              <Input
                type="datetime-local"
                value={v.end}
                onChange={(e) => setV((s) => ({ ...s, end: e.target.value }))}
              />
              <FormHelperText>
                End time uses the same rule — stored in UTC, rendered in the viewer’s local time.
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel mb="1">All day</FormLabel>
              <VStack align="start" spacing={1}>
                <Switch
                  isChecked={v.allDay}
                  onChange={(e) => setV((s) => ({ ...s, allDay: e.target.checked }))}
                />
                <FormHelperText>
                  All-day events ignore hours/minutes and won’t shift across timezones.
                </FormHelperText>
              </VStack>
            </FormControl>

            <FormControl>
              <FormLabel>Event type</FormLabel>
              <Select
                value={v.eventType}
                onChange={(e) => setV((s) => ({ ...s, eventType: e.target.value }))}
              >
                <option value="PVM">PvM</option>
                <option value="MASS">Mass</option>
                <option value="SKILLING">Skilling</option>
                <option value="MISC">Misc</option>
                <option value="MIXED_CONTENT">Mixed Content</option>
                <option value="JAGEX">Official Jagex Event</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// helpers: ISO <-> input
function toInput(d) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const pad = (n) => String(n).padStart(2, '0');
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const day = pad(dt.getDate());
  const h = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
function fromInput(s) {
  // store as UTC ISO string so everyone sees their local equivalent
  return new Date(s).toISOString();
}
