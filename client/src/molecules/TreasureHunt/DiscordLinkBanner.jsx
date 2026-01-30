// components/molecules/TreasureHunt/DiscordLinkBanner.jsx
import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  VStack,
  Text,
  Icon,
  CloseButton,
  Box,
  useDisclosure,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';

const DiscordLinkBanner = ({ onDismiss }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  // Don't show if user has Discord linked or if dismissed
  if (!user || user.discordUserId || !isOpen) {
    return null;
  }

  const handleLinkDiscord = () => {
    navigate(`/user/${user.id}`);
  };

  const handleDismiss = () => {
    onClose();
    if (onDismiss) onDismiss();
  };

  return (
    <Alert
      status="warning"
      variant="solid"
      bg="linear-gradient(135deg, #5865F2 0%, #7289DA 100%)"
      borderRadius="md"
      mb={4}
      position="relative"
      maxW="1200px"
    >
      <HStack spacing={3} flex={1} align="start">
        <Icon as={FaDiscord} boxSize={6} color="white" mt={1} />
        <VStack align="start" spacing={1} flex={1}>
          <AlertTitle color="white" fontWeight="bold" fontSize="md">
            Link Your Discord for Full Access
          </AlertTitle>
          <AlertDescription color="whiteAlpha.900" fontSize="sm">
            <Text>Link your Discord account to unlock all team features:</Text>
            <HStack spacing={4} mt={2} flexWrap="wrap">
              <Text fontSize="xs">✓ Use buffs on objectives</Text>
              <Text fontSize="xs">✓ Purchase from Inns</Text>
              <Text fontSize="xs">✓ Submit via Discord bot</Text>
            </HStack>
          </AlertDescription>
          <Button
            size="sm"
            mt={2}
            colorScheme="whiteAlpha"
            bg="white"
            color="#5865F2"
            _hover={{ bg: 'whiteAlpha.900' }}
            leftIcon={<FaDiscord />}
            rightIcon={<ExternalLinkIcon />}
            onClick={handleLinkDiscord}
          >
            Link Discord Now
          </Button>
        </VStack>
      </HStack>
      <CloseButton position="absolute" right={2} top={2} color="white" onClick={handleDismiss} />
    </Alert>
  );
};

export default DiscordLinkBanner;
