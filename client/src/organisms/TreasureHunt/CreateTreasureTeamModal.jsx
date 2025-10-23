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
  useColorMode,
  Text,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { CREATE_TREASURE_TEAM } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';

export default function CreateTeamModal({ isOpen, onClose, eventId, onSuccess }) {
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
                Add Discord user IDs for team members. (Right click their name in Discord and select
                "Copy ID"; Make sure Developer Mode is enabled in Discord settings.)
                <br />
                <br /> Note: This is how team members will be able to use Discord commands to submit
                their screenshots, check progress and more, and to use the site UI to use buffs, buy
                items from inns, etc. (Make sure they have an OSRS Bingo Hub account, are logged in
                and have linked their Discord!)
              </Text>
              <VStack spacing={2} align="stretch">
                {formData.members.map((member, index) => (
                  <HStack key={index}>
                    <Input
                      placeholder="Discord User ID"
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      color={currentColors.textColor}
                    />
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
