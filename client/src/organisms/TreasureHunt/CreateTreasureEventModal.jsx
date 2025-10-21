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
  Tooltip,
  Icon,
  HStack,
  Text,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { CREATE_TREASURE_EVENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
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
      green: '#43AA8B',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#171923',
      cardBg: 'white',
      green: '#43AA8B',
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
    difficulty: 'normal',
    startDate: '',
    endDate: '',
  });

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const [createEvent, { loading }] = useMutation(CREATE_TREASURE_EVENT, {
    onCompleted: (data) => {
      showToast('Event created successfully!', 'success');
      if (onSuccess) onSuccess();
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

  // Helper component for label with tooltip
  const LabelWithTooltip = ({ label, tooltip }) => (
    <HStack spacing={1}>
      <FormLabel color={currentColors.textColor} mb={0}>
        {label}
      </FormLabel>
      <Tooltip
        label={tooltip}
        placement="top"
        hasArrow
        bg="gray.700"
        color="white"
        fontSize="sm"
        maxW="300px"
      >
        <Icon as={InfoIcon} boxSize={3} color="gray.500" cursor="help" />
      </Tooltip>
    </HStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Create New Treasure Hunt Event</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <LabelWithTooltip
                label="Event Name"
                tooltip="Give your treasure hunt a memorable name (e.g., 'Summer Bingo Bonanza')"
              />
              <Input
                placeholder="My Treasure Hunt"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl>

            <FormControl>
              <LabelWithTooltip
                label="Clan ID (Optional)"
                tooltip="Your clan's identifier for Discord integration. Leave blank if not using Discord features."
              />
              <Input
                placeholder="cool_clan_123"
                value={formData.clanId}
                onChange={(e) => handleInputChange('clanId', e.target.value)}
                color={currentColors.textColor}
              />
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <LabelWithTooltip
                  label="Start Date"
                  tooltip="When teams can begin completing objectives"
                />
                <Input
                  type="date"
                  min={today}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  color={currentColors.textColor}
                />
              </FormControl>

              <FormControl isRequired>
                <LabelWithTooltip
                  label="End Date"
                  tooltip="Final deadline for completing objectives. The map scales based on event duration."
                />
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
              <LabelWithTooltip
                label="Difficulty Level"
                tooltip="Scales all objective requirements. Easy = 80%, Normal = 100%, Hard = 140%, Sweatlord = 200%"
              />
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                color={currentColors.textColor}
              >
                <option value="easy">Easy (0.8x objectives) - Casual fun</option>
                <option value="normal">Normal (1.0x objectives) - Balanced</option>
                <option value="hard">Hard (1.4x objectives) - Challenging</option>
                <option value="sweatlord">Sweatlord (2.0x objectives) - Extreme</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <LabelWithTooltip
                label="Total Prize Pool (GP)"
                tooltip="Total GP to be split among teams based on performance. Maximum pot per team is calculated automatically."
              />
              <NumberInput
                value={formData.prizePoolTotal}
                onChange={(_, val) => handleInputChange('prizePoolTotal', val)}
                min={0}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Per team max:{' '}
                {(formData.prizePoolTotal / Math.max(formData.numOfTeams, 1) / 1000000).toFixed(1)}M
                GP
              </Text>
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <LabelWithTooltip
                  label="Number of Teams"
                  tooltip="How many teams will compete. More teams = more competition!"
                />
                <NumberInput
                  value={formData.numOfTeams}
                  onChange={(_, val) => handleInputChange('numOfTeams', val)}
                  min={1}
                  max={50}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <LabelWithTooltip
                  label="Players per Team"
                  tooltip="Team size affects map generation. More players = more nodes to complete."
                />
                <NumberInput
                  value={formData.playersPerTeam}
                  onChange={(_, val) => handleInputChange('playersPerTeam', val)}
                  min={1}
                  max={20}
                >
                  <NumberInputField color={currentColors.textColor} />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <FormControl isRequired>
              <LabelWithTooltip
                label="Nodes per Inn"
                tooltip="How many objective nodes between each Inn checkpoint. Lower = more Inns to trade keys for GP. Recommended: 5"
              />
              <NumberInput
                value={formData.nodeToInnRatio}
                onChange={(_, val) => handleInputChange('nodeToInnRatio', val)}
                min={1}
                max={20}
              >
                <NumberInputField color={currentColors.textColor} />
              </NumberInput>
            </FormControl>

            {/* Map Preview Stats */}
            <VStack
              w="full"
              p={3}
              bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
              borderRadius="md"
              spacing={2}
            >
              <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                📊 Map Preview
              </Text>
              <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
                <VStack spacing={0}>
                  <Text color="gray.500">Total Nodes</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    ~
                    {Math.floor(
                      10 *
                        formData.playersPerTeam *
                        ((new Date(formData.endDate || Date.now()) -
                          new Date(formData.startDate || Date.now())) /
                          (1000 * 60 * 60 * 24 * 7)) *
                        1.5
                    ) || '?'}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.500">Inns</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    ~
                    {Math.floor(
                      (10 *
                        formData.playersPerTeam *
                        ((new Date(formData.endDate || Date.now()) -
                          new Date(formData.startDate || Date.now())) /
                          (1000 * 60 * 60 * 24 * 7))) /
                        formData.nodeToInnRatio
                    ) || '?'}
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text color="gray.500">Avg GP/Node</Text>
                  <Text fontWeight="bold" color={currentColors.green}>
                    {formData.startDate && formData.endDate
                      ? (
                          ((formData.prizePoolTotal / formData.numOfTeams) * 0.6) /
                          (10 *
                            formData.playersPerTeam *
                            ((new Date(formData.endDate) - new Date(formData.startDate)) /
                              (1000 * 60 * 60 * 24 * 7))) /
                          1000000
                        ).toFixed(1) + 'M'
                      : '?'}
                  </Text>
                </VStack>
              </SimpleGrid>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Map generates automatically based on these settings
              </Text>
            </VStack>

            <Button
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
              w="full"
              onClick={handleCreateEvent}
              isLoading={loading}
              size="lg"
            >
              Create Event
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
