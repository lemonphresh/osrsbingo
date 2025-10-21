import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Button,
  SimpleGrid,
  useColorMode,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { UPDATE_TREASURE_EVENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';

export default function EditEventModal({ isOpen, onClose, event, onSuccess }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  const [formData, setFormData] = useState({
    eventName: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    prizePoolTotal: 0,
    numOfTeams: 0,
    playersPerTeam: 0,
    nodeToInnRatio: 5,
    difficulty: 'normal',
  });

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName || '',
        status: event.status || 'DRAFT',
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        prizePoolTotal: event.eventConfig?.prize_pool_total || 0,
        numOfTeams: event.eventConfig?.num_of_teams || 0,
        playersPerTeam: event.eventConfig?.players_per_team || 0,
        nodeToInnRatio: event.eventConfig?.node_to_inn_ratio || 5,
        difficulty: event.eventConfig?.difficulty || 'normal',
      });
    }
  }, [event]);

  const [updateEvent, { loading }] = useMutation(UPDATE_TREASURE_EVENT, {
    onCompleted: () => {
      showToast('Event updated successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      showToast(`Error updating event: ${error.message}`, 'error');
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateEvent = async () => {
    // Validate dates
    if (!formData.startDate || !formData.endDate) {
      showToast('Please select both start and end dates', 'warning');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end <= start) {
      showToast('End date must be after start date', 'warning');
      return;
    }

    // Convert date strings to ISO datetime strings
    const startDate = new Date(formData.startDate + 'T00:00:00').toISOString();
    const endDate = new Date(formData.endDate + 'T23:59:59').toISOString();

    try {
      await updateEvent({
        variables: {
          eventId: event.eventId,
          input: {
            eventName: formData.eventName,
            status: formData.status,
            startDate: startDate,
            endDate: endDate,
            eventConfig: {
              prize_pool_total: formData.prizePoolTotal,
              num_of_teams: formData.numOfTeams,
              players_per_team: formData.playersPerTeam,
              node_to_inn_ratio: formData.nodeToInnRatio,
              difficulty: formData.difficulty,

              reward_split_ratio: {
                nodes: 0.6,
                inns: 0.25,
                bonus_tasks: 0.15,
              },
              keys_expire: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Edit Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Event Name</FormLabel>
              <Input
                placeholder="My Treasure Hunt"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Status</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                color={currentColors.textColor}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>Start Date</FormLabel>
                <Input
                  type="date"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  color={currentColors.textColor}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>End Date</FormLabel>
                <Input
                  type="date"
                  min={formData.startDate || today}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  color={currentColors.textColor}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Difficulty Level</FormLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                color={currentColors.textColor}
              >
                <option value="easy">Easy (0.8x objectives)</option>
                <option value="normal">Normal (1.0x objectives)</option>
                <option value="hard">Hard (1.4x objectives)</option>
                <option value="sweatlord">Sweatlord (2.0x objectives)</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Total Prize Pool (GP)</FormLabel>
              <NumberInput
                value={formData.prizePoolTotal}
                onChange={(_, val) => handleInputChange('prizePoolTotal', val)}
                min={0}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>Number of Teams</FormLabel>
                <NumberInput
                  value={formData.numOfTeams}
                  onChange={(_, val) => handleInputChange('numOfTeams', val)}
                  min={1}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={currentColors.textColor}>Players per Team</FormLabel>
                <NumberInput
                  value={formData.playersPerTeam}
                  onChange={(_, val) => handleInputChange('playersPerTeam', val)}
                  min={1}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Nodes per Inn</FormLabel>
              <NumberInput
                value={formData.nodeToInnRatio}
                onChange={(_, val) => handleInputChange('nodeToInnRatio', val)}
                min={1}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
            </FormControl>

            <Button
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
              w="full"
              onClick={handleUpdateEvent}
              isLoading={loading}
            >
              Update Event
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
