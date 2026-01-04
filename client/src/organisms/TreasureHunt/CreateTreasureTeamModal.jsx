import { useState } from 'react';
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
  Button,
  Text,
  IconButton,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  Icon,
  AccordionIcon,
  AccordionPanel,
  OrderedList,
  ListItem,
  Image,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, DeleteIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { CREATE_TREASURE_TEAM } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import DiscordStep1 from '../../assets/discordstep1.png';
import DiscordStep2 from '../../assets/discordstep2.png';
import { useThemeColors } from '../../hooks/useThemeColors';

function isValidDiscordId(id) {
  return /^\d{17,19}$/.test(id);
}

export default function CreateTeamModal({ isOpen, onClose, eventId, onSuccess }) {
  const { colors: currentColors, colorMode } = useThemeColors();

  const { showToast } = useToastContext();

  const [formData, setFormData] = useState({
    teamName: '',
    discordRoleId: '',
    members: [''],
  });

  const [createTeam, { loading }] = useMutation(CREATE_TREASURE_TEAM, {
    onCompleted: () => {
      showToast('Team created successfully!', 'success');
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (error) => {
      showToast(`Error creating team: ${error.message}`, 'error');
    },
  });

  const handleClose = () => {
    setFormData({
      teamName: '',
      discordRoleId: '',
      members: [''],
    });
    onClose();
  };

  const handleAddMember = () => {
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, ''],
    }));
  };

  const handleRemoveMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const handleMemberChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((member, i) => (i === index ? value : member)),
    }));
  };

  const handleCreateTeam = async () => {
    if (!formData.teamName.trim()) {
      showToast('Please enter a team name', 'warning');
      return;
    }

    const members = formData.members.filter((m) => m.trim() !== '');

    try {
      await createTeam({
        variables: {
          eventId,
          input: {
            teamName: formData.teamName.trim(),
            discordRoleId: formData.discordRoleId.trim() || null,
            members,
          },
        },
      });
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Create New Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color={currentColors.textColor}>Team Name</FormLabel>
              <Input
                placeholder="Dragon Slayers"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                color={currentColors.textColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={currentColors.textColor}>Team Members (Discord IDs)</FormLabel>
              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} mb={2}>
                Add Discord user IDs for team members.
                <br />
                <br /> Note: This is how team members will be able to use Discord commands to submit
                their screenshots, check progress and more, and to use the site UI to use buffs, buy
                items from inns, etc. (Make sure they have an OSRS Bingo Hub account, are logged in
                and have linked their Discord!)
              </Text>
              <Accordion allowToggle mb={3}>
                <AccordionItem border="none" bg="blue.50">
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={InfoIcon} color="blue.500" />
                        <Text fontSize="sm" fontWeight="bold">
                          How do I find Discord User IDs?
                        </Text>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <OrderedList spacing={2} fontSize="sm">
                      <ListItem>
                        Open Discord Settings → Advanced → Enable "Developer Mode"
                        <Image src={DiscordStep1} mt={2} borderRadius="md" />
                      </ListItem>
                      <ListItem>
                        Right-click the user's name → "Copy User ID"
                        <Image src={DiscordStep2} mt={2} borderRadius="md" />
                      </ListItem>
                      <ListItem>Paste the 18-digit ID below (example: 123456789012345678)</ListItem>
                    </OrderedList>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
              <VStack spacing={2} align="stretch">
                {formData.members.map((member, index) => (
                  <HStack key={index}>
                    <Input
                      placeholder="Discord User ID"
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      color={currentColors.textColor}
                    />
                    {member && isValidDiscordId(member) && (
                      <Icon as={CheckIcon} color="green.400" />
                    )}
                    {member && !isValidDiscordId(member) && (
                      <Tooltip label="Discord IDs are 17-19 digits">
                        <Icon as={WarningIcon} color="red.400" />
                      </Tooltip>
                    )}
                    {formData.members.length > 1 && (
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleRemoveMember(index)}
                        aria-label="Remove member"
                      />
                    )}
                  </HStack>
                ))}
                <Button
                  leftIcon={<AddIcon />}
                  size="sm"
                  variant="outline"
                  onClick={handleAddMember}
                  color={currentColors.textColor}
                >
                  Add Member
                </Button>
              </VStack>
            </FormControl>

            <Button
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
              w="full"
              onClick={handleCreateTeam}
              isLoading={loading}
            >
              Create Team
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
