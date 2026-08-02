import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Box,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// ── Checklist row ─────────────────────────────────────────────────────────────

function ChecklistItem({ done, disabled, label, description }) {
  return (
    <HStack
      p={3}
      borderRadius="md"
      bg={done ? 'green.900' : 'whiteAlpha.100'}
      borderWidth="1px"
      borderColor={done ? 'green.700' : 'whiteAlpha.200'}
      spacing={3}
      align={done ? 'center' : 'start'}
      opacity={disabled ? 0.45 : 1}
      transition="opacity 0.2s"
    >
      <Box flexShrink={0} mt={done ? '0' : '2px'}>
        {done ? (
          <Icon as={CheckCircleIcon} color="green.400" boxSize={5} />
        ) : (
          <Box
            w="20px"
            h="20px"
            borderRadius="full"
            borderWidth="2px"
            borderColor={disabled ? 'gray.600' : 'yellow.400'}
          />
        )}
      </Box>
      <VStack align="start" spacing={0}>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color={done ? 'green.300' : disabled ? 'gray.500' : 'white'}
          textDecoration={done ? 'line-through' : 'none'}
        >
          {label}
        </Text>
        {description && (
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            {description}
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ParticipantSetupModal({ isOpen, onClose, user, eventId }) {
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const hasDiscord = !!user?.discordUserId;

  const handleDismiss = () => {
    localStorage.setItem(`participantSetup_${eventId}_seen`, 'true');
    onClose();
  };

  const handleSignIn = () => {
    onClose();
    navigate('/');
  };

  const handleLinkDiscord = () => {
    onClose();
    navigate(`/user/${user.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
      <ModalContent bg="gray.800" borderWidth="1px" borderColor="yellow.600" borderRadius="xl">
        <ModalCloseButton color="gray.400" onClick={handleDismiss} />
        <ModalBody py={8} px={7}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <VStack spacing={1} align="start">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="yellow.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Heads up!
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="white">
                Participating in this event?
              </Text>
              <Text fontSize="sm" color="gray.400">
                Be sure to complete these steps so you can access your team page so you do things
                like visit inns, trade keys for rewards, and more!
              </Text>
            </VStack>

            {/* Checklist */}
            <VStack spacing={2} align="stretch">
              <ChecklistItem
                done={isLoggedIn}
                label={isLoggedIn ? `Signed in as ${user.username}` : 'Sign in to your account'}
                description={!isLoggedIn ? 'Create or log in to your Bingo Hub account' : undefined}
              />
              <ChecklistItem
                done={hasDiscord}
                disabled={!isLoggedIn}
                label="Link your Discord account"
                description={
                  !isLoggedIn
                    ? 'Sign in first'
                    : !hasDiscord
                    ? 'Required to view your team page and access event features'
                    : undefined
                }
              />
            </VStack>

            {/* CTA */}
            <VStack spacing={2}>
              {!isLoggedIn && (
                <Button w="full" colorScheme="blue" size="lg" onClick={handleSignIn}>
                  Sign In
                </Button>
              )}
              {isLoggedIn && !hasDiscord && (
                <Button
                  w="full"
                  colorScheme="purple"
                  size="lg"
                  leftIcon={<Icon as={FaDiscord} />}
                  onClick={handleLinkDiscord}
                >
                  Link Discord Account
                </Button>
              )}
              <Button
                w="full"
                variant="ghost"
                size="sm"
                color="gray.500"
                _hover={{ color: 'gray.300' }}
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
