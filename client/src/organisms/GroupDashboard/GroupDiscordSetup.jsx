import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  Checkbox,
  Link,
  Divider,
} from '@chakra-ui/react';
import { CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  CONFIRM_GROUP_DASHBOARD_DISCORD,
  UPDATE_GROUP_DISCORD_NOTIFICATIONS,
} from '../../graphql/groupDashboardOperations';

const NOTIFICATION_ROWS = [
  { key: 'event_started', label: 'Event started' },
  { key: 'milestone_25', label: '25% reached' },
  { key: 'milestone_50', label: '50% reached' },
  { key: 'milestone_75', label: '75% reached' },
  { key: 'milestone_100', label: 'Goal complete (100%)' },
  { key: 'event_ended', label: 'Event ended' },
];

function initNotifState(saved) {
  const result = {};
  for (const { key } of NOTIFICATION_ROWS) {
    result[key] = {
      enabled: saved?.[key]?.enabled !== false,
      ping: saved?.[key]?.ping !== false,
    };
  }
  return result;
}

export default function GroupDiscordSetup({ dashboard }) {
  const discordConfig = dashboard?.discordConfig ?? {};
  const [guildId, setGuildId] = useState(discordConfig.guildId ?? '');
  const [channelId, setChannelId] = useState(discordConfig.channelId ?? '');
  const [roleId, setRoleId] = useState(discordConfig.roleId ?? '');
  const [guildName, setGuildName] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [verifyingGuild, setVerifyingGuild] = useState(false);
  const [verifyingChannel, setVerifyingChannel] = useState(false);
  const [guildError, setGuildError] = useState(null);
  const [channelError, setChannelError] = useState(null);

  const [notifSettings, setNotifSettings] = useState(() =>
    initNotifState(discordConfig.notifications)
  );
  const [notifSaved, setNotifSaved] = useState(false);

  const [confirmDiscord, { loading: confirming }] = useMutation(CONFIRM_GROUP_DASHBOARD_DISCORD);
  const [updateNotifications, { loading: savingNotif }] = useMutation(
    UPDATE_GROUP_DISCORD_NOTIFICATIONS
  );

  function setNotif(key, field, value) {
    setNotifSaved(false);
    setNotifSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSaveNotifications() {
    await updateNotifications({ variables: { id: dashboard.id, notifications: notifSettings } });
    setNotifSaved(true);
  }

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
    await confirmDiscord({ variables: { id: dashboard.id, guildId, channelId, roleId: roleId || null } });
  }

  const botInstallUrl = process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL;

  const isConfirmed =
    discordConfig.confirmed &&
    discordConfig.guildId === guildId &&
    discordConfig.channelId === channelId &&
    (discordConfig.roleId ?? '') === roleId;

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

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">
          Role to Tag <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal">(optional)</Text>
        </FormLabel>
        <Input
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          placeholder="i.e. 123456789012345678"
          bg="gray.800"
          borderColor="gray.600"
          fontFamily="mono"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          If set, this role will be mentioned with every milestone post.
        </Text>
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

      <Divider borderColor="gray.700" />

      <Box>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.300"
          mb={1}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Notification settings
        </Text>
        <Text fontSize="xs" color="gray.500" mb={4}>
          Control which events post to Discord and whether they ping the role.
        </Text>

        <Box
          bg="gray.750"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          overflow="hidden"
        >
          <HStack
            px={4}
            py={2}
            bg="gray.700"
            spacing={0}
            borderBottom="1px solid"
            borderColor="gray.600"
          >
            <Text fontSize="xs" color="gray.400" flex="1">
              Notification
            </Text>
            <Text fontSize="xs" color="gray.400" w="60px" textAlign="center">
              Send
            </Text>
            <Text fontSize="xs" color="gray.400" w="80px" textAlign="center">
              Ping role
            </Text>
          </HStack>
          {NOTIFICATION_ROWS.map(({ key, label }, i) => {
            const s = notifSettings[key];
            return (
              <HStack
                key={key}
                px={4}
                py={3}
                spacing={0}
                borderTop={i === 0 ? undefined : '1px solid'}
                borderColor="gray.700"
              >
                <Text fontSize="sm" color="gray.200" flex="1">
                  {label}
                </Text>
                <Box w="60px" display="flex" justifyContent="center">
                  <Checkbox
                    isChecked={s.enabled}
                    onChange={(e) => setNotif(key, 'enabled', e.target.checked)}
                  />
                </Box>
                <Box w="80px" display="flex" justifyContent="center">
                  <Checkbox
                    isChecked={s.ping}
                    isDisabled={!s.enabled}
                    onChange={(e) => setNotif(key, 'ping', e.target.checked)}
                  />
                </Box>
              </HStack>
            );
          })}
        </Box>

        <HStack mt={3} spacing={3} align="center">
          <Button
            size="sm"
            colorScheme="purple"
            onClick={handleSaveNotifications}
            isLoading={savingNotif}
          >
            Save notification settings
          </Button>
          {notifSaved && (
            <HStack spacing={1}>
              <CheckIcon color="green.400" boxSize={3} />
              <Text fontSize="xs" color="green.400">
                Saved
              </Text>
            </HStack>
          )}
        </HStack>
      </Box>
    </VStack>
  );
}
