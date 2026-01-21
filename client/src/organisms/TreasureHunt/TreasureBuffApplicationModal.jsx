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
  Text,
  Button,
  Box,
  Badge,
  Divider,
  Radio,
  RadioGroup,
  useColorMode,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { OBJECTIVE_TYPES } from '../../utils/treasureHuntHelpers';

const BuffApplicationModal = ({ isOpen, onClose, node, availableBuffs = [], onApplyBuff }) => {
  const { colorMode } = useColorMode();
  const [selectedBuffId, setSelectedBuffId] = useState(null);
  const [applying, setApplying] = useState(false);

  const colors = {
    dark: { cardBg: '#2D3748', textColor: '#F7FAFC' },
    light: { cardBg: 'white', textColor: '#171923' },
  };
  const currentColors = colors[colorMode];

  if (!node || !node.objective) return null;

  // Filter buffs that can be applied to this objective
  const applicableBuffs = availableBuffs.filter((buff) =>
    buff.objectiveTypes.includes(node.objective.type)
  );

  const selectedBuff = applicableBuffs.find((b) => b.buffId === selectedBuffId);

  const getBuffIcon = (buffType) => {
    if (buffType.includes('kill_reduction')) return '⚔️';
    if (buffType.includes('xp_reduction')) return '📚';
    if (buffType.includes('item_reduction')) return '📦';
    if (buffType.includes('universal')) return '✨';
    if (buffType.includes('multi_use')) return '🔄';
    return '🎁';
  };

  const calculateReduction = () => {
    if (!selectedBuff) return null;

    const original = node.objective.quantity;
    const reduced = Math.ceil(original * (1 - selectedBuff.reduction));
    const saved = original - reduced;

    return { original, reduced, saved };
  };

  const handleApply = async () => {
    if (!selectedBuffId) return;

    setApplying(true);
    try {
      await onApplyBuff(selectedBuffId);
      onClose();
    } catch (error) {
      console.error('Error applying buff:', error);
    } finally {
      setApplying(false);
    }
  };

  const reduction = calculateReduction();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Apply Buff to Objective</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Objective Info */}
            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>
                Current Objective:
              </Text>
              <Text fontWeight="bold" fontSize="lg" color={currentColors.textColor}>
                {OBJECTIVE_TYPES[node.objective.type]}: {node.objective.quantity}{' '}
                {node.objective.target}
              </Text>
            </Box>

            <Divider />

            {/* Buff Selection */}
            {applicableBuffs.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No buffs available for this objective type {OBJECTIVE_TYPES[node.objective.type]} (
                {node.objective.type})
              </Alert>
            ) : (
              <>
                <Text fontWeight="bold" color={currentColors.textColor}>
                  Select a buff to apply:
                </Text>
                <RadioGroup onChange={setSelectedBuffId} value={selectedBuffId}>
                  <VStack spacing={2} align="stretch">
                    {applicableBuffs.map((buff) => (
                      <Box
                        key={buff.buffId}
                        p={3}
                        borderWidth={2}
                        borderRadius="md"
                        borderColor={selectedBuffId === buff.buffId ? 'blue.400' : 'gray.600'}
                        cursor="pointer"
                        onClick={() => setSelectedBuffId(buff.buffId)}
                        _hover={{ borderColor: 'blue.300' }}
                      >
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Radio value={buff.buffId} />
                            <Text fontSize="xl">{getBuffIcon(buff.buffType)}</Text>
                            <VStack align="start" spacing={0}>
                              <HStack>
                                <Text fontWeight="bold" color={currentColors.textColor}>
                                  {buff.buffName}
                                </Text>
                                <Badge colorScheme="blue">
                                  -{(buff.reduction * 100).toFixed(0)}%
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                {buff.description}
                              </Text>
                            </VStack>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </RadioGroup>
              </>
            )}

            {/* Reduction Preview */}
            {reduction && (
              <>
                <Divider />
                <Box bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} p={4} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    📊 Reduction Preview
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        Original requirement:
                      </Text>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        {reduction.original}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        With buff applied:
                      </Text>
                      <Text fontWeight="bold" color="green.400">
                        {reduction.reduced} ✨
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        You save:
                      </Text>
                      <Text fontWeight="bold" color="blue.400">
                        {reduction.saved} {node.objective.type}!
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleApply}
            isDisabled={!selectedBuffId || applicableBuffs.length === 0}
            isLoading={applying}
          >
            Apply Buff
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuffApplicationModal;
