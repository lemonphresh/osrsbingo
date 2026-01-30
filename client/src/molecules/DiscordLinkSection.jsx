// components/molecules/DiscordLinkSection.jsx
import React, { useEffect, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Avatar,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Icon,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import { useMutation } from '@apollo/client';
import { UNLINK_DISCORD_ACCOUNT } from '../graphql/mutations';
import theme from '../theme';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

const DiscordLinkSection = ({ user, shownUser, setUser, setShownUser, showToast }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkStatus, setLinkStatus] = useState(null); // 'success' | 'error' | null

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordLinked = params.get('discord_linked');
    const discordError = params.get('discord_error');
    const discordUsername = params.get('discord_username');
    const linkedTo = params.get('linked_to');

    if (discordLinked === 'true') {
      setLinkStatus('success');
      showToast(`Discord linked successfully as ${discordUsername}!`, 'success');
      // Update local state with new Discord info
      if (discordUsername) {
        setShownUser((prev) => ({ ...prev, discordUsername }));
        setUser((prev) => ({ ...prev, discordUsername }));
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (discordError) {
      setLinkStatus('error');
      let errorMsg = 'Failed to link Discord account';
      if (discordError === 'already_linked') {
        errorMsg = `This Discord account is already linked to ${linkedTo || 'another user'}`;
      } else if (discordError === 'auth_failed') {
        errorMsg = 'Discord authentication failed. Please try again.';
      }
      showToast(errorMsg, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showToast, setShownUser, setUser]);

  const [unlinkDiscord, { loading: unlinkingDiscord }] = useMutation(UNLINK_DISCORD_ACCOUNT, {
    onCompleted: () => {
      setUser({ ...user, discordUserId: null, discordUsername: null, discordAvatar: null });
      setShownUser({
        ...shownUser,
        discordUserId: null,
        discordUsername: null,
        discordAvatar: null,
      });
      showToast('Discord account unlinked', 'info');
    },
    onError: (error) => {
      showToast(`Error unlinking Discord: ${error.message}`, 'error');
    },
  });

  const handleLinkDiscord = async () => {
    setIsLinking(true);
    try {
      const response = await fetch(`${API_BASE}/api/discord/auth-url?userId=${user.id}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error) {
      showToast('Failed to start Discord linking process', 'error');
      setIsLinking(false);
    }
  };

  const handleUnlinkDiscord = () => {
    unlinkDiscord({ variables: { userId: user.id } });
  };

  const getDiscordAvatarUrl = () => {
    if (shownUser?.discordAvatar && shownUser?.discordUserId) {
      return `https://cdn.discordapp.com/avatars/${shownUser.discordUserId}/${shownUser.discordAvatar}.png`;
    }
    return null;
  };

  const isLinked = !!shownUser?.discordUserId;
  const isVerified = isLinked && !!shownUser?.discordUsername;
  const hasManualLinkOnly = isLinked && !shownUser?.discordUsername;

  return (
    <>
      <Divider my={3} />
      <VStack width="100%" spacing={3} py={2}>
        <HStack width="100%" justify="space-between">
          <HStack>
            <Icon as={FaDiscord} color={theme.colors.teal[200]} boxSize={5} />
            <Text color={theme.colors.teal[200]} fontWeight="bold">
              Discord
            </Text>
            {isVerified ? (
              <Badge colorScheme="green" fontSize="sm">
                <HStack spacing={1}>
                  <CheckCircleIcon boxSize={3} />
                  <Text>Verified</Text>
                </HStack>
              </Badge>
            ) : hasManualLinkOnly ? (
              <Badge colorScheme="yellow" fontSize="sm">
                <HStack spacing={1}>
                  <WarningIcon boxSize={3} />
                  <Text>Not Verified</Text>
                </HStack>
              </Badge>
            ) : (
              <Badge colorScheme="gray" fontSize="sm">
                Not linked
              </Badge>
            )}
          </HStack>
        </HStack>

        {linkStatus === 'success' && (
          <Alert color="gray.700" status="success" borderRadius="md" mb={2}>
            <AlertIcon />
            <AlertDescription fontSize="sm">Discord account linked successfully!</AlertDescription>
          </Alert>
        )}

        {linkStatus === 'error' && (
          <Alert status="error" borderRadius="md" mb={2}>
            <AlertIcon />
            <AlertDescription fontSize="sm">
              Failed to link Discord. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Fully verified via OAuth */}
        {isVerified && (
          <Box
            width="100%"
            p={3}
            bg="rgba(202, 207, 255, 0.1)"
            borderRadius="md"
            borderWidth="1px"
            borderColor="rgba(194, 199, 255, 0.3)"
          >
            <HStack spacing={3}>
              <Avatar
                size="sm"
                src={getDiscordAvatarUrl()}
                name={shownUser.discordUsername}
                bg={shownUser.discordAvatar ? 'transparent' : '#5865F2'}
              />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontWeight="bold" color="white" fontSize="sm">
                  {shownUser.discordUsername}
                </Text>
                <Text fontSize="xs" color="gray.300">
                  ID: {shownUser.discordUserId}
                </Text>
              </VStack>
              <Button
                size="sm"
                colorScheme="white"
                variant="outline"
                onClick={handleUnlinkDiscord}
                isLoading={unlinkingDiscord}
              >
                Unlink
              </Button>
            </HStack>
          </Box>
        )}

        {/* Manual link only - prompt to verify */}
        {hasManualLinkOnly && (
          <VStack width="100%" spacing={3}>
            <Box
              width="100%"
              p={3}
              bg="rgba(236, 201, 75, 0.1)"
              borderRadius="md"
              borderWidth="1px"
              borderColor="rgba(236, 201, 75, 0.3)"
            >
              <HStack spacing={3}>
                <Avatar size="sm" bg="#5865F2" />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold" color="white" fontSize="sm">
                    Discord ID Linked
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    ID: {shownUser.discordUserId}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Alert status="warning" borderRadius="md" size="sm">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm" color="gray.700">
                  Verify Your Discord
                </AlertTitle>
                <AlertDescription fontSize="xs" color="gray.600">
                  Your Discord ID was added manually. Verify with OAuth to confirm ownership and
                  display your username and avatar.
                </AlertDescription>
              </Box>
            </Alert>

            <Button
              leftIcon={<FaDiscord />}
              colorScheme="yellow"
              width="100%"
              onClick={handleLinkDiscord}
              isLoading={isLinking}
              loadingText="Redirecting to Discord..."
              rightIcon={<ExternalLinkIcon />}
            >
              Verify with Discord
            </Button>

            <Button
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={handleUnlinkDiscord}
              isLoading={unlinkingDiscord}
            >
              Remove Discord Link
            </Button>
          </VStack>
        )}

        {/* Not linked at all */}
        {!isLinked && (
          <VStack width="100%" spacing={3}>
            <Alert color="gray.700" status="info" borderRadius="md" size="sm">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm">Why link Discord?</AlertTitle>
                <AlertDescription fontSize="xs">
                  Link your Discord to use bot commands, participate in Gielinor Rush events, and
                  verify your identity for team actions.
                </AlertDescription>
              </Box>
            </Alert>

            <Button
              leftIcon={<FaDiscord />}
              colorScheme="purple"
              bg="#5865F2"
              _hover={{ bg: '#4752C4' }}
              width="100%"
              onClick={handleLinkDiscord}
              isLoading={isLinking}
              loadingText="Redirecting to Discord..."
              rightIcon={<ExternalLinkIcon />}
            >
              Link with Discord
            </Button>
          </VStack>
        )}

        <Text fontSize="xs" color="gray.300" textAlign="center">
          We only access your Discord username and ID. We never post on your behalf.
        </Text>
      </VStack>
    </>
  );
};

export default DiscordLinkSection;
