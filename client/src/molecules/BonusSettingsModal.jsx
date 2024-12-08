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
      <ModalOverlay />
      <ModalContent backgroundColor={theme.colors.gray[100]}>
        <ModalHeader textAlign="center">Bonus Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody paddingX={['16px', '32px', '56px']} width="100%">
          <Flex direction="column" gap="16px">
            {/* Allow Diagonals */}
            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text>Allow Diagonal Bonus</Text>
              <Checkbox
                colorScheme="purple"
                isChecked={localSettings?.allowDiagonals}
                onChange={(e) => handleChange('allowDiagonals', e.target.checked)}
              />
            </Flex>

            <Text color={theme.colors.purple[600]} fontWeight="bold">
              Multipliers
            </Text>
            <Text color={theme.colors.purple[600]} fontSize="12px">
              The amount that a group of tiles is multiplied by when all are completed. (1x to 2x,
              by 0.1 intervals)
            </Text>
            {/* Horizontal Bonus */}
            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text>Row Bonus</Text>
              <NumberInput
                color={theme.colors.gray[700]}
                colorScheme="purple"
                max={2}
                maxWidth="80px"
                min={1}
                onChange={(val) => handleChange('horizontalBonus', parseFloat(val, 10) || 0)}
                step={0.1}
                width="100%"
              >
                <NumberInputField
                  autoComplete="off"
                  placeholder={localSettings?.horizontalBonus || 0}
                  value={localSettings?.horizontalBonus || 0}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>

            {/* Vertical Bonus */}
            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text>Column Bonus </Text>
              <NumberInput
                variant="filled"
                colorScheme="purple"
                color={theme.colors.gray[700]}
                max={2}
                maxWidth="80px"
                min={1}
                onChange={(val) => handleChange('verticalBonus', parseFloat(val, 10) || 0)}
                step={0.1}
                width="100%"
              >
                <NumberInputField
                  autoComplete="off"
                  placeholder={localSettings?.verticalBonus || 0}
                  value={localSettings?.verticalBonus || 0}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>

            {/* Diagonal Bonus */}
            {localSettings.allowDiagonals && (
              <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
                <Text>Diagonal Bonus</Text>
                <NumberInput
                  color={theme.colors.gray[700]}
                  colorScheme="purple"
                  max={2}
                  maxWidth="80px"
                  min={1}
                  onChange={(val) => handleChange('diagonalBonus', parseFloat(val, 10) || 0)}
                  step={0.1}
                  width="100%"
                >
                  <NumberInputField
                    autoComplete="off"
                    placeholder={localSettings?.diagonalBonus || 0}
                    value={localSettings?.diagonalBonus || 0}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
            )}

            <Text color={theme.colors.purple[600]} fontWeight="bold">
              Point Bonus
            </Text>
            <Text color={theme.colors.purple[600]} fontSize="12px">
              Amount added to total when board is filled out completely. (Min: 0, Max: 250)
            </Text>
            {/* Blackout Bonus */}
            <Flex align="center" justify="space-between" paddingX="16px" paddingY="4px">
              <Text>Blackout Bonus</Text>
              <NumberInput
                color={theme.colors.gray[700]}
                colorScheme="purple"
                max={250}
                maxWidth="80px"
                min={0}
                onChange={(val) => handleChange('blackoutBonus', parseInt(val, 10) || 0)}
                step={10}
                width="100%"
              >
                <NumberInputField
                  autoComplete="off"
                  placeholder={localSettings?.blackoutBonus || 0}
                  value={localSettings?.blackoutBonus || 0}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
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
