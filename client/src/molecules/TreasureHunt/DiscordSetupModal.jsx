import React, { useState } from 'react';
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
  Box,
  Code,
  Badge,
  Checkbox,
  Divider,
  OrderedList,
  ListItem,
  Icon,
  Button,
  Link,
  Input,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import { InfoIcon, ExternalLinkIcon, CheckCircleIcon, CopyIcon } from '@chakra-ui/icons';
import { useLazyQuery, useMutation, gql } from '@apollo/client';
import theme from '../../theme';
import { useToastContext } from '../../providers/ToastProvider';

const VERIFY_DISCORD_GUILD = gql`
  query VerifyDiscordGuild($guildId: String!) {
    verifyDiscordGuild(guildId: $guildId) {
      success
      guildName
      error
    }
  }
`;

const CONFIRM_DISCORD_SETUP = gql`
  mutation ConfirmDiscordSetup($eventId: ID!, $guildId: String!) {
    confirmDiscordSetup(eventId: $eventId, guildId: $guildId) {
      success
      guildId
    }
  }
`;

const DiscordSetupModal = ({ isOpen, onClose, eventId, onConfirmed, eventStatus }) => {
  const isLive = eventStatus === 'PUBLIC' || eventStatus === 'COMPLETED';
  const botInstallUrl = process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL;
  const [guildId, setGuildId] = useState('');
  const [verifyState, setVerifyState] = useState('idle'); // idle | loading | success | error
  const [verifiedGuildName, setVerifiedGuildName] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [channelsAcknowledged, setChannelsAcknowledged] = useState(false);

  const [verifyGuild] = useLazyQuery(VERIFY_DISCORD_GUILD, { fetchPolicy: 'network-only' });
  const [confirmSetup, { loading: confirming }] = useMutation(CONFIRM_DISCORD_SETUP);

  const { showToast } = useToastContext();

  const handleVerify = async () => {
    if (!guildId.trim()) return;
    setVerifyState('loading');
    setErrorMsg(null);

    try {
      const { data } = await verifyGuild({ variables: { guildId: guildId.trim() } });
      if (data?.verifyDiscordGuild?.success) {
        setVerifyState('success');
        setVerifiedGuildName(data.verifyDiscordGuild.guildName);
      } else {
        setVerifyState('error');
        setErrorMsg(data?.verifyDiscordGuild?.error || 'Bot not found in that server');
      }
      document.getElementById('channel-setup')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      setVerifyState('error');
      setErrorMsg('Something went wrong. Try again.');
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmSetup({ variables: { eventId, guildId: guildId.trim() } });
      onConfirmed?.();
      onClose();
    } catch (e) {
      setVerifyState('error');
      setErrorMsg(e.message);
    }
  };

  const scrollbarStyles = {
    '&::-webkit-scrollbar': { width: '8px' },
    '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
    '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '10px' },
    scrollbarWidth: 'thin',
    scrollbarColor: '#4A5568 transparent',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.700" color="white" maxH="90vh">
        <ModalHeader textAlign="center" color="white">
          <HStack justify="center">
            <Icon as={InfoIcon} color={theme.colors.purple[300]} />
            <Text>{isLive ? 'Discord Reference' : 'Discord Bot Setup Guide'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody pb={6} css={scrollbarStyles}>
          <VStack spacing={4} align="stretch">
            {!isLive && (
              <>
                {/* Overview */}
                <Box>
                  <Text fontWeight="semibold" color="white" mb={2}>
                    📱 Overview
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    The Discord bot lets your teams interact with Gielinor Rush directly from Discord.
                    Teams can view progress, check nodes, submit completions, and view the leaderboard
                    all without leaving your server!
                  </Text>
                </Box>

                <Divider borderColor="gray.600" />

                {/* Step 0: Install Bot */}
                <Box>
                  <HStack mb={2}>
                    <Badge colorScheme="purple" fontSize="sm">
                      Step 0
                    </Badge>
                    <Text fontWeight="semibold" color="white">
                      Install the Bot
                    </Text>
                  </HStack>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color="gray.300">
                      Add the Gielinor Rush bot to your Discord server.
                    </Text>
                    <Box p={3} bg="gray.800" borderRadius="md">
                      <Button
                        as={Link}
                        href={botInstallUrl}
                        isExternal
                        colorScheme={process.env.NODE_ENV === 'production' ? 'green' : 'yellow'}
                        size="sm"
                        rightIcon={<ExternalLinkIcon />}
                        _hover={{ textDecoration: 'none' }}
                        w="100%"
                      >
                        Add Bot to Discord Server
                      </Button>
                    </Box>
                    <Text fontSize="xs" color="gray.400">
                      You'll need "Manage Server" permissions to add the bot.
                    </Text>
                  </VStack>
                </Box>

                <Divider borderColor="gray.600" />

                {/* Step 1: Verify Guild */}
                <Box>
                  <HStack mb={2}>
                    <Badge colorScheme="purple" fontSize="sm">
                      Step 1
                    </Badge>
                    <Text fontWeight="semibold" color="white">
                      Verify Bot Connection
                    </Text>
                  </HStack>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color="gray.300">
                      Paste your Discord Server ID below to confirm the bot was added successfully.
                    </Text>
                    <Box
                      p={2}
                      bg="yellow.900"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="yellow.700"
                    >
                      <Text fontSize="xs" color="yellow.200">
                        ⚠️ Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then
                        right-click your server icon → Copy Server ID
                      </Text>
                    </Box>

                    <InputGroup size="md">
                      <Input
                        placeholder="i.e. 123456789012345678"
                        value={guildId}
                        onChange={(e) => {
                          setGuildId(e.target.value);
                          setVerifyState('idle');
                        }}
                        bg="gray.800"
                        border="1px solid"
                        borderColor={
                          verifyState === 'success'
                            ? 'green.400'
                            : verifyState === 'error'
                            ? 'red.400'
                            : 'gray.600'
                        }
                        color="white"
                        _placeholder={{ color: 'gray.500' }}
                        isDisabled={verifyState === 'success'}
                      />
                      <InputRightElement width="5.5rem">
                        {verifyState === 'success' ? (
                          <Icon as={CheckCircleIcon} color="green.400" />
                        ) : (
                          <Button
                            h="1.75rem"
                            size="sm"
                            mr={1}
                            colorScheme="purple"
                            isDisabled={!guildId.trim() || verifyState === 'loading'}
                            onClick={handleVerify}
                          >
                            {verifyState === 'loading' ? <Spinner size="xs" /> : 'Verify'}
                          </Button>
                        )}
                      </InputRightElement>
                    </InputGroup>
                    <Box minH="72px" mt={2}>
                      {verifyState === 'success' && (
                        <Alert
                          status="success"
                          borderRadius="md"
                          display="inline-flex"
                          bg="green.800"
                          fontSize="sm"
                          flexDirection="column"
                          alignItems="start"
                        >
                          <HStack mb={1}>
                            <AlertIcon color="green.400" />
                            <Text>
                              Bot detected in{' '}
                              <span style={{ fontWeight: 'bold', color: theme.colors.green[400] }}>
                                {verifiedGuildName}
                              </span>
                              !
                            </Text>
                          </HStack>
                          Yeehaw! Don't forget to add the bot to your event channels and set the correct
                          topic. See steps below.
                        </Alert>
                      )}
                      {verifyState === 'error' && (
                        <Alert status="error" borderRadius="md" bg="red.900" fontSize="sm">
                          <AlertIcon color="red.400" />
                          {errorMsg} — double check the ID and that the bot was added.
                        </Alert>
                      )}
                    </Box>
                  </VStack>
                </Box>

                <Divider borderColor="gray.600" />
              </>
            )}

            {/* Step 2: Create Channels */}
            <Box id="channel-setup">
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 2
                </Badge>
                <Text fontWeight="semibold" color="white">
                  Create Event Channels
                </Text>
              </HStack>
              <OrderedList spacing={2} fontSize="sm" color="gray.300">
                <ListItem>
                  Create a text channel for each team (i.e.,{' '}
                  <Code bg="gray.800" color="gray.100">
                    #team-dragons
                  </Code>
                  )
                </ListItem>
                <ListItem>Add the bot to each channel</ListItem>
                <ListItem flexDirection="row" display="flex">
                  Set each channel's topic to your Event ID:{' '}
                  <Tooltip label={`Click to copy the event ID`} w="fit-content" hasArrow>
                    <HStack
                      spacing={2}
                      px={3}
                      py={1}
                      ml={2}
                      bg="whiteAlpha.200"
                      borderRadius="md"
                      cursor="pointer"
                      transition="all 0.2s"
                      w="fit-content"
                      _hover={{ bg: 'whiteAlpha.400' }}
                      onClick={() => {
                        navigator.clipboard.writeText(eventId);
                        showToast('Event ID copied to clipboard!', 'success');
                      }}
                    >
                      <Text
                        fontSize="xs"
                        color="gray.200"
                        fontFamily="mono"
                        maxW="260px"
                        isTruncated
                      >
                        {eventId}
                      </Text>
                      <Icon as={CopyIcon} boxSize={3} color="gray.200" />
                    </HStack>
                  </Tooltip>
                </ListItem>
                <ListItem>
                  Add all players to their respective team channels and ensure they can send
                  messages there. The bot uses the presence of specific Discord user IDs to
                  determine which team a player belongs to.
                </ListItem>
              </OrderedList>
              <Box
                mt={2}
                p={2}
                bg="teal.900"
                borderRadius="md"
                borderWidth="1px"
                borderColor="teal.700"
              >
                <Text fontSize="xs" color="teal.100" fontWeight="semibold">
                  💡 The same Event ID goes in every team channel's topic and the bot figures out
                  which team is which based on team membership.
                </Text>
              </Box>
              {!isLive && (
                <Checkbox
                  mt={4}
                  colorScheme="purple"
                  isChecked={channelsAcknowledged}
                  onChange={(e) => setChannelsAcknowledged(e.target.checked)}
                >
                  <Text fontSize="sm" color="yellow.200" fontWeight="semibold">
                    I understand that channels must be set up before launching. The bot will NOT work
                    without them.
                  </Text>
                </Checkbox>
              )}
            </Box>

            <Divider borderColor="gray.600" />

            {/* Commands */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Commands
                </Badge>
                <Text fontWeight="semibold" color="white">
                  Available Commands
                </Text>
              </HStack>
              <VStack align="stretch" spacing={2}>
                {[
                  {
                    cmd: '!nodes',
                    color: 'teal.300',
                    desc: "View your team's available nodes and progress",
                  },
                  {
                    cmd: '!submit <node_id>',
                    color: 'orange.300',
                    desc: 'Submit a node completion with proof screenshot',
                  },
                  {
                    cmd: '!leaderboard',
                    color: 'teal.300',
                    desc: 'View current standings',
                    alias: '!lb',
                  },
                  {
                    cmd: '!treasurehunt',
                    color: 'purple.300',
                    desc: 'Show all commands and help',
                    alias: '!th',
                  },
                ].map(({ cmd, color, desc, alias }) => (
                  <Box key={cmd} p={2} bg="gray.800" borderRadius="md">
                    <HStack>
                      <Code bg="transparent" color={color}>
                        {cmd}
                      </Code>
                      {alias && (
                        <>
                          <Text color="gray.500" fontSize="sm">
                            or
                          </Text>
                          <Code bg="transparent" color={color}>
                            {alias}
                          </Code>
                        </>
                      )}
                    </HStack>
                    <Text fontSize="xs" mt={1} color="gray.400">
                      {desc}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Divider borderColor="gray.600" />

            {isLive ? (
              <Button colorScheme="purple" size="lg" width="100%" onClick={onClose}>
                Got it
              </Button>
            ) : (
              <Button
                colorScheme="green"
                size="lg"
                width="100%"
                isDisabled={verifyState !== 'success' || !channelsAcknowledged}
                isLoading={confirming}
                onClick={handleConfirm}
                leftIcon={<CheckCircleIcon />}
              >
                {verifyState === 'success' ? 'Confirm Setup' : 'Verify connection above to continue'}
              </Button>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DiscordSetupModal;
