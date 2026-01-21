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
} from '@chakra-ui/react';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import { AddIcon, InfoIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { CREATE_TREASURE_TEAM } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import DiscordStep1 from '../../assets/discordstep1.png';
import DiscordStep2 from '../../assets/discordstep2.png';
import { useThemeColors } from '../../hooks/useThemeColors';

function isValidDiscordId(id) {
  return /^\d{17,19}$/.test(id);
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  eventId,
  existingTeams = [],
  onSuccess,
}) {
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

  const getExistingMemberMap = () => {
    const memberMap = new Map(); // discordId -> teamName
    existingTeams.forEach((team) => {
      team.members?.forEach((memberId) => {
        memberMap.set(memberId, team.teamName);
      });
    });
    return memberMap;
  };

  const existingMemberMap = getExistingMemberMap();

  // Check if a member ID is already on another team
  const getMemberConflict = (memberId) => {
    if (!memberId || !isValidDiscordId(memberId)) return null;
    const existingTeam = existingMemberMap.get(memberId);
    return existingTeam || null;
  };

  // Check for duplicates within the current form
  const getDuplicateInForm = (memberId, currentIndex) => {
    if (!memberId || !isValidDiscordId(memberId)) return false;
    return formData.members.some((m, idx) => idx !== currentIndex && m === memberId);
  };

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

    // Check for members already on other teams
    const conflicts = members
      .map((m) => ({ id: m, team: getMemberConflict(m) }))
      .filter((c) => c.team);

    if (conflicts.length > 0) {
      const conflictMsg = conflicts
        .map((c) => `User ${c.id} is already on team "${c.team}"`)
        .join(', ');
      showToast(`Cannot add members: ${conflictMsg}`, 'error');
      return;
    }

    // Check for duplicates within this team
    const uniqueMembers = [...new Set(members)];
    if (uniqueMembers.length !== members.length) {
      showToast('Cannot add the same user multiple times to one team', 'warning');
      return;
    }

    try {
      await createTeam({
        variables: {
          eventId,
          input: {
            teamName: formData.teamName.trim(),
            discordRoleId: formData.discordRoleId.trim() || null,
            members: uniqueMembers,
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
              <VStack spacing={3} align="stretch">
                {formData.members.map((member, index) => (
                  <DiscordMemberInput
                    key={index}
                    value={member}
                    onChange={(newValue) => handleMemberChange(index, newValue)}
                    onRemove={() => handleRemoveMember(index)}
                    showRemove={formData.members.length > 1}
                    colorMode={colorMode}
                    conflictTeam={getMemberConflict(member)} // <-- ADD
                    isDuplicateInForm={getDuplicateInForm(member, index)} // <-- ADD
                  />
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
