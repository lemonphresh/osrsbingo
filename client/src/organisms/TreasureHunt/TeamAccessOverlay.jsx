import React, { useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Icon,
  useColorMode,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { LockIcon, ExternalLinkIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { FaDiscord } from 'react-icons/fa';

/**
 * Overlay that prevents unauthorized users from viewing team pages
 * Shows if user is not an admin and either:
 * 1. Has no Discord ID linked
 * 2. Their Discord ID is not in the team's member list
 */
const TeamAccessOverlay = ({
  show,
  reason, // 'no_discord' | 'not_member' | 'authorized'
  eventId,
  teamName,
  userDiscordId,
}) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();

  const colors = {
    dark: {
      cardBg: '#2D3748',
      textColor: '#F7FAFC',
    },
    light: {
      cardBg: 'white',
      textColor: '#171923',
    },
  };

  const currentColors = colors[colorMode];

  useEffect(() => {
    if (show) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  const handleGoBack = () => {
    navigate(`/treasure-hunt/${eventId}`);
  };

  const handleLinkDiscord = () => {
    navigate('/');
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(36, 36, 105, 0.5)"
      backdropFilter="blur(20px)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <VStack
        spacing={6}
        maxW="500px"
        bg={currentColors.cardBg}
        p={8}
        borderRadius="xl"
        boxShadow="2xl"
        borderWidth={2}
        borderColor="red.400"
      >
        <Box
          p={4}
          bg="red.400"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={LockIcon} boxSize={8} color="white" />
        </Box>

        <Heading size="lg" color={currentColors.textColor} textAlign="center">
          Access Restricted
        </Heading>

        {reason === 'no_discord' && (
          <Alert
            status="warning"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            borderRadius="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Discord Account Required
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              To view team progress, you need to link your Discord account via your user profile.
              This ensures only team members can access sensitive information.
            </AlertDescription>
          </Alert>
        )}

        {reason === 'not_member' && (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            borderRadius="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Not a Team Member
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              You are not a member of <strong>{teamName}</strong>. Only team members and event
              admins can view this page.
              {userDiscordId && (
                <Text fontSize="xs" mt={2} color="gray.500">
                  Your Discord ID: <code>{userDiscordId}</code>
                </Text>
              )}
            </AlertDescription>
          </Alert>
        )}

        <VStack spacing={2} align="stretch" w="full">
          <Text fontSize="sm" color="gray.500" textAlign="center">
            This protection prevents teams from viewing each other's progress during the event.
          </Text>
        </VStack>

        <VStack spacing={3} w="full">
          {reason === 'no_discord' && (
            <Button
              colorScheme="purple"
              size="lg"
              w="full"
              leftIcon={<Icon as={FaDiscord} />}
              rightIcon={<ExternalLinkIcon />}
              onClick={handleLinkDiscord}
            >
              Link Discord Account
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            w="full"
            bg="gray.50"
            leftIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
          >
            Back to Event Overview
          </Button>
        </VStack>

        {/* Help Text */}
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            If you believe this is an error, contact the event organizer.
          </Text>
          {reason === 'not_member' && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Event admins can add you to the team through the admin panel.
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default TeamAccessOverlay;
