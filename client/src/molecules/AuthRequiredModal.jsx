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
  Button,
  Icon,
  Divider,
  useColorMode,
} from '@chakra-ui/react';
import { LockIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

/**
 * Modal that prompts unauthenticated users to sign up or log in
 * before they can access a protected feature
 */
const AuthRequiredModal = ({ isOpen, onClose, feature = 'this feature' }) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      borderColor: '#4A5568',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#171923',
      cardBg: 'white',
      borderColor: '#E2E8F0',
    },
  };

  const currentColors = colors[colorMode];

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent
        bg={currentColors.cardBg}
        borderWidth={2}
        borderColor={currentColors.purple.base}
      >
        <ModalHeader color={currentColors.textColor}>
          <HStack spacing={2}>
            <Icon as={LockIcon} color={currentColors.purple.base} />
            <Text>Authentication Required</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={currentColors.textColor} />

        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Info Text */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="md" color={currentColors.textColor}>
                You need to be logged in to {feature}.
              </Text>
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                Create an account to start hosting your own competitive OSRS events, or log in if
                you already have an account.
              </Text>
            </VStack>

            <Divider borderColor={currentColors.borderColor} />

            {/* Action Buttons */}
            <VStack spacing={3} align="stretch">
              {/* Sign Up - Primary Action */}
              <Button
                size="lg"
                bg={currentColors.purple.base}
                color="white"
                _hover={{ bg: currentColors.purple.light, transform: 'translateY(-2px)' }}
                onClick={handleSignUp}
                rightIcon={<ArrowForwardIcon />}
                boxShadow="md"
              >
                Create Account
              </Button>

              {/* Login - Secondary Action */}
              <Button
                size="md"
                variant="outline"
                borderColor={currentColors.purple.base}
                color={currentColors.purple.base}
                _hover={{
                  bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50',
                  borderColor: currentColors.purple.light,
                }}
                onClick={handleLogin}
              >
                Already have an account? Log In
              </Button>
            </VStack>

            {/* Benefits */}
            <VStack
              spacing={2}
              align="stretch"
              bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}
              p={4}
              borderRadius="md"
            >
              <Text fontSize="xs" fontWeight="bold" color={currentColors.textColor}>
                ✨ What you can do with an account:
              </Text>
              <VStack
                spacing={1}
                align="stretch"
                fontSize="xs"
                color={currentColors.textColor}
                pl={2}
              >
                <Text>
                  • Create unlimited <strong>bingo boards</strong> for events or tracking progress
                </Text>
                <Text ml={3}>• Share your boards with your friends</Text>
                <Text ml={3}>• Browse public boards for inspiration</Text>
                <Text>
                  • Create unlimited <strong>treasure hunt events</strong>
                </Text>
                <Text ml={3}>• Review and approve submissions</Text>
                <Text ml={3}>• Access event analytics and leaderboards</Text>
              </VStack>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AuthRequiredModal;
