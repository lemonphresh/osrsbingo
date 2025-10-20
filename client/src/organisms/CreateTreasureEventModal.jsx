import React, { useState } from 'react';
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
import { CREATE_TREASURE_EVENT } from '../graphql/mutations';
import { useToastContext } from '../providers/ToastProvider';
import { useNavigate } from 'react-router-dom';

export default function CreateEventModal({ isOpen, onClose, onSuccess }) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
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
    clanId: '',
    prizePoolTotal: 5000000000,
    numOfTeams: 10,
    playersPerTeam: 5,
    nodeToInnRatio: 5,
    diffculty: 'normal',
    startDate: '',
    endDate: '',
  });

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const [createEvent, { loading }] = useMutation(CREATE_TREASURE_EVENT, {
    onCompleted: (data) => {
      showToast('Event created successfully!', 'success');
      if (onSuccess) onSuccess(); // Refetch the events list
      navigate(`/treasure-hunt/${data.createTreasureEvent.eventId}`);
      onClose();
    },
    onError: (error) => {
      showToast(`Error creating event: ${error.message}`, 'error');
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
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
      await createEvent({
        variables: {
          input: {
            eventName: formData.eventName,
            clanId: formData.clanId || null,
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
      console.error('Error creating event:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Create New Treasure Hunt Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Event Name</FormLabel>
              <Input
                placeholder="October Treasure Hunt"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={currentColors.textColor}>Clan ID</FormLabel>
              <Input
                placeholder="cool_clan_123"
                value={formData.clanId}
                onChange={(e) => handleInputChange('clanId', e.target.value)}
                color={currentColors.textColor}
              />
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
              onClick={handleCreateEvent}
              isLoading={loading}
            >
              Create Event
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
