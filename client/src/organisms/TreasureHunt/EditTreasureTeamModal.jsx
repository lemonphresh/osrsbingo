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
  Button,
  useColorMode,
  Text,
  IconButton,
  HStack,
  Divider,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { UPDATE_TREASURE_TEAM, DELETE_TREASURE_TEAM } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';

export default function EditTeamModal({ isOpen, onClose, team, eventId, onSuccess }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();

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

  useEffect(() => {
    if (team) {
      setFormData({
        teamName: team.teamName || '',
        discordRoleId: team.discordRoleId || '',
        members: team.members && team.members.length > 0 ? team.members : [''],
      });
    }
  }, [team]);

  const [updateTeam, { loading }] = useMutation(UPDATE_TREASURE_TEAM, {
    onCompleted: () => {
      showToast('Team updated successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      showToast(`Error updating team: ${error.message}`, 'error');
    },
  });

  const [deleteTeam, { loading: deleteLoading }] = useMutation(DELETE_TREASURE_TEAM, {
    onCompleted: () => {
      showToast('Team deleted successfully!', 'success');
      if (onSuccess) onSuccess();
      onDeleteClose();
      onClose();
    },
    onError: (error) => {
      showToast(`Error deleting team: ${error.message}`, 'error');
    },
  });

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

  const handleUpdateTeam = async () => {
    if (!formData.teamName.trim()) {
      showToast('Please enter a team name', 'warning');
      return;
    }

    const members = formData.members.filter((m) => m.trim() !== '');

    try {
      await updateTeam({
        variables: {
          eventId,
          teamId: team.teamId,
          input: {
            teamName: formData.teamName.trim(),
            discordRoleId: formData.discordRoleId.trim() || null,
            members,
          },
        },
      });
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam({
        variables: {
          eventId,
          teamId: team.teamId,
        },
      });
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Edit Team</ModalHeader>
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
              <FormLabel color={currentColors.textColor}>Discord Role ID (Optional)</FormLabel>
              <Input
                placeholder="123456789012345678"
                value={formData.discordRoleId}
                onChange={(e) => setFormData({ ...formData, discordRoleId: e.target.value })}
                color={currentColors.textColor}
              />
              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} mt={1}>
                Discord role ID for team members (used by the bot)
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel color={currentColors.textColor}>Team Members (Discord IDs)</FormLabel>
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
              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} mt={1}>
                Optional: Add Discord user IDs for team members
              </Text>
            </FormControl>

            <Button
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
              w="full"
              onClick={handleUpdateTeam}
              isLoading={loading}
            >
              Update Team
            </Button>

            <Divider />

            <Button colorScheme="red" variant="outline" w="full" onClick={onDeleteOpen}>
              Delete Team
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent bg={currentColors.cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={currentColors.textColor}>
              Delete Team
            </AlertDialogHeader>

            <AlertDialogBody color={currentColors.textColor}>
              Are you sure you want to delete <strong>{team?.teamName}</strong>? This will remove
              all team progress and cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteTeam} ml={3} isLoading={deleteLoading}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Modal>
  );
}
