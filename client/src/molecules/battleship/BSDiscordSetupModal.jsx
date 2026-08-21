import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Code,
  Badge,
  Checkbox,
  Divider,
  Button,
  Link,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { CheckCircleIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useLazyQuery, useMutation } from '@apollo/client';
import { VERIFY_DISCORD_GUILD, UPDATE_BS_EVENT } from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';

const NAVY = '#071523';
const CARD = '#0d2137';
const BORDER = '#1e4976';
const CYAN = '#0ea5e9';
const DIM = '#94a3b8';
const BODY = '#cbd5e1';

function StepBadge({ n }) {
  return (
    <Badge
      fontFamily="mono"
      fontSize="10px"
      letterSpacing="wider"
      flexShrink={0}
      mt={0.5}
      bg="#0c2d4a"
      color={CYAN}
      border="1px solid"
      borderColor={BORDER}
    >
      Step {n}
    </Badge>
  );
}

function SectionLabel({ children }) {
  return (
    <Text
      fontSize="10px"
      fontWeight="bold"
      color={DIM}
      letterSpacing="widest"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

function CmdRow({ cmd, desc, color = CYAN }) {
  return (
    <Box p={2} bg={NAVY} borderRadius="md" border="1px solid" borderColor={BORDER}>
      <Code bg="transparent" color={color} fontFamily="mono" fontSize="sm">
        {cmd}
      </Code>
      <Text fontSize="xs" mt={1} color={DIM}>
        {desc}
      </Text>
    </Box>
  );
}

export default function BSDiscordSetupModal({ isOpen, onClose, eventId, onConfirmed }) {
  const botInstallUrl = process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL;
  const [guildId, setGuildId] = useState('');
  const [verifyState, setVerifyState] = useState('idle'); // idle | loading | success | error
  const [verifiedGuildName, setVerifiedGuildName] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [channelsAcknowledged, setChannelsAcknowledged] = useState(false);

  const { showToast } = useToastContext();

  const [verifyGuild] = useLazyQuery(VERIFY_DISCORD_GUILD, { fetchPolicy: 'network-only' });
  const [updateBSEvent, { loading: confirming }] = useMutation(UPDATE_BS_EVENT);

  const handleVerify = async () => {
    if (!guildId.trim()) return;
    setVerifyState('loading');
    setErrorMsg(null);
    try {
      const { data } = await verifyGuild({ variables: { guildId: guildId.trim() } });
      if (data?.verifyDiscordGuild?.success) {
        setVerifyState('success');
        setVerifiedGuildName(data.verifyDiscordGuild.guildName);
        document.getElementById('bs-channel-setup')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setVerifyState('error');
        setErrorMsg(data?.verifyDiscordGuild?.error || 'Bot not found in that server');
      }
    } catch {
      setVerifyState('error');
      setErrorMsg('Something went wrong. Try again.');
    }
  };

  const handleConfirm = async () => {
    try {
      await updateBSEvent({ variables: { eventId, input: { guildId: guildId.trim() } } });
      onConfirmed?.();
      onClose();
    } catch (e) {
      showToast(e.message ?? 'Failed to save Discord setup.', 'error');
    }
  };

  const handleSkip = () => {
    onConfirmed?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} size="xl" scrollBehavior="inside" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.800" />
      <ModalContent bg={CARD} border="1px solid" borderColor={BORDER} maxH="90vh" overflow="hidden">
        {/* Hero */}
        <Box position="relative" px={6} pt={6} pb={5} overflow="hidden">
          <Box
            position="absolute"
            inset={0}
            opacity={0.04}
            pointerEvents="none"
            backgroundImage={`repeating-linear-gradient(0deg, ${CYAN} 0px, ${CYAN} 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, ${CYAN} 0px, ${CYAN} 1px, transparent 1px, transparent 40px)`}
          />
          <Box position="absolute" bottom={0} left={0} right={0} h="1px" bg={BORDER} />
          <VStack align="flex-start" spacing={1} position="relative" zIndex={1}>
            <Text
              fontFamily="mono"
              fontSize={['md', 'lg']}
              fontWeight="bold"
              color="#e2e8f0"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Discord Bot Setup
            </Text>
            <Text fontFamily="mono" fontSize="xs" color={DIM} letterSpacing="wide">
              Connect your Discord server so teams can submit tasks with the bot.
            </Text>
            <HStack spacing={2} pt={1}>
              <Box w="24px" h="1px" bg={CYAN} />
              <Box w="8px" h="1px" bg={BORDER} />
            </HStack>
          </VStack>
        </Box>
        <ModalCloseButton color={DIM} _hover={{ color: '#e2e8f0' }} onClick={handleSkip} />

        <ModalBody
          overflowY="auto"
          px={6}
          py={5}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: BORDER, borderRadius: '10px' },
            scrollbarWidth: 'thin',
            scrollbarColor: `${BORDER} transparent`,
          }}
        >
          <VStack align="stretch" spacing={5} fontFamily="mono">
            {/* Step 0 — Install bot */}
            <Box>
              <HStack mb={3} spacing={2}>
                <StepBadge n={0} />
                <Text fontWeight="semibold" color="#e2e8f0" fontSize="sm">
                  Install the Bot
                </Text>
              </HStack>
              <Text fontSize="sm" color={BODY} mb={3} lineHeight="1.7">
                Add the bot to your Discord server. You'll need Manage Server permissions.
              </Text>
              <Button
                as={Link}
                href={botInstallUrl}
                isExternal
                size="sm"
                w="full"
                bg={CYAN}
                color={NAVY}
                fontFamily="mono"
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="widest"
                textTransform="uppercase"
                rightIcon={<ExternalLinkIcon />}
                _hover={{ bg: '#38bdf8', textDecoration: 'none' }}
              >
                Add Bot to Discord
              </Button>
            </Box>

            <Divider borderColor={BORDER} />

            {/* Step 1 — Verify guild */}
            <Box>
              <HStack mb={3} spacing={2}>
                <StepBadge n={1} />
                <Text fontWeight="semibold" color="#e2e8f0" fontSize="sm">
                  Verify Bot Connection
                </Text>
              </HStack>
              <Text fontSize="sm" color={BODY} mb={3} lineHeight="1.7">
                Paste your Discord Server ID to confirm the bot was added.
              </Text>
              <Box
                p={2}
                bg="#1a1a00"
                borderRadius="md"
                border="1px solid"
                borderColor="#3d3800"
                mb={3}
              >
                <Text fontSize="xs" color="#fcd34d">
                  Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then
                  right-click your server icon → Copy Server ID.
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
                  bg={NAVY}
                  border="1px solid"
                  borderColor={
                    verifyState === 'success'
                      ? '#22c55e'
                      : verifyState === 'error'
                      ? '#ef4444'
                      : BORDER
                  }
                  color="#e2e8f0"
                  fontFamily="mono"
                  fontSize="sm"
                  _placeholder={{ color: '#475569' }}
                  _focus={{ borderColor: CYAN, boxShadow: 'none' }}
                  isDisabled={verifyState === 'success'}
                />
                <InputRightElement width="5.5rem">
                  {verifyState === 'success' ? (
                    <Icon as={CheckCircleIcon} color="#22c55e" />
                  ) : (
                    <Button
                      h="1.75rem"
                      size="sm"
                      mr={1}
                      bg={CYAN}
                      color={NAVY}
                      fontFamily="mono"
                      fontSize="xs"
                      fontWeight="bold"
                      _hover={{ bg: '#38bdf8' }}
                      isDisabled={!guildId.trim() || verifyState === 'loading'}
                      onClick={handleVerify}
                    >
                      {verifyState === 'loading' ? <Spinner size="xs" /> : 'Verify'}
                    </Button>
                  )}
                </InputRightElement>
              </InputGroup>

              {verifyState === 'success' && (
                <Box
                  mt={2}
                  p={2}
                  bg="#052e16"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="#14532d"
                >
                  <Text fontSize="sm" color="#4ade80">
                    Bot detected in{' '}
                    <Text as="span" fontWeight="bold">
                      {verifiedGuildName}
                    </Text>
                    ! Set up your team channels below.
                  </Text>
                </Box>
              )}
              {verifyState === 'error' && (
                <Box
                  mt={2}
                  p={2}
                  bg="#1c0a0a"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="#7f1d1d"
                >
                  <Text fontSize="sm" color="#f87171">
                    {errorMsg}. Double check the ID and that the bot was added.
                  </Text>
                </Box>
              )}
            </Box>

            <Divider borderColor={BORDER} />

            {/* Step 2 — Per-team channel setup */}
            <Box id="bs-channel-setup">
              <HStack mb={3} spacing={2}>
                <StepBadge n={2} />
                <Text fontWeight="semibold" color="#e2e8f0" fontSize="sm">
                  Set Up Team Channels
                </Text>
              </HStack>
              <VStack align="stretch" spacing={2} fontSize="sm" color={BODY} mb={3}>
                <Text lineHeight="1.7">
                  1. Create a text channel for each team (i.e.{' '}
                  <Code bg={NAVY} color="#94a3b8">
                    #team-kraken
                  </Code>
                  )
                </Text>
                <Text lineHeight="1.7">
                  2. Add the bot to each channel and make sure team members can send messages there
                </Text>
                <Text lineHeight="1.7">
                  3. Once your teams are created, assign each team's Discord channel ID from the{' '}
                  <Text as="span" fontWeight="bold" color={CYAN}>
                    Admin page → Teams
                  </Text>
                </Text>
              </VStack>

              <Box p={3} bg="#0a1e33" borderRadius="md" border="1px solid" borderColor={BORDER}>
                <Text fontSize="xs" color={CYAN} lineHeight="1.7">
                  The bot uses each team's Discord Channel ID to post task notifications and accept
                  submissions. You can also set a Role ID per team so the bot pings the right
                  people.
                </Text>
              </Box>

              <Checkbox
                mt={4}
                isChecked={channelsAcknowledged}
                onChange={(e) => setChannelsAcknowledged(e.target.checked)}
                colorScheme="cyan"
                alignItems="flex-start"
              >
                <Text fontSize="sm" color="#fcd34d">
                  I understand team channels must be configured before the ship placement phase
                  begins.
                </Text>
              </Checkbox>
            </Box>

            <Divider borderColor={BORDER} />

            {/* Commands */}
            <Box>
              <SectionLabel>Bot Commands</SectionLabel>
              <VStack align="stretch" spacing={2}>
                <CmdRow
                  cmd="!bspre"
                  desc="Record metric progress before submitting (i.e. boss KC screenshot). Required for tasks with a metric target."
                  color="#f59e0b"
                />
                <CmdRow
                  cmd="!bssubmit"
                  desc="Submit a task completion with a proof screenshot. Refs will review and approve or deny."
                  color={CYAN}
                />
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          flexDir="column"
          gap={3}
          borderTop="1px solid"
          borderColor={BORDER}
          px={6}
          py={4}
        >
          <Button
            w="full"
            isDisabled={verifyState !== 'success' || !channelsAcknowledged}
            isLoading={confirming}
            onClick={handleConfirm}
            bg={CYAN}
            color={NAVY}
            fontFamily="mono"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="widest"
            textTransform="uppercase"
            leftIcon={<CheckCircleIcon />}
            _hover={{ bg: '#38bdf8' }}
            _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
          >
            {verifyState === 'success' ? 'Save & Continue' : 'Verify connection to continue'}
          </Button>
          <Button
            w="full"
            variant="ghost"
            color={DIM}
            fontFamily="mono"
            fontSize="xs"
            letterSpacing="widest"
            _hover={{ color: '#e2e8f0', bg: 'transparent' }}
            onClick={handleSkip}
          >
            Skip for now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
