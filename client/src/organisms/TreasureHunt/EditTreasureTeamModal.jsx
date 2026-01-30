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
  Text,
  Divider,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  HStack,
  Icon,
  OrderedList,
  ListItem,
  Image,
} from '@chakra-ui/react';
import { AddIcon, InfoIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { UPDATE_TREASURE_TEAM, DELETE_TREASURE_TEAM } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import DiscordStep1 from '../../assets/discordstep1.png';
import DiscordStep2 from '../../assets/discordstep2.png';

const isValidDiscordId = (id) => /^\d{17,19}$/.test(id);

export default function EditTeamModal({
  isOpen,
  onClose,
  team,
  existingTeams = [],
  eventId,
  onSuccess,
}) {
  const { showToast } = useToastContext();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();

  const [formData, setFormData] = useState({
    teamName: '',
    discordRoleId: '',
    members: [''],
  });

  const getExistingMemberMap = () => {
    const memberMap = new Map();
    existingTeams.forEach((t) => {
      if (t.teamId === team?.teamId) return;

      t.members?.forEach((memberId) => {
        memberMap.set(memberId, t.teamName);
      });
    });
    return memberMap;
  };

  const existingMemberMap = getExistingMemberMap();

  const getMemberConflict = (memberId) => {
    if (!memberId || !isValidDiscordId(memberId)) return null;
    return existingMemberMap.get(memberId) || null;
  };

  const getDuplicateInForm = (memberId, currentIndex) => {
    if (!memberId || !isValidDiscordId(memberId)) return false;
    return formData.members.some((m, idx) => idx !== currentIndex && m === memberId);
  };

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

    const conflicts = members
      .map((m) => ({ id: m, team: getMemberConflict(m) }))
      .filter((c) => c.team);

    if (conflicts.length > 0) {
      const conflictMsg = conflicts
        .map((c) => `User ${c.id.slice(-6)} is already on "${c.team}"`)
        .join(', ');
      showToast(`Cannot add members: ${conflictMsg}`, 'error');
      return;
    }

    const uniqueMembers = [...new Set(members)];
    if (uniqueMembers.length !== members.length) {
      showToast('Cannot add the same user multiple times to one team', 'warning');
      return;
    }

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
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader color="white">Edit Team</ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color="gray.100">Team Name</FormLabel>
              <Input
                placeholder="Dragon Slayers"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                color="white"
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: 'gray.500' }}
                _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.100">Team Members</FormLabel>
              <Text fontSize="xs" color="gray.400" mb={2}>
                Add Discord user IDs for team members. Members need to link their Discord on their
                OSRS Bingo Hub profile to use site features like buffs and inn purchases.
              </Text>
              <Accordion allowToggle mb={3}>
                <AccordionItem border="none" bg="blue.900" borderRadius="md">
                  <AccordionButton _hover={{ bg: 'blue.800' }}>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={InfoIcon} color="blue.400" />
                        <Text fontSize="sm" fontWeight="bold" color="blue.200">
                          How do I find Discord User IDs?
                        </Text>
                      </HStack>
                    </Box>
                    <AccordionIcon color="blue.400" />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <OrderedList spacing={2} fontSize="sm" color="gray.300">
                      <ListItem>
                        Open Discord Settings → Advanced → Enable "Developer Mode"
                        <Image src={DiscordStep1} mt={2} borderRadius="md" />
                      </ListItem>
                      <ListItem>
                        Right-click the user's name → "Copy User ID"
                        <Image src={DiscordStep2} mt={2} borderRadius="md" />
                      </ListItem>
                      <ListItem>
                        Paste the 17-19 digit ID below (example: 123456789012345678)
                      </ListItem>
                    </OrderedList>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
              <VStack spacing={3} align="stretch">
                {formData.members.map((member, index) => (
                  <DiscordMemberInput
                    key={index}
                    value={member}
                    onChange={(newValue) => handleMemberChange(index, newValue)}
                    onRemove={() => handleRemoveMember(index)}
                    showRemove={formData.members.length > 1}
                    colorMode="dark"
                    conflictTeam={getMemberConflict(member)}
                    isDuplicateInForm={getDuplicateInForm(member, index)}
                  />
                ))}
                <Button
                  leftIcon={<AddIcon />}
                  size="sm"
                  variant="outline"
                  onClick={handleAddMember}
                  color="gray.300"
                  borderColor="gray.600"
                  _hover={{ bg: 'whiteAlpha.100', borderColor: 'gray.500' }}
                >
                  Add Member
                </Button>
              </VStack>
            </FormControl>

            <Button colorScheme="purple" w="full" onClick={handleUpdateTeam} isLoading={loading}>
              Update Team
            </Button>

            <Divider borderColor="gray.600" />

            <Button colorScheme="red" variant="outline" w="full" onClick={onDeleteOpen}>
              Delete Team
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay backdropFilter="blur(4px)">
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Team
            </AlertDialogHeader>

            <AlertDialogBody color="gray.200">
              Are you sure you want to delete <strong>{team?.teamName}</strong>? This will remove
              all team progress and cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onDeleteClose}
                variant="ghost"
                color="gray.400"
                _hover={{ bg: 'whiteAlpha.100' }}
              >
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
