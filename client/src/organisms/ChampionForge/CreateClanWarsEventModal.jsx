import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Switch,
  Button,
  Text,
  Divider,
} from '@chakra-ui/react';

const DEFAULT_FORM = {
  eventName: '',
  clanId: '',
  gatheringHours: 48,
  outfittingHours: 24,
  turnTimerSeconds: 60,
  maxConsumableSlots: 4,
  flexRolesAllowed: false,
};

export default function CreateClanWarsEventModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.eventName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        eventName: form.eventName.trim(),
        clanId: form.clanId.trim() || null,
        gatheringHours: Number(form.gatheringHours),
        outfittingHours: Number(form.outfittingHours),
        turnTimerSeconds: Number(form.turnTimerSeconds),
        maxConsumableSlots: Number(form.maxConsumableSlots),
        flexRolesAllowed: form.flexRolesAllowed,
      });
      setForm(DEFAULT_FORM);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Champion Forge Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="sm">Event Name</FormLabel>
              <Input
                value={form.eventName}
                onChange={(e) => set('eventName', e.target.value)}
                placeholder="Summer Clan Wars 2026"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Clan ID (optional)</FormLabel>
              <Input
                value={form.clanId}
                onChange={(e) => set('clanId', e.target.value)}
                placeholder="Discord server ID or clan tag"
              />
            </FormControl>

            <Divider />
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
              Phase Timings
            </Text>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Gathering (hours)</FormLabel>
                <NumberInput
                  min={1}
                  max={168}
                  value={form.gatheringHours}
                  onChange={(v) => set('gatheringHours', v)}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Outfitting (hours)</FormLabel>
                <NumberInput
                  min={1}
                  max={48}
                  value={form.outfittingHours}
                  onChange={(v) => set('outfittingHours', v)}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </HStack>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Turn Timer (seconds)</FormLabel>
                <NumberInput
                  min={15}
                  max={300}
                  value={form.turnTimerSeconds}
                  onChange={(v) => set('turnTimerSeconds', v)}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Max Consumable Slots</FormLabel>
                <NumberInput
                  min={1}
                  max={6}
                  value={form.maxConsumableSlots}
                  onChange={(v) => set('maxConsumableSlots', v)}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </HStack>

            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb={0}>
                Allow Flex Roles
              </FormLabel>
              <Switch
                colorScheme="purple"
                isChecked={form.flexRolesAllowed}
                onChange={(e) => set('flexRolesAllowed', e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            isLoading={loading}
            isDisabled={!form.eventName.trim()}
            onClick={handleSubmit}
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
