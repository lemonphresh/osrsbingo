import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Badge,
  Box,
  Link,
} from '@chakra-ui/react';
import { CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CONFIRM_GROUP_DASHBOARD_DISCORD } from '../../graphql/groupDashboardOperations';

export default function GroupDiscordSetup({ dashboard }) {
  const discordConfig = dashboard?.discordConfig ?? {};
  const [guildId, setGuildId] = useState(discordConfig.guildId ?? '');
  const [channelId, setChannelId] = useState(discordConfig.channelId ?? '');
  const [guildName, setGuildName] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [verifyingGuild, setVerifyingGuild] = useState(false);
  const [verifyingChannel, setVerifyingChannel] = useState(false);
  const [guildError, setGuildError] = useState(null);
  const [channelError, setChannelError] = useState(null);

  const [confirmDiscord, { loading: confirming }] = useMutation(CONFIRM_GROUP_DASHBOARD_DISCORD);

  async function verifyGuild() {
    setGuildError(null);
    setGuildName(null);
    if (!/^\d{17,19}$/.test(guildId)) {
      setGuildError('Invalid Discord server ID (17-19 digits)');
      return;
    }
    setVerifyingGuild(true);
    try {
      const res = await fetch(`/discguild/${guildId}`);
      const data = await res.json();
      if (!res.ok) {
        setGuildError(data.error ?? 'Server not found');
        return;
      }
      setGuildName(data.name);
    } catch {
      setGuildError('Failed to verify server');
    } finally {
      setVerifyingGuild(false);
    }
  }

  async function verifyChannel() {
    setChannelError(null);
    setChannelName(null);
    if (!/^\d{17,19}$/.test(channelId)) {
      setChannelError('Invalid channel ID (17-19 digits)');
      return;
    }
    setVerifyingChannel(true);
    try {
      const res = await fetch(`/discchannel/${channelId}`);
      const data = await res.json();
      if (!res.ok) {
        setChannelError(data.error ?? 'Channel not found');
        return;
      }
      setChannelName(data.name);
    } catch {
      setChannelError('Failed to verify channel');
    } finally {
      setVerifyingChannel(false);
    }
  }

  async function handleConfirm() {
    await confirmDiscord({ variables: { id: dashboard.id, guildId, channelId } });
  }

  const botInstallUrl = process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL;

  const isConfirmed =
    discordConfig.confirmed &&
    discordConfig.guildId === guildId &&
    discordConfig.channelId === channelId;

  return (
    <VStack spacing={5} align="stretch">
      {isConfirmed && (
        <HStack bg="green.900" borderRadius="md" p={3} spacing={2}>
          <CheckIcon color="green.300" />
          <Text fontSize="sm" color="green.300">
            Discord notifications are active
          </Text>
        </HStack>
      )}

      <Box bg="gray.750" border="1px solid" borderColor="gray.600" borderRadius="md" p={4}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.300"
          mb={3}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          What gets posted
        </Text>
        <VStack spacing={2} align="stretch">
          {[
            { emoji: '🏁', label: 'Event started', desc: 'Posted when a new event goes live.' },
            {
              emoji: '📊',
              label: '25% / 50% reached',
              desc: 'Group total goals only. Posted as your group crosses each threshold.',
            },
            { emoji: '🔥', label: '75% reached', desc: 'Group total goals only.' },
            {
              emoji: '🎉',
              label: 'Goal complete (100%)',
              desc: 'Group total goals only. Includes a top contributors list.',
            },
            {
              emoji: '🏆',
              label: 'Event ended',
              desc: 'Posted when the event window closes. If the event had individual target goals, includes a summary of how many members completed each one.',
            },
          ].map(({ emoji, label, desc }) => (
            <HStack key={label} spacing={3} align="flex-start">
              <Text fontSize="md" lineHeight="1" mt="1px" flexShrink={0}>
                {emoji}
              </Text>
              <Box>
                <Text fontSize="sm" color="gray.200" fontWeight="medium">
                  {label}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {desc}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
        <Text
          fontSize="xs"
          color="gray.500"
          mt={3}
          pt={3}
          borderTop="1px solid"
          borderColor="gray.700"
        >
          Individual target goals don't get mid-event milestone posts. Progress is tracked per
          member on the dashboard, with a completion summary when the event ends.
        </Text>
      </Box>

      <Text fontSize="sm" color="gray.400">
        Make sure the OSRS Bingo Hub bot is in your server before confirming.
      </Text>

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

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">
          Discord Server ID
        </FormLabel>
        <HStack>
          <Input
            value={guildId}
            onChange={(e) => {
              setGuildId(e.target.value);
              setGuildName(null);
            }}
            placeholder="i.e. 123456789012345678"
            bg="gray.800"
            borderColor="gray.600"
            fontFamily="mono"
          />
          <Button
            size="sm"
            colorScheme="purple"
            variant="outline"
            onClick={verifyGuild}
            isLoading={verifyingGuild}
            isDisabled={!guildId}
            flexShrink={0}
          >
            Verify
          </Button>
        </HStack>
        {guildName && (
          <HStack mt={1} spacing={1}>
            <CheckIcon color="green.400" boxSize={3} />
            <Text fontSize="xs" color="green.400">
              {guildName}
            </Text>
          </HStack>
        )}
        {guildError && (
          <Text fontSize="xs" color="red.400" mt={1}>
            {guildError}
          </Text>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">
          Announcements Channel ID
        </FormLabel>
        <HStack>
          <Input
            value={channelId}
            onChange={(e) => {
              setChannelId(e.target.value);
              setChannelName(null);
            }}
            placeholder="i.e. 987654321098765432"
            bg="gray.800"
            borderColor="gray.600"
            fontFamily="mono"
          />
          <Button
            size="sm"
            colorScheme="purple"
            variant="outline"
            onClick={verifyChannel}
            isLoading={verifyingChannel}
            isDisabled={!channelId}
            flexShrink={0}
          >
            Verify
          </Button>
        </HStack>
        {channelName && (
          <HStack mt={1} spacing={1}>
            <CheckIcon color="green.400" boxSize={3} />
            <Text fontSize="xs" color="green.400">
              #{channelName}
            </Text>
          </HStack>
        )}
        {channelError && (
          <Text fontSize="xs" color="red.400" mt={1}>
            {channelError}
          </Text>
        )}
      </FormControl>

      <Box>
        <Button
          colorScheme="purple"
          size="sm"
          onClick={handleConfirm}
          isLoading={confirming}
          isDisabled={!guildName || !channelName}
        >
          {isConfirmed ? 'Update Discord Setup' : 'Confirm Discord Setup'}
        </Button>
        <Text fontSize="xs" color="gray.500" mt={2}>
          You must verify the server before confirming.
        </Text>
      </Box>
    </VStack>
  );
}
