import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Select,
  Badge,
  IconButton,
  useToast,
  Divider,
  Heading,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { ADMIN_GIVE_BUFF, ADMIN_REMOVE_BUFF } from '../../graphql/mutations';

const BUFF_TYPES = {
  kill_reduction_minor: { label: "Slayer's Edge (25%)", icon: '⚔️' },
  kill_reduction_moderate: { label: "Slayer's Focus (50%)", icon: '⚔️' },
  kill_reduction_major: { label: "Slayer's Mastery (75%)", icon: '⚔️' },
  xp_reduction_minor: { label: 'Training Efficiency (25%)', icon: '📚' },
  xp_reduction_moderate: { label: 'Training Momentum (50%)', icon: '📚' },
  xp_reduction_major: { label: 'Training Enlightenment (75%)', icon: '📚' },
  item_reduction_minor: { label: 'Efficient Gathering (25%)', icon: '📦' },
  item_reduction_moderate: { label: 'Master Gatherer (50%)', icon: '📦' },
  item_reduction_major: { label: 'Legendary Gatherer (75%)', icon: '📦' },
  universal_reduction: { label: 'Versatile Training (50%)', icon: '✨' },
  multi_use_minor: { label: 'Persistent Focus (25% x2)', icon: '🔄' },
};

const AdminBuffManager = ({ eventId, team, onUpdate }) => {
  const toast = useToast();
  const [selectedBuffType, setSelectedBuffType] = useState('kill_reduction_moderate');

  const [giveBuff, { loading: giving }] = useMutation(ADMIN_GIVE_BUFF, {
    onCompleted: () => {
      toast({
        title: 'Buff granted',
        status: 'success',
        duration: 2000,
      });
      onUpdate && onUpdate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const [removeBuff, { loading: removing }] = useMutation(ADMIN_REMOVE_BUFF, {
    onCompleted: () => {
      toast({
        title: 'Buff removed',
        status: 'success',
        duration: 2000,
      });
      onUpdate && onUpdate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleGiveBuff = async () => {
    await giveBuff({
      variables: {
        eventId,
        teamId: team.teamId,
        buffType: selectedBuffType,
      },
    });
  };

  const handleRemoveBuff = async (buffId) => {
    await removeBuff({
      variables: {
        eventId,
        teamId: team.teamId,
        buffId,
      },
    });
  };

  return (
    <Box p={4} bg="purple.900" borderRadius="md" borderWidth={2} borderColor="purple.500">
      <VStack align="stretch" spacing={4}>
        <Heading size="sm" color="white">
          🛡️ Admin: Manage Team Buffs
        </Heading>

        {/* Current Buffs */}
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
            Current Buffs ({team.activeBuffs?.length || 0})
          </Text>
          {!team.activeBuffs || team.activeBuffs.length === 0 ? (
            <Text fontSize="xs" color="gray.300">
              No active buffs
            </Text>
          ) : (
            <VStack spacing={2} align="stretch">
              {team.activeBuffs.map((buff) => (
                <HStack
                  key={buff.buffId}
                  p={2}
                  bg="whiteAlpha.200"
                  borderRadius="md"
                  justify="space-between"
                >
                  <HStack>
                    <Text fontSize="lg">{buff.icon}</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="white">
                        {buff.buffName}
                      </Text>
                      <HStack spacing={1}>
                        <Badge colorScheme="blue" fontSize="xs">
                          -{(buff.reduction * 100).toFixed(0)}%
                        </Badge>
                        {buff.usesRemaining > 1 && (
                          <Badge colorScheme="orange" fontSize="xs">
                            {buff.usesRemaining} uses
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleRemoveBuff(buff.buffId)}
                    isLoading={removing}
                    aria-label="Remove buff"
                  />
                </HStack>
              ))}
            </VStack>
          )}
        </Box>

        <Divider />

        {/* Give Buff */}
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
            Give Buff
          </Text>
          <VStack spacing={2}>
            <Select
              value={selectedBuffType}
              onChange={(e) => setSelectedBuffType(e.target.value)}
              bg="whiteAlpha.200"
              color="white"
              borderColor="purple.400"
            >
              {Object.entries(BUFF_TYPES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </Select>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="green"
              w="full"
              onClick={handleGiveBuff}
              isLoading={giving}
            >
              Give Buff
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminBuffManager;
