import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Icon,
  useColorMode,
} from '@chakra-ui/react';
import { MdHome } from 'react-icons/md';
import { CheckCircleIcon } from '@chakra-ui/icons';

/**
 * Modal that displays all available inns (completed but not yet purchased from)
 * Clicking on an inn opens the InnModal for that specific inn
 */
const AvailableInnsModal = ({ isOpen, onClose, availableInns, onSelectInn }) => {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      hoverBg: '#4A5568',
      green: { base: '#43AA8B' },
    },
    light: {
      textColor: '#171923',
      cardBg: 'white',
      hoverBg: '#EDF2F7',
      green: { base: '#43AA8B' },
    },
  };

  const currentColors = colors[colorMode];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>
          <HStack>
            <Icon as={MdHome} color="green.500" boxSize={6} />
            <Text>Available Inns</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={currentColors.textColor} />
        <ModalBody pb={6}>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Click on any inn below to view rewards and make purchases.
          </Text>
          <VStack spacing={3} align="stretch">
            {availableInns.length === 0 ? (
              <Box
                p={4}
                borderRadius="md"
                bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                textAlign="center"
              >
                <Text color="gray.500" fontSize="sm">
                  No available inns at the moment. Complete more nodes to unlock inns!
                </Text>
              </Box>
            ) : (
              availableInns.map((inn) => (
                <Box
                  key={inn.nodeId}
                  p={4}
                  borderRadius="md"
                  borderWidth={2}
                  borderColor="green.500"
                  bg={currentColors.cardBg}
                  cursor="pointer"
                  onClick={() => {
                    onSelectInn(inn);
                    onClose();
                  }}
                  _hover={{
                    bg: currentColors.hoverBg,
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between" align="start">
                    <HStack spacing={3} flex={1}>
                      <CheckCircleIcon color={currentColors.green.base} boxSize={5} />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          {inn.title}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {inn.mapLocation}
                        </Text>
                        {inn.description && (
                          <Text fontSize="xs" color="gray.400" maxW="400px">
                            {inn.description}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={1}>
                      <Badge colorScheme="yellow" fontSize="xs">
                        INN #{inn.innTier}
                      </Badge>
                      <Badge colorScheme="green" fontSize="xs">
                        Available
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AvailableInnsModal;
