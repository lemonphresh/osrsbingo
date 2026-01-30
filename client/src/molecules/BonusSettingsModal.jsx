import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from '@chakra-ui/react';
import theme from '../theme';

const removeTypename = (obj) => {
  if (obj?.__typename) {
    const { __typename, ...rest } = obj;
    return rest;
  }
  return obj;
};

const BonusSettingsModal = ({ board, isOpen, onClose, onUpdateField }) => {
  const [localSettings, setLocalSettings] = useState(
    board?.bonusSettings || {
      allowDiagonals: false,
      horizontalBonus: 1,
      verticalBonus: 1,
      diagonalBonus: 1,
      blackoutBonus: 0,
    }
  );

  const handleChange = (fieldName, fieldValue) => {
    setLocalSettings((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  const handleSaveAndClose = async () => {
    await onUpdateField(localSettings);
    onClose();
  };

  useEffect(() => {
    setLocalSettings(removeTypename(board?.bonusSettings));
  }, [board]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent backgroundColor="gray.700" color="white">
        <ModalHeader textAlign="center" color="white">
          Bonus Settings
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody paddingX={['16px', '32px', '56px']} width="100%">
          <Flex direction="column" gap="16px">
            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text color="gray.100">Allow Diagonal Bonus</Text>
              <Checkbox
                colorScheme="purple"
                isChecked={localSettings?.allowDiagonals}
                onChange={(e) => handleChange('allowDiagonals', e.target.checked)}
              />
            </Flex>

            <Text color={theme.colors.purple[300]} fontWeight="bold">
              Multipliers
            </Text>
            <Text color="gray.400" fontSize="12px">
              The amount of bonus points awarded for a completed row, column or diagonal (when
              applicable). (Min: 0, Max: 100)
            </Text>

            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text color="gray.100">Row Bonus</Text>
              <NumberInput
                color="white"
                colorScheme="purple"
                max={100}
                maxWidth="80px"
                min={0}
                onChange={(val) => handleChange('horizontalBonus', parseFloat(val, 10) || 0)}
                step={1}
                width="100%"
              >
                <NumberInputField
                  autoComplete="off"
                  placeholder={localSettings?.horizontalBonus || 0}
                  value={localSettings?.horizontalBonus || 0}
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
                />
                <NumberInputStepper borderColor="gray.600">
                  <NumberIncrementStepper color="gray.400" borderColor="gray.600" />
                  <NumberDecrementStepper color="gray.400" borderColor="gray.600" />
                </NumberInputStepper>
              </NumberInput>
            </Flex>

            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text color="gray.100">Column Bonus</Text>
              <NumberInput
                colorScheme="purple"
                color="white"
                max={100}
                maxWidth="80px"
                min={0}
                onChange={(val) => handleChange('verticalBonus', parseFloat(val, 10) || 0)}
                step={1}
                width="100%"
              >
                <NumberInputField
                  autoComplete="off"
                  placeholder={localSettings?.verticalBonus || 0}
                  value={localSettings?.verticalBonus || 0}
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
                />
                <NumberInputStepper borderColor="gray.600">
                  <NumberIncrementStepper color="gray.400" borderColor="gray.600" />
                  <NumberDecrementStepper color="gray.400" borderColor="gray.600" />
                </NumberInputStepper>
              </NumberInput>
            </Flex>

            {localSettings.allowDiagonals && (
              <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
                <Text color="gray.100">Diagonal Bonus</Text>
                <NumberInput
                  color="white"
                  colorScheme="purple"
                  max={100}
                  maxWidth="80px"
                  min={0}
                  onChange={(val) => handleChange('diagonalBonus', parseFloat(val, 10) || 0)}
                  step={1}
                  width="100%"
                >
                  <NumberInputField
                    autoComplete="off"
                    placeholder={localSettings?.diagonalBonus || 0}
                    value={localSettings?.diagonalBonus || 0}
                    bg="gray.700"
                    borderColor="gray.600"
                    _hover={{ borderColor: 'gray.500' }}
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
                  />
                  <NumberInputStepper borderColor="gray.600">
                    <NumberIncrementStepper color="gray.400" borderColor="gray.600" />
                    <NumberDecrementStepper color="gray.400" borderColor="gray.600" />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
            )}

            <Text color={theme.colors.purple[300]} fontWeight="bold">
              Point Bonus
            </Text>
            <Text color="gray.400" fontSize="12px">
              Bonus points added to total when board is filled out completely. (Min: 0, Max: 250)
            </Text>

            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text color="gray.100">Blackout Bonus</Text>
              <NumberInput
                color="white"
                colorScheme="purple"
                max={250}
                maxWidth="80px"
                min={0}
                onChange={(val) => handleChange('blackoutBonus', parseInt(val, 10) || 0)}
                step={1}
                width="100%"
              >
                <NumberInputField
                  autoComplete="off"
                  placeholder={localSettings?.blackoutBonus || 0}
                  value={localSettings?.blackoutBonus || 0}
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
                />
                <NumberInputStepper borderColor="gray.600">
                  <NumberIncrementStepper color="gray.400" borderColor="gray.600" />
                  <NumberDecrementStepper color="gray.400" borderColor="gray.600" />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
          </Flex>
        </ModalBody>
        <ModalFooter margin="8px">
          <Button colorScheme="purple" onClick={handleSaveAndClose}>
            Save & Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BonusSettingsModal;
