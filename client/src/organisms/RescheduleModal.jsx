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
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function RescheduleModal({ isOpen, onClose, onConfirm }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    setStart('');
    setEnd('');
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pick a new date & time</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Start</FormLabel>
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>End</FormLabel>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString(),
              })
            }
          >
            Add back
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
