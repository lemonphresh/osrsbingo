import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, VStack, HStack, Text, Button, Divider, Link } from '@chakra-ui/react';
import { DELETE_BS_EVENT } from '../../../graphql/bsOperations';
import { useToastContext } from '../../../providers/ToastProvider';
import BSLaunchControl from '../BSLaunchControl';

export function LaunchTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const teams = event.teams ?? [];
  const tasks = event.tasks ?? [];
  const shipTemplates = event.shipTemplates ?? [];

  const teamCount = teams.length;
  const taskCount = tasks.length;
  const templateCount = shipTemplates.length;

  const teamOk = teamCount >= 2;
  const templateOk = templateCount >= 17;
  const taskGreen = taskCount >= 100;
  const discordOk = teamOk && teams.every((t) => t.discordChannelId);
  const guildOk = !!event.guildId;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [deleteBSEvent, { loading: deleting }] = useMutation(DELETE_BS_EVENT, {
    onCompleted: () => {
      showToast('Campaign deleted.', 'success');
      navigate('/battleship');
    },
    onError: (err) => showToast(err.message ?? 'Failed to delete campaign.', 'error'),
  });

  function CheckRow({ label, ok, warn }) {
    const color = ok ? 'green.400' : warn ? 'yellow.400' : 'red.400';
    const indicator = ok ? '[ OK ]' : warn ? '[ ! ]' : '[  ]';
    return (
      <HStack
        py={2}
        px={3}
        bg="#060f0a"
        border="1px solid"
        borderColor="#1a4028"
        borderRadius="sm"
        spacing={3}
      >
        <Text fontFamily="mono" fontSize="xs" color={color} fontWeight="bold" flexShrink={0}>
          {indicator}
        </Text>
        <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
          {label}
        </Text>
      </HStack>
    );
  }

  return (
    <VStack align="stretch" spacing={5}>
      <Text
        fontFamily="mono"
        fontSize="10px"
        color="#6b9e78"
        letterSpacing="widest"
        textTransform="uppercase"
      >
        Pre-launch Checklist
      </Text>

      <VStack align="stretch" spacing={2}>
        <CheckRow label={`Teams: ${teamCount}/2 enlisted`} ok={teamOk} warn={false} />
        <CheckRow
          label={
            guildOk ? (
              'Discord bot: server connected'
            ) : (
              <>
                Discord bot: not configured --{' '}
                <Link
                  as={RouterLink}
                  to={`/battleship/${event.eventId}/admin`}
                  color="#0ea5e9"
                  _hover={{ color: '#38bdf8' }}
                >
                  set up in Admin page
                </Link>
              </>
            )
          }
          ok={guildOk}
          warn={false}
        />
        <CheckRow
          label={
            discordOk
              ? 'Discord: both team channels configured'
              : teamOk
              ? `Discord: ${
                  teams.filter((t) => t.discordChannelId).length
                }/2 channels set -- set in Teams tab`
              : 'Discord: set team channel IDs in Teams tab'
          }
          ok={discordOk}
          warn={false}
        />
        <CheckRow
          label={`Ship templates: ${templateCount}/17 assigned -- sufficient`}
          ok={templateOk}
          warn={templateCount > 0 && !templateOk}
        />
        <CheckRow
          label={`Task pool${taskGreen ? ' -- sufficient' : ' -- need 100+ ocean tasks'}`}
          ok={taskGreen}
          warn={taskCount > 0 && !taskGreen}
        />
        <CheckRow
          label={
            event.womCompetitionId ? (
              'WOM: competition ID set -- progress bars will sync automatically'
            ) : (
              <>
                WOM: no competition ID set -- can be added in{' '}
                <Link
                  as={RouterLink}
                  to={`/battleship/${event.eventId}/admin`}
                  color="#0ea5e9"
                  _hover={{ color: '#38bdf8' }}
                >
                  Admin page
                </Link>{' '}
                now or after event starts
              </>
            )
          }
          ok={!!event.womCompetitionId}
          warn={!event.womCompetitionId}
        />
      </VStack>

      <Divider borderColor="#1a4028" />

      <BSLaunchControl event={event} refetch={refetch} />

      <Divider borderColor="#1a4028" />

      {/* Danger zone */}
      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={3}
        >
          Danger Zone
        </Text>
        {!confirmDelete ? (
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            borderColor="#4c1a1a"
            color="#f87171"
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="wider"
            textTransform="uppercase"
            _hover={{ bg: '#1a0a0a', borderColor: '#f87171' }}
            onClick={() => setConfirmDelete(true)}
          >
            Delete Campaign
          </Button>
        ) : (
          <Box bg="#1a0a0a" border="1px solid" borderColor="#7f1d1d" borderRadius="md" p={3}>
            <Text fontFamily="mono" fontSize="xs" color="#f87171" mb={3}>
              This will permanently delete the campaign, all teams, tasks, and boards. This cannot
              be undone.
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="red"
                fontFamily="mono"
                fontSize="10px"
                letterSpacing="wider"
                textTransform="uppercase"
                isLoading={deleting}
                loadingText="Deleting..."
                onClick={() => deleteBSEvent({ variables: { eventId: event.eventId } })}
              >
                Confirm Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="#3d6b4a"
                fontFamily="mono"
                fontSize="10px"
                _hover={{ color: '#d4f0da', bg: 'transparent' }}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </HStack>
          </Box>
        )}
      </Box>
    </VStack>
  );
}
