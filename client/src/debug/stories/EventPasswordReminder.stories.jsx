import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Code,
  VStack,
  Text,
  Box,
} from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';

function PasswordReminderModal({ isOpen, onClose, eventPassword }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="orange.500" borderWidth="1px">
        <ModalHeader color="orange.300">📸 Set Your Event Password</ModalHeader>
        <ModalBody>
          <VStack spacing={3} align="stretch">
            <Text fontSize="sm" color="gray.300">
              Your submission screenshots must show this event password. Configure it in the{' '}
              <strong>Wise Old Man</strong> RuneLite plugin (or similar overlay) so it appears in
              every screenshot you submit.
            </Text>
            <Box
              bg="gray.900"
              borderRadius="md"
              p={3}
              borderLeft="3px solid"
              borderLeftColor="orange.400"
            >
              <Text fontSize="xs" color="gray.500" mb={1}>
                Event password
              </Text>
              <Code
                fontSize="lg"
                fontWeight="semibold"
                letterSpacing="wider"
                bg="transparent"
                color="orange.200"
              >
                {eventPassword}
              </Code>
            </Box>
            <Text fontSize="xs" color="gray.500">
              Screenshots without the password visible may be rejected. This reminder won't show
              again after you dismiss it.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="orange" onClick={onClose}>
            Got it!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function Scenario({ title, description, tags, eventPassword }) {
  const [open, setOpen] = useState(false);
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Button size="sm" colorScheme="orange" onClick={() => setOpen(true)}>
        Show Reminder
      </Button>
      <PasswordReminderModal
        isOpen={open}
        onClose={() => setOpen(false)}
        eventPassword={eventPassword}
      />
    </StoryLayout>
  );
}

export default function EventPasswordReminderStories() {
  return (
    <StoryPage
      title="EventPasswordReminder"
      description="Modal shown once to Discord-linked team members reminding them to configure their event password in RuneLite."
    >
      <Scenario
        title="Standard password"
        description="Typical short alphanumeric event password"
        tags={['modal', 'once-only']}
        eventPassword="EPIC-2434"
      />
      <Scenario
        title="Long password"
        description="Longer password string to check layout doesn't break"
        tags={['modal', 'edge case']}
        eventPassword="FEARLESS-2343"
      />
    </StoryPage>
  );
}
